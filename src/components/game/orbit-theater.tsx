import { REGION_ART } from "@/game/art";
import { CANONICAL_REGION_IDS, locById, regionById } from "@/game/data";
import { knownPois, locationToRegion, poiActionOf, poiUsedToday } from "@/game/field-ops";
import { siteCopyFor } from "@/game/story";
import { REGION_STREET } from "@/game/item-art";
import { sfx } from "@/game/audio";
import { punchClick, shockwaveAt } from "@/game/juice";
import { useGame } from "@/game/store";
import type { LocationId, RegionId } from "@/game/types";
import { cn } from "@/lib/cn";
import { Home, Lock, Minus, Plus, RadioTower, Skull, Store, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { WorldAtlas } from "./atlas";

const REGION_TO_LOCATION: Record<RegionId, LocationId> = {
  ironclad: "ironclad",
  slagtown: "kingdom",
  blackspire: "caverns",
  brasswater: "library",
  veyra: "veyra",
};

export function OrbitTheater({
  loc,
  onClose,
  onSelect,
}: {
  loc: LocationId;
  onClose: () => void;
  onSelect: (id: LocationId) => void;
}) {
  const locations = useGame((g) => g.s.locations);
  const mapOpen = useGame((g) => !!g.s.regionMapOpen);

  useEffect(() => {
    document.body.dataset.orbit = "1";
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sfx.whoosh();
    const onMap = () => onClose();
    window.addEventListener("hollow:open-region-map", onMap);
    return () => {
      delete document.body.dataset.orbit;
      document.body.style.overflow = prev;
      window.removeEventListener("hollow:open-region-map", onMap);
    };
  }, [onClose]);

  useEffect(() => {
    if (mapOpen) onClose();
  }, [mapOpen, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[130] flex flex-col bg-[#020307] text-paper">
      <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-3 px-3 pt-[max(0.7rem,env(safe-area-inset-top))]">
        <button
          id="hollow-orbit-close"
          type="button"
          aria-label="Leave orbit"
          onClick={() => {
            sfx.click();
            onClose();
          }}
          className="pointer-events-auto flex size-12 items-center justify-center rounded-full border border-line/70 bg-ink/80 text-paper shadow-xl backdrop-blur-md"
        >
          <X className="size-5" />
        </button>
      </header>

      <div className="pointer-events-none absolute inset-x-0 bottom-[max(7.4rem,calc(env(safe-area-inset-bottom)+6.6rem))] z-20 px-3">
        <div className="pointer-events-auto flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CANONICAL_REGION_IDS.map((id) => {
          const location = REGION_TO_LOCATION[id];
          const unlocked = !!locations[location]?.unlocked;
          const active = (locationToRegion(loc) ?? "ironclad") === id;
          const region = regionById(id);
          return (
            <button
              key={id}
              type="button"
              disabled={!unlocked}
              onClick={(e) => {
                if (!unlocked) return;
                punchClick(e.clientX, e.clientY);
                sfx.click();
                onSelect(location);
              }}
              className={cn(
                "shrink-0 rounded-[var(--radius-md)] border px-3 py-2 text-left backdrop-blur-md",
                active
                  ? "border-ember/70 bg-ember/20 text-ember-bright"
                  : "border-line/70 bg-ink/70 text-moon disabled:opacity-35",
              )}
            >
              <span className="flex items-center gap-1 font-display text-[10px] uppercase tracking-[0.14em]">
                {!unlocked ? <Lock className="size-3" /> : null}
                {region.short}
              </span>
              <span className="mt-0.5 block font-display text-[8px] uppercase tracking-[0.16em] opacity-60">{region.continent}</span>
            </button>
          );
        })}
        </div>
      </div>

      <div id="hollow-orbit-stage" className="relative min-h-0 flex-1">
        <WorldAtlas loc={loc} onSelect={onSelect} theater />
      </div>
    </div>,
    document.body,
  );
}

