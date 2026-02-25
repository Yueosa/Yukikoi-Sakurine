#!/bin/bash
set -e
DEST="/var/www/yukikoi"
echo "Deploying to $DEST..."
rsync -av --delete \
  --exclude 'deploy.sh' \
  --exclude '.git' \
  ./ "$DEST/"
echo "Done."
