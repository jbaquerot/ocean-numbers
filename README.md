# 🌊 Ocean Numbers!

A free ocean-themed game to practise reading large numbers in English. Each game has ten randomly generated quiz, writing and matching rounds, hints and no timer.

**Play:** https://jbaquerot.github.io/ocean-numbers/

## Local development

Requires Node.js 22 or later.

```sh
npm ci
npm run dev
```

```sh
npm test
npm run build
npm run preview
```

Built with React, Framer Motion, Tailwind CSS and Vite. The original game design and component were supplied by the repository owner. Game count and best score are stored in this browser, with an in-memory fallback when storage is unavailable.

## Deployment

GitHub Actions runs tests, builds the static site and publishes it to GitHub Pages on every push to `main`. Pages uses GitHub Actions as its deployment source. The Vite base path is `/ocean-numbers/`; update it if the repository is renamed.
