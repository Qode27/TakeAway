# CI/CD on Azure – Classroom Guide

This guide shows how a code change goes from **GitHub → Azure Pipelines → Azure Container Registry → Kubernetes (AKS) → the end user**.

```text
 git push ──► Azure Pipelines
               │
               ├─ CI stage ─ npm ci → lint → test → docker build → docker push ──► ACR (image: takeaway:<build id>)
               │
               └─ CD stage ─ kubectl apply (image takeaway:<build id>) ──► AKS pulls the image from ACR, runs 2 pods
                                                                            │
                                                          users open http://<EXTERNAL-IP>
```

Files in this repo that make it work:

| File | What it does |
| --- | --- |
| [`Dockerfile`](../Dockerfile) | Recipe for the container image (builds frontend + backend into one image) |
| [`azure-pipelines.yml`](../azure-pipelines.yml) | The CI/CD pipeline (2 stages: CI and CD) |
| [`k8s/deployment.yaml`](../k8s/deployment.yaml) | Kubernetes: run 2 pods of our image |
| [`k8s/service.yaml`](../k8s/service.yaml) | Kubernetes: give the pods one public IP address |

> No database is used in this demo. The web page and `/api/health` work, but **logging in won't work**, because users are stored in the database. That doesn't affect the CI/CD demo.

---

## Part 1 – Create these in the Azure portal

Use the **same resource group and region** for everything. The ACR name must be globally unique, so you may need to add numbers. If you change a name, change it in the `variables:` section at the top of `azure-pipelines.yml` too.

### 1. Resource group
- **Name:** `takeaway-rg`

### 2. Container Registry (ACR)
- **Name:** `takeawayacr` · **Pricing plan:** Basic

### 3. Kubernetes cluster (AKS)
**Create a resource → Kubernetes Service → Create → Kubernetes cluster**
- **Resource group:** `takeaway-rg` · **Cluster name:** `takeaway-aks`
- **Cluster preset configuration:** Dev/Test
- **Authentication and Authorization:** keep the default *Local accounts with Kubernetes RBAC*
- **Node pools tab:** 1 node is enough (e.g. size `Standard_B2s` or `Standard_D2s_v3`, whichever your subscription allows)
- **Integrations tab → Container registry:** select `takeawayacr` ← **important**: this lets the cluster pull images from ACR
- Review + create (takes ~5–10 minutes)

That's everything in the Azure portal.

---

## Part 2 – Azure DevOps (https://dev.azure.com)

### ⚠️ Do this first: free pipeline agents
New Azure DevOps organizations can't use Microsoft-hosted agents until Microsoft approves a free grant. Request it at **https://aka.ms/azpipelines-parallelism-request**. Approval usually takes 2–3 business days, so request it well before class. (Without it, runs fail with *"No hosted parallelism has been purchased or granted"*.)

### 4. Project
Create an organization (if you don't have one) and a project, e.g. `TakeAway`.

### 5. Service connection (lets the pipeline talk to Azure)
**Project settings → Service connections → New service connection → Azure Resource Manager**
- Identity type: **App registration (automatic)**, Credential: **Workload identity federation**
- Scope level: **Subscription**, Resource group: `takeaway-rg`
- **Service connection name:** `azure-connection`
- Tick **Grant access permission to all pipelines**

### 6. Pipeline
**Pipelines → New pipeline → GitHub → pick this repository → Existing Azure Pipelines YAML file → `/azure-pipelines.yml` → Run**

The first run asks you to **Permit** access to the service connection and the `production` environment. Click Permit.

---

## Part 3 – The classroom demo

1. **CI.** Open the run and walk through the *CI* stage: install → lint → test → `docker build` → `docker push`.
2. **The image in ACR.** In the portal: **Container registry → Services → Repositories → `takeaway`**. Show the tag that matches the pipeline's build number, plus `latest`.
3. **CD.** The *CD* stage runs `kubectl apply -f k8s/`, waits for the rollout, lists the pods, then smoke-tests `/api/health`. The last log line prints the public URL.
4. **Kubernetes in the portal.** **AKS → Kubernetes resources → Workloads** shows the `takeaway` deployment with 2 pods. **Services and ingresses** shows the external IP.
5. **The end user.** Open `http://<EXTERNAL-IP>`. Students can open it on their phones too.
6. **Change → push → deploy.** Make a visible change, e.g. edit the heading text in `apps/frontend/src/pages/LoginPage.tsx`, and commit it to `main`. The pipeline starts by itself, ACR gets a new tag, and Kubernetes replaces the pods one at a time (a rolling update, so no downtime).
7. **Break the build (optional).** Push a change that fails a test. CI goes red, CD never runs, and users keep the working version.
8. **Manual approval (optional).** **Pipelines → Environments → production → ⋯ → Approvals and checks → Approvals**, add yourself. CD now waits for your OK before deploying.

### Optional: kubectl from Azure Cloud Shell
In the portal, open Cloud Shell (`>_` icon, Bash) and run:
```bash
az aks get-credentials -g takeaway-rg -n takeaway-aks
kubectl get pods
kubectl get service takeaway
kubectl logs deployment/takeaway
kubectl scale deployment takeaway --replicas=4     # watch new pods appear
kubectl delete pod <one-pod-name>                  # Kubernetes self-heals and starts a new one
```

### Run the same container locally (needs Docker Desktop)
```bash
docker build -t takeaway .
docker run -p 4000:4000 -e JWT_ACCESS_SECRET=local-access-secret-at-least-32-chars -e JWT_REFRESH_SECRET=local-refresh-secret-at-least-32-chars takeaway
```
Open http://localhost:4000. This is the *same image* the pipeline builds: "build once, run anywhere".

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| *No hosted parallelism has been purchased or granted* | See the free-agents warning in Part 2 |
| Pods stuck in `ImagePullBackOff` | The cluster can't pull from ACR. Run in Cloud Shell: `az aks update -g takeaway-rg -n takeaway-aks --attach-acr takeawayacr` |
| `rollout status` times out | Check pod logs: `kubectl logs deployment/takeaway` |
| *Resource not found* in the pipeline | The names in the `variables:` section don't match the portal |

## Clean up after class
Delete the resource group `takeaway-rg`. That also deletes the AKS cluster and its helper resource group `MC_takeaway-rg_...`, and stops the costs. To save money between classes, you can instead **Stop** the AKS cluster from its Overview page.
