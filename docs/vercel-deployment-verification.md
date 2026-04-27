# Vercel deployment verification

1. Import `TrueCarry/ton-cell-abi-viewer` into Vercel.
2. Use the default Vite settings: install `pnpm install --frozen-lockfile`, build `pnpm build`, output `dist`.
3. Confirm the deployed app loads the default comment example.
4. Paste a hex BOC and confirm parser status is success, partial, or unknown rather than a blank page.
5. Switch Tree, YAML, JSON, Raw cell and TVM code tabs.
6. Confirm copy, download and share actions work in the production origin.
