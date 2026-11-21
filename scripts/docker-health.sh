#!/usr/bin/env bash
# scripts/docker-health.sh — verify that the Docker stack is fully ready.
#
# Usage:
#   bash scripts/docker-health.sh             # run all checks against the live stack
#   bash scripts/docker-health.sh --self-test # validate the failure path without Docker
#
# Exit codes:
#   0  All checks passed — the stack is ready (or, with --self-test, the
#      failure path correctly flagged a simulated unhealthy service).
#   1  One or more checks failed. The summary names every check that failed
#      so it is clear which prerequisite was not satisfied.
#
# --self-test runs a single synthetic unhealthy-service check (no Docker, no
# network) and verifies the script reports it as not ready. Use it to confirm
# the diagnostic path works on a fresh clone or in CI.

set -euo pipefail

PASS=0
FAIL=1
overall=0
SELF_TEST=0

# Labels of checks that failed, so the summary names the unmet prerequisite
# instead of a generic "one or more checks failed".
declare -a FAILED_LABELS=()

check() {
  local label="$1"
  local cmd="$2"
  if eval "$cmd" > /dev/null 2>&1; then
    echo "  ✅  $label"
  else
    echo "  ❌  $label"
    overall=1
    FAILED_LABELS+=("$label")
  fi
}

# Parse optional flags.
while [ $# -gt 0 ]; do
  case "$1" in
    --self-test)
      SELF_TEST=1
      shift
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

# ── Self-test (no Docker required) ──────────────────────────────────────────
# Simulate one unhealthy service and confirm the script does NOT report the
# stack as ready. Exits 0 when the failure path works, 1 when it does not.
if [ "$SELF_TEST" -eq 1 ]; then
  echo ""
  echo "==> Veritoken docker-health self-test (no Docker required)"
  echo ""
  echo "Simulated service:"
  check "self-test probe (simulated unhealthy service)" "false"
  echo ""
  if [ "$overall" -eq 1 ]; then
    echo "self-test passed: the simulated unhealthy service was not reported as ready."
    exit 0
  fi
  echo "self-test FAILED: a simulated unhealthy service was reported as ready." >&2
  exit 1
fi

echo ""
echo "==> Veritoken Docker stack health check"
echo ""

# ── Stellar node ──────────────────────────────────────────────────────────
echo "Stellar node (http://localhost:8000):"
check "Soroban RPC endpoint responding" \
  "curl -sf http://localhost:8000/soroban/rpc"

# ── Contracts service ─────────────────────────────────────────────────────
echo ""
echo "Contracts service:"
check "Container is running" \
  "docker compose ps contracts | grep -q 'running\|Up'"
check "cargo check passes inside container" \
  "docker compose exec -T contracts cargo check --target wasm32v1-none --quiet"

# ── Frontend service ──────────────────────────────────────────────────────
echo ""
echo "Frontend (http://localhost:5173):"
check "Dev server responding" \
  "curl -sf http://localhost:5173"

# ── Summary ───────────────────────────────────────────────────────────────
echo ""
if [ "$overall" -eq 0 ]; then
  echo "All checks passed. The Veritoken stack is ready."
else
  echo "One or more checks failed. The following prerequisite(s) were not met:"
  for label in "${FAILED_LABELS[@]}"; do
    echo "  ❌  $label"
  done
  echo "Check 'docker compose logs' for details."
fi
echo ""

exit "$overall"
