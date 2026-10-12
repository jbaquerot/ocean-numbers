# 🌊 Ocean Numbers!

A free ocean-themed game to practise reading large numbers in English. Enter your name, choose a difficulty and pick 1–50 randomly generated rounds, with hints and no timer. Longer games cycle through quiz, writing and matching rounds.

- **Easy:** thousands with whole hundreds, such as 24,300.
- **Hard:** thousands with tens and ones, such as 246,783.
- **Very hard:** millions with full number groups, such as 12,345,678.

The player name appears during play and on the results screen. Best scores are tracked separately for each difficulty and round count so games of different lengths are comparable. Returning to the menu lets you change the settings; replay keeps your current settings.

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

Built with React, Framer Motion, Tailwind CSS and Vite. The original game design and component were supplied by the repository owner. Game count and best scores are stored in this browser, with an in-memory fallback when storage is unavailable. Existing ten-round records migrate to Easy. Player names stay in the current session and are not sent to a server.

## Deployment

GitHub Actions runs tests, builds the static site and publishes it to GitHub Pages on every push to `main`. Pages uses GitHub Actions as its deployment source. The Vite base path is `/ocean-numbers/`; update it if the repository is renamed.
