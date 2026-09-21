# Portulan HXV : fiches, quiz et examen blanc pour l'Intra 1 d'histoire

Fait le 21 septembre 2026 pour l'Intra 1 du cours *Histoire du monde depuis le XVe siècle*
(330-HXV-AG, Charles Dorval), mercredi 23 (groupe 0001) ou jeudi 24 septembre 2026 (groupes 0002 et 0003), 20 % de la note.

Sources : les PowerPoint du dossier `Grasset Session 1\Histoire` (séances 1 à 7, 154 diapos lues une à une,
cartes et extraits du manuel compris), la présentation `HXV_-_Examen_Intra.pptx` (format de l'examen et
corrigé officiel de l'exemple sur les Ottomans) et le plan de cours.

## Ouvrir
- Double-cliquer sur `docs/index.html` (page complète, marche sans Internet sauf les polices).
- Ou l'Artifact (privé, adresse donnée dans la conversation du 21 sept. 2026).
- La progression (fiches cochées, questions ratées, examens blancs, examen en cours) reste dans le
  navigateur (localStorage, clés `portulan-hxv` et `portulan-hxv-draft`). Aucun compte, aucun serveur.

## Ce qu'il y a dedans
- **Express 30 min** (vue d'ouverture) : tout l'intra condensé dans l'ordre de la copie : définitions du prof,
  confusions de personnages, dates, vrai ou faux pièges; méthode de la question de lecture avec le corrigé du
  prof; méthode du développement et 12 plans; mini-tests.
- **Fiches** : 20 fiches (0 = guide de l'intra, 1 à 16 = séances 1 à 7, 17 chronologie, 18 lexique, 19 qui est qui).
  Les encadrés verts « Complément » signalent ce qui ne vient PAS des diapos (manuel, culture générale).
- **Quiz** : qcm, vrai ou faux, réponses courtes corrigées automatiquement (accents, majuscules et articles
  ignorés, une faute de frappe tolérée sauf pour les dates), 12 questions de lecture et 30 développements
  avec réponse modèle et barème sur 4.
- **Examen blanc** : la vraie structure de l'intra (partie 1 : 8 questions à 0,5; partie 2 : une lecture sur 4;
  partie 3 : 3 développements au choix sur 6, à 4 points), note sur 20, chrono, examen en cours sauvegardé.
- **Cartes éclair** : les réponses courtes en cartes à retourner.

## Modifier
Le code est découpé dans `parts/` :
- `a-head.html` : titre, polices (EB Garamond, Source Serif 4, Figtree), CSS clair et sombre.
- `b0-topbar.html` : barre du haut et onglets. `f-express.html` : la révision express.
- `b1-fiches.html` à `b4-fiches.html` : les fiches (`<section class="fiche" id="sN">`).
- `c-views.html` : coquilles des vues quiz, examen, cartes.
- `bank/*.json` : qcm, vf et courtes (rédigés par trois sous-agents à partir des fiches, puis vérifiés).
- `d1-core.js` : groupes, types, questions de lecture (`L01`...) et de développement (`D01`...).
- `e-app.js` : le moteur.

`node build.js` vérifie la banque (ids, fiches, formats, aucun tiret long) puis écrit `portulan-hxv.html`
(fragment pour l'Artifact) et `docs/index.html` (page complète). Test local : `node serve.js`, puis
http://localhost:8766/ (lancement `portulan` dans `Typing\.claude\launch.json`).

## Points d'attention
- L'exemple officiel du prof dit Zheng He « du XIVe siècle » : ses expéditions datent de 1405-1433 (signalé).
- La table des matières du manuel n'est pas en ligne : les lectures (chap. 2.1 à 5.1) sont couvertes par les
  compléments, sans garantie de coller mot pour mot au manuel.
- Il manque peut-être une séance (« Première mondialisation, partie 2 ») et le contenu des ateliers.
