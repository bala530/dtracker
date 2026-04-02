# GCP Free Tier Deployment Guide

## Prerequisites
- GCP account (free tier: 1× e2-micro VM, 30 GB disk, us-central1 region)
- A GitHub account (to push this project's code)

---

## Step 1 — Push code to GitHub

On your local machine or in Replit's shell:

```bash
git remote add origin https://github.com/YOUR_ORG/bug-tracker.git
git push -u origin main
```

---

## Step 2 — Create the GCP VM

1. Go to **GCP Console → Compute Engine → VM Instances → Create Instance**
2. Settings:
   - **Name:** `bug-tracker`
   - **Region:** `us-central1` (required for free tier)
   - **Machine type:** `e2-micro` (free tier)
   - **Boot disk:** Ubuntu 22.04 LTS, 30 GB standard disk
   - **Firewall:** tick both "Allow HTTP" and "Allow HTTPS"
3. Click **Create**
4. Once running, go to **VPC Network → External IP Addresses** and reserve a static IP for this VM

---

## Step 3 — Restrict access to your office only (make it private)

1. Go to **VPC Network → Firewall Rules**
2. Find the `default-allow-http` rule, click **Edit**
3. Under **Source IP ranges**, replace `0.0.0.0/0` with your office IP (e.g. `203.0.113.10/32`)
   - To find your office IP: visit https://whatismyip.com from the office network
4. Save — now port 80 only accepts connections from your IP

---

## Step 4 — SSH into the VM and install Docker

```bash
# From GCP Console, click SSH button on your VM, then run:

sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-plugin git
sudo usermod -aG docker $USER

# Log out and back in for group to take effect
exit
```

Re-open the SSH terminal, then verify:
```bash
docker --version
docker compose version
```

---

## Step 5 — Add a swap file (prevents out-of-memory crashes on e2-micro)

```bash
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## Step 6 — Clone the code onto the VM

```bash
git clone https://github.com/YOUR_ORG/bug-tracker.git
cd bug-tracker
```

---

## Step 7 — Create your .env file

```bash
cp deploy/.env.example deploy/.env
nano deploy/.env
```

Edit the values:
- Set `DB_PASSWORD` to a long random string (e.g. 32 characters)
- Set `SESSION_SECRET` to a different long random string
- Set `APP_USERNAME` and `APP_PASSWORD` to your login credentials

Save with `Ctrl+X → Y → Enter`

---

## Step 8 — Build and start everything

```bash
cd ~/bug-tracker
docker compose -f deploy/docker-compose.yml --env-file deploy/.env up -d --build
```

This will:
- Build the API server Docker image
- Build the frontend Docker image
- Start PostgreSQL, run DB migrations, start the API, start nginx
- Takes 3–5 minutes on first run

Check everything is running:
```bash
docker compose -f deploy/docker-compose.yml ps
docker compose -f deploy/docker-compose.yml logs -f
```

---

## Step 9 — Access the app

Open a browser and go to: `http://YOUR_VM_EXTERNAL_IP`

You should see the login page. Log in with your credentials.

---

## Ongoing maintenance

**Update the app after code changes:**
```bash
cd ~/bug-tracker
git pull
docker compose -f deploy/docker-compose.yml --env-file deploy/.env up -d --build
```

**Backup the database:**
```bash
docker compose -f deploy/docker-compose.yml exec db \
  pg_dump -U appuser bugtracker > backup-$(date +%Y%m%d).sql
```

**Restore a backup:**
```bash
cat backup-20260101.sql | docker compose -f deploy/docker-compose.yml exec -T db \
  psql -U appuser bugtracker
```

**View logs:**
```bash
docker compose -f deploy/docker-compose.yml logs api
docker compose -f deploy/docker-compose.yml logs web
```

---

## File Attachments

File attachments currently use Replit's cloud storage and will not work in the self-hosted setup without additional configuration. Two options:

**Option A — GCS (recommended, 5 GB free):**
1. Create a GCS bucket in GCP Console
2. Create a service account with Storage Object Admin role
3. Download the JSON key as `deploy/gcs-key.json`
4. Uncomment the GCS lines in `deploy/docker-compose.yml`

**Option B — Skip for now:**
The app works fully without file attachments — you can still log defects, change status, add comments, etc.
