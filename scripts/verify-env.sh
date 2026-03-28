#!/bin/bash
# ─── Verify that all required env vars are set ──────────
# Run this before deploying to catch missing configuration.

set -e

echo "Katha AI - Environment Verification"
echo "===================================="
echo ""

ENV_FILE="${1:-.env.local}"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE not found"
  echo "Run: cp .env.example .env.local"
  exit 1
fi

echo "Reading from: $ENV_FILE"
echo ""

# Source the env file
set -a
source "$ENV_FILE"
set +a

ERRORS=0

check_var() {
  local var_name="$1"
  local required="$2"  # "required" or "optional"
  local value="${!var_name}"

  if [ -z "$value" ]; then
    if [ "$required" = "required" ]; then
      echo "  MISSING  $var_name"
      ERRORS=$((ERRORS + 1))
    else
      echo "  skip     $var_name (optional)"
    fi
  else
    # Mask secrets in output
    case "$var_name" in
      *SECRET*|*PASSWORD*|*KEY*|*DSN*)
        echo "  OK       $var_name = ****"
        ;;
      *)
        echo "  OK       $var_name = $value"
        ;;
    esac
  fi
}

echo "── Core ──────────────────────────────────────"
check_var NODE_ENV required
check_var APP_PORT required

echo ""
echo "── Database ──────────────────────────────────"
check_var DATABASE_URL required

echo ""
echo "── Redis ─────────────────────────────────────"
check_var REDIS_HOST required
check_var REDIS_PORT required
check_var REDIS_PASSWORD optional

echo ""
echo "── Auth ──────────────────────────────────────"
check_var JWT_SECRET required
check_var JWT_EXPIRES_IN required
check_var ENCRYPTION_SECRET required

echo ""
echo "── OAuth ─────────────────────────────────────"
check_var GOOGLE_CLIENT_ID optional
check_var APPLE_CLIENT_ID optional

echo ""
echo "── AI / Voice ────────────────────────────────"
check_var AI_PROVIDER required
check_var TTS_PROVIDER required
check_var STT_PROVIDER required

echo ""
echo "── Subscription ──────────────────────────────"
check_var APPLE_SHARED_SECRET optional
check_var GOOGLE_SERVICE_ACCOUNT_KEY optional

echo ""
echo "── Observability ─────────────────────────────"
check_var SENTRY_DSN optional

echo ""
echo "=============================================="
if [ "$ERRORS" -gt 0 ]; then
  echo "FAILED: $ERRORS required variable(s) missing"
  exit 1
else
  echo "ALL CHECKS PASSED"
fi
