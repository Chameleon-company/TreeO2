# AWS Scripting Guide

A guide for anyone writing a script that touches the TreeO2 AWS account. Covers what a script actually is, the shape every script needs to follow, and a few examples to copy from.

## What a script actually is

A script is just a text file full of terminal commands, saved together so they run one after another instead of typing each one by hand. If you can type an AWS CLI command into your terminal, you can write a script, it's the same commands, just saved to a file.

You don't need AWS access to write one. You only need access to run it, which is why the split works: you write it and open a PR, the Cloud Leads review it, and they'll run it themselves later once it's approved.

## The shape every script should follow

Five things every script needs. Here's why each one matters, then the examples below put them all together.

**1. A header comment at the top.** Task ID, what it does, what region it runs in, what it creates, and whether it's safe to run twice. This is what makes review fast, whoever's checking it can read a few lines and know what's about to run instead of reading the whole thing line by line first.

**2. `set -euo pipefail` right after the header.** This one line stops the script the moment something goes wrong, instead of letting it plow ahead with a half-broken setup. Without it, a typo on line 3 might not show up until line 15 fails in a confusing way.

**3. A region and account check before anything real happens.** With one shared AWS user, this is the single most important safety line, it stops a script from accidentally running against the wrong account.

**4. Variables instead of hardcoded values.** Names, IDs, regions, put them in variables at the top, don't bury them in the middle of a command. Anything another script might need later, like a queue URL, should get printed out at the end.

**5. Check before you create, and confirm before you destroy.** Every `create-*` command should check first whether the thing already exists, that's what lets a script run more than once safely. Every `delete-*`/`terminate-*`/`revoke-*` should ask "are you sure?" before doing it.

## Example 1: SQS queue

```bash
# Task: CLD07
# Purpose: Create treeo2-reports queue with a dead-letter queue
# Region: ap-southeast-2
# Creates: 2 SQS queues (treeo2-reports, treeo2-reports-dlq)
# Re-runnable: yes, checks for an existing queue first

set -euo pipefail

REGION="ap-southeast-2"
QUEUE_NAME="treeo2-reports"
DLQ_NAME="treeo2-reports-dlq"

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "Running against account $ACCOUNT_ID in $REGION"

DLQ_URL=$(aws sqs get-queue-url --queue-name "$DLQ_NAME" --region "$REGION" \
  --query 'QueueUrl' --output text 2>/dev/null || echo "None")

if [ "$DLQ_URL" == "None" ]; then
  DLQ_URL=$(aws sqs create-queue --queue-name "$DLQ_NAME" --region "$REGION" \
    --query 'QueueUrl' --output text)
  echo "Created $DLQ_NAME: $DLQ_URL"
else
  echo "$DLQ_NAME already exists: $DLQ_URL, skipping"
fi

DLQ_ARN=$(aws sqs get-queue-attributes --queue-url "$DLQ_URL" \
  --attribute-names QueueArn --region "$REGION" \
  --query 'Attributes.QueueArn' --output text)

QUEUE_URL=$(aws sqs get-queue-url --queue-name "$QUEUE_NAME" --region "$REGION" \
  --query 'QueueUrl' --output text 2>/dev/null || echo "None")

if [ "$QUEUE_URL" == "None" ]; then
  REDRIVE_POLICY="{\"deadLetterTargetArn\":\"$DLQ_ARN\",\"maxReceiveCount\":\"3\"}"

  QUEUE_URL=$(aws sqs create-queue \
    --queue-name "$QUEUE_NAME" \
    --attributes "RedrivePolicy=$REDRIVE_POLICY" \
    --region "$REGION" \
    --query 'QueueUrl' --output text)

  echo "Created $QUEUE_NAME: $QUEUE_URL (moves to DLQ after 3 failed tries)"
else
  echo "$QUEUE_NAME already exists: $QUEUE_URL, skipping"
fi
```

## Example 2: S3 bucket

```bash
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
```

## Example 3: EB environment variables

