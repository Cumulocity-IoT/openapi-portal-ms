#!/bin/bash
docker build -t gainsight-sync-ms --platform linux/amd64 .
rm -rf .tmp
mkdir .tmp
docker save gainsight-sync-ms > "image.tar"
zip .tmp/gainsight-sync-ms cumulocity.json image.tar
rm image.tar