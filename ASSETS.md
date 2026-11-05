# Monetura HQ: external assets

**There are no external art assets in `apps/hq`.** No models, textures, HDRIs, fonts files, sounds or images were downloaded for this build.

Everything on the island is made in code:

| What | How it's made | Where |
|---|---|---|
| Terrain, beaches, cliffs | Deterministic heightfield and a procedural shader | `src/world/world.ts`, `src/scene/Terrain.tsx` |
| Ocean, foam, sparkle | Custom GLSL shader | `src/scene/Ocean.tsx` |
| Sky, clouds | Custom shader and canvas-painted sprites | `src/scene/Sky.tsx` |
| Palms, foliage, rocks | Generated geometry and canvas-painted leaf textures | `src/scene/Foliage.tsx`, `src/scene/textures.ts` |
| Buildings and interiors | Merged primitives from the architecture kit | `src/scene/buildingKit.ts`, `src/scene/interiors.ts` |
| Characters | Procedural rig, posed in code | `src/scene/character.ts` |
| Screens and signage ("travel imagery") | Painted on canvas at runtime; invented scenes, no real photos | `src/scene/textures.ts` |
| Yachts, docks, helipad, helicopter, waterfalls | Generated geometry and shaders | `src/scene/Harbour.tsx` |
| HUD icons, M mark, avatars | Inline SVG written for this project | `src/hud/Icon.tsx` |

## Fonts

| Font | Source | License | Note |
|---|---|---|---|
| Cormorant Garamond | Google Fonts, via `next/font/google` (self-hosted at build time) | SIL Open Font License 1.1 | Already the temporary heading font across Monetura (`packages/config/tailwind.config.ts`). UI text uses the system font stack. |

## Code libraries

Installed through npm and listed in `apps/hq/package.json`; these aren't art assets but are recorded here for completeness.

| Library | License |
|---|---|
| three | MIT |
| @react-three/fiber, @react-three/drei, @react-three/postprocessing | MIT |
| postprocessing | Zlib |
| n8ao (dependency of the above) | CC0 1.0 |
| zustand | MIT |
| @playwright/test (dev only) | Apache-2.0 |

## Adding an asset later

Only use CC0 or MIT-licensed assets. Add a row here with the source URL and license **before** committing the file. If a license is unclear, don't use it.
