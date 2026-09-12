#!/usr/bin/env bash
#
# verify-access.sh
#
# Task:      CLD02 - Access Verification
# Purpose:   Confirm the shared IAM user (treeo2-platform-dev) can reach/manage
#            the five AWS services the TreeO2 Cloud/DevOps stream depends on:
#            EC2 security groups, Elastic Beanstalk, S3, SQS, CloudWatch
#            (alarms and log groups checked independently).
#            Read-only - no resources are created, modified, or deleted.
# Region:    ap-southeast-2
# Creates:   Nothing. Safe to run any number of times.
# Rollback:  N/A - read-only.
#
# Output:    Prints a PASS/FAIL line per service, with the real AWS error
#            message on failure, then a summary table.
#            Exits non-zero if any service failed,(per CLD02's
#            dependency notes).

set -euo pipefail

REGION="ap-southeast-2"
EB_ENV_NAME="treeo2-platform-api-test"

# service -> result, for the final summary table
declare -A RESULTS
declare -A ERRORS

record_result() {
  local service="$1" status="$2" detail="${3:-}"
  RESULTS["$service"]="$status"
  ERRORS["$service"]="$detail"
}

# Runs an AWS CLI command, captures stderr, and
# returns the command's exit code.
run_check() {
  local out
  if out=$("$@" 2>&1 >/dev/null); then
    LAST_ERROR=""
    return 0
  else
    LAST_ERROR="$out"
    return 1
  fi
}

echo "== CLD02: Access Verification =="
echo "Account/region check:"
if ! aws sts get-caller-identity --output text >/tmp/whoami.$$ 2>&1; then
  echo "FAIL - could not confirm caller identity"
  cat /tmp/whoami.$$
  rm -f /tmp/whoami.$$
  exit 1
fi
cat /tmp/whoami.$$
rm -f /tmp/whoami.$$
echo

check_ec2_security_groups() {
  echo "-- EC2 (security groups) --"
  if run_check aws ec2 describe-security-groups --region "$REGION" --max-results 5; then
    record_result "EC2 security groups" "PASS"
    echo "PASS - describe-security-groups succeeded"
  else
    record_result "EC2 security groups" "FAIL" "$LAST_ERROR"
    echo "FAIL - describe-security-groups was rejected"
    echo "  $LAST_ERROR"
  fi
  echo
}

check_elastic_beanstalk() {
  echo "-- Elastic Beanstalk ($EB_ENV_NAME) --"
  if run_check aws elasticbeanstalk describe-environments \
      --region "$REGION" --environment-names "$EB_ENV_NAME"; then
    record_result "Elastic Beanstalk" "PASS"
    echo "PASS - describe-environments succeeded for $EB_ENV_NAME"
  else
    record_result "Elastic Beanstalk" "FAIL" "$LAST_ERROR"
    echo "FAIL - describe-environments was rejected"
    echo "  $LAST_ERROR"
  fi
  echo
}

check_s3() {
  echo "-- S3 --"
  if run_check aws s3api list-buckets --region "$REGION"; then
    record_result "S3" "PASS"
    echo "PASS - list-buckets succeeded"
  else
    record_result "S3" "FAIL" "$LAST_ERROR"
    echo "FAIL - list-buckets was rejected"
    echo "  $LAST_ERROR"
  fi
  echo
}

check_sqs() {
  echo "-- SQS --"
  if run_check aws sqs list-queues --region "$REGION"; then
    record_result "SQS" "PASS"
    echo "PASS - list-queues succeeded"
  else
    record_result "SQS" "FAIL" "$LAST_ERROR"
    echo "FAIL - list-queues was rejected"
    echo "  $LAST_ERROR"
  fi
  echo
}

check_cloudwatch() {
  echo "-- CloudWatch (alarms) --"
  if run_check aws cloudwatch describe-alarms --region "$REGION" --max-records 5; then
    record_result "CloudWatch alarms" "PASS"
    echo "PASS - describe-alarms succeeded"
  else
    record_result "CloudWatch alarms" "FAIL" "$LAST_ERROR"
    echo "FAIL - describe-alarms was rejected"
    echo "  $LAST_ERROR"
  fi
  echo

  echo "-- CloudWatch (log groups) --"
  if run_check aws logs describe-log-groups --region "$REGION" --limit 5; then
    record_result "CloudWatch logs" "PASS"
    echo "PASS - describe-log-groups succeeded"
  else
    record_result "CloudWatch logs" "FAIL" "$LAST_ERROR"
    echo "FAIL - describe-log-groups was rejected"
    echo "  $LAST_ERROR"
  fi
  echo
}

check_ec2_security_groups
check_elastic_beanstalk
check_s3
check_sqs
check_cloudwatch

echo "== Summary =="
overall_status=0
for service in "EC2 security groups" "Elastic Beanstalk" "S3" "SQS" "CloudWatch alarms" "CloudWatch logs"; do
  printf "%-25s %s\n" "$service" "${RESULTS[$service]}"
  if [[ "${RESULTS[$service]}" == "FAIL" ]]; then
    overall_status=1
    if [[ -n "${ERRORS[$service]}" ]]; then
      echo "  error: ${ERRORS[$service]}"
    fi
  fi
done

if [[ "$overall_status" -ne 0 ]]; then
  echo
  echo "One or more service checks failed - check FAIL messages above."
fi

exit "$overall_status"