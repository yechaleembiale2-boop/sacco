# Deployment Guide — Injibara University SACCO

This document describes deploying the SACCO system to the university's IT infrastructure.

## Prerequisites

- **Server**: Linux (Ubuntu 22.04 LTS or RHEL 9 recommended)
- **RAM**: 4 GB minimum, 8 GB recommended
- **Disk**: 40 GB minimum for database + backups
- **Docker**: 24.0+ with Compose v2
- **Domain name**: e.g. `sacco.injibara.edu.et` pointing to the server IP
- **TLS certificate**: from Let's Encrypt or the university's CA
- **Firewall**: allow 80 and 443 from the internet; block everything else

## Step 1: Prepare the Server

```bash
# Create deployment directory
sudo mkdir -p /opt/sacco
sudo chown $USER:$USER /opt/sacco

# Install Docker (Ubuntu)
sudo apt update
sudo apt install -y docker.io docker-compose-v2 git openssl
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker --version
docker compose version