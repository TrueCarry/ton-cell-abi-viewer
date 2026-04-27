# Release checklist

- Run `pnpm install --frozen-lockfile`.
- Run `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build`.
- Run `pnpm test:e2e` after installing Playwright browsers with `pnpm exec playwright install --with-deps chromium`.
- Verify supported examples: comment, jetton transfer, NFT transfer, transaction, block, StateInit.
- Verify output modes: tree, YAML, JSON, raw cell, TVM code.
- Verify copy, download, share and JSONHero actions.
- Deploy to Vercel and compare build output against local `dist`.
