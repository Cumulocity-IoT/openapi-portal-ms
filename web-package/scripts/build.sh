#!/bin/bash
DOCKER_BUILDKIT=1 docker buildx build --progress=plain --provenance=false --platform linux/amd64 --tag swagger-sample-ms:local --load --target=production -f ./Dockerfile .
rm -rf .tmp
mkdir .tmp
docker save swagger-sample-ms:local > ".tmp/image.tar"
zip .tmp/swagger-sample-ms cumulocity.json .tmp/image.tar
rm .tmp/image.tar