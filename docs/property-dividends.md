# Property Dividend Lifecycle

This guide describes how the property token records and pays dividends to holders, and what a holder must have in place to accrue and claim them. It describes the implemented behavior only. It does not promise any amount, schedule, or return, and it is not financial or tax advice.

Sources: `contracts/property-token/src/lib.rs` (`deposit_dividend`, `claim_dividend`, `claim_rent_yield`, `claim_capital_return`, `pending_dividend`, `unclaimed_balance`) and `contracts/property-token/src/test.rs`.

---

## 1. Prerequisites for a holder

A holder accrues dividends only while all of the following are true:

| Requirement | Why | Where it is enforced |
|---|---|---|
| The holder has an active, approved KYC record | Shares can only be minted to, transferred to, or transferred from addresses with approved KYC. A holder cannot receive shares without it. | `mint`, `transfer`, `transfer_from`, `forced_transfer` in the property token |
| The holder holds shares when a dividend is deposited | Accrual uses the holder's balance at each deposit. A deposit made while the holder has no shares gives them nothing. | `deposit_dividend` records a per-share index; `preview_holder_checkpoint` multiplies the holder's balance by the index change |
| The holder is the one claiming | Every claim call requires the holder's own signature. | `claim_dividend`, `claim_rent_yield`, `claim_capital_return` call `holder.require_auth()` |

Claims do not check KYC again. A holder who was approved when the shares were received can claim them later, unless a separate process changes their KYC status.

---

## 2. Who can distribute

Only the admin can call `deposit_dividend`. The call fails if any of these hold:

- the amount is zero or negative (`InvalidDividendAmount`)
- the distribution type is not one of the defined values (`InvalidDistributionType`)
- the token has no shares outstanding (`NoShares`)

Distribution types:

| Value | Name | Meaning |
|---|---|---|
| `0` | `Rent` | Rental income |
| `1` | `Capital` | Capital return, such as sale proceeds |
| `2` | `Other` | Any other distribution |

Each deposit is recorded as an immutable distribution checkpoint. Its per-share amount is calculated as `(amount × SCALE_FACTOR) ÷ total_shares`, where `SCALE_FACTOR` is 10^7. Any remainder from this division is kept as dust and is not lost. The admin can withdraw dust with `collect_dust_reserve`.

---

## 3. How entitlements are recorded

The contract does not loop over holders when a dividend is deposited. Instead it keeps a running per-share index for each distribution type and for the total.

For each holder, the contract stores a checkpoint with:

- the index values at the holder's last settlement
- the holder's balance at that point
- unclaimed amounts for rent, capital, and total
- the cumulative amount already claimed

When a holder's entitlement is read or settled, the contract computes:

```
unclaimed += balance × (current_index − checkpoint_index) ÷ SCALE_FACTOR
```

Two rules follow from this:

- **Transfers settle the sender first.** Before shares move, the sender's accrued amount is fixed in their checkpoint. The recipient starts from zero for dividends declared before the transfer. In `test_transfer_snapshots_dividends`, Alice keeps the 100 she accrued before transferring her 100 shares to Bob, and Bob has no pending amount from that earlier dividend. A dividend declared after the transfer accrues to Bob.
- **Entitlements are per-holder, not per-address-at-deposit.** The amount a holder can claim depends on their balance over time, not on who held shares when the deposit was made.

---

## 4. Checking what is owed

| Method | Returns |
|---|---|
| `pending_dividend(holder)` | Total unclaimed stroops for the holder, all types combined |
| `unclaimed_balance(holder)` | Unclaimed amounts split into rent, capital, and other |
| `holder_dividend_checkpoint(holder)` | The stored checkpoint, including the claimed total |
| `get_distribution(id)` / `get_distributions(start, limit)` | Immutable distribution checkpoints |
| `get_dividend_history(start, limit)` | Deposit events, paginated |
| `dividend_pool()` | Amount currently in the dividend pool |

These read methods do not change state. They compute the current entitlement with the same formula as a claim.

---

## 5. Claiming

| Method | What it pays | Behavior when nothing is owed |
|---|---|---|
| `claim_dividend(holder)` | All unclaimed amounts, all types | Fails with `InvalidDividendAmount` |
| `claim_rent_yield(holder)` | Rent-type amounts only | Returns `0` |
| `claim_capital_return(holder)` | Capital-type amounts only | Returns `0` |

A successful claim:

1. settles the holder's checkpoint to the current index
2. zeroes the claimed unclaimed amounts and adds them to the holder's claimed total
3. subtracts the amount from the dividend pool (fails with `InsufficientDividendPool` if the pool is short)
4. emits a claim event and returns the amount in stroops

A second claim with no new deposits returns nothing (`test_second_claim_yields_nothing`). Claiming one type does not claim the others (`test_956_rent_claim_does_not_withdraw_capital`).

---

## 6. Practical notes for holders

- Dividends are paid in the amounts recorded by the contract. The contract does not set a schedule, and no amount is guaranteed.
- Check `pending_dividend` or `unclaimed_balance` before claiming. A claim with a zero balance fails for `claim_dividend` and returns zero for the typed claims.
- Shares moved before a deposit do not carry that deposit's entitlement with them. Claim before transferring if you want to keep an accrued amount.

---

## 7. Related references

- [contract-api-reference.md — Property Token](contract-api-reference.md#property-token) for signatures and error codes
- [glossary.md](glossary.md) for the dividend index and distribution type terms
- [tier-based-compliance.md](tier-based-compliance.md) for the KYC tier rules that apply to shareholders
