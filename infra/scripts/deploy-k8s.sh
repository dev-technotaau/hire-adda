#!/usr/bin/env bash
# ============================================================
# Hire Adda — K8s Deployment Orchestrator
# Mirrors deploy.sh capabilities for Kubernetes (K3s + Argo Rollouts)
# Supports: progressive, blue-green, canary, rolling strategies
# ============================================================
# Usage:
#   deploy-k8s.sh --strategy progressive --backend-tag <sha> --frontend-tag <sha>
#   deploy-k8s.sh --strategy blue-green --backend-tag <sha>
#   deploy-k8s.sh --strategy canary --backend-tag <sha> --canary-weight 20
#   deploy-k8s.sh --strategy rolling --backend-tag <sha>
#   deploy-k8s.sh --promote
#   deploy-k8s.sh --rollback
#   deploy-k8s.sh --status
#   deploy-k8s.sh --dry-run --strategy progressive --backend-tag <sha>
# ============================================================

set -euo pipefail

# ── Configuration ──
NAMESPACE="hire-adda"
BACKEND_IMAGE="ghcr.io/dev-technotaau/hire-adda-backend"
FRONTEND_IMAGE="ghcr.io/dev-technotaau/hire-adda-frontend"
STATE_CM="deploy-state"
LOCK_CM="deploy-lock"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROLLOUT_DIR="${SCRIPT_DIR}/../k8s/cd"
LOG_FILE="/var/log/hire-adda-deploy-k8s.log"

ROLLOUT_TIMEOUT="600s"
MIGRATION_TIMEOUT="120s"

# ── Colors ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# ── Defaults ──
ACTION="deploy"
STRATEGY="progressive"
BACKEND_TAG=""
FRONTEND_TAG=""
CANARY_WEIGHT=20
SKIP_MIGRATIONS=false
DRY_RUN=false

# ── Parse Arguments ──
while [[ $# -gt 0 ]]; do
  case "$1" in
    --strategy)       STRATEGY="$2"; shift 2 ;;
    --backend-tag)    BACKEND_TAG="$2"; shift 2 ;;
    --frontend-tag)   FRONTEND_TAG="$2"; shift 2 ;;
    --canary-weight)  CANARY_WEIGHT="$2"; shift 2 ;;
    --skip-migrations) SKIP_MIGRATIONS=true; shift ;;
    --dry-run)        DRY_RUN=true; shift ;;
    --promote)        ACTION="promote"; shift ;;
    --rollback)       ACTION="rollback"; shift ;;
    --status)         ACTION="status"; shift ;;
    *) echo -e "${RED}Unknown argument: $1${NC}"; exit 1 ;;
  esac
done

# ── Logging ──
log() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
  echo -e "$msg" | tee -a "$LOG_FILE" 2>/dev/null || echo -e "$msg"
}

log_info()    { log "${BLUE}[INFO]${NC} $1"; }
log_success() { log "${GREEN}[OK]${NC} $1"; }
log_warn()    { log "${YELLOW}[WARN]${NC} $1"; }
log_error()   { log "${RED}[ERROR]${NC} $1"; }

# ── Locking ──
acquire_lock() {
  if kubectl get configmap "$LOCK_CM" -n "$NAMESPACE" &>/dev/null; then
    local lock_ts
    lock_ts=$(kubectl get configmap "$LOCK_CM" -n "$NAMESPACE" -o jsonpath='{.data.timestamp}' 2>/dev/null || echo "")
    if [[ -n "$lock_ts" ]]; then
      local lock_epoch now_epoch
      lock_epoch=$(date -d "$lock_ts" +%s 2>/dev/null || echo 0)
      now_epoch=$(date +%s)
      # Stale lock: older than 30 minutes
      if (( now_epoch - lock_epoch > 1800 )); then
        log_warn "Removing stale deploy lock (from $lock_ts)"
        kubectl delete configmap "$LOCK_CM" -n "$NAMESPACE" --ignore-not-found &>/dev/null
      else
        log_error "Another deployment is in progress (started at $lock_ts)"
        log_error "If this is stale, delete it: kubectl delete configmap $LOCK_CM -n $NAMESPACE"
        exit 1
      fi
    fi
  fi

  if [[ "$DRY_RUN" == "true" ]]; then
    log_info "[DRY RUN] Would acquire deploy lock"
    return 0
  fi

  kubectl create configmap "$LOCK_CM" -n "$NAMESPACE" \
    --from-literal=timestamp="$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    --from-literal=strategy="$STRATEGY" \
    --from-literal=pid="$$" \
    --dry-run=client -o yaml | kubectl apply -f - &>/dev/null

  log_info "Acquired deploy lock"
}

