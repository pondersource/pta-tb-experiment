# pta-tb-experiment
An experiment to see if we can combine Plain Text Accounting with TigerBeetle

## Run

```
# provision TigerBeetle's data directory
./format.sh
# run TigerBeetle
./start.sh
# import a Plain Text Accounting journal
node index.mjs ./sample.journal ./dictionary.json