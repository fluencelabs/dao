#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

AGE_URL="https://github.com/FiloSottile/age/releases/latest/download/age-v1.0.0-linux-amd64.tar.gz"
BIN_DIR="/usr/local/bin"
curl -Lo age.tar.gz $AGE_URL
tar xf age.tar.gz
sudo mv age/age age/age-keygen $BIN_DIR
rm -f age.tar.gz
rm -rf age
