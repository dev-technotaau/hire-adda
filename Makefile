.PHONY: dev dev-backend dev-frontend build build-backend build-frontend \
       test test-backend test-frontend lint lint-fix format \
       db-push db-migrate db-studio db-seed db-seed-dev \
       docker-up docker-down docker-build clean install help \
       backup-db backup-db-restore backup-db-local \
       backup-cleanup backup-status \
       ssl-init ssl-renew ssl-status ssl-dev \
       mail-setup mail-up mail-down mail-logs mail-test \
       mail-accounts mail-dkim mail-restart mail-add-account

# ─── Development ─────────────────────────────────────────
dev:                    ## Start both backend and frontend
	npm run dev

dev-backend:            ## Start backend only
	npm run dev:backend

dev-frontend:           ## Start frontend only
	npm run dev:frontend

# ─── Build ───────────────────────────────────────────────
build:                  ## Build both projects
	npm run build

build-backend:          ## Build backend only
	npm run build:backend

build-frontend:         ## Build frontend only
	npm run build:frontend

# ─── Testing ─────────────────────────────────────────────
test:                   ## Run all tests
	npm test

test-backend:           ## Run backend tests
	cd backend && npm test

test-frontend:          ## Run frontend tests
	cd frontend && npm test

test-cov:               ## Run tests with coverage
	cd backend && npm run test:cov
	cd frontend && npm run test:ci

# ─── Code Quality ────────────────────────────────────────
lint:                   ## Lint all workspaces
	npm run lint

lint-fix:               ## Lint and auto-fix
	cd backend && npm run lint:fix
	cd frontend && npm run lint:fix

format:                 ## Format all code with Prettier
	cd backend && npm run format
	cd frontend && npm run format

type-check:             ## Type-check both projects
	cd backend && npm run type-check
	cd frontend && npm run type-check

# ─── Database ────────────────────────────────────────────
db-push:                ## Push Prisma schema to database
	cd backend && npm run db:push

db-migrate:             ## Run Prisma migrations (dev)
	cd backend && npm run db:migrate

db-migrate-prod:        ## Deploy migrations to production
	cd backend && npm run db:migrate:prod

db-studio:              ## Open Prisma Studio
	cd backend && npm run db:studio

db-seed:                ## Seed super admin
	cd backend && npm run db:seed

db-seed-dev:            ## Seed full development data
	cd backend && npm run db:seed:dev

db-generate:            ## Generate Prisma client
	cd backend && npm run db:generate

# ─── Docker ──────────────────────────────────────────────
docker-up:              ## Start all services with Docker Compose
	cd backend && docker compose up -d

docker-down:            ## Stop all Docker services
	cd backend && docker compose down

docker-build:           ## Build Docker images
	cd backend && docker compose build

docker-logs:            ## View Docker logs
	cd backend && docker compose logs -f

# ─── Backup & Recovery ──────────────────────────────────
# Automated: BullMQ runs pg_dump → R2 daily at 2AM UTC
# Manual: Use these commands from your local machine
backup-db:              ## Create DB backup locally (pg_dump → ./backups/)
	cd backend && bash scripts/db-backup.sh

backup-db-restore:      ## Restore database from local backup (FILE=path/to/backup.sql.gz)
	cd backend && bash scripts/db-restore.sh $(FILE) --confirm

backup-cleanup:         ## Remove old local backups beyond retention period
	cd backend && bash scripts/backup-cleanup.sh

backup-status:          ## Show last automated backup timestamps from Redis
	@echo "=== Backup Status (Redis) ===" && \
	cd backend && node -e " \
		const Redis = require('ioredis'); \
		const r = new Redis(process.env.REDIS_URL || 'redis://localhost:6379'); \
		Promise.all([ \
			r.get('backup:last-success:db'), \
			r.get('backup:last-failure:db'), \
			r.get('backup:last-success:cleanup'), \
		]).then(([ds,df,cl]) => { \
			console.log('DB last success:       ', ds || 'never'); \
			console.log('DB last failure:       ', df || 'none'); \
			console.log('Cleanup last run:      ', cl || 'never'); \
			r.quit(); \
		}).catch(e => { console.error(e.message); r.quit(); }); \
	"

# ─── SSL / Let's Encrypt ───────────────────────────────
ssl-init:               ## Request initial Let's Encrypt certs for hireadda.in
	cd backend && docker compose exec certbot certbot certonly --webroot \
		-w /var/www/certbot \
		-d hireadda.in -d www.hireadda.in -d api.hireadda.in \
		--agree-tos --non-interactive --email $(EMAIL)

ssl-renew:              ## Force certificate renewal
	cd backend && docker compose exec certbot certbot renew --webroot -w /var/www/certbot
	cd backend && docker compose exec nginx nginx -s reload

ssl-status:             ## Show certificate expiry dates
	cd backend && docker compose exec certbot certbot certificates

ssl-dev:                ## Generate self-signed certs for local development
	cd backend/nginx/ssl && openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
		-keyout privkey.pem -out fullchain.pem -subj "/CN=localhost"

# ─── Mail Server (Docker Mailserver) ──────────────────────
mail-setup:             ## Initial mail server setup (accounts, DKIM, aliases)
	cd infra/mail && bash setup.sh

mail-up:                ## Start mail server
	cd infra/mail && docker compose up -d

mail-down:              ## Stop mail server
	cd infra/mail && docker compose down

mail-restart:           ## Restart mail server
	cd infra/mail && docker compose restart mailserver

mail-logs:              ## View mail server logs
	cd infra/mail && docker compose logs -f mailserver

mail-test:              ## Test mail server connectivity and configuration
	cd infra/mail && bash test.sh

mail-accounts:          ## List all email accounts
	cd infra/mail && docker compose exec mailserver setup email list

mail-dkim:              ## Show DKIM DNS record
	cd infra/mail && docker compose exec mailserver cat /tmp/docker-mailserver/opendkim/keys/hireadda.in/mail.txt

mail-add-account:       ## Add new email account (EMAIL=user@hireadda.in PASS=password)
	cd infra/mail && docker compose exec -T mailserver setup email add $(EMAIL) $(PASS)

# ─── Maintenance ─────────────────────────────────────────
install:                ## Install all dependencies
	npm install

clean:                  ## Clean all build artifacts and node_modules
	npm run clean

# ─── Help ────────────────────────────────────────────────
help:                   ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
