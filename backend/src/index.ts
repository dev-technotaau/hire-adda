// Trigger CI/CD rebuild again after postgres migration and backend tag fix in migration and nginx policy fix and canary comparison fix
// Trigger CI/CD rebuild — refresh ghcr-credentials after VPS reboot (token expired during downtime)
// Trigger CI/CD rebuild again — full pipeline (backend + frontend builds + deploy-k8s)
// Trigger CI/CD rebuild — verify deploy-k8s SSH after MaxAuthTries fix and IdentitiesOnly flag
// Trigger CI/CD rebuild — alertmanager webhook 403 fix (mount route before CSRF)
import './server';
