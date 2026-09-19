#!/usr/bin/env bash

# Task: CLD05
# Purpose: Test deployed TreeO2 API health, read, authenticated write, and RBAC failure paths
# Region: ap-southeast-2
# Creates: One uniquely named test tree type per successful run
# Re-runnable: yes, uses a unique timestamped test tree type name
# Depends on: CLD04 deployed API environment

set -euo pipefail

REGION="ap-southeast-2"

# Required runtime variables.
# Do not hardcode deployed URLs or authentication tokens in this file.
: "${BASE_URL:?Set BASE_URL to the deployed TreeO2 API URL}"
: "${ADMIN_TOKEN:?Set ADMIN_TOKEN to a valid ADMIN JWT}"
: "${NON_ADMIN_TOKEN:?Set NON_ADMIN_TOKEN to a valid non-ADMIN JWT}"

# Remove a trailing slash if one was supplied.
BASE_URL="${BASE_URL%/}"

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "Running against AWS account $ACCOUNT_ID in $REGION"
echo "Testing API at $BASE_URL"
echo

TMP_BODY=$(mktemp)

cleanup() {
  rm -f "$TMP_BODY"
}

trap cleanup EXIT

run_request() {
  local name="$1"
  local expected_status="$2"
  shift 2

  echo "=== $name ==="

  RESULT=$(curl \
    --silent \
    --show-error \
    --output "$TMP_BODY" \
    --write-out "%{http_code}|%{time_total}" \
    "$@")

  HTTP_STATUS="${RESULT%%|*}"
  RESPONSE_TIME="${RESULT##*|}"

  cat "$TMP_BODY"
  echo
  echo "HTTP status: $HTTP_STATUS"
  echo "Response time: ${RESPONSE_TIME}s"

  if [ "$expected_status" = "2xx" ]; then
    if [[ "$HTTP_STATUS" != 2* ]]; then
      echo "FAILED: expected a 2xx response"
      exit 1
    fi
  elif [ "$HTTP_STATUS" != "$expected_status" ]; then
    echo "FAILED: expected HTTP $expected_status"
    exit 1
  fi

  echo "PASS"
  echo
}

# 1. Health check
run_request \
  "Health check" \
  "2xx" \
  "$BASE_URL/health"

# 2. Read endpoint
run_request \
  "Read tree types" \
  "2xx" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  "$BASE_URL/tree-types"

# 3. Authenticated write endpoint
TEST_TREE_TYPE="CLD05 Test $(date +%s)"

run_request \
  "Authenticated tree type write" \
  "2xx" \
  -X POST \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"$TEST_TREE_TYPE\"}" \
  "$BASE_URL/tree-types"

# 4. RBAC failure - authenticated non-ADMIN user must be forbidden
run_request \
  "RBAC failure check" \
  "403" \
  -X POST \
  -H "Authorization: Bearer $NON_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"CLD05 Forbidden Test\"}" \
  "$BASE_URL/tree-types"

echo "CLD05 endpoint checks completed successfully."