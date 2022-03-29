#!/usr/bin/env bash

# pipe stdin to code file
cat > /usr/src/app/main.go

# build binary
go build -v -o /usr/local/bin/app ./...

# execute binary
/usr/local/bin/app
