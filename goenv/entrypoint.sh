#!/usr/bin/env bash
set -euo pipefail

# pipe stdin to code file
cat > /usr/src/app/main.go

# build binary
go build -o /usr/local/bin/app ./...

# execute binary
/usr/local/bin/app
