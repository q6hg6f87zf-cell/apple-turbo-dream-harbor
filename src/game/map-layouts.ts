import type { RegionId } from "./types";

export type RegionMapLayer = {
  id: string;
  z: number;
  scroll?: boolean;
};

export type RegionMapAnchor = {
  poiId: string;
  x: number;
  y: number;
  z: number;
};

export type RegionMapLayout = {
  id: RegionId;
  map: string;
  /** Authored single-channel heightfield. Prefer over runtime luminance bake. */
  height?: string;
  camera: { yaw: number; pitch: number; fov: number };
  bounds: { w: number; h: number };
  rim: { ember: number; teal: number };
  layers: RegionMapLayer[];
  anchors: RegionMapAnchor[];
};

const DEFAULT_LAYERS: RegionMapLayer[] = [
  { id: "ground", z: 0 },
  { id: "districts", z: 0.08 },
  { id: "roofs", z: 0.16 },
  { id: "smoke", z: 0.22, scroll: true },
];

function heightUrl(id: RegionId) {
  return `/map/regions/${id}.height.png?v=h1`;
}

const DEFAULTS: Record<RegionId, RegionMapLayout> = {
  ironclad: {
    id: "ironclad",
    map: "/map/regions/ironclad.jpg?v=town4k1",
    height: heightUrl("ironclad"),
    camera: { yaw: 14, pitch: 54, fov: 30 },
    bounds: { w: 1, h: 1 },
    rim: { ember: 0.55, teal: 0 },
    layers: DEFAULT_LAYERS,
    anchors: [],
  },
  slagtown: {
    id: "slagtown",
    map: "/map/regions/slagtown.jpg?v=town4k1",
    height: heightUrl("slagtown"),
    camera: { yaw: -10, pitch: 52, fov: 30 },
    bounds: { w: 1, h: 1 },
    rim: { ember: 0.72, teal: 0 },
    layers: DEFAULT_LAYERS,
    anchors: [],
  },
  blackspire: {
    id: "blackspire",
    map: "/map/regions/blackspire.jpg?v=town4k1",
    height: heightUrl("blackspire"),
    camera: { yaw: 8, pitch: 50, fov: 28 },
    bounds: { w: 1, h: 1 },
    rim: { ember: 0.45, teal: 0.05 },
    layers: DEFAULT_LAYERS,
    anchors: [],
  },
  brasswater: {
    id: "brasswater",
    map: "/map/regions/brasswater.jpg?v=town4k1",
    height: heightUrl("brasswater"),
    camera: { yaw: -6, pitch: 53, fov: 29 },
    bounds: { w: 1, h: 1 },
    rim: { ember: 0.28, teal: 0.55 },
    layers: DEFAULT_LAYERS,
    anchors: [],
  },
  veyra: {
    id: "veyra",
    map: "/map/regions/veyra.jpg?v=town4k1",
    height: heightUrl("veyra"),
    camera: { yaw: 12, pitch: 55, fov: 28 },
    bounds: { w: 1, h: 1 },
    rim: { ember: 0.35, teal: 0.25 },
    layers: DEFAULT_LAYERS,
    anchors: [],
  },
};

const cache = new Map<RegionId, RegionMapLayout>();
const inflight = new Map<RegionId, Promise<RegionMapLayout>>();

function normalize(raw: Partial<RegionMapLayout> | null | undefined, id: RegionId): RegionMapLayout {
  const base = DEFAULTS[id];
  if (!raw) return base;
  return {
    id,
    map: typeof raw.map === "string" ? raw.map : base.map,
    height: typeof raw.height === "string" ? raw.height : base.height,
    camera: {
      yaw: Number.isFinite(raw.camera?.yaw) ? Number(raw.camera!.yaw) : base.camera.yaw,
      pitch: Number.isFinite(raw.camera?.pitch) ? Number(raw.camera!.pitch) : base.camera.pitch,
      fov: Number.isFinite(raw.camera?.fov) ? Number(raw.camera!.fov) : base.camera.fov,
    },
    bounds: {
      w: Number.isFinite(raw.bounds?.w) ? Number(raw.bounds!.w) : 1,
      h: Number.isFinite(raw.bounds?.h) ? Number(raw.bounds!.h) : 1,
    },
    rim: {
      ember: Number.isFinite(raw.rim?.ember) ? Number(raw.rim!.ember) : base.rim.ember,
      teal: Number.isFinite(raw.rim?.teal) ? Number(raw.rim!.teal) : base.rim.teal,
    },
    layers: Array.isArray(raw.layers) && raw.layers.length ? raw.layers : base.layers,
    anchors: Array.isArray(raw.anchors) ? raw.anchors : base.anchors,
  };
}

/** Layout sidecar for the 2.5D region player. Falls back to baked defaults. */
export async function loadRegionLayout(id: RegionId): Promise<RegionMapLayout> {
  const hit = cache.get(id);
  if (hit) return hit;
  const pending = inflight.get(id);
  if (pending) return pending;
  const job = (async () => {
    try {
      const res = await fetch(`/map/regions/${id}.layout.json`, { cache: "force-cache" });
      if (!res.ok) throw new Error(`layout ${id} ${res.status}`);
      const json = (await res.json()) as Partial<RegionMapLayout>;
      const layout = normalize(json, id);
      cache.set(id, layout);
      return layout;
    } catch {
      const layout = DEFAULTS[id];
      cache.set(id, layout);
      return layout;
    } finally {
      inflight.delete(id);
    }
  })();
  inflight.set(id, job);
  return job;
}

export function regionLayoutSync(id: RegionId): RegionMapLayout {
  return cache.get(id) ?? DEFAULTS[id];
}

/** Short war-room label — never the awkward last-word truncate. */
export function poiShortLabel(name: string): string {
  const clean = name.replace(/^The\s+/i, "").trim();
  const parts = clean.split(/\s+/);
  if (parts.length <= 2) return clean.toUpperCase();
  if (/vault/i.test(clean)) return "VAULT 13";
  if (/relay|tower/i.test(clean)) return "TOWER";
  if (/market/i.test(clean)) return "MARKET";
  if (/gate/i.test(clean)) return "GATE";
  if (/shop|mechanical|bay/i.test(clean)) return "SHOP";
  if (/rail/i.test(clean)) return "RAIL CUT";
  if (/highway/i.test(clean)) return "HIGHWAY";
  if (/works|foundry/i.test(clean)) return "WORKS";
  if (/berm/i.test(clean)) return "BERM";
  if (/exchange/i.test(clean)) return "EXCHANGE";
  if (/halo/i.test(clean)) return "HALO";
  if (/pack|gravenor|boss/i.test(clean)) return "PACK";
  return parts.slice(0, 2).join(" ").toUpperCase();
}

/** POI x/y in data are percent 0–100; layout anchors are 0–1. */
export function poiMapUv(x: number, y: number): { u: number; v: number } {
  if (x <= 1.5 && y <= 1.5) return { u: x, v: y };
  return { u: x / 100, v: y / 100 };
}