release_lock() {
  if [[ "$DRY_RUN" == "true" ]]; then return 0; fi
  kubectl delete configmap "$LOCK_CM" -n "$NAMESPACE" --ignore-not-found &>/dev/null
}

cleanup() {
  release_lock
}
trap cleanup EXIT

# ── State Management ──
read_state() {
  if kubectl get configmap "$STATE_CM" -n "$NAMESPACE" &>/dev/null; then
    STATE_STRATEGY=$(kubectl get configmap "$STATE_CM" -n "$NAMESPACE" -o jsonpath='{.data.strategy}' 2>/dev/null || echo "none")
    STATE_BACKEND_TAG=$(kubectl get configmap "$STATE_CM" -n "$NAMESPACE" -o jsonpath='{.data.backend_tag}' 2>/dev/null || echo "latest")
    STATE_FRONTEND_TAG=$(kubectl get configmap "$STATE_CM" -n "$NAMESPACE" -o jsonpath='{.data.frontend_tag}' 2>/dev/null || echo "latest")
    STATE_CANARY_WEIGHT=$(kubectl get configmap "$STATE_CM" -n "$NAMESPACE" -o jsonpath='{.data.canary_weight}' 2>/dev/null || echo "0")
    STATE_LAST_DEPLOY=$(kubectl get configmap "$STATE_CM" -n "$NAMESPACE" -o jsonpath='{.data.last_deploy}' 2>/dev/null || echo "never")
    STATE_ROLLOUT_MODE=$(kubectl get configmap "$STATE_CM" -n "$NAMESPACE" -o jsonpath='{.data.rollout_mode}' 2>/dev/null || echo "deployment")
  else
    STATE_STRATEGY="none"
    STATE_BACKEND_TAG="latest"
    STATE_FRONTEND_TAG="latest"
    STATE_CANARY_WEIGHT="0"
    STATE_LAST_DEPLOY="never"
    STATE_ROLLOUT_MODE="deployment"
  fi
}

write_state() {
  local strategy="$1"
  local backend_tag="$2"
  local frontend_tag="$3"
  local canary_weight="$4"
  local rollout_mode="$5"

  if [[ "$DRY_RUN" == "true" ]]; then
    log_info "[DRY RUN] Would update state: strategy=$strategy, backend=$backend_tag, frontend=$frontend_tag"
    return 0
  fi

  kubectl create configmap "$STATE_CM" -n "$NAMESPACE" \
    --from-literal=strategy="$strategy" \
    --from-literal=backend_tag="$backend_tag" \
    --from-literal=frontend_tag="$frontend_tag" \
    --from-literal=canary_weight="$canary_weight" \
    --from-literal=last_deploy="$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    --from-literal=rollout_mode="$rollout_mode" \
    --dry-run=client -o yaml | kubectl apply -f - &>/dev/null
}

# ── Grafana Annotations ──
grafana_annotate() {
  local text="$1"
  local tags="$2"

  if [[ "$DRY_RUN" == "true" ]]; then
    log_info "[DRY RUN] Would create Grafana annotation: $text"
    return 0
  fi

  # Best-effort: don't fail deploy if Grafana is unavailable
  kubectl exec -n monitoring deploy/kube-prometheus-grafana -c grafana -- \
    wget -q -O /dev/null --post-data="{\"text\":\"$text\",\"tags\":[$tags]}" \
    --header='Content-Type: application/json' \
    --header='Authorization: Basic YWRtaW46YWRtaW4=' \
    'http://localhost:3000/api/annotations' 2>/dev/null || true
}

