import { regionById } from "@/game/data";
import { knownPois } from "@/game/field-ops";
import { MAIN_MENU_ART } from "@/game/art";
import { useGame } from "@/game/store";
import type { LocationId, RegionId } from "@/game/types";
import { Map, Minus, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";

const REGION_TO_LOCATION: Record<RegionId, LocationId> = {
  ironclad: "ironclad",
  slagtown: "kingdom",
  blackspire: "caverns",
  brasswater: "library",
  veyra: "veyra",
};

const LOCATION_TO_REGION: Partial<Record<LocationId, RegionId>> = {
  ironclad: "ironclad",
  kingdom: "slagtown",
  caverns: "blackspire",
  library: "brasswater",
  veyra: "veyra",
};

const REGION_ORDER: RegionId[] = ["ironclad", "slagtown", "blackspire", "brasswater", "veyra"];

export function HollowRealmVisuals() {
  const screen = useGame((g) => g.s.screen);
  const selectedLoc = useGame((g) => g.s.selectedLoc);
  const selectedPoiId = useGame((g) => g.s.selectedPoiId);
  const mapOpen = useGame((g) => !!g.s.regionMapOpen);
  const selectLoc = useGame((g) => g.selectLoc);
  const selectPoi = useGame((g) => g.selectPoi);
  const closeRegionMap = useGame((g) => g.closeRegionMap);
  const s = useGame((g) => g.s);
  const [zoom, setZoom] = useState(1);

  const regionId = LOCATION_TO_REGION[selectedLoc ?? "ironclad"] ?? "ironclad";
  const region = regionById(regionId);

  useEffect(() => {
    if (screen !== "map" && mapOpen) closeRegionMap();
  }, [screen, mapOpen, closeRegionMap]);

  useEffect(() => {
    if (mapOpen) setZoom(1);
  }, [mapOpen, regionId]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700;800&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap');
        :root {
          --color-ink: #0b0908;
          --color-surface: #15110f;
          --color-raised: #211812;
          --color-panel: #2a1e16;
          --color-line: #70513a;
          --color-ember: #c98545;
          --color-ember-bright: #f2bd70;
          --color-paper: #f1e3c2;
          --color-muted: #aa9075;
          --color-moon: #c8a66a;
          --color-danger: #b6523c;
          --color-ok: #5b9c91;
          --color-void: #627684;
          --font-display: "Cinzel", Georgia, serif;
        }
        [data-ready="1"]:not([data-screen]) {
          background-color: #0b0908 !important;
          background-image:
            linear-gradient(180deg, rgba(7,5,4,.08) 0%, rgba(7,5,4,.24) 38%, rgba(7,5,4,.82) 78%, #0b0908 100%),
            url("${MAIN_MENU_ART}") !important;
          background-size: cover !important;
          background-position: center center !important;
        }
        [data-ready="1"]:not([data-screen]) > picture:first-child { display: none !important; }
        [data-ready="1"]:not([data-screen]) div:has(> img[alt^="Tyrone Bot"]) { display: none !important; }
        [data-ready="1"]:not([data-screen]) .glass-strong {
          background: rgba(17,12,9,.74) !important;
          border: 1px solid rgba(201,133,69,.36);
          box-shadow: inset 0 1px 0 rgba(242,189,112,.16), 0 22px 60px rgba(0,0,0,.58) !important;
        }
        [data-ready="1"]:not([data-screen]) button { letter-spacing: .08em; }
        .hollow-region-map-image {
          image-rendering: auto;
          transform-origin: center top;
        }
      `}</style>

      {false && screen === "map" && mapOpen ? (
        <div className="fixed inset-0 z-[120] flex flex-col bg-ink text-paper">
          <header className="flex shrink-0 items-center gap-3 border-b border-line bg-surface/95 px-3 py-3 backdrop-blur">
            <button
              type="button"
              onClick={() => closeRegionMap()}
              className="flex size-11 items-center justify-center rounded-lg border border-line text-moon"
              aria-label="Back to Hollow Realm globe"
            >
              <X className="size-5" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[10px] uppercase tracking-[0.22em] text-ember">Hollow Realm · regional map</p>
              <h2 className="truncate font-display text-xl">{region.name}</h2>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.85, z - 0.2))}
                className="flex size-10 items-center justify-center rounded-lg border border-line text-moon"
                aria-label="Zoom map out"
              >
                <Minus className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(2.6, z + 0.2))}
                className="flex size-10 items-center justify-center rounded-lg border border-line text-moon"
                aria-label="Zoom map in"
              >
                <Plus className="size-4" />
              </button>
              <Map className="ml-1 size-5 text-moon" />
            </div>
          </header>

          <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-line bg-raised/80 px-3 py-2">
            {REGION_ORDER.map((id) => {
              const target = REGION_TO_LOCATION[id];
              const unlocked = !!s.locations[target]?.unlocked;
              const def = regionById(id);
              return (
                <button
                  key={id}
                  type="button"
                  disabled={!unlocked}
                  onClick={() => {
                    selectLoc(target);
                    setZoom(1);
                  }}
                  className={`shrink-0 rounded-full border px-3 py-2 font-display text-[10px] uppercase tracking-[0.14em] ${
                    regionId === id
                      ? "border-ember bg-ember/15 text-ember-bright"
                      : "border-line bg-ink/60 text-moon disabled:opacity-35"
                  }`}
                >
                  {def.name}
                </button>
              );
            })}
          </div>

          <div className="ms-scroll min-h-0 flex-1 overflow-auto bg-[#080706]" style={{ touchAction: "pan-x pan-y pinch-zoom" }}>
            <div className="relative origin-top">
              <img
                src={region.mapAsset}
                alt={`${region.name} regional map`}
                className="block h-auto max-w-none select-none"
                draggable={false}
                style={{ width: `${Math.round(zoom * 100)}%` }}
              />
              {knownPois(s, REGION_TO_LOCATION[regionId]).map((point) => {
                const active = selectedPoiId === point.id;
                return (
                  <button
                    key={point.id}
                    type="button"
                    onClick={() => selectPoi(point.id)}
                    style={{ left: `${point.x}%`, top: `${point.y}%` }}
                    className={`absolute flex min-h-11 min-w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border px-2 font-display text-[9px] uppercase tracking-[0.12em] shadow-lg ${
                      active
                        ? "border-ember bg-ember text-ink"
                        : "border-ember/70 bg-ink/85 text-ember-bright backdrop-blur-md"
                    }`}
                    aria-label={point.name}
                  >
                    <span className="max-w-[7rem] truncate px-1">{point.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <footer className="shrink-0 border-t border-line bg-surface px-4 py-3" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
            {(() => {
              const locId = REGION_TO_LOCATION[regionId];
              const poi = knownPois(s, locId).find((p) => p.id === selectedPoiId) ?? knownPois(s, locId)[0];
              return (
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-sm text-paper">{poi?.name ?? region.name}</p>
                    <p className="mt-1 text-sm leading-relaxed text-moon">{poi?.description ?? region.description}</p>
                  </div>
                  <span className="shrink-0 rounded-full border border-line bg-ink px-2 py-1 font-display text-[9px] uppercase tracking-[0.13em] text-ember">
                    {Math.round(zoom * 100)}%
                  </span>
                </div>
              );
            })()}
            <button
              type="button"
              onClick={() => {
                const locId = REGION_TO_LOCATION[regionId];
                const poi = knownPois(s, locId)[0];
                if (!selectedPoiId && poi) selectPoi(poi.id);
                closeRegionMap();
              }}
              className="mt-3 flex min-h-12 w-full items-center justify-center rounded-[var(--radius-md)] bg-ember font-display text-[11px] uppercase tracking-[0.16em] text-ink"
            >
              Lock this site
            </button>
          </footer>
        </div>
      ) : null}
    </>
  );
}
