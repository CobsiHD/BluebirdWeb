#!/usr/bin/env bash
# Déploiement de BluebirdWeb : dépendances, build, redémarrage, préchauffage
# du cache d'images.
#
# Appelé par `~/deploy.sh` sur le VPS, un lanceur de quelques lignes qui met
# d'abord le dépôt à jour puis passe la main à ce fichier. La synchronisation
# git reste volontairement de son côté : ce script est lui-même versionné, et
# bash lit un script au fil de l'exécution — un `git reset --hard` en cours de
# route réécrirait le fichier en train d'être lu.
set -euo pipefail

APP_DIR=/var/www/bluebird
SERVICE=bluebird
PORT=3000

log() { echo -e "\n\033[1;34m==> $*\033[0m"; }

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
