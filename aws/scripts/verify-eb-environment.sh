#!/bin/bash
#
# Task: CLD03
# Purpose: Audit the EXISTING treeo2-platform-api-test environment against
#          spec (ASG min/max, ALB attached), confirm the EB -> RDS security
#          group chain actually permits Postgres traffic, confirm PostGIS is
#          enabled on RDS, and set DATABASE_URL on the environment.
# Region: ap-southeast-2
# Creates: nothing. Updates: DATABASE_URL env var on treeo2-platform-api-test.
# Re-runnable: yes - every check is read-only, and `eb setenv` just
#          overwrites the same key.
# Rollback: N/A for the checks (read-only). To roll back the env var, run
#          `eb setenv DATABASE_URL=<previous-value>` on treeo2-platform-api-test.
# Depends on: CLD02 (verify-access.sh) should pass first - this script talks
#          to the same services (EC2, EB, RDS) plus the `eb` CLI.
#
# Required before running:
#   - DATABASE_URL must be exported in your shell.
#   - The `eb` CLI (EB CLI) must be installed and configured for step 4:
#       pip install --user awsebcli
#     then make sure its install location is on PATH (pip warns you of the
#     exact path if it isn't - on Windows/Git Bash this is typically
#     C:\Users\<you>\AppData\Roaming\Python\Python3xx\Scripts, added via
#     `export PATH="$PATH:/c/Users/<you>/AppData/Roaming/Python/Python3xx/Scripts"`).
#     `eb --version` should print a version once it's on PATH.
#   - `eb init` must have been run once in this directory (creates a local
#     .elasticbeanstalk/config.yml associating this folder with the real
#     EB application) before `eb use`/`eb setenv` will work. `eb init`
#     itself needs s3:ListBucket on the account's EB-managed bucket.
#   - `psql` must be on PATH, and this machine must actually be able to
#     reach RDS (PIA VPN + whitelisted static IP per aws/README.md)

set -euo pipefail

REGION="ap-southeast-2"
EB_ENV_NAME="treeo2-platform-api-test"
EXPECTED_MIN_SIZE=1
EXPECTED_MAX_SIZE=1
DB_PORT=5432
EXPECTED_ACCOUNT_ID="930315119020"

DATABASE_URL="${DATABASE_URL:-}"
RDS_INSTANCE_ID="${RDS_INSTANCE_ID:-}"

CHECK_NAMES=()
CHECK_RESULTS=()

record_result() {
  local name="$1"
  local status="$2"
  CHECK_NAMES+=("$name")
  CHECK_RESULTS+=("$status")
}

# Runs an AWS CLI command and echoes its stdout on success. On failure
# (such as AccessDenied), the error text is echoed instead and the function
# returns non-zero
run_aws() {
  "$@" 2>&1
}

echo "== Account/region confirmation =="
ACCOUNT_ID=$(aws sts get-caller-identity --query "Account" --output text)
echo "Account: $ACCOUNT_ID"
echo "Region:  $REGION"
if [ "$ACCOUNT_ID" != "$EXPECTED_ACCOUNT_ID" ]; then
  echo "ABORT - expected account $EXPECTED_ACCOUNT_ID, but caller identity" \
    "resolved to $ACCOUNT_ID. Refusing to run against the wrong account."
  exit 1
fi
echo

