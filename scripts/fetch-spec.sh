#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

for file in openapi.yml stainless.yml; do
	gh api "repos/imagekit-developer/imagekit-sdk-config/contents/default/stainless/${file}?ref=main" \
		-H 'Accept: application/vnd.github.raw' > "openapi/${file}"
done
