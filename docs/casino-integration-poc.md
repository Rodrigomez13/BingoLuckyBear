# Casino integration POC

## Audit conclusion

`casino ejemplo.zip` is a standalone Node/offline casino demo, not a package that can be imported into Next.js. It has its own JWT authentication, PostgreSQL wallet/transaction adapters and provider-specific static bundles. Its catalog is profile-led and spans slot, table and crash-style engines. Directly embedding it would create two sources of truth for identity and money, and its third-party provider bundles require licensing and launch credentials.

## POC architecture

`lib/casino/contracts.ts` is the provider port. Each future adapter can only resolve an outcome; `app/api/casino/[gameId]/spin` authenticates with the current Supabase session, validates the adapter output and settles it through `lbb_settle_casino_round`. The SQL function locks the existing general wallet, persists one round and writes the existing `lbb_wallet_transactions` history atomically.

The initial adapter is `lbb-roulette-poc`: a server-authoritative red/black European roulette. It proves login reuse, balance debit/credit, idempotent rounds and transaction history without importing a third-party game bundle. The `/casino` module is authenticated and `/casino/ruleta` is playable.

## Adding a ZIP/provider game

1. Implement a `CasinoGameAdapter` under `lib/casino/adapters` and register it in `lib/casino/catalog.ts`.
2. Keep provider launch/session code in that adapter; do not give a browser direct wallet credentials.
3. Add the approved game ID and payout bound to `lbb_settle_casino_round` in a migration.
4. Add its dedicated UI/iframe wrapper and test retry/idempotency with a fixed round ID.

## Visual demo catalog

`CASINO_DEMO_ORIGIN` points to an isolated Maldivas Docker deployment. LBB reads
`/api/games` to show its discovered catalog and opens `/games/<symbol>/` inside
`/casino/demo/<symbol>`. Demos deliberately do not share LBB money or sessions.
For a deployed LBB preview, localhost is not reachable: run the container on a
public HTTPS host and configure that host as `CASINO_DEMO_ORIGIN` in Vercel.

## TODO before any external game is enabled

- Obtain provider licences, game distribution rights and regulated-market approval.
- Obtain the provider launch URL, API credentials, signing/webhook specification and IP allowlist.
- Validate provider-side results/signatures and add reconciliation/void handling.
- Add jurisdiction, age gate, limits, self-exclusion and responsible-gaming controls.
- Apply `20260805_casino_integration_poc.sql` to the target Supabase project before deploying the route.
