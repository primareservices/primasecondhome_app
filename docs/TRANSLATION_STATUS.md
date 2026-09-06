# Translation status

UI strings: `src/i18n/translations/<lang>.js` (reference: `en.js`, checked by `npm run check`).
Long-form content (rules, guides, house info, arrival tips): `src/content/<lang>.js`.

| Language | Code | UI strings | Content | Status |
|---|---|---|---|---|
| Slovak | sk | ✔ complete | ✔ | written by the team's language, review house-rules wording with office |
| English | en | ✔ reference | ✔ | reference |
| Ukrainian | uk | ✔ | ✔ | machine draft — **native review needed** |
| Russian | ru | ✔ | ✔ | machine draft — **native review needed** |
| Serbian (Latin) | sr | ✔ | falls back to EN | machine draft — native review needed; content to translate |
| Romanian | ro | ✔ | falls back to EN | machine draft — native review needed; content to translate |
| Hungarian | hu | ✔ | falls back to EN | machine draft — native review needed; content to translate |
| Vietnamese | vi | ✔ | falls back to EN | machine draft — native review needed; content to translate |
| Hindi | hi | ✔ | falls back to EN | machine draft — native review needed; content to translate |
| Nepali | ne | ✔ | falls back to EN | machine draft — native review needed; content to translate |
| Uzbek (Latin) | uz | ✔ | falls back to EN | machine draft — native review needed; content to translate |
| Filipino | tl | ✔ | falls back to EN | machine draft — native review needed; content to translate |

Candidates for later: Georgian (ka), Kyrgyz (ky), Kazakh (kk), Turkish (tr), Indonesian (id),
Bengali (bn), Punjabi (pa) — decide from the Casist nationality ranking per building.

## How to add a language

1. Add the entry to `src/config/languages.js` (`code`, native `name`, `short`, BCP-47 `locale`).
2. Copy `src/i18n/translations/en.js` to `<code>.js`, translate every value, keep the keys and
   the `{placeholders}`.
3. Register the loader in `src/i18n/index.js` (`LOADERS`).
4. Optionally add `src/content/<code>.js` and list the code in `CONTENT_LANGS`.
5. `npm run check` must pass.

## Review guidance for native speakers

- Keep sentences short; guests read on 360 px phones, often as a second language.
- Use the polite form but not bureaucratic language.
- Do not translate product names (PRIMA, PRIMA SECOND HOME, RE SERVICE) or codes (IC23-1102).
- Slovak institution names stay in Slovak with a translation in brackets the first time
  (e.g. *cudzinecká polícia* — foreign police).
