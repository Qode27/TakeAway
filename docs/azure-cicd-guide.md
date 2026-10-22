# CI/CD on Azure – Classroom Guide

This guide shows how a code change goes from **GitHub → Azure Pipelines → Azure Container Registry → Azure App Service → the end user**.

```text
 git push ──► Azure Pipelines
               │
               ├─ CI stage ─ npm ci → lint → test → docker build → docker push ──► ACR (image: takeaway:<build id>)
               │
               └─ CD stage ─ tell the Web App "run image takeaway:<build id>" ──► App Service pulls the image from ACR
                                                                                 │
                                                       users open https://<web-app>.azurewebsites.net
```

Files in this repo that make it work:

| File | What it does |
| --- | --- |
| [`Dockerfile`](../Dockerfile) | Recipe for the container image (builds frontend + backend into one image) |
| [`azure-pipelines.yml`](../azure-pipelines.yml) | The CI/CD pipeline (2 stages: CI and CD) |
| [`infra/docker-compose.yml`](../infra/docker-compose.yml) | Run the same image locally with a database |

---

## Part 1 – Create these in the Azure portal

Use the **same resource group and region** for everything. Names below are examples; ACR and Web App names must be globally unique, so you may need to add numbers. If you change a name, change it in the `variables:` section at the top of `azure-pipelines.yml` too.

### 1. Resource group
- **Name:** `takeaway-rg`

### 2. Container Registry (ACR)
- **Name:** `takeawayacr` · **Pricing plan:** Basic
- After it's created: **Settings → Access keys → Admin user: Enabled** (the Web App uses this to pull images)

### 3. Azure Database for PostgreSQL – Flexible Server
- **Server name:** `takeaway-db`
- **Workload type:** Development (Burstable B1ms is the cheapest) · **Version:** 16
- **Authentication:** PostgreSQL authentication only. Choose an admin user and password. **Use only letters and numbers in the password** so it doesn't need escaping in the URL.
- **Networking:** Public access. Tick **"Allow public access from any Azure service within Azure to this server"**.
- After it's created: **Settings → Databases → + Add →** name it `order_hub`

### 4. Web App (App Service)
- **Name:** `takeaway-app` · **Publish:** Container · **Operating system:** Linux
- **Pricing plan:** Basic B1
- **Container tab:** leave the default *Quickstart* image. The pipeline replaces it with our image.
- After it's created: **Settings → Environment variables → App settings**, add these and click **Apply**:

| Name | Value |
| --- | --- |
| `DATABASE_URL` | `postgresql://<admin-user>:<password>@takeaway-db.postgres.database.azure.com:5432/order_hub?sslmode=require` |
| `JWT_ACCESS_SECRET` | any random text, **at least 32 characters** |
| `JWT_REFRESH_SECRET` | a different random text, **at least 32 characters** |

> Teaching point: secrets live in Azure, **not** in Git. The pipeline sets the non-secret settings itself (port, etc.).

That's everything in the Azure portal.

---

## Part 2 – Azure DevOps (https://dev.azure.com)

### ⚠️ Do this first: free pipeline agents
New Azure DevOps organizations can't use Microsoft-hosted agents until Microsoft approves a free grant. Request it at **https://aka.ms/azpipelines-parallelism-request**. Approval usually takes 2–3 business days, so request it well before class. (Without it, runs fail with *"No hosted parallelism has been purchased or granted"*.)

### 5. Project
Create an organization (if you don't have one) and a project, e.g. `TakeAway`.

### 6. Service connection (lets the pipeline talk to Azure)
**Project settings → Service connections → New service connection → Azure Resource Manager**
- Identity type: **App registration (automatic)**, Credential: **Workload identity federation**
- Scope level: **Subscription**, Resource group: `takeaway-rg`
- **Service connection name:** `azure-connection`
- Tick **Grant access permission to all pipelines**

### 7. Pipeline
**Pipelines → New pipeline → GitHub → pick this repository → Existing Azure Pipelines YAML file → `/azure-pipelines.yml` → Run**

The first run asks you to **Permit** access to the service connection and the `production` environment. Click Permit.

---

## Part 3 – The classroom demo

1. **CI.** Open the run and walk through the *CI* stage: install → lint → test → `docker build` → `docker push`.
2. **The image in ACR.** In the portal: **Container registry → Services → Repositories → `takeaway`**. Show the tag that matches the pipeline's build number, plus `latest`.
3. **CD.** The *CD* stage tells the Web App which image tag to run, restarts it, then smoke-tests `/api/health`. The last log line prints the live URL.
4. **The end user.** Open `https://<your-web-app>.azurewebsites.net` and log in with `admin@orderhub.ie` / `Password123!`
5. **Change → push → deploy.** Make a visible change, e.g. edit the text in `apps/frontend/src/pages/LoginPage.tsx`, and commit it to `main`. The pipeline starts by itself, ACR gets a new tag, and the site updates.
6. **Break the build (optional).** Push a change that fails a test. CI goes red, and CD never runs, so users keep the working version.
7. **Manual approval (optional).** **Pipelines → Environments → production → ⋯ → Approvals and checks → Approvals**, add yourself. CD now waits for your OK before deploying.
8. **Rollback (optional).** Point the Web App at an older tag: **Web App → Deployment Center**, or re-run an older pipeline run's CD stage.

### Run the same container locally (needs Docker Desktop)
```bash
docker compose -f infra/docker-compose.yml up --build
```
Open http://localhost:4000. This is the *same image* the pipeline builds: "build once, run anywhere".

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| *No hosted parallelism has been purchased or granted* | See the free-agents warning in Part 2 |
| Smoke test times out | **Web App → Monitoring → Log stream.** A database error usually means a wrong `DATABASE_URL`, or the "Allow Azure services" firewall box wasn't ticked |
| `az acr credential show` fails | ACR **Admin user** isn't enabled (step 2) |
| *Resource not found* in CD | The names in the `variables:` section don't match the portal |

## Clean up after class
Delete the resource group `takeaway-rg`. That removes everything and stops the costs (roughly ACR Basic ~$5 + App Service B1 ~$13 + PostgreSQL B1ms ~$15 per month).