# ---------------------------------------------------------------------------
# Check 1: does treeo2-platform-api-test exist, and does its ASG match spec?
# ---------------------------------------------------------------------------
check_eb_environment_spec() {
  echo "-- 1. EB environment + Auto Scaling Group spec --"

  local env_status
  env_status=$(aws elasticbeanstalk describe-environments \
    --environment-names "$EB_ENV_NAME" \
    --region "$REGION" \
    --query "Environments[0].Status" --output text 2>/dev/null || echo "None")

  if [ "$env_status" == "None" ] || [ "$env_status" == "null" ]; then
    echo "FAIL - $EB_ENV_NAME was not found in $REGION"
    record_result "EB environment exists" "FAIL"
    record_result "ASG min/max matches spec" "SKIPPED"
    record_result "ALB attached" "SKIPPED"
    return
  fi
  echo "Found $EB_ENV_NAME, status: $env_status"
  record_result "EB environment exists" "PASS"

  ASG_NAME=$(aws elasticbeanstalk describe-environment-resources \
    --environment-name "$EB_ENV_NAME" \
    --region "$REGION" \
    --query "EnvironmentResources.AutoScalingGroups[0].Name" --output text)

  local min_size max_size
  read -r min_size max_size <<< "$(aws autoscaling describe-auto-scaling-groups \
    --auto-scaling-group-names "$ASG_NAME" \
    --region "$REGION" \
    --query "AutoScalingGroups[0].[MinSize,MaxSize]" --output text)"

  echo "ASG: $ASG_NAME (min=$min_size, max=$max_size)"
  if [ "$min_size" -eq "$EXPECTED_MIN_SIZE" ] && [ "$max_size" -eq "$EXPECTED_MAX_SIZE" ]; then
    echo "PASS - matches expected spec (min=$EXPECTED_MIN_SIZE, max=$EXPECTED_MAX_SIZE)"
    record_result "ASG min/max matches spec" "PASS"
  else
    echo "MISMATCH - expected min=$EXPECTED_MIN_SIZE max=$EXPECTED_MAX_SIZE," \
      "found min=$min_size max=$max_size"
    record_result "ASG min/max matches spec" "FAIL"
  fi

  local alb_count
  alb_count=$(aws elasticbeanstalk describe-environment-resources \
    --environment-name "$EB_ENV_NAME" \
    --region "$REGION" \
    --query "length(EnvironmentResources.LoadBalancers)" --output text)

  if [ "$alb_count" -gt 0 ]; then
    ALB_NAME=$(aws elasticbeanstalk describe-environment-resources \
      --environment-name "$EB_ENV_NAME" \
      --region "$REGION" \
      --query "EnvironmentResources.LoadBalancers[0].Name" --output text)
    echo "PASS - ALB attached: $ALB_NAME"
    record_result "ALB attached" "PASS"
  else
    echo "FAIL - no load balancer attached to $EB_ENV_NAME"
    record_result "ALB attached" "FAIL"
  fi
  echo
}

# ---------------------------------------------------------------------------
# Check 2: can the EB instances' security group actually reach RDS on 5432?
# ---------------------------------------------------------------------------
check_security_group_chain() {
  echo "-- 2. EB -> RDS security group chain --"

  local instance_id
  instance_id=$(aws elasticbeanstalk describe-environment-resources \
    --environment-name "$EB_ENV_NAME" \
    --region "$REGION" \
    --query "EnvironmentResources.Instances[0].Id" --output text 2>/dev/null || echo "None")

  if [ "$instance_id" == "None" ] || [ "$instance_id" == "null" ]; then
    echo "SKIPPED - no running EB instance found to read its security groups from"
    record_result "EB -> RDS security group chain" "SKIPPED"
    echo
    return
  fi

  EB_SG_IDS=$(aws ec2 describe-instances \
    --instance-ids "$instance_id" \
    --region "$REGION" \
    --query "Reservations[0].Instances[0].SecurityGroups[].GroupId" --output text)
  echo "EB instance $instance_id security group(s): $EB_SG_IDS"

  if [ -z "$RDS_INSTANCE_ID" ]; then
    local candidates
    if ! candidates=$(run_aws aws rds describe-db-instances \
        --region "$REGION" \
        --query "DBInstances[?contains(DBInstanceIdentifier, \`treeo2\`)].DBInstanceIdentifier" \
        --output text); then
      echo "SKIPPED - could not list RDS instances (likely IAM permission issues):"
      echo "  $candidates"
      record_result "EB -> RDS security group chain" "SKIPPED"
      echo
      return
    fi
    local candidate_count
    candidate_count=$(echo "$candidates" | wc -w)

    if [ "$candidate_count" -eq 1 ]; then
      RDS_INSTANCE_ID="$candidates"
      echo "Auto-discovered RDS instance: $RDS_INSTANCE_ID"
    else
      echo "SKIPPED - could not auto-discover a RDS instance" \
        "(candidates found: '${candidates:-none}')."
      echo "Re-run with RDS_INSTANCE_ID=<id> set to skip auto-discovery."
      record_result "EB -> RDS security group chain" "SKIPPED"
      echo
      return
    fi
  fi

  if ! RDS_SG_IDS=$(run_aws aws rds describe-db-instances \
      --db-instance-identifier "$RDS_INSTANCE_ID" \
      --region "$REGION" \
      --query "DBInstances[0].VpcSecurityGroups[].VpcSecurityGroupId" --output text); then
    echo "SKIPPED - could not describe RDS instance $RDS_INSTANCE_ID (likely IAM permission issues):"
    echo "  $RDS_SG_IDS"
    record_result "EB -> RDS security group chain" "SKIPPED"
    echo
    return
  fi
  echo "RDS instance $RDS_INSTANCE_ID security group(s): $RDS_SG_IDS"

  local chain_ok="false"
  local chain_error=""
  for rds_sg in $RDS_SG_IDS; do
    local allowed_from
    if ! allowed_from=$(run_aws aws ec2 describe-security-groups \
        --group-ids "$rds_sg" \
        --region "$REGION" \
        --query "SecurityGroups[0].IpPermissions[?FromPort<=\`$DB_PORT\` && ToPort>=\`$DB_PORT\`].UserIdGroupPairs[].GroupId" \
        --output text); then
      echo "SKIPPED - could not describe security group $rds_sg (likely IAM permission issues):"
      echo "  $allowed_from"
      chain_error="$allowed_from"
      continue
    fi

    for eb_sg in $EB_SG_IDS; do
      if echo "$allowed_from" | grep -qw "$eb_sg"; then
        echo "PASS - $rds_sg allows inbound $DB_PORT from $eb_sg"
        chain_ok="true"
      fi
    done
  done

  if [ "$chain_ok" == "true" ]; then
    record_result "EB -> RDS security group chain" "PASS"
  elif [ -n "$chain_error" ]; then
    echo "SKIPPED - could not fully evaluate the security group chain due to" \
      "the error(s) above."
    record_result "EB -> RDS security group chain" "SKIPPED"
  else
    echo "FAIL - no RDS security group was found permitting port $DB_PORT" \
      "from any EB security group ($EB_SG_IDS)"
    record_result "EB -> RDS security group chain" "FAIL"
  fi
  echo
}

