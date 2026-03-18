// ==========================================
// build.js — Met à jour la navigation et le footer sur toutes les pages
// ==========================================
//
// COMMENT ÇA MARCHE :
//   Le menu (nav) et le pied de page (footer) sont les mêmes sur
//   toutes les pages du site. Pour éviter de les copier-coller à la
//   main dans chaque fichier HTML, ce script le fait automatiquement.
//
//   Les fichiers "source" se trouvent dans le dossier _includes/ :
//     - _includes/nav.html         → le menu de navigation
//     - _includes/footer.html      → le pied de page
//     - _includes/parallax-bg.html → le fond animé (aurora, mandala, canvas)
//
// COMMENT L'UTILISER :
//   1. Modifie le fichier dans _includes/ (nav.html ou footer.html)
//   2. Ouvre un terminal dans ce dossier
//   3. Tape la commande :  node build.js
//   4. C'est tout ! Les pages HTML sont mises à jour.
//
// IMPORTANT :
//   - Ne modifie PAS directement le nav ou le footer dans les pages
//     HTML (index.html, formation.html, etc.) — tes changements
//     seraient écrasés au prochain build.
//   - Ce script n'a besoin d'aucune installation (pas de npm install).
//
// ==========================================

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const INCLUDES = path.join(ROOT, '_includes');

// Fichiers HTML à traiter (toutes les pages du site)
const pages = [
  'index.html',
  'formation-dj-ecstatic-dance.html',
  'explications-ecstatic-dance.html',
  'eotim-dj-holistique.html',
  'partenaires.html',
  'contact.html',
  'mentions-legales.html',
  'politique-confidentialite.html',
];

// Blocs à injecter
const blocks = {
  NAV: fs.readFileSync(path.join(INCLUDES, 'nav.html'), 'utf8'),
  FOOTER: fs.readFileSync(path.join(INCLUDES, 'footer.html'), 'utf8'),
  PARALLAX: fs.readFileSync(path.join(INCLUDES, 'parallax-bg.html'), 'utf8'),
  FORM_FORMATION: fs.readFileSync(path.join(INCLUDES, 'form-formation.html'), 'utf8'),
  FORM_CONTACT: fs.readFileSync(path.join(INCLUDES, 'form-contact.html'), 'utf8'),
};

let totalReplacements = 0;

pages.forEach(function (page) {
  const filePath = path.join(ROOT, page);
  if (!fs.existsSync(filePath)) {
    console.log('  SKIP  ' + page + ' (fichier introuvable)');
    return;
  }

  let html = fs.readFileSync(filePath, 'utf8');
  let replacements = 0;

  Object.keys(blocks).forEach(function (name) {
    // Regex : tout entre <!-- NAME:START --> et <!-- NAME:END -->
    const regex = new RegExp(
      '(<!-- ' + name + ':START -->)[\\s\\S]*?(<!-- ' + name + ':END -->)',
      'g'
    );

    if (regex.test(html)) {
      html = html.replace(regex, '$1\n' + blocks[name] + '\n  $2');
      replacements++;
    }
  });

  if (replacements > 0) {
    fs.writeFileSync(filePath, html, 'utf8');
    totalReplacements += replacements;
    console.log('  OK    ' + page + ' (' + replacements + ' bloc(s) mis à jour)');
  } else {
    console.log('  ---   ' + page + ' (aucun marqueur trouvé)');
  }
});

console.log('\nTerminé — ' + totalReplacements + ' bloc(s) mis à jour sur ' + pages.length + ' pages.\n');
