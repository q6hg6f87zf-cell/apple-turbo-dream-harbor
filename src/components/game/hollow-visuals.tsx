import { canonicalRegionId, regionById } from "@/game/data";
import { MAIN_MENU_ART, REGION_ART } from "@/game/art";
import { useGame } from "@/game/store";
import type { LocationId, RegionId } from "@/game/types";
import { Map, X, ZoomIn } from "lucide-react";
import { useEffect, useState } from "react";

const REGION_TO_LOCATION: Record<RegionId, LocationId> = {
  ironclad: "ironclad",
  slagtown: "kingdom",
  blackspire: "caverns",
  brasswater: "library",
  veyra: "veyra",
};

const REGION_ORDER: RegionId[] = ["ironclad", "slagtown", "blackspire", "brasswater", "veyra"];

export function HollowRealmVisuals() {
  const screen = useGame((g) => g.s.screen);
  const selectedLoc = useGame((g) => g.s.selectedLoc);
  const locations = useGame((g) => g.s.locations);
  const selectLoc = useGame((g) => g.selectLoc);
  const [mapOpen, setMapOpen] = useState(false);

  const regionId = canonicalRegionId(selectedLoc ?? "ironclad") ?? "ironclad";
  const region = regionById(regionId);

  useEffect(() => {
    if (screen !== "map") setMapOpen(false);
  }, [screen]);

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
            linear-gradient(180deg, rgba(7,5,4,.12) 0%, rgba(7,5,4,.28) 38%, rgba(7,5,4,.86) 78%, #0b0908 100%),
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
        [data-ready="1"]:not([data-screen]) button {
          letter-spacing: .08em;
        }
        .hollow-region-map-image {
          image-rendering: auto;
          filter: saturate(.95) contrast(1.04);
        }
      `}</style>

      {screen === "map" ? (
        <>
          <button
            type="button"
            onClick={() => setMapOpen(true)}
            className="fixed bottom-24 right-3 z-[19] w-40 overflow-hidden rounded-xl border border-ember/45 bg-ink/95 text-left shadow-2xl backdrop-blur md:bottom-6 md:right-6 md:w-52"
            aria-label={`Open ${region.name} regional map`}
          >
            <div className="relative aspect-square overflow-hidden">
              <img src={REGION_ART[regionId]} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent" />
              <ZoomIn className="absolute right-2 top-2 size-4 text-paper drop-shadow" />
              <div className="absolute inset-x-0 bottom-0 p-2.5">
                <p className="font-display text-[10px] uppercase tracking-[0.18em] text-ember">Regional map</p>
                <p className="font-display text-sm text-paper">{region.name}</p>
              </div>
            </div>
          </button>

          {mapOpen ? (
            <div className="fixed inset-0 z-[60] flex flex-col bg-ink text-paper">
              <header className="flex shrink-0 items-center gap-3 border-b border-line bg-surface/95 px-3 py-3 backdrop-blur">
                <button
                  type="button"
                  onClick={() => setMapOpen(false)}
                  className="flex size-11 items-center justify-center rounded-lg border border-line text-moon"
                  aria-label="Back to Hollow Realm"
                >
                  <X className="size-5" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-[10px] uppercase tracking-[0.22em] text-ember">Hollow Realm · regional map</p>
                  <h2 className="truncate font-display text-xl">{region.name}</h2>
                </div>
                <Map className="size-5 text-moon" />
              </header>

              <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-line bg-raised/80 px-3 py-2">
                {REGION_ORDER.map((id) => {
                  const target = REGION_TO_LOCATION[id];
                  const unlocked = !!locations[target]?.unlocked;
                  const def = regionById(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      disabled={!unlocked}
                      onClick={() => selectLoc(target)}
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

              <div className="ms-scroll min-h-0 flex-1 overflow-auto bg-[#080706] p-4" style={{ touchAction: "pan-x pan-y pinch-zoom" }}>
                <div className="mx-auto w-[min(1100px,180vw)] min-w-[720px] overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
                  <img
                    src={REGION_ART[regionId]}
                    alt={`${region.name} regional map`}
                    className="h-auto w-full hollow-region-map-image"
                    draggable={false}
                  />
                </div>
              </div>

              <footer className="shrink-0 border-t border-line bg-surface px-4 py-3" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
                <p className="text-sm leading-relaxed text-moon">{region.description}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {region.points.slice(0, 4).map((point) => (
                    <span key={point.id} className="rounded-full border border-line bg-ink px-2 py-1 text-[11px] text-muted">
                      {point.name}
                    </span>
                  ))}
                </div>
              </footer>
            </div>
          ) : null}
        </>
      ) : null}
    </>
  );
}
