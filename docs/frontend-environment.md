# Frontend Environment Variables

This page lists every `VITE_*` variable the frontend reads, what it does, and whether it is required. The source of truth is `frontend/.env.example` and the readers listed in each row.

---

## Read this first: `VITE_` values are public

Vite embeds every `VITE_*` variable into the JavaScript bundle at build time. Anyone who loads the site can read them in the browser.

- **Never put secrets in a `VITE_` variable.** This includes admin secret keys, API tokens with write access, and private RPC credentials that must stay private.
- Contract IDs, network names, and public RPC URLs are safe to set here, because they are already public on-chain or in the browser.
- Secrets used by deploy scripts belong in `.env.docker` or the shell environment, not in `frontend/.env`. See [secret-safe-deployment.md](secret-safe-deployment.md).

---

## Setup

```bash
cp frontend/.env.example frontend/.env
```

Fill in the contract IDs from your deployment. `scripts/deploy.sh` can write them for you. Restart the Vite dev server after changing `frontend/.env`, because Vite reads it at startup.

---

## Variable reference

### Required to load the app

The app shows a configuration error screen if any of these five are empty (`frontend/src/main.tsx`).

| Variable | Required | Purpose | Expected format |
|---|---|---|---|
| `VITE_KYC_REGISTRY_ID` | Yes | Contract ID of the KYC registry | Stellar contract ID, starts with `C` |
| `VITE_COMPLIANCE_ENGINE_ID` | Yes | Contract ID of the compliance engine | Stellar contract ID, starts with `C` |
| `VITE_INVOICE_TOKEN_ID` | Yes | Contract ID of the invoice token | Stellar contract ID, starts with `C` |
| `VITE_PROPERTY_TOKEN_ID` | Yes | Contract ID of the property token | Stellar contract ID, starts with `C` |
| `VITE_CARBON_TOKEN_ID` | Yes | Contract ID of the carbon credit token | Stellar contract ID, starts with `C` |

### Network selection

| Variable | Required | Default in code | Purpose | Expected format |
|---|---|---|---|---|
| `VITE_STELLAR_NETWORK` | No | `testnet` (store) / `TESTNET` (wallet) | Selects the network the app starts on | `TESTNET` or `MAINNET` in `.env.example`. A custom network name also works when the RPC URL and passphrase are set (see below). |
| `VITE_SOROBAN_RPC_URL` | No | Built-in RPC for the selected network | Overrides the Soroban RPC endpoint | Full URL, such as `https://soroban-testnet.stellar.org`. Blank uses the built-in endpoint. |
| `VITE_STELLAR_NETWORK_PASSPHRASE` | No | Built-in passphrase for the selected network | Overrides the network passphrase. Set it to match a custom RPC endpoint. | Exact passphrase string. Blank uses the built-in value. |
| `VITE_RPC_ALLOW_HTTP` | No | `false` except for `standalone` | Allows a plain `http://` RPC URL | `true` to allow, or blank to use the default. Any other value counts as `false`. |

Notes:

- `VITE_STELLAR_NETWORK` is read as-is by the network store, so a custom name is only usable together with `VITE_SOROBAN_RPC_URL` and `VITE_STELLAR_NETWORK_PASSPHRASE`. The wallet store uppercases the value. Use the uppercase form shown in `.env.example` to avoid mismatches.
- A network choice saved in the browser can override this value on later visits, because the network selection is persisted in local storage under `veritoken-network`.

### Optional contract ID

This contract is not required to load the app.

| Variable | Required | Purpose | Expected format |
|---|---|---|---|
| `VITE_RWA_TOKEN_ID` | No | Contract ID of the base RWA token. The dashboard shows its section only when set. | Stellar contract ID |

### Optional services

| Variable | Required | Purpose | Expected format |
|---|---|---|---|
| `VITE_INDEXER_URL` | No | Off-chain event indexer. When set, event queries use the indexer instead of direct RPC calls. When blank, the app queries RPC directly. | Base URL, such as `http://localhost:3001` |
| `VITE_WALLETCONNECT_PROJECT_ID` | No | Project ID for WalletConnect sessions. It is not in `.env.example`. When blank, the app falls back to a development placeholder (`veritoken-dev`). | WalletConnect project ID string |

---

## Checking a value

1. Confirm the variable name is spelled exactly as above. Vite ignores variables that do not start with `VITE_`.
2. Restart the dev server after any change.
3. If the configuration error screen lists a contract, that variable is empty or missing.

---

## See also

- [docker-environment.md](docker-environment.md) — the Docker stack sets several of these variables from `.env.docker`
- [secret-safe-deployment.md](secret-safe-deployment.md) — how to handle keys and secrets
- [troubleshooting.md](troubleshooting.md) — common setup problems
