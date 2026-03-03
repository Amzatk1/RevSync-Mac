#!/usr/bin/env bash
set -euo pipefail

BACKEND_HEALTH_URL="${BACKEND_HEALTH_URL:-http://127.0.0.1:8000/api/v1/health/}"
WEB_HEALTH_URL="${WEB_HEALTH_URL:-http://127.0.0.1:3000/api/health}"

echo "Checking backend health: ${BACKEND_HEALTH_URL}"
BACKEND_CODE="$(curl -s -o /tmp/backend_health.txt -w "%{http_code}" "${BACKEND_HEALTH_URL}")"
cat /tmp/backend_health.txt
echo
if [[ "${BACKEND_CODE}" != "200" ]]; then
    echo "Backend health check failed with HTTP ${BACKEND_CODE}"
    exit 1
fi

echo "Checking web health: ${WEB_HEALTH_URL}"
WEB_CODE="$(curl -s -o /tmp/web_health.txt -w "%{http_code}" "${WEB_HEALTH_URL}")"
cat /tmp/web_health.txt
echo
if [[ "${WEB_CODE}" != "200" ]]; then
    echo "Web health check failed with HTTP ${WEB_CODE}"
    exit 1
fi

echo "Health checks passed."
