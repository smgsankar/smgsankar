# Card fonts

Subsetted `woff2` files inlined into the README stat cards by `scripts/cards.mjs`.
GitHub renders README SVGs inside a sandbox that blocks external requests, so the
fonts have to travel with the image.

| File | Family | Licence |
|---|---|---|
| `fraunces-600.woff2`, `fraunces-italic.woff2` | [Fraunces](https://github.com/undercasetype/Fraunces) by Undercase Type | SIL Open Font License 1.1 |
| `instrument-sans-500.woff2` | [Instrument Sans](https://github.com/Instrument/instrument-sans) by Instrument | SIL Open Font License 1.1 |

Subsets were produced by Google Fonts' `text=` endpoint and cover ASCII letters,
digits and basic punctuation. To add a glyph, re-download with a wider `text=`.
