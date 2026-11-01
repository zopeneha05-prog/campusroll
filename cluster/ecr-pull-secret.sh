#!/usr/bin/env bash
# Refresh the 'ecr-pull' imagePullSecret used by kind to pull CampusRoll from private ECR.
# ECR auth tokens last 12h -> scheduled with cron (see GUIDE). Credentials come from the EC2 instance role.
set -euo pipefail
export PATH="/usr/local/bin:/usr/bin:/bin"
export KUBECONFIG="${KUBECONFIG:-/home/ubuntu/.kube/config}"

AWS_REGION="${AWS_REGION:-ap-south-1}"
NS="campusroll"
REGISTRY="$(aws sts get-caller-identity --query Account --output text).dkr.ecr.${AWS_REGION}.amazonaws.com"
TOKEN="$(aws ecr get-login-password --region "$AWS_REGION")"

kubectl get ns "$NS" >/dev/null 2>&1 || kubectl create ns "$NS"
kubectl -n "$NS" delete secret ecr-pull --ignore-not-found
kubectl -n "$NS" create secret docker-registry ecr-pull \
  --docker-server="$REGISTRY" --docker-username=AWS --docker-password="$TOKEN"
echo "[$(date -Is)] ecr-pull secret refreshed"