# ── Prisma Migrations ──
run_migrations() {
  local tag="$1"
  local image="${BACKEND_IMAGE}:${tag}"

  if [[ "$SKIP_MIGRATIONS" == "true" ]]; then
    log_info "Skipping Prisma migrations (--skip-migrations)"
    return 0
  fi

  if [[ "$DRY_RUN" == "true" ]]; then
    log_info "[DRY RUN] Would run Prisma migrations with image $image"
    return 0
  fi

  log_info "Running Prisma migrations..."
  local job_name="prisma-migrate-$(date +%s)"

  # Security context required: hire-adda namespace enforces Restricted PSA
  if kubectl run "$job_name" \
    --image="$image" \
    --restart=Never \
    --rm -i \
    --namespace="$NAMESPACE" \
    --image-pull-policy=Always \
    --overrides='{
      "spec": {
        "securityContext": {
          "runAsUser": 1001,
          "runAsGroup": 1001,
          "fsGroup": 1001,
          "runAsNonRoot": true,
          "seccompProfile": {"type": "RuntimeDefault"}
        },
        "containers": [{
          "name": "migrate",
          "image": "'"$image"'",
          "command": ["npx", "prisma", "migrate", "deploy"],
          "envFrom": [
            {"secretRef": {"name": "backend-secrets"}},
            {"configMapRef": {"name": "backend-config"}}
          ],
          "securityContext": {
            "allowPrivilegeEscalation": false,
            "readOnlyRootFilesystem": false,
            "capabilities": {"drop": ["ALL"]}
          }
        }],
        "imagePullSecrets": [{"name": "ghcr-credentials"}],
        "restartPolicy": "Never"
      }
    }' \
    --timeout="$MIGRATION_TIMEOUT" 2>&1 | while IFS= read -r line; do
      log_info "  [migrate] $line"
    done; then
    log_success "Prisma migrations completed"
  else
    log_error "Migration failed! Aborting deploy."
    exit 1
  fi
}

# ── Deployment ↔ Rollout Transition ──
ensure_rollout_active() {
  local service="$1"     # backend or frontend
  local variant="$2"     # canary or bluegreen

  if [[ "$DRY_RUN" == "true" ]]; then
    log_info "[DRY RUN] Would activate $variant Rollout for $service"
    return 0
  fi

  # Determine rollout file
  local rollout_file
  if [[ "$service" == "backend" ]]; then
    if [[ "$variant" == "bluegreen" ]]; then
      rollout_file="${ROLLOUT_DIR}/rollout-bluegreen.yaml"
    else
      rollout_file="${ROLLOUT_DIR}/rollout.yaml"
    fi
  else
    if [[ "$variant" == "bluegreen" ]]; then
      rollout_file="${ROLLOUT_DIR}/frontend-rollout-bluegreen.yaml"
    else
      rollout_file="${ROLLOUT_DIR}/frontend-rollout.yaml"
    fi
  fi

  if [[ ! -f "$rollout_file" ]]; then
    log_error "Rollout file not found: $rollout_file"
    exit 1
  fi

  # Scale Deployment to 0 (ArgoCD ignores replicas — stable)
  log_info "Scaling Deployment/$service to 0 replicas..."
  kubectl scale deployment/"$service" --replicas=0 -n "$NAMESPACE" 2>/dev/null || true

  # Wait for Deployment pods to terminate
  kubectl wait --for=delete pod -l app="$service" -n "$NAMESPACE" --timeout=60s 2>/dev/null || true

  # Apply the Rollout
  log_info "Applying $variant Rollout for $service..."
  kubectl apply -f "$rollout_file" -n "$NAMESPACE"
}

