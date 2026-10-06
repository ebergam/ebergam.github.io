# enricobergamini.it — redesign (work in progress)

This folder is the new site. It starts with an underscore, so GitHub Pages
ignores it: committing or pushing it will NOT change the live site.

## Preview locally
Double-click `index.html` — it opens in your browser, no build step.
(Fonts load from Google Fonts, so you need to be online for the final look.)

## Files
- `index.html` — the whole site (one page)
- `assets/css/style.css` — all styling; colours are at the top (dark first, light below)
- `assets/js/site.js` — theme toggle + the static network shapes in the margins
- `assets/img/profile.jpg` — photo (480 px, ~30 KB)
- `assets/papers/<INITIALS>.png` — light copy of each paper's figure (≤1200 px wide), named by co-author initials (JMP.png for the job market paper)
- `assets/papers/full/<INITIALS>.png` — the full-size original, opened when someone clicks the figure
- `CV_EnricoBergamini.pdf`, `EnricoBergamini_JMP.pdf` — same names as today, so old links keep working

## Swap in a paper figure
Put the full-size image in `assets/papers/full/` and a light copy (about 1200 px wide) with the same name in `assets/papers/`.
Any aspect ratio works (it is fitted into a 4:3 white tile; transparent backgrounds are fine).

## Add a paper
Copy one `<article class="paper"> … </article>` block in `index.html`,
edit the text, and add its figure to `assets/papers/` (light) and `assets/papers/full/` (original).
Badges: `badge--pub` (published), `badge--review` (under review / R&R),
`badge--wp` (working paper), `badge--flag` (filled, e.g. job market paper).

## Abstracts
Every paper card and every work-in-progress item has a collapsible abstract.
Replace the orange `[abstract to add …]` line with the text and remove `class="todo"`.

## Going live (later)
Move the contents of this folder to the repo root, replacing the old
AcademicPages files, keep `CNAME`, add an empty `.nojekyll`, commit and push.
