# Aion V owners FAQ

A static Hebrew (RTL) Q&A page with instant search. There is no build step and no server code.

- `index.html`, `style.css`, `app.js`: the page
- `faq.json`: all questions and answers (the only file you normally edit)

## Publish on GitHub Pages (one time, about 5 minutes)

1. Sign in to github.com with a **personal** account and create a new **public** repository, e.g. `aion-v-faq`.
2. On the repo page, click **Add file → Upload files** and drag in the four files above (plus `.nojekyll`). Commit.
3. Go to **Settings → Pages**. Under *Build and deployment*, choose **Deploy from a branch**, branch `main`, folder `/ (root)`, then save.
4. After a minute the site is live at `https://<your-username>.github.io/aion-v-faq/`. Share that link in the group.

## Editing questions

Open `faq.json` on GitHub, click the pencil icon, edit, and commit. The site updates within a minute or two.

Each item looks like this:

```json
{
  "id": "ac-weak-cooling",            // unique, English, used in the share link (#ac-weak-cooling)
  "category": "climate",              // charging, battery, climate, app, software, multimedia, key,
                                      // driving, defects, tires, service, insurance, accessories, delivery, general
  "question": "...",
  "answer": "...",
  "steps": ["...", "..."],            // optional, shown as a numbered list
  "keywords": ["מזגן", "AC", "..."],  // extra words people might search for
  "status": "answered",               // answered | open (no answer yet) | disputed (members disagree)
  "last_seen": "2026-10",
  "mentions": 109                     // how often it came up; higher shows first
}
```

(The `//` comments above are only explanations. Don't put comments in the real file.)

After editing `style.css` or `app.js`, bump the `?v=` number in `index.html` so visitors get the new version.

## Local preview

```bash
python3 -m http.server 8765
```

Then open http://localhost:8765.
