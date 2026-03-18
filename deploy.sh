#!/bin/bash
set -e

DEST="/var/www/yukikoi"
MODE="${1:-full}"

case "$MODE" in
  full)
    echo "Full deploy to $DEST (--delete enabled)..."
    rsync -av --delete \
      --exclude 'deploy.sh' \
      --exclude '.git' \
      ./ "$DEST/"
    ;;
  update)
    echo "Update deploy to $DEST (preserving extra files)..."
    rsync -av \
      --exclude 'deploy.sh' \
      --exclude '.git' \
      ./ "$DEST/"
    ;;
  *)
    echo "Usage: $0 [full|update]"
    echo "  full   — sync and delete files removed from source (default)"
    echo "  update — sync only, preserve any extra files on server"
    exit 1
    ;;
esac

echo "Done."
