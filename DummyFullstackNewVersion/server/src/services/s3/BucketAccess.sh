#!/usr/bin/env bash
# Lock a bucket to one access key (Hetzner Object Storage)
# Usage: STORAGE_ENDPOINT=... STORAGE_BUCKET=... STORAGE_ACCESS_KEY=... STORAGE_SECRET_KEY=... ./BucketAccess.sh <projectId>
set -euo pipefail

PROJECT_ID="${1:?Usage: ./BucketAccess.sh <projectId>}"
: "${STORAGE_ENDPOINT:?STORAGE_ENDPOINT is required}"
: "${STORAGE_BUCKET:?STORAGE_BUCKET is required}"
: "${STORAGE_ACCESS_KEY:?STORAGE_ACCESS_KEY is required}"
: "${STORAGE_SECRET_KEY:?STORAGE_SECRET_KEY is required}"

# Project id needs a 'p' prefix
case "$PROJECT_ID" in p*) ;; *) PROJECT_ID="p${PROJECT_ID}";; esac

export AWS_ACCESS_KEY_ID="$STORAGE_ACCESS_KEY"
export AWS_SECRET_ACCESS_KEY="$STORAGE_SECRET_KEY"

PRINCIPAL="arn:aws:iam:::user/${PROJECT_ID}:${STORAGE_ACCESS_KEY}"
POLICY_FILE="$(mktemp)"
trap 'rm -f "$POLICY_FILE"' EXIT

# Deny everyone except this key
cat > "$POLICY_FILE" <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyAllUsersButOne",
      "Effect": "Deny",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::${STORAGE_BUCKET}",
        "arn:aws:s3:::${STORAGE_BUCKET}/*"
      ],
      "NotPrincipal": {
        "AWS": "${PRINCIPAL}"
      }
    }
  ]
}
EOF

echo "Applying policy to bucket '${STORAGE_BUCKET}' allowing only ${PRINCIPAL} ..."
aws s3api put-bucket-policy \
  --bucket "${STORAGE_BUCKET}" \
  --policy "file://${POLICY_FILE}" \
  --endpoint-url "${STORAGE_ENDPOINT}"

echo "Testing access with the allowed key..."
aws s3 ls "s3://${STORAGE_BUCKET}" --endpoint-url "${STORAGE_ENDPOINT}"

echo "Done. Other keys in the project now get AccessDenied for this bucket."
