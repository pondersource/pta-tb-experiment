# pta-tb-experiment
An experiment to see if we can combine Plain Text Accounting with TigerBeetle

## Run

```
docker run -p 3000:3000 -v $(pwd)/data:/data --ulimit memlock=-1:-1 \
    ghcr.io/tigerbeetledb/tigerbeetle start --addresses=0.0.0.0:3000 /data/0_0.tigerbeetle