# RevSync Ops Runbook

## 1. Start / Stop Services (Local)
```bash
# Backend
cd backend
python manage.py runserver 0.0.0.0:8000

# Web
cd ../web
npm run dev
```

Stop with `Ctrl+C` in each terminal.

## 2. Pre-Deploy Validation
```bash
cd backend
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py test users.tests.test_auth_flow users.tests.test_preferences_api core.tests.test_health
```

## 3. Deploy / Migration Safety
```bash
cd backend
python manage.py migrate --noinput
./scripts/check_migrations.sh
```

If `check_migrations.sh` fails in staging/prod, stop rollout and apply missing migrations.

## 4. Runtime Health + Auth Smoke
```bash
# From repo root
./scripts/check_health.sh
```

Manual auth smoke:
1. `POST /api/v1/auth/login/` with a known user.
2. `POST /api/v1/auth/refresh/` with returned refresh token.
3. `GET /api/v1/users/me/` with returned access token.
4. `GET /api/v1/preferences/` and verify expected user preferences load.

## 5. Key Rotation
If signing keys are compromised:
1. Generate new key pair (internal process/command).
2. Rotate `REVSYNC_SIGNING_PRIVATE_KEY` and `REVSYNC_SIGNING_PUBLIC_KEY`.
3. Deploy backend and clients that trust the new public key.
4. Re-sign active artifacts if required by policy.

## 6. Tune Kill Switch
If a tune is unsafe in production:
1. In admin, set tune/listing status to `SUSPENDED`.
2. Confirm download endpoints return `403` for that version.
3. Notify affected purchasers and process refunds/credits where required.

## 7. Incident Notes
- Prefer reversible actions first (suspend before delete).
- Capture relevant logs and timestamps before restarting services.
- Record root cause and follow-up tasks in `TODO.md`.
