#!/bin/bash

set -e

cd /home/ubuntu/install/chaibytes-admin

git pull origin main

docker build -t chaibytes-admin .

docker stop chaibytes-admin || true
docker rm chaibytes-admin || true

docker run -d \
  --name chaibytes-admin \
  -p 3001:80 \
  --restart unless-stopped \
  chaibytes-admin

echo "✅ Chaibytes Admin deployed successfully"