ensure_deployment_active() {
  local service="$1"

  if [[ "$DRY_RUN" == "true" ]]; then
    log_info "[DRY RUN] Would activate Deployment for $service"
    return 0
  fi

  # Delete Rollout if exists
  if kubectl get rollout "$service" -n "$NAMESPACE" &>/dev/null; then
    log_info "Deleting Rollout/$service..."
    kubectl delete rollout "$service" -n "$NAMESPACE" --ignore-not-found
    # Wait for Rollout pods to terminate
    kubectl wait --for=delete pod -l app="$service" -n "$NAMESPACE" --timeout=60s 2>/dev/null || true
  fi

  # Scale Deployment back to 1
  log_info "Scaling Deployment/$service to 1 replica..."
  kubectl scale deployment/"$service" --replicas=1 -n "$NAMESPACE"
}

# ── Set Image on Rollout ──
set_rollout_image() {
  local service="$1"
  local tag="$2"
  local image

  if [[ "$service" == "backend" ]]; then
    image="${BACKEND_IMAGE}:${tag}"
  else
    image="${FRONTEND_IMAGE}:${tag}"
  fi

  if [[ "$DRY_RUN" == "true" ]]; then
    log_info "[DRY RUN] Would set Rollout/$service image to $image"
    return 0
  fi

  log_info "Setting Rollout/$service image to $image"
  kubectl-argo-rollouts set image "$service" "$service=$image" -n "$NAMESPACE"
}

# ── Wait for Rollout ──
wait_for_rollout() {
  local service="$1"

  if [[ "$DRY_RUN" == "true" ]]; then
    log_info "[DRY RUN] Would wait for Rollout/$service to complete"
    return 0
  fi

  log_info "Watching Rollout/$service progress..."
  kubectl-argo-rollouts status "$service" -n "$NAMESPACE" --watch --timeout="$ROLLOUT_TIMEOUT" || {
    local status=$?
    log_error "Rollout/$service did not complete successfully"
    return $status
  }
  log_success "Rollout/$service completed"
}

# ═══════════════════════════════════════════════════════
# STRATEGY: ROLLING
# Uses standard K8s Deployment (maxUnavailable:0, maxSurge:1)
# ═══════════════════════════════════════════════════════
deploy_rolling() {
  log_info "Strategy: Rolling (sequential backend → frontend)"

  # Phase 1: Backend
  if [[ -n "$BACKEND_TAG" ]]; then
    log_info "Phase 1: Backend rolling update..."

    run_migrations "$BACKEND_TAG"
    ensure_deployment_active "backend"

    if [[ "$DRY_RUN" == "true" ]]; then
      log_info "[DRY RUN] Would set backend image to ${BACKEND_IMAGE}:${BACKEND_TAG}"
    else
      kubectl set image deployment/backend "backend=${BACKEND_IMAGE}:${BACKEND_TAG}" -n "$NAMESPACE"
      log_info "Waiting for backend rolling update..."
      kubectl rollout status deployment/backend -n "$NAMESPACE" --timeout="$ROLLOUT_TIMEOUT"
      log_success "Backend rolling update completed"
    fi
  fi

  # Phase 2: Frontend
  if [[ -n "$FRONTEND_TAG" ]]; then
    log_info "Phase 2: Frontend rolling update..."

    ensure_deployment_active "frontend"

    if [[ "$DRY_RUN" == "true" ]]; then
      log_info "[DRY RUN] Would set frontend image to ${FRONTEND_IMAGE}:${FRONTEND_TAG}"
    else
      kubectl set image deployment/frontend "frontend=${FRONTEND_IMAGE}:${FRONTEND_TAG}" -n "$NAMESPACE"
      log_info "Waiting for frontend rolling update..."
      kubectl rollout status deployment/frontend -n "$NAMESPACE" --timeout="$ROLLOUT_TIMEOUT"
      log_success "Frontend rolling update completed"
    fi
  fi

  write_state "rolling" \
    "${BACKEND_TAG:-$STATE_BACKEND_TAG}" \
    "${FRONTEND_TAG:-$STATE_FRONTEND_TAG}" \
    "0" "deployment"

  grafana_annotate \
    "Deploy (rolling): backend=${BACKEND_TAG:-unchanged} frontend=${FRONTEND_TAG:-unchanged}" \
    '"deploy","rolling"'

  log_success "Rolling deployment completed"
}

