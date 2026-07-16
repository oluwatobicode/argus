#!/bin/bash
set -e

cd ~/argus
echo "$(date): Deploy starting..." >> ~/deploy.log

git pull origin main

docker compose -f infra/docker-compose.ec2.yml --env-file infra/.env up -d --build

docker compose -f infra/docker-compose.ec2.yml exec -T migrate pnpm exec prisma migrate deploy || true

docker image prune -f

echo "$(date): Deploy completed" >> ~/deploy.log
