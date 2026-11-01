# CampusRoll – Student Information System

CampusRoll is a lightweight Student Information System (Node.js + Express) shipped
through a GitOps pipeline: **GitHub Actions → Amazon ECR → Argo CD → Kubernetes (kind on EC2 / Amazon EKS)**.

## Features

1. **Register students** – name, roll number, email, department, year (with validation and duplicate roll-no check)
2. **Search & filter** – live search by name/roll number, filter by department
3. **Promote / delete** – move a student to the next year or remove them
4. **Dashboard stats** – total students and count per department
5. **Health probes** – `/health/live`, `/health/ready` for Kubernetes

The footer shows the running **version** (`v<run number>`) and the **pod** that served the page.
Data is held in memory, so it resets when pods restart.

## Repository layout (mono-repo)

```
app/                    Node.js application
  src/                  Express server, routes, in-memory store
  public/index.html     Single-page UI (vanilla JS)
  test/                 API tests (node:test, no extra libraries)
  Dockerfile            Multi-stage build on node:20-alpine
k8s/                    Kubernetes manifests watched by Argo CD
  deployment.yaml       image tag is bumped by the pipeline
  service.yaml          ClusterIP
  ingress.yaml          NGINX Ingress (cookie affinity)
argocd/                 Argo CD Helm values + Application
cluster/                EC2 bootstrap, kind config, ECR pull-secret script, IAM JSON
.github/workflows/      CI/CD pipeline
```

## Run locally

```bash
cd app
npm install
npm test          # 8 API tests
npm start         # http://localhost:3000
```

## Run in Docker

```bash
cd app
docker build --build-arg APP_VERSION=local -t campusroll:local .
docker run --rm -p 3000:3000 campusroll:local
```

## API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/students?q=&department=` | list / search / filter |
| POST | `/api/students` | register |
| PUT | `/api/students/:id` | update (e.g. `{"year":3}`) |
| DELETE | `/api/students/:id` | delete |
| GET | `/api/stats` | counts by department and year |
| GET | `/api/info` | app name, banner, version, pod |

## Pipeline

Triggered on pushes to `main` that change `app/**`:

1. Checkout → `npm ci` → `npm test`
2. Assume AWS role through **GitHub OIDC** (no stored AWS keys)
3. Build image `campusroll:v<run_number>`, Trivy scan (report only), push to ECR
4. `yq` writes the new image into `k8s/deployment.yaml` and the bot commits it with `[skip ci]`
5. Argo CD (auto-sync, prune, self-heal) applies `k8s/` to the cluster

Repository secret required: `AWS_OIDC_ROLE_ARN`.
