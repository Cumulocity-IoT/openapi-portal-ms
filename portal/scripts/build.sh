#!/bin/bash
DOCKER_BUILDKIT=1 docker buildx build --progress=plain --provenance=false --platform linux/amd64 --tag openapi-portal-ms:local --load --target=production -f ./Dockerfile .
rm -rf .tmp
mkdir .tmp
docker save openapi-portal-ms:local > "image.tar"
zip .tmp/openapi-portal-ms cumulocity.json image.tar
rm image.tar