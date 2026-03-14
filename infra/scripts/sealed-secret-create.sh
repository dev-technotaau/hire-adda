#!/usr/bin/env bash
# ============================================================
# Create SealedSecrets from .env files
# Encrypts secrets so they can be safely stored in Git.
# ============================================================
# Prerequisites:
#   - kubeseal CLI installed
#   - sealed-secrets controller running in cluster
# Usage:
#   ./infra/scripts/sealed-secret-create.sh
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
OUTPUT_DIR="$ROOT_DIR/infra/k8s/security/sealed-secrets"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[sealed-secrets]${NC} $*"; }
warn() { echo -e "${YELLOW}[sealed-secrets]${NC} $*"; }
fail() { echo -e "${RED}[sealed-secrets]${NC} $*"; exit 1; }

# Check prerequisites
command -v kubeseal >/dev/null 2>&1 || fail "kubeseal not found. Install: https://github.com/bitnami-labs/sealed-secrets/releases"
command -v kubectl >/dev/null 2>&1 || fail "kubectl not found"

mkdir -p "$OUTPUT_DIR"

# ── Backend Secrets ──
BACKEND_ENV="$ROOT_DIR/backend/.env"
if [[ -f "$BACKEND_ENV" ]]; then
  log "Creating backend secrets from $BACKEND_ENV..."

  # Filter out comments and empty lines, create K8s secret
  kubectl create secret generic backend-secrets \
    --namespace=talent-bridge \
    --from-env-file="$BACKEND_ENV" \
    --dry-run=client -o yaml | \
    kubeseal --format yaml \
    > "$OUTPUT_DIR/backend-secrets.yaml"

  log "  Written: $OUTPUT_DIR/backend-secrets.yaml"
else
  warn "Backend .env not found at $BACKEND_ENV — skipping"
fi

# ── PostgreSQL Secrets ──
log "Creating postgres secrets..."
# Extract POSTGRES_PASSWORD from backend .env or prompt
if [[ -f "$BACKEND_ENV" ]]; then
  PG_PASS=$(grep "^POSTGRES_PASSWORD=" "$BACKEND_ENV" | cut -d'=' -f2-)
fi

if [[ -z "${PG_PASS:-}" ]]; then
  read -sp "Enter POSTGRES_PASSWORD: " PG_PASS
  echo ""
fi

kubectl create secret generic postgres-secrets \
  --namespace=talent-bridge \
  --from-literal=POSTGRES_PASSWORD="$PG_PASS" \
  --dry-run=client -o yaml | \
  kubeseal --format yaml \
  > "$OUTPUT_DIR/postgres-secrets.yaml"

log "  Written: $OUTPUT_DIR/postgres-secrets.yaml"

# ── Summary ──
echo ""
log "═══════════════════════════════════════════════"
log "SealedSecrets created in: $OUTPUT_DIR/"
log "These files are safe to commit to Git."
log "═══════════════════════════════════════════════"
ls -la "$OUTPUT_DIR/"
