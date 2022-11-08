#!/bin/bash
set -e

docker run -d -p 3000:3000 -v $(pwd)/data:/data --ulimit memlock=-1:-1 --name tigerbeetle \
    ghcr.io/tigerbeetledb/tigerbeetle start --addresses=0.0.0.0:3000 /data/0_0.tigerbeetle
docker ps