# ---------------------------------------------------------------------------
# Check 3: is the PostGIS extension actually enabled on RDS?
# ---------------------------------------------------------------------------
check_postgis() {
  echo "-- 3. PostGIS extension on RDS --"

  if [ -z "$DATABASE_URL" ]; then
    echo "SKIPPED - DATABASE_URL is not set in this shell, cannot connect directly."
    echo "Run manually once connected: SELECT extversion FROM pg_extension WHERE extname = 'postgis';"
    record_result "PostGIS enabled on RDS" "SKIPPED"
    echo
    return
  fi

  if ! command -v psql >/dev/null 2>&1; then
    echo "SKIPPED - psql is not installed on this machine."
    echo "Run manually once connected: SELECT extversion FROM pg_extension WHERE extname = 'postgis';"
    record_result "PostGIS enabled on RDS" "SKIPPED"
    echo
    return
  fi

  local postgis_version
  if postgis_version=$(psql "$DATABASE_URL" -tAc \
      "SELECT extversion FROM pg_extension WHERE extname = 'postgis';" 2>/dev/null) \
      && [ -n "$postgis_version" ]; then
    echo "PASS - PostGIS enabled, version $postgis_version"
    record_result "PostGIS enabled on RDS" "PASS"
  else
    echo "FAIL - could not confirm PostGIS is enabled (query failed, or extension not found)."
    echo "Check RDS reachability (VPN + whitelisted IP, see aws/README.md) before assuming it's missing."
    record_result "PostGIS enabled on RDS" "FAIL"
  fi
  echo
}

# ---------------------------------------------------------------------------
# Step 4: set DATABASE_URL on the environment.
# ---------------------------------------------------------------------------
set_eb_env_vars() {
  echo "-- 4. Set DATABASE_URL on $EB_ENV_NAME --"

  if [ -z "$DATABASE_URL" ]; then
    echo "SKIPPED - DATABASE_URL is not set in this shell, nothing to write."
    record_result "DATABASE_URL set on EB" "SKIPPED"
    echo
    return
  fi

  if ! command -v eb >/dev/null 2>&1; then
    echo "SKIPPED - the EB CLI ('eb') is not installed on this machine."
    record_result "DATABASE_URL set on EB" "SKIPPED"
    echo
    return
  fi

  local eb_output
  if eb_output=$(eb use "$EB_ENV_NAME" 2>&1) && eb_output+=$'\n'"$(eb setenv DATABASE_URL="$DATABASE_URL" 2>&1)"; then
    echo "PASS - DATABASE_URL set on $EB_ENV_NAME"
    record_result "DATABASE_URL set on EB" "PASS"
  else
    echo "FAIL - eb use/eb setenv did not complete successfully:"
    echo "$eb_output"
    record_result "DATABASE_URL set on EB" "FAIL"
  fi
  echo
}

check_eb_environment_spec
check_security_group_chain
check_postgis
set_eb_env_vars

echo "== Summary =="
for i in "${!CHECK_NAMES[@]}"; do
  printf '%-30s %s\n' "${CHECK_NAMES[$i]}" "${CHECK_RESULTS[$i]}"
done