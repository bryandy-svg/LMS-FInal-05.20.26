# Release procedure

The application source is `supabase-app/`. `dist/` is generated output and must never be used as source.

1. Start from current `main` in this repository. Include emergency fixes here too.
2. Update behavior tests with the change, then run `npm test`.
3. Run `npm run release:prepare`, commit all reviewed source and the manifest, and push a branch.
4. Verify the Git preview: login, QR asset details, repeat searches, tab navigation, relevant forms and PDFs. Confirm `/release.json` identifies the expected commit and source hash.
5. Merge only the verified commit. The production build repeats regression tests and validates the source manifest.
6. Check production `/release.json` against that commit after deployment. Preserve the prior deployment as a rollback point.

Do not deploy loose workspace snapshots or replace the application with an older archive. The build refuses a production deployment without Vercel Git commit metadata. Repository administrators can still bypass or alter these checks; branch protection should require the `Regression checks / regression` check and review.

Database changes require separate review and verification. A frontend rollback must not revert database security policies or accounting records.
