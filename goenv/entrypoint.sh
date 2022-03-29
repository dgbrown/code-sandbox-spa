#!/usr/bin/env bash

cat > /usr/src/app/main.go

go build -v -o /usr/local/bin/app ./...
/usr/local/bin/app