# ═══════════════════════════════════════════════════════
# STRATEGY: CANARY
# Argo Rollout with initial weight, pauses for manual promote
# ═══════════════════════════════════════════════════════
deploy_canary() {
  log_info "Strategy: Canary (initial weight: ${CANARY_WEIGHT}%)"

  # Phase 1: Backend
  if [[ -n "$BACKEND_TAG" ]]; then
    log_info "Phase 1: Backend canary deployment..."
    run_migrations "$BACKEND_TAG"
    ensure_rollout_active "backend" "canary"

    # Patch initial weight if different from YAML default (20%)
    if [[ "$CANARY_WEIGHT" -ne 20 && "$DRY_RUN" != "true" ]]; then
      log_info "Patching backend canary weight to ${CANARY_WEIGHT}%..."
      kubectl patch rollout backend -n "$NAMESPACE" --type=json \
        -p "[{\"op\":\"replace\",\"path\":\"/spec/strategy/canary/steps/0/setWeight\",\"value\":${CANARY_WEIGHT}}]"
    fi

    set_rollout_image "backend" "$BACKEND_TAG"

    if [[ "$DRY_RUN" != "true" ]]; then
      # Wait for canary pods, then pause indefinitely (prevent auto-progression)
      log_info "Waiting for backend canary pods to start..."
      sleep 5
      kubectl-argo-rollouts pause backend -n "$NAMESPACE"
      log_info "Backend canary paused at ${CANARY_WEIGHT}% traffic"
    fi
  fi

  # Phase 2: Frontend
  if [[ -n "$FRONTEND_TAG" ]]; then
    log_info "Phase 2: Frontend canary deployment..."
    ensure_rollout_active "frontend" "canary"

    # Patch initial weight if different from YAML default (20%)
    if [[ "$CANARY_WEIGHT" -ne 20 && "$DRY_RUN" != "true" ]]; then
      log_info "Patching frontend canary weight to ${CANARY_WEIGHT}%..."
      kubectl patch rollout frontend -n "$NAMESPACE" --type=json \
        -p "[{\"op\":\"replace\",\"path\":\"/spec/strategy/canary/steps/0/setWeight\",\"value\":${CANARY_WEIGHT}}]"
    fi

    set_rollout_image "frontend" "$FRONTEND_TAG"

    if [[ "$DRY_RUN" != "true" ]]; then
      log_info "Waiting for frontend canary pods to start..."
      sleep 5
      kubectl-argo-rollouts pause frontend -n "$NAMESPACE"
      log_info "Frontend canary paused at ${CANARY_WEIGHT}% traffic"
    fi
  fi

  write_state "canary" \
    "${BACKEND_TAG:-$STATE_BACKEND_TAG}" \
    "${FRONTEND_TAG:-$STATE_FRONTEND_TAG}" \
    "$CANARY_WEIGHT" "rollout"

  grafana_annotate \
    "Deploy (canary ${CANARY_WEIGHT}%): backend=${BACKEND_TAG:-unchanged} frontend=${FRONTEND_TAG:-unchanged}" \
    '"deploy","canary"'

  log_success "Canary deployed at ${CANARY_WEIGHT}% traffic"
  log_info "Monitor metrics, then:"
  log_info "  Promote:  $0 --promote"
  log_info "  Rollback: $0 --rollback"
}

