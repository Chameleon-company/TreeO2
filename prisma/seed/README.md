# Seeding

Seeds a small, internally consistent set of dev and test data. Safe to run against
a fresh database or re-run against one that's already seeded, everything here is
idempotent.

## Order

Each file depends on ids created by the ones before it, so `seed.ts` calls them in
a fixed order:

1. `roles.ts` and `geography.ts` first. Almost everything else needs a role id or
   a location id.
2. `organisations.ts`, needs a country and location from geography. Seeds two
   organisations, the main owner and a partner used later to demonstrate
   project sharing.
3. `users.ts`, needs role ids and a location.
4. `treeTypes.ts`, doesn't depend on anything, just grouped near the project since
   that's the only place it gets used.
5. `projects.ts`, needs the organisations, geography, and the tree types. Seeds
   two projects owned by the same organisation, then links the partner
   organisation to the first one as a shared collaborator rather than an owner.
6. `scans.ts`, needs the project, the users, and the tree types.
7. `partnersAdoptions.ts`, needs a scan so the adoption can point at a real fobId.
8. `localization.ts` last, doesn't depend on anything else here.

## Why users are seeded at all

`AUTH_DEV_MODE` lets you skip logging in entirely, so it's a fair question
whether seeding real user rows is even necessary. It only skips proving who you
are, not what the app does with that identity afterward. Every controller that
writes to the database still takes `req.user.sub` and uses it as a real user id,
for example who's recorded as the inspector on a scan batch. If nobody actually
exists at that id, the write fails with a foreign key error instead of an auth
error.

That's also why the ids in `users.ts` are pinned instead of left to whatever
Postgres happens to assign. `auth.middleware.ts` hardcodes sub `"1"` through
`"5"` to five specific roles, so the real ids have to match. This happened
during development, not just in theory: reseeding after running the test suite
once drifted the ids off 1-5, and dev token requests started failing on writes
for a reason that had nothing to do with auth. Pinning the ids and resyncing the
sequence afterward fixes that, and if 1-5 are ever genuinely taken by something
else, seeding now fails loudly with a unique constraint error instead of
drifting quietly.

TODO (AUTH05, T2 2026): once the dev bypass looks users up by email instead of
trusting a hardcoded sub, the pinned ids in `users.ts` can go away and it can go
back to a plain upsert.
