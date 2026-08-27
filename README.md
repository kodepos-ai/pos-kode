# Kode Pos

Astro Server + Cloudflare adapter.

## Build

npm install
npm run build

## Architecture

Dynamic Kode Pos routes use server rendering and intentionally do not use
getStaticPaths(), so the build does not generate every province/city/district.

Cloudflare KV/API data access should be connected through src/lib/kode-pos/config.ts.
