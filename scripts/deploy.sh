#!/usr/bin/env bash
# Déploiement de BluebirdWeb sur le VPS : récupère le code, build, redémarre,
# préchauffe le cache d'images.
#
# Lancé depuis le serveur par `bash ~/deploy.sh`, qui n'est qu'un lanceur d'une
# ligne : toute la logique vit ici, versionnée avec le reste du projet.
set -euo pipefail

APP_DIR=/var/www/bluebird
BRANCH=main
SERVICE=bluebird
PORT=3000

# Ce script vit dans le dépôt qu'il va lui-même réinitialiser. Bash lit un
# script au fil de l'exécution : si `git reset --hard` réécrivait le fichier en
# cours de route, la suite serait lue de travers. On se relance donc depuis une
# copie temporaire, hors du dépôt.
if [ "${BLUEBIRD_DEPLOY_COPIE:-}" != "1" ]; then
  COPIE=$(mktemp /tmp/bluebird-deploy.XXXXXX)
  cp "$0" "$COPIE"
  set +e
  BLUEBIRD_DEPLOY_COPIE=1 bash "$COPIE" "$@"
  CODE=$?
  set -e
  rm -f "$COPIE"
  exit $CODE
fi

log() { echo -e "\n\033[1;34m==> $*\033[0m"; }

log "Récupération des dernières modifications"
git -C "$APP_DIR" fetch --prune origin
git -C "$APP_DIR" reset --hard "origin/$BRANCH"

cd "$APP_DIR"

log "Installation des dépendances"
npm ci

log "Build de production"
npm run build

log "Redémarrage du service"
sudo systemctl restart "$SERVICE"
sleep 3
systemctl is-active --quiet "$SERVICE" && echo "Service actif" || {
  echo "Le service n'a pas démarré :"
  sudo journalctl -u "$SERVICE" -n 30 --no-pager
  exit 1
}

log "Préchauffage du cache d'images"
# Next optimise les images à la demande : sans cette étape, le premier visiteur
# paie l'encodage AVIF de chaque variante. On le fait ici, en local (donc sans
# passer par Nginx ni TLS), une fois que le service répond vraiment —
# `systemctl restart` rend la main avant que Next n'écoute.
for _ in $(seq 1 20); do
  curl -sf -o /dev/null "http://127.0.0.1:$PORT/" && break
  sleep 1
done
# Un échec ici ne doit pas faire échouer le déploiement : le site fonctionne,
# seules les premières images seraient plus lentes.
node scripts/prechauffer-images.mjs "http://127.0.0.1:$PORT" \
  || echo "Préchauffage incomplet — sans gravité."

log "Déploiement terminé."
