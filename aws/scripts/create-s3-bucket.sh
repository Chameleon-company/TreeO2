#!/usr/bin/env bash
# Task: CLD06
# Purpose: Create treeo2-reports bucket (private, versioned, encrypted)
# Region: ap-southeast-2
# Creates: 1 S3 bucket (treeo2-reports)
# Re-runnable: yes, checks for an existing bucket first

set -euo pipefail

REGION="ap-southeast-2"
BUCKET_NAME="treeo2-reports"

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "Running against account $ACCOUNT_ID in $REGION"

if aws s3api head-bucket --bucket "$BUCKET_NAME" 2>/dev/null; then
  echo "$BUCKET_NAME already exists, skipping creation"
else
  aws s3api create-bucket \
    --bucket "$BUCKET_NAME" \
    --region "$REGION" \
    --create-bucket-configuration LocationConstraint="$REGION"

  aws s3api put-bucket-versioning \
    --bucket "$BUCKET_NAME" \
    --versioning-configuration Status=Enabled

  aws s3api put-bucket-encryption \
    --bucket "$BUCKET_NAME" \
    --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

  aws s3api put-public-access-block \
    --bucket "$BUCKET_NAME" \
    --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

  echo "Created $BUCKET_NAME with versioning, encryption, and public access blocked"
fi

# Print the bucket's actual configuration, so whoever runs this can confirm the
# settings landed rather than trusting the create calls above. Runs on both
# paths, so a re-run also reports the current state.
#
# Each lookup falls back to "None" rather than failing: a bucket that already
# existed may not have every setting configured, and reporting that is more
# useful than aborting under set -e.
BUCKET_REGION=$(aws s3api get-bucket-location \
  --bucket "$BUCKET_NAME" \
  --query 'LocationConstraint' --output text 2>/dev/null || echo "None")

VERSIONING=$(aws s3api get-bucket-versioning \
  --bucket "$BUCKET_NAME" \
  --query 'Status' --output text 2>/dev/null || echo "None")

ENCRYPTION=$(aws s3api get-bucket-encryption \
  --bucket "$BUCKET_NAME" \
  --query 'ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm' \
  --output text 2>/dev/null || echo "None")

PUBLIC_ACCESS=$(aws s3api get-public-access-block \
  --bucket "$BUCKET_NAME" \
  --query 'PublicAccessBlockConfiguration.[BlockPublicAcls,IgnorePublicAcls,BlockPublicPolicy,RestrictPublicBuckets]' \
  --output text 2>/dev/null || echo "None")

echo
echo "Configuration for $BUCKET_NAME:"
echo "  ARN:                 arn:aws:s3:::$BUCKET_NAME"
echo "  Region:              ${BUCKET_REGION:-None}"
echo "  Versioning:          ${VERSIONING:-None}"
echo "  Encryption:          ${ENCRYPTION:-None}"
echo "  Public access block: ${PUBLIC_ACCESS:-None}"
