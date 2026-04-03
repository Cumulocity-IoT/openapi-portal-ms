#!/bin/bash
DOCKER_BUILDKIT=1 docker buildx build --progress=plain --provenance=false --platform linux/amd64 --tag gainsight-sync-ms:local --load --target=production -f ./Dockerfile .
rm -rf .tmp
mkdir .tmp
docker save gainsight-sync-ms:local > "image.tar"
zip .tmp/gainsight-sync-ms cumulocity.json image.tar
rm image.tar