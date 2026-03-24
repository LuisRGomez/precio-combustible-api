#!/bin/bash
set -e

echo "=== Instalando AWS CLI en WSL ==="
curl -s "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o /tmp/awscliv2.zip
python3 -c "import zipfile; zipfile.ZipFile('/tmp/awscliv2.zip').extractall('/tmp/awscli')"
sudo /tmp/awscli/aws/install --update
aws --version

echo "=== Instalando SAM CLI ==="
curl -Ls "https://github.com/aws/aws-sam-cli/releases/latest/download/aws-sam-cli-linux-x86_64.zip" -o /tmp/sam.zip
python3 -c "import zipfile; zipfile.ZipFile('/tmp/sam.zip').extractall('/tmp/sam-inst')"
sudo /tmp/sam-inst/install
sam --version

echo "=== Configurando credenciales AWS ==="
mkdir -p ~/.aws
cp /mnt/c/Users/TitoGomez/.aws/credentials ~/.aws/credentials 2>/dev/null || echo "Copiando config..."
cp /mnt/c/Users/TitoGomez/.aws/config ~/.aws/config 2>/dev/null || true

aws sts get-caller-identity

echo "=== Todo listo ==="