# ═══════════════════════════════════════════════════════
# STRATEGY: PROGRESSIVE
# Argo Rollout canary with auto-stepping (20→50→100) + analysis
# ═══════════════════════════════════════════════════════
deploy_progressive() {
  log_info "Strategy: Progressive (auto-stepping 20% → 50% → 100% with analysis)"

  local backend_completed=false

  # Phase 1: Backend
  if [[ -n "$BACKEND_TAG" ]]; then
    log_info "Phase 1: Backend progressive rollout..."
    run_migrations "$BACKEND_TAG"
    ensure_rollout_active "backend" "canary"
    set_rollout_image "backend" "$BACKEND_TAG"
    wait_for_rollout "backend"
    backend_completed=true
  fi

  # Phase 2: Frontend
  # If frontend fails, undo backend phase (atomic deploy — matches Docker's _undo_backend)
  if [[ -n "$FRONTEND_TAG" ]]; then
    log_info "Phase 2: Frontend progressive rollout..."
    ensure_rollout_active "frontend" "canary"
    set_rollout_image "frontend" "$FRONTEND_TAG"

    if ! wait_for_rollout "frontend"; then
      log_error "Frontend progressive rollout failed!"

      if [[ "$backend_completed" == "true" && "$DRY_RUN" != "true" ]]; then
        log_warn "Undoing backend phase — rolling back to previous version..."
        kubectl-argo-rollouts undo backend -n "$NAMESPACE" || true
        log_info "Waiting for backend rollback..."
        kubectl-argo-rollouts status backend -n "$NAMESPACE" --watch --timeout="$ROLLOUT_TIMEOUT" 2>/dev/null || true
        log_info "Backend rolled back to previous version"

        grafana_annotate \
          "Progressive FAILED: frontend rollout failed, backend rolled back" \
          '"deploy","rollback","progressive"'
      fi

      write_state "failed" \
        "${BACKEND_TAG:-$STATE_BACKEND_TAG}" \
        "${FRONTEND_TAG:-$STATE_FRONTEND_TAG}" \
        "0" "rollout"
      exit 1
    fi
  fi

  write_state "progressive" \
    "${BACKEND_TAG:-$STATE_BACKEND_TAG}" \
    "${FRONTEND_TAG:-$STATE_FRONTEND_TAG}" \
    "0" "rollout"

  grafana_annotate \
    "Deploy (progressive): backend=${BACKEND_TAG:-unchanged} frontend=${FRONTEND_TAG:-unchanged}" \
    '"deploy","progressive"'

  log_success "Progressive deployment completed"
}

# ═══════════════════════════════════════════════════════
# STRATEGY: BLUE-GREEN
# Argo Rollout blueGreen, preview service, manual promote
# ═══════════════════════════════════════════════════════
deploy_blue_green() {
  log_info "Strategy: Blue-Green (preview → promote)"

  # Phase 1: Backend
  if [[ -n "$BACKEND_TAG" ]]; then
    log_info "Phase 1: Backend blue-green deployment..."
    run_migrations "$BACKEND_TAG"
    ensure_rollout_active "backend" "bluegreen"
    set_rollout_image "backend" "$BACKEND_TAG"

    if [[ "$DRY_RUN" != "true" ]]; then
      log_info "Backend preview is available via backend-preview service"
      log_info "Waiting for pre-promotion analysis..."
      # Blue-green with autoPromotionEnabled=false pauses after analysis
      sleep 10
      kubectl-argo-rollouts status "backend" -n "$NAMESPACE" 2>/dev/null || true
    fi
  fi

  # Phase 2: Frontend
  if [[ -n "$FRONTEND_TAG" ]]; then
    log_info "Phase 2: Frontend blue-green deployment..."
    ensure_rollout_active "frontend" "bluegreen"
    set_rollout_image "frontend" "$FRONTEND_TAG"

    if [[ "$DRY_RUN" != "true" ]]; then
      log_info "Frontend preview is available via frontend-preview service"
      sleep 10
      kubectl-argo-rollouts status "frontend" -n "$NAMESPACE" 2>/dev/null || true
    fi
  fi

  write_state "blue-green" \
    "${BACKEND_TAG:-$STATE_BACKEND_TAG}" \
    "${FRONTEND_TAG:-$STATE_FRONTEND_TAG}" \
    "0" "rollout"

  grafana_annotate \
    "Deploy (blue-green preview): backend=${BACKEND_TAG:-unchanged} frontend=${FRONTEND_TAG:-unchanged}" \
    '"deploy","blue-green"'

  log_success "Blue-green preview deployed"
  log_info "Preview services available for testing"
  log_info "  Promote:  $0 --promote"
  log_info "  Rollback: $0 --rollback"
}