export function RegionMapOverlay() {
  const s = useGame((g) => g.s);
  const close = useGame((g) => g.closeRegionMap);
  const selectPoi = useGame((g) => g.selectPoi);
  const loc = s.selectedLoc ?? "ironclad";
  const regionId = locationToRegion(loc) ?? "ironclad";
  const region = regionById(regionId);
  const art = REGION_ART[regionId];
  const street = region.streetAsset ?? REGION_STREET[regionId];
  const pois = knownPois(s, loc);
  const [scale, setScale] = useState(1);
  const scroller = useRef<HTMLDivElement>(null);
  const pinch = useRef<{ distance: number; scale: number } | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());

  useEffect(() => {
    document.body.dataset.regionMap = "1";
    return () => {
      delete document.body.dataset.regionMap;
    };
  }, []);

  useEffect(() => {
    setScale(1);
    scroller.current?.scrollTo({ top: 0, left: 0 });
  }, [regionId]);

  const clampScale = (n: number) => Math.min(2.8, Math.max(1, n));

  if (typeof document === "undefined") return null;

  const sheet = (
    <div className="fixed inset-0 z-[140] flex flex-col bg-ink text-paper" data-region-map="1">
      <header className="flex shrink-0 items-center gap-3 border-b border-line bg-surface/95 px-3 py-3 backdrop-blur">
        <button
          type="button"
          onClick={() => {
            sfx.click();
            close();
          }}
          className="flex size-12 items-center justify-center rounded-full border border-line text-moon"
          aria-label="Close regional map"
        >
          <X className="size-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-display text-[10px] uppercase tracking-[0.22em] text-ember">{region.continent} · ground</p>
          <h2 className="truncate font-display text-xl">{region.name}</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => setScale((z) => clampScale(z - 0.25))}
            className="flex size-11 items-center justify-center rounded-[var(--radius-sm)] border border-line text-moon"
          >
            <Minus className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => setScale((z) => clampScale(z + 0.25))}
            className="flex size-11 items-center justify-center rounded-[var(--radius-sm)] border border-line text-moon"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div
          ref={scroller}
          className="relative min-h-0 flex-1 overflow-auto bg-ink touch-pan-x touch-pan-y"
          onPointerDown={(e) => {
            pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (pointers.current.size === 2) {
              const pts = [...pointers.current.values()];
              pinch.current = {
                distance: Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y),
                scale,
              };
            }
          }}
          onPointerMove={(e) => {
            if (!pointers.current.has(e.pointerId)) return;
            pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (pointers.current.size >= 2 && pinch.current) {
              const pts = [...pointers.current.values()];
              const dist = Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y);
              setScale(clampScale(pinch.current.scale * (dist / Math.max(1, pinch.current.distance))));
            }
          }}
          onPointerUp={(e) => {
            pointers.current.delete(e.pointerId);
            if (pointers.current.size < 2) pinch.current = null;
          }}
          onPointerCancel={(e) => {
            pointers.current.delete(e.pointerId);
            if (pointers.current.size < 2) pinch.current = null;
          }}
        >
          <div className="relative" style={{ width: `${scale * 100}%` }}>
            <img
              src={art}
              alt={`${region.name} regional map`}
              className="block w-full select-none"
              draggable={false}
            />
            {pois.map((p) => {
              const on = s.selectedPoiId === p.id;
              const act = poiActionOf(p);
              const Icon = act === "shop" ? Store : act === "listen" ? RadioTower : act === "home" ? Home : act === "boss" ? Skull : null;
              return (
              <button
                key={p.id}
                type="button"
                data-poi={p.id}
                onClick={(e) => {
                  e.stopPropagation();
                  punchClick(e.clientX, e.clientY);
                  shockwaveAt(e.clientX, e.clientY);
                  sfx.unlock();
                  selectPoi(p.id);
                }}
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
                className={cn(
                  "absolute flex min-h-11 min-w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-1 rounded-full border px-2 font-display text-[10px] uppercase tracking-[0.12em] shadow-xl backdrop-blur-md",
                  on ? "border-ember bg-ember text-ink z-10" : "border-ember/60 bg-ink/80 text-ember",
                )}
              >
                {Icon ? <Icon className="size-3.5" /> : null}
                <span className={on ? "max-w-[9rem] truncate" : "sr-only"}>{p.name}</span>
                {!on ? <span className="max-w-[4.6rem] truncate">{p.name.split(" ").slice(-1)[0]}</span> : null}
              </button>
              );
            })}
          </div>
        </div>

        {street ? (
          <div className="relative h-[32vh] min-h-[10.5rem] shrink-0 overflow-hidden border-t border-line">
            <img src={street} alt={`${region.name} street`} className="absolute inset-0 size-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 via-ink/35 to-transparent px-4 pb-3 pt-10">
              <p className="font-display text-[10px] uppercase tracking-[0.2em] text-ember">{region.continent}</p>
              <p className="text-sm text-paper">{region.name} · street</p>
            </div>
          </div>
        ) : null}
      </div>

      {(() => {
        const selected = pois.find((p) => p.id === s.selectedPoiId) ?? pois[0];
        const used = selected ? poiUsedToday(s, selected.id) : false;
        const act = selected ? poiActionOf(selected) : "scout";
        const label =
          act === "shop"
            ? "Open stalls"
            : act === "listen"
              ? "Climb and listen · 1 watch"
              : act === "home"
                ? "Return to Vault 13"
                : act === "boss"
                  ? "Hold for deploy"
                  : act === "bay"
                    ? "Open Travis's bay"
                  : act === "salvage"
                    ? "Salvage · 1 watch"
                    : "Scout · 1 watch";
        return (
          <div className="shrink-0 border-t border-line bg-surface/95 px-4 py-3">
            <p className="font-display text-[10px] uppercase tracking-[0.2em] text-ember">
              {selected ? selected.name : region.name}
            </p>
            <p className="mt-1 text-sm text-moon">
              {selected
                ? siteCopyFor(selected, act === "salvage" ? "forage" : "scout").brief
                : locById(loc).desc}
            </p>
            {selected ? (
              <button
                type="button"
                data-poi-act={selected.id}
                disabled={used && act !== "shop" && act !== "home" && act !== "boss" && act !== "bay"}
                onClick={() => {
                  sfx.unlock();
                  const msg = useGame.getState().workSite(selected.id);
                  if (msg) {
                    useGame.setState((st) => ({ s: { ...st.s, toast: msg } }));
                  }
                }}
                className="mt-3 flex min-h-12 w-full items-center justify-center rounded-[var(--radius-sm)] bg-ember px-3 font-display text-sm text-ink disabled:opacity-40"
              >
                {used && act !== "shop" && act !== "home" && act !== "boss" && act !== "bay" ? "Worked today" : label}
              </button>
            ) : null}
          </div>
        );
      })()}
    </div>
  );

  return createPortal(sheet, document.body);
}
