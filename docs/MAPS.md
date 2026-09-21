# Hollow Realm maps — Cursor contract

Do **not** invent a new geography. Do **not** replace the painted maps with a generated planet.
Rebuild the **player**: turn the existing paintings into a 2.5D war-room surface.

## Canon assets (source of truth)

| Surface | File | Role |
|---|---|---|
| Overworld | `/public/map/overworld.jpg` | Painted dieselpunk continent. Not NASA Earth. |
| Ironclad | `/public/map/regions/ironclad.jpg` | Circular fortress-city, rail cuts, bunker ridge |
| Slagtown | `/public/map/regions/slagtown.jpg` | Furnace city on cooling slag |
| Blackspire | `/public/map/regions/blackspire.jpg` | Volcanic mine mountain, lift cages |
| Brasswater | `/public/map/regions/brasswater.jpg` | Drowned brass coast, half-sunken library |
| Veyra | `/public/map/regions/veyra.jpg` | AEGIS frame capital, needle spire |
| Prompts | `*.prompt.txt` next to each jpg | Camera and palette lock |
| Street stills | `/public/art/places/*-street.jpg` | Encounter / briefing backdrops only |

Region ids: `ironclad`, `slagtown`, `blackspire`, `brasswater`, `veyra`.
Legacy location aliases stay in the engine: slagtown=`kingdom`, blackspire=`caverns`, brasswater=`library`. HQ pins on Ironclad.

POI records already live on `RegionDefinition.points` in `src/game/data.ts` with `x`/`y` in 0–1 map space. Those numbers are the pin contract. If a pin is off the painted building, move the number, not the painting.

## What is live today (do not confuse these)

1. `WorldAtlas` → `HollowGlobeWebGL` is an Earth-like orbital shader. It is **not** the painted Hollow overworld.
2. Region briefing (`region-sheet.tsx`) uses a **street photo** as a full-bleed backdrop, then lists POIs. The painted region JPGs are barely the play surface.
3. That is why the game still feels like "a flat jpg with pins" even though 1MB strategy maps already sit in `/public/map/regions`.

## Required rebuild — 2.5D map player

Build `RegionMapStage` (and later `OverworldMapStage`) that:

- Renders the painted jpg as a textured plane, not a CSS `background-image`.
- Adds a matching height / occlusion layer so rooftops sit above streets.
- Camera is high isometric, same angle as the prompts. Orbit ±18°, pitch locked, pinch-zoom 0.8–2.4.
- Parallax: far haze, mid districts, near rails/smoke. No first-person walk.
- POIs are world-anchored meshes/sprites at `point.x/y`, not HTML dots over a photo.
- Fog-of-war uses `discoveredPois` / `unlocked`. Unknown sites are silhouettes, not missing art.
- Heat / watch / Kane band can tint the rim. Do not redraw the city to show state.
- Mobile: one-finger pan, two-finger zoom, tap pin → existing `RegionSheet` briefing. Do not invent a new mission flow.

Stack: Three/R3F or a tight WebGL2 plane + displacement. Keep `globe-webgl.tsx` as the orbital theater until a second pass wraps the painted overworld onto a custom globe. Do not delete the globe in this slice.

## Forbidden

- New towns, renamed towns, merged districts, Earth continents, satellite photos.
- Text, compass roses, or legends baked into replacement art.
- Letting an image model "improve" Ironclad into a different fortress.
- Shipping another fullscreen street still and calling it the map.
- Blocking play behind a 50MB 4K texture. Max display atlas ~2048 on the long edge; keep the master painting in `/public/map` and generate web-sized + thumb derivatives.

## Height / layer kit Cursor should add

For each region, add a sidecar next to the jpg:

```
public/map/regions/<id>.layout.json
```

```json
{
  "id": "ironclad",
  "map": "/map/regions/ironclad.jpg",
  "camera": { "yaw": 18, "pitch": 52, "fov": 28 },
  "bounds": { "w": 1, "h": 1 },
  "layers": [
    { "id": "ground", "z": 0 },
    { "id": "districts", "z": 0.08 },
    { "id": "roofs", "z": 0.16 },
    { "id": "smoke", "z": 0.22, "scroll": true }
  ],
  "anchors": [{ "poiId": "ironclad-gate", "x": 0.42, "y": 0.61, "z": 0.1 }]
}
```

If a heightfield PNG is generated, store it as `/public/map/regions/<id>.height.png` (single-channel, same aspect as the painting). Derive it from the painting. Do not hallucinate extra mountains.

## Visual lock

Disco Elysium cartography × SYNAPSE war-room. Charcoal, rust, brass, ember, teal water only where Brasswater/Veyra already use it. Hard edges. Readable rooftops. No photoreal city, no mushy AI fog.

## Acceptance

- Zooming Ironclad shows the circular wall and rail cuts from `ironclad.jpg`, not a new mesh city.
- Tapping a discovered POI still opens the existing briefing sheet and field-ops actions.
- Slagtown / Blackspire / Brasswater / Veyra use the same player with their own painting + layout.
- Overworld zoom from globe → region does not swap in Earth coastline art.
- Low GPU falls back to the painting + CSS pins. Never a black canvas.
