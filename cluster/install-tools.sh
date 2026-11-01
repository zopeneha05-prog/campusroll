#!/usr/bin/env bash
# CampusRoll admin box bootstrap (Ubuntu 24.04 on EC2)
# Installs: Docker (official repo), AWS CLI v2, kubectl, kind, Helm, argocd CLI, yq
set -euo pipefail
ARCH=amd64

step() { echo; echo "==== $* ===="; }

step "Docker Engine (official Docker apt repo)"
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg unzip git
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor --yes -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin
sudo usermod -aG docker "$USER"

step "AWS CLI v2"
curl -fsSL https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip -o /tmp/awscli.zip
unzip -qo /tmp/awscli.zip -d /tmp && sudo /tmp/aws/install --update

step "kubectl"
curl -fsSLo /tmp/kubectl "https://dl.k8s.io/release/$(curl -fsSL https://dl.k8s.io/release/stable.txt)/bin/linux/${ARCH}/kubectl"
sudo install -m 0755 /tmp/kubectl /usr/local/bin/kubectl

step "kind"
curl -fsSLo /tmp/kind "https://kind.sigs.k8s.io/dl/v0.27.0/kind-linux-${ARCH}"
sudo install -m 0755 /tmp/kind /usr/local/bin/kind

step "Helm 3"
curl -fsSL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

step "argocd CLI"
curl -fsSLo /tmp/argocd "https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-${ARCH}"
sudo install -m 0755 /tmp/argocd /usr/local/bin/argocd

step "yq"
curl -fsSLo /tmp/yq "https://github.com/mikefarah/yq/releases/latest/download/yq_linux_${ARCH}"
sudo install -m 0755 /tmp/yq /usr/local/bin/yq

step "Versions"
docker --version; aws --version; kubectl version --client; kind version; helm version --short; argocd version --client --short || true; yq --version
echo; echo "Run 'newgrp docker' or re-login so docker works without sudo."