# ═══════════════════════════════════════════════════════
# ACTION: PROMOTE
# Advance canary to 100% or promote blue-green preview
# ═══════════════════════════════════════════════════════
do_promote() {
  read_state

  if [[ "$STATE_STRATEGY" != "canary" && "$STATE_STRATEGY" != "blue-green" ]]; then
    log_error "No active canary or blue-green deployment to promote"
    log_error "Current strategy: $STATE_STRATEGY"
    exit 1
  fi

  log_info "Promoting ${STATE_STRATEGY} deployment..."

  if [[ "$DRY_RUN" == "true" ]]; then
    log_info "[DRY RUN] Would promote all active rollouts"
    return 0
  fi

  # Promote backend rollout (if exists)
  if kubectl get rollout backend -n "$NAMESPACE" &>/dev/null; then
    log_info "Promoting backend rollout..."
    if [[ "$STATE_STRATEGY" == "canary" ]]; then
      # Canary: skip remaining steps, go straight to 100% (matches Docker promote)
      kubectl-argo-rollouts promote backend --full -n "$NAMESPACE"
    else
      # Blue-green: standard promote (swap active ↔ preview)
      kubectl-argo-rollouts promote backend -n "$NAMESPACE"
    fi
    wait_for_rollout "backend"
  fi

  # Promote frontend rollout (if exists)
  if kubectl get rollout frontend -n "$NAMESPACE" &>/dev/null; then
    log_info "Promoting frontend rollout..."
    if [[ "$STATE_STRATEGY" == "canary" ]]; then
      kubectl-argo-rollouts promote frontend --full -n "$NAMESPACE"
    else
      kubectl-argo-rollouts promote frontend -n "$NAMESPACE"
    fi
    wait_for_rollout "frontend"
  fi

  write_state "promoted" \
    "$STATE_BACKEND_TAG" \
    "$STATE_FRONTEND_TAG" \
    "0" "rollout"

  grafana_annotate \
    "Promote: ${STATE_STRATEGY} → 100% (backend=${STATE_BACKEND_TAG}, frontend=${STATE_FRONTEND_TAG})" \
    '"deploy","promote"'

  log_success "Promotion completed — 100% traffic on new version"
}

# ═══════════════════════════════════════════════════════
# ACTION: ROLLBACK
# Abort in-progress rollout or undo completed rollout
# ═══════════════════════════════════════════════════════
do_rollback() {
  read_state

  log_info "Rolling back deployment..."

  if [[ "$DRY_RUN" == "true" ]]; then
    log_info "[DRY RUN] Would rollback all active rollouts"
    return 0
  fi

  local rolled_back=false

  # Rollback backend rollout (if exists)
  if kubectl get rollout backend -n "$NAMESPACE" &>/dev/null; then
    local backend_status
    backend_status=$(kubectl-argo-rollouts status backend -n "$NAMESPACE" 2>/dev/null | head -1 || echo "")

    if echo "$backend_status" | grep -qi "paused\|progressing"; then
      log_info "Aborting in-progress backend rollout..."
      kubectl-argo-rollouts abort backend -n "$NAMESPACE"
    else
      log_info "Undoing completed backend rollout..."
      kubectl-argo-rollouts undo backend -n "$NAMESPACE"
    fi
    rolled_back=true
  fi

  # Rollback frontend rollout (if exists)
  if kubectl get rollout frontend -n "$NAMESPACE" &>/dev/null; then
    local frontend_status
    frontend_status=$(kubectl-argo-rollouts status frontend -n "$NAMESPACE" 2>/dev/null | head -1 || echo "")

    if echo "$frontend_status" | grep -qi "paused\|progressing"; then
      log_info "Aborting in-progress frontend rollout..."
      kubectl-argo-rollouts abort frontend -n "$NAMESPACE"
    else
      log_info "Undoing completed frontend rollout..."
      kubectl-argo-rollouts undo frontend -n "$NAMESPACE"
    fi
    rolled_back=true
  fi

  if [[ "$rolled_back" == "false" ]]; then
    # No rollouts — rollback Deployments
    log_info "No active rollouts — rolling back Deployments..."
    kubectl rollout undo deployment/backend -n "$NAMESPACE" 2>/dev/null || true
    kubectl rollout undo deployment/frontend -n "$NAMESPACE" 2>/dev/null || true
  fi

  write_state "rollback" \
    "$STATE_BACKEND_TAG" \
    "$STATE_FRONTEND_TAG" \
    "0" "$STATE_ROLLOUT_MODE"

  grafana_annotate \
    "Rollback: reverted to previous version" \
    '"deploy","rollback"'

  log_success "Rollback completed"
}

