# Cloudflare account storage

Google profiles, progress sync, Community publishing, ratings, reports, and trustworthy save counts require one D1 binding named `DB`.

1. Authenticate Wrangler: `npx wrangler login`
2. Create and bind the database once: `npm run cloudflare:database:create`
3. Keep the generated `d1_databases` entry in `wrangler.jsonc`.
4. Apply schema changes: `npm run cloudflare:database:migrate`
5. Deploy normally. Future schema updates only require step 4.

Do not commit account tokens. The D1 database ID is safe to commit and is required for reproducible deployment.

Signed-in note images and PDF notebooks use the R2 binding named `NOTE_ASSETS`. Create its bucket once before deploying:

`npm run cloudflare:assets:create`

R2 stores the large binary files while D1 keeps the small note/deck metadata. Each account can only read its own asset prefix.
