# Task: CLD07
# Purpose: To create a TreeO2 report queue with a dead-letter queue
# Region: ap-southeast-2
# Creates: 2 SQS queues (treeo2-reports, treeo2-reports-dlq
# Re-runnable: yes, checks for existing queues first


set -euo pipefail

REGION="ap-southeast-2"
QUEUE_NAME="treeo2-reports"
DLQ_NAME="treeo2-reports-dlq"
MAX_RECEIVE_COUNT="3"

ACCOUNT_ID=$(aws sts get-caller-identity \
  --query Account \
  --output text)

echo "Running against account $ACCOUNT_ID in $REGION"

#DLQ
DLQ_URL=$(aws sqs get-queue-url \
  --queue-name "$DLQ_NAME" \
  --region "$REGION" \
  --query 'QueueUrl' \
  --output text 2>/dev/null || echo "None")

if [ "$DLQ_URL" == "None" ]; then
  DLQ_URL=$(aws sqs create-queue \
    --queue-name "$DLQ_NAME" \
    --region "$REGION" \
    --query 'QueueUrl' \
    --output text)

  echo "Created $DLQ_NAME: $DLQ_URL"
else
  echo "$DLQ_NAME already exists: $DLQ_URL, skipping"
fi

DLQ_ARN=$(aws sqs get-queue-attributes \
  --queue-url "$DLQ_URL" \
  --attribute-names QueueArn \
  --region "$REGION" \
  --query 'Attributes.QueueArn' \
  --output text)

#SQS
QUEUE_URL=$(aws sqs get-queue-url \
  --queue-name "$QUEUE_NAME" \
  --region "$REGION" \
  --query 'QueueUrl' \
  --output text 2>/dev/null || echo "None")

if [ "$QUEUE_URL" == "None" ]; then

  # Redrive policy:
  REDRIVE_POLICY="{\"deadLetterTargetArn\":\"$DLQ_ARN\",\"maxReceiveCount\":\"$MAX_RECEIVE_COUNT\"}"

  QUEUE_URL=$(aws sqs create-queue \
    --queue-name "$QUEUE_NAME" \
    --attributes "RedrivePolicy=$REDRIVE_POLICY" \
    --region "$REGION" \
    --query 'QueueUrl' \
    --output text)

  echo "Created $QUEUE_NAME: $QUEUE_URL"
else
  echo "$QUEUE_NAME already exists: $QUEUE_URL, skipping"
fi

echo "Queue URL: $QUEUE_URL"


REDRIVE_POLICY_OUTPUT=$(aws sqs get-queue-attributes \
  --queue-url "$QUEUE_URL" \
  --attribute-names RedrivePolicy \
  --region "$REGION" \
  --query 'Attributes.RedrivePolicy' \
  --output text)

echo "Redrive policy: $REDRIVE_POLICY_OUTPUT"