# ═══════════════════════════════════════════════════════
# ACTION: STATUS
# Display current deployment state
# ═══════════════════════════════════════════════════════
do_status() {
  read_state

  echo ""
  echo -e "${CYAN}═══════════════════════════════════════════${NC}"
  echo -e "${CYAN}  Hire Adda — K8s Deployment Status${NC}"
  echo -e "${CYAN}═══════════════════════════════════════════${NC}"
  echo ""
  echo -e "  Strategy:       ${GREEN}${STATE_STRATEGY}${NC}"
  echo -e "  Rollout Mode:   ${STATE_ROLLOUT_MODE}"
  echo -e "  Backend Tag:    ${STATE_BACKEND_TAG}"
  echo -e "  Frontend Tag:   ${STATE_FRONTEND_TAG}"
  echo -e "  Canary Weight:  ${STATE_CANARY_WEIGHT}%"
  echo -e "  Last Deploy:    ${STATE_LAST_DEPLOY}"
  echo ""

  # Backend Rollout status
  if kubectl get rollout backend -n "$NAMESPACE" &>/dev/null; then
    echo -e "  ${BLUE}Backend Rollout:${NC}"
    kubectl-argo-rollouts status backend -n "$NAMESPACE" --no-color 2>/dev/null | sed 's/^/    /'
    echo ""
  fi

  # Frontend Rollout status
  if kubectl get rollout frontend -n "$NAMESPACE" &>/dev/null; then
    echo -e "  ${BLUE}Frontend Rollout:${NC}"
    kubectl-argo-rollouts status frontend -n "$NAMESPACE" --no-color 2>/dev/null | sed 's/^/    /'
    echo ""
  fi

  # Pod status
  echo -e "  ${BLUE}Pods:${NC}"
  kubectl get pods -n "$NAMESPACE" -l 'app in (backend,frontend)' \
    -o custom-columns='NAME:.metadata.name,STATUS:.status.phase,RESTARTS:.status.containerStatuses[0].restartCount,AGE:.metadata.creationTimestamp,IMAGE:.spec.containers[0].image' \
    --no-headers 2>/dev/null | sed 's/^/    /'
  echo ""

  # Deployment replicas
  echo -e "  ${BLUE}Deployments:${NC}"
  kubectl get deployments -n "$NAMESPACE" -l 'app in (backend,frontend)' \
    -o custom-columns='NAME:.metadata.name,READY:.status.readyReplicas,REPLICAS:.spec.replicas' \
    --no-headers 2>/dev/null | sed 's/^/    /'
  echo ""

  echo -e "${CYAN}═══════════════════════════════════════════${NC}"
}

# ═══════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════
main() {
  log_info "Hire Adda K8s Deploy — Action: ${ACTION}, Strategy: ${STRATEGY}"

  case "$ACTION" in
    status)
      do_status
      exit 0
      ;;

    promote)
      acquire_lock
      do_promote
      ;;

    rollback)
      acquire_lock
      do_rollback
      ;;

    deploy)
      if [[ -z "$BACKEND_TAG" && -z "$FRONTEND_TAG" ]]; then
        log_error "At least one of --backend-tag or --frontend-tag is required"
        exit 1
      fi

      acquire_lock
      read_state

      case "$STRATEGY" in
        progressive) deploy_progressive ;;
        blue-green)  deploy_blue_green ;;
        canary)      deploy_canary ;;
        rolling)     deploy_rolling ;;
        *)
          log_error "Unknown strategy: $STRATEGY"
          log_error "Valid strategies: progressive, blue-green, canary, rolling"
          exit 1
          ;;
      esac
      ;;

    *)
      log_error "Unknown action: $ACTION"
      exit 1
      ;;
  esac

  log_success "Done"
}

main
