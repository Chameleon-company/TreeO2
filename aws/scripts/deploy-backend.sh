# Task: CLD04
# Purpose: Run database migrations against RDS, deploy the backend to
#          Elastic Beanstalk, and verify the deployed application
# Region: ap-southeast-2
# Updates: RDS schema and treeo2-platform-api-test deployment
# Re-runnable: yes, Prisma migrations only apply pending migrations

set -euo pipefail

REGION="ap-southeast-2"
ENV_NAME="treeo2-platform-api-test"

echo "=== CLD04: Deploy Backend ==="

# Verify AWS identity
ACCOUNT_ID=$(aws sts get-caller-identity \
	--query Account \
	--output text)

echo "AWS account: $ACCOUNT_ID"
echo "AWS region: $REGION"

# DATABASE_URL must be supplied externally.
# CLD03 is responsible for configuring DATABASE_URL on the EB environment.
if [ -z "${DATABASE_URL:-}" ]; then
	echo "ERROR: DATABASE_URL is not set."
	echo "Provide the real RDS DATABASE_URL before running this script."
	exit 1
fi

# Verify the EB environment exists
CURRENT_STATUS=$(aws elasticbeanstalk describe-environments \
	--environment-names "$ENV_NAME" \
	--region "$REGION" \
	--query 'Environments[0].Status' \
	--output text 2>/dev/null || echo "None")

if [ "$CURRENT_STATUS" = "None" ]; then
	echo "ERROR: Elastic Beanstalk environment '$ENV_NAME' does not exist."
	exit 1
fi

echo "EB environment: $ENV_NAME"
echo "EB status: $CURRENT_STATUS"

# Run pending migrations against RDS
echo ""
echo "=== Running database migrations ==="
npm run prisma:migrate:deploy

echo "Database migrations completed."

# Deploy backend to Elastic Beanstalk
echo ""
echo "=== Deploying backend ==="
eb use "$ENV_NAME"
eb deploy

echo "Deployment completed."

# Get the deployed environment URL
ENV_CNAME=$(aws elasticbeanstalk describe-environments \
	--environment-names "$ENV_NAME" \
	--region "$REGION" \
	--query 'Environments[0].CNAME' \
	--output text)

ENV_URL="http://$ENV_CNAME"

echo ""
echo "=== Health Check ==="
echo "Checking $ENV_URL/health"

HEALTH_RESPONSE=$(curl \
	--fail \
	--silent \
	--show-error \
	"$ENV_URL/health")

echo "Health check: PASS"
echo "$HEALTH_RESPONSE"

# Verify database connectivity
echo ""
echo "=== Database Connection Check ==="

if npx prisma migrate status --schema prisma > /dev/null 2>&1; then
	echo "Database connection: PASS"
else
	echo "Database connection: FAIL"
	exit 1
fi

echo ""
echo "=== CLD04 completed successfully ==="