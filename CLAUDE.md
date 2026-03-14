# CLAUDE.md

Ce fichier guide Claude Code (claude.ai/code) pour travailler sur ce dépôt.

## Vue d'ensemble

Site statique pour "DJing Is A Medicine" — plateforme de formation DJ holistique et Ecstatic Dance par Ëotim (Benjamin Bossu). Hébergé sur Netlify, avec un serveur PHP de secours sur LWS. Site entièrement en français.

URL : https://djingisamedicine.com/

## Build

La seule étape de build est un script Node.js qui injecte la nav et le footer partagés dans toutes les pages HTML :

```bash
node build.js
```

Ce script lit `_includes/nav.html` et `_includes/footer.html` puis remplace le contenu entre les marqueurs `<!-- NAV:START -->` / `<!-- NAV:END -->` et `<!-- FOOTER:START -->` / `<!-- FOOTER:END -->` dans chaque page. Aucune dépendance npm.

**Ne jamais modifier la nav ou le footer directement dans les pages HTML** — les changements seront écrasés par `build.js`. Toujours modifier `_includes/nav.html` ou `_includes/footer.html`, puis lancer `node build.js`.

## Architecture

- **Site statique pur** : pas de framework, pas de bundler, pas de npm. HTML + CSS + JS vanilla.
- **Un fichier CSS par page** : `style.css` (index + styles partagés : variables, nav, footer, curseur), `formation.css`, `ecstatic-dance.css`, `a-propos.css`, `contact.css`, `partenaires.css`.
- **Pages** : `index.html`, `formation.html`, `ecstatic-dance.html`, `a-propos.html`, `partenaires.html`, `contact.html`, plus les pages légales (`mentions-legales.html`, `politique-confidentialite.html`).
- **JS** (dossier `js/`) :
  - `main.js` — Scroll reveal, comportement nav au scroll, menu mobile, ancres smooth, tilt 3D des cartes, curseur custom + effet magnétique. Chargé sur toutes les pages.
  - `contact.js` — Soumission du formulaire vers l'API Systeme.io via proxy.
  - `formation-nav.js` — Sous-navigation sticky de la page formation.
  - `mandala.js` — Animation SVG mandala sur la page d'accueil.
- **Flux du formulaire de contact** : `contact.html` → `js/contact.js` → `contact.php` (principal, serveur LWS) → API Systeme.io. Si le PHP échoue, bascule sur `netlify/functions/contact.mjs` (Netlify Function).
- **Includes partagés** : `_includes/nav.html` et `_includes/footer.html` injectés dans les pages via `build.js`.

## Déploiement

- **Netlify** : déploiement auto depuis git. Config dans `netlify.toml` (minification CSS/JS, compression images, dossier Netlify Functions).
- **SEO** : `sitemap.xml`, `robots.txt`, `llms.txt` à la racine.

## Conventions importantes

- Tous les commentaires et la documentation sont en français (écrits pour Benjamin, non-développeur).
- Les fichiers marqués "NE PAS MODIFIER" contiennent du code technique fragile — bien comprendre avant de toucher.
- Les variables CSS sont définies dans `style.css` (bloc `:root`) pour les couleurs, polices et espacements.
- Les animations au scroll utilisent la classe `.reveal` + IntersectionObserver dans `main.js`.
- Ne pas modifier le contenu visible (titres, textes) sans accord explicite de l'utilisateur — la rédaction a été soigneusement travaillée.
