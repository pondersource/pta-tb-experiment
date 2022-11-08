# pta-tb-experiment
An experiment to see if we can combine Plain Text Accounting with TigerBeetle

## Run

```
# provision TigerBeetle's data directory
docker run -v $(pwd)/data:/data --ulimit memlock=-1:-1 \
 ghcr.io/tigerbeetledb/tigerbeetle format --cluster=0 --replica=0 /data/0_0.tigerbeetle
 # run TigerBeetle
docker run -d -p 3000:3000 -v $(pwd)/data:/data --ulimit memlock=-1:-1 \
    ghcr.io/tigerbeetledb/tigerbeetle start --addresses=0.0.0.0:3000 /data/0_0.tigerbeetle
# import a Plain Text Accounting journal
node index.mjs ./sample.journal ./dictionary.json