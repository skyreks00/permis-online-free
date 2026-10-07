# Permis Online Free

Site gratuit pour préparer l'examen théorique du permis B en Belgique : leçons, quiz par thème et examen blanc. En ligne sur [permisfree.be](https://permisfree.be).

## Contenu

- Une trentaine de leçons de théorie, plus deux synthèses en PDF (permis B et infractions)
- Quiz sur 30 thèmes, environ 1 250 questions au total
- Examen B : questions tirées d'une banque de 1 500, nombre de questions réglable (50 par défaut)
- Résultats détaillés et révision des questions ratées
- Lecture audio des questions, avec la synthèse vocale du navigateur ou ElevenLabs si une clé est renseignée
- Analyse des erreurs par l'API Groq, avec une clé personnelle saisie dans le profil
- Progression enregistrée dans le navigateur, synchronisable entre appareils en se connectant avec GitHub
- Mode clair et mode sombre, installation possible comme application (PWA)

Une erreur dans une question ? Elle peut être corrigée depuis le site après connexion avec GitHub : la correction est enregistrée dans ce dépôt, sous forme de pull request pour les personnes qui n'en sont pas propriétaires. Une issue fait aussi l'affaire.

## Stack

React 19, React Router 7 et Vite 7, avec vite-plugin-pwa. Firebase gère la connexion GitHub et la sauvegarde de la progression (Firestore). Les fonctions d'IA passent par le SDK Groq, les corrections par Octokit, et l'animation d'arrière-plan utilise Three.js. Le site est servi par GitHub Pages.

## Développement

```bash
git clone https://github.com/skyreks00/permis-online-free.git
cd permis-online-free
npm install
npm run dev
```

Le site fonctionne sans configuration. Pour activer la connexion et la synchronisation, créer un `.env.local` avec les identifiants d'un projet Firebase :

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

| Commande | Rôle |
| -------- | ---- |
| `npm run dev` | Serveur de développement |
| `npm run build` | Génère le sitemap, compile le site, ajoute le `404.html` du routage et une page HTML par URL du sitemap |
| `npm run preview` | Sert le build localement |
| `npm run lint` | ESLint |
| `npm run deploy` | Compile puis publie `dist/` sur la branche `gh-pages` |

## Organisation

```text
public/data/       questions au format JSON, un fichier par thème (index dans themes.json, examen dans examen_B.json)
public/lecon/      leçons en HTML et images des infractions
public/pdf/        synthèses téléchargeables
src/pages/         pages de l'application (accueil, leçons, quiz, examen B, résultats, profil)
src/components/    composants d'interface
src/utils/         chargement du contenu, Firebase, Groq, GitHub, synthèse vocale
scripts/           génération du sitemap et des pages statiques, scripts de maintenance des explications
server.js          outil local (port 3001) pour corriger une question avec Gemini et l'écrire dans public/data
```

## Remerciements

Merci à [stotwo](https://github.com/stotwo) et à [tous les contributeurs](https://github.com/skyreks00/permis-online-free/graphs/contributors). Les questions et leçons s'appuient sur des ressources libres autour du code de la route.
