#!/usr/bin/env node
/**
 * Cycle de vie du jeton Instagram.
 *
 * Le jeton longue durée vaut 60 jours et doit être rafraîchi avant expiration,
 * sinon le feed se vide (la page, elle, continue de s'afficher normalement).
 *
 *   npm run instagram:token -- echange <jeton-court> <app-secret>
 *       Transforme le jeton court obtenu à l'autorisation en jeton 60 jours.
 *
 *   npm run instagram:token -- rafraichir <jeton-long>
 *       Repart pour 60 jours. À faire avant la date d'expiration affichée.
 *       Le jeton doit avoir au moins 24 h d'existence pour être rafraîchissable.
 *
 * Le jeton obtenu est à coller dans INSTAGRAM_TOKEN (.env.local en local, et
 * dans les variables d'environnement de l'hébergeur en production).
 */

const [commande, ...args] = process.argv.slice(2);

const echeance = (secondes) =>
  new Date(Date.now() + secondes * 1000).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

async function appeler(url) {
  const reponse = await fetch(url);
  const corps = await reponse.json();
  if (!reponse.ok) {
    // Le message d'erreur de Meta ne contient pas le jeton, l'URL si.
    throw new Error(corps?.error?.message ?? `HTTP ${reponse.status}`);
  }
  return corps;
}

try {
  if (commande === "echange") {
    const [jetonCourt, secret] = args;
    if (!jetonCourt || !secret) {
      throw new Error("Usage : echange <jeton-court> <app-secret>");
    }
    const url = new URL("https://graph.instagram.com/access_token");
    url.searchParams.set("grant_type", "ig_exchange_token");
    url.searchParams.set("client_secret", secret);
    url.searchParams.set("access_token", jetonCourt);
    const { access_token, expires_in } = await appeler(url);
    console.log("\nINSTAGRAM_TOKEN=%s\n", access_token);
    console.log("Valable jusqu'au %s.", echeance(expires_in));
  } else if (commande === "rafraichir") {
    const [jetonLong] = args;
    if (!jetonLong) throw new Error("Usage : rafraichir <jeton-long>");
    const url = new URL("https://graph.instagram.com/refresh_access_token");
    url.searchParams.set("grant_type", "ig_refresh_token");
    url.searchParams.set("access_token", jetonLong);
    const { access_token, expires_in } = await appeler(url);
    console.log("\nINSTAGRAM_TOKEN=%s\n", access_token);
    console.log("Valable jusqu'au %s.", echeance(expires_in));
  } else {
    console.log(
      "Commandes : echange <jeton-court> <app-secret> | rafraichir <jeton-long>",
    );
    process.exit(1);
  }
} catch (erreur) {
  console.error("Échec :", erreur.message);
  process.exit(1);
}
