#!/bin/bash
if ! curl -sf http://localhost:3000/ > /dev/null 2>&1; then
  echo "$(date): API is down, restarting..." >> ~/healthcheck.log
  cd ~/argus && docker compose -f infra/docker-compose.ec2.yml --env-file infra/.env restart api
fi