```bash
# Task: CLD03
# Purpose: Set DATABASE_URL and other required env vars on the EB environment
# Region: ap-southeast-2
# Updates: environment variables on treeo2-platform-api-test
# Re-runnable: yes, eb setenv just overwrites the same keys

set -euo pipefail

REGION="ap-southeast-2"
ENV_NAME="treeo2-platform-api-test"

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "Running against account $ACCOUNT_ID in $REGION"

CURRENT_STATUS=$(aws elasticbeanstalk describe-environments \
  --environment-names "$ENV_NAME" \
  --region "$REGION" \
  --query 'Environments[0].Status' --output text 2>/dev/null || echo "None")

if [ "$CURRENT_STATUS" == "None" ]; then
  echo "$ENV_NAME doesn't exist yet, nothing to set env vars on"
  exit 1
fi

echo "Setting env vars on $ENV_NAME (currently $CURRENT_STATUS)"

eb use "$ENV_NAME"
eb setenv \
  DATABASE_URL="$DATABASE_URL" \
  NODE_ENV="production"

echo "Env vars set on $ENV_NAME"
```

## Example 4: Deleting an SQS queue (a destructive one)

```bash
# Task: cleanup
# Purpose: Delete treeo2-reports queue when tearing down a test environment
# Region: ap-southeast-2
# Deletes: 1 SQS queue (treeo2-reports)
# Re-runnable: yes, does nothing if the queue is already gone

set -euo pipefail

REGION="ap-southeast-2"
QUEUE_NAME="treeo2-reports"

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "Running against account $ACCOUNT_ID in $REGION"

QUEUE_URL=$(aws sqs get-queue-url --queue-name "$QUEUE_NAME" --region "$REGION" \
  --query 'QueueUrl' --output text 2>/dev/null || echo "None")

if [ "$QUEUE_URL" == "None" ]; then
  echo "$QUEUE_NAME doesn't exist, nothing to delete"
else
  read -p "This will delete $QUEUE_NAME ($QUEUE_URL). Type 'yes' to continue: " CONFIRM
  if [ "$CONFIRM" == "yes" ]; then
    aws sqs delete-queue --queue-url "$QUEUE_URL" --region "$REGION"
    echo "Deleted $QUEUE_NAME"
  else
    echo "Aborted, nothing deleted"
  fi
fi
```

## What gets checked before anything runs

- Header block present and accurate?
- `set -euo pipefail` at the top?
- Region and account confirmed before real work starts?
- Variables used instead of hardcoded names/IDs?
- Existence check before every `create-*`?
- Confirmation prompt before any `delete-*`/`terminate-*`/`revoke-*`?
- Matches the task's actual subtask list, no more, no less?

## If you want to learn more

- [AWS CLI Command Reference](https://docs.aws.amazon.com/cli/latest/reference/): look up any command's exact flags here
- [AWS CLI User Guide](https://docs.aws.amazon.com/cli/latest/userguide/): the basics of configuring and using the CLI
- [ShellCheck](https://www.shellcheck.net/): paste a script in and it'll flag common bash mistakes before you even run it
- [Google's Shell Style Guide](https://google.github.io/styleguide/shellguide.html): good habits for writing bash that's easy for someone else to read

## The full workflow

1. Write the script for your CLD task, following the shape above.
2. Commit it to `aws/scripts/` on a feature branch and open a PR, same as application code.
3. It goes through normal review against the checklist above.
4. Once approved and merged, the **Cloud Leads will review it, and they will run it themselves later once it's approved.** Being merged doesn't mean it's been run, those are two different states, and mixing them up is how the repo and the real AWS account quietly drift apart without anyone noticing.
5. Whoever applies it logs it in `aws/scripts/APPLIED.md`, one line per script:

```
| Date       | Script                          | Applied by  | Result | Notes |
|------------|---------------------------------|-------------|--------|-------|
| 2026-08-27 | create-sqs-queue.sh             | Cloud Lead  | OK     | —     |
| 2026-08-28 | create-s3-bucket.sh             | Cloud Lead  | OK     | —     |
```

This log is the actual source of truth for what's been done to AWS.

## One more thing for the PR description

If your script depends on something already existing, an earlier task's security group, an IAM role, a VPC, say so directly in the PR description. Don't leave it for whoever's applying scripts to work out by reading the code. If there's a queue of several merged-but-unapplied scripts, the order they need to run in should be obvious from the descriptions, not something anyone has to reverse-engineer under time pressure.