#!/bin/bash
set -e

rm -rf data
mkdir data
docker run -v $(pwd)/data:/data --ulimit memlock=-1:-1 \
 ghcr.io/tigerbeetledb/tigerbeetle format --cluster=0 --replica=0 /data/0_0.tigerbeetle
