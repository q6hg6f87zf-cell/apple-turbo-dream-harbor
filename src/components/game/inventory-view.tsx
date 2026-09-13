import { Button } from "@/components/ui/button";
import { ARMOR, LEDGER_POOLS, WEAPONS, regionById } from "@/game/data";
import { HOLLOW_CATALOG } from "@/game/hollow-catalog";
import { PACK_CATALOG, PACK_KEYS } from "@/game/inventory";
import { CLASS_PRESENTATION, ITEM_KIND_PRESENTATION, classLabel, itemEmoji } from "@/game/presentation";
import { useGame } from "@/game/store";
import type {
  ClassName,
  Condition,
  InventoryCategory,
  InventoryScope,
  InventorySort,
  Item,
  ItemKind,
  PackKey,
  Rarity,
  RegionId,
} from "@/game/types";
import { cn } from "@/lib/cn";
import { Archive, Check, Search, UserRound, Wrench, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Coin, Panel, RarityMark, SectionLabel } from "./primitives";

type Mode = "owned" | "catalogue";
type Source = "vault" | "operative" | "pack" | "catalogue";

type InventoryRow = {
  key: string;
  source: Source;
  name: string;
  kind: ItemKind;
  rarity: Rarity;
  condition?: Condition;
  effect: string;
  lore: string;
  value: number;
  owner: string;
  ownerId?: string;
  item?: Item;
  packKey?: PackKey;
  quantity?: number;
  equipped?: boolean;
  classHint?: ClassName;
  damage?: string;
  defense?: number;
  sourceRegion?: RegionId;
};

const CATEGORIES: InventoryCategory[] = [
  "all",
  "weapon",
  "armor",
  "trinket",
  "consumable",
  "enchantment",
  "material",
  "special",
];

const RARITY_RANK: Record<Rarity, number> = {
  Common: 0,
  Uncommon: 1,
  Rare: 2,
  Legendary: 3,
  Mythic: 4,
  Cursed: 5,
};

const CONDITION_RANK: Record<Condition, number> = {
  Broken: 0,
  Damaged: 1,
  Worn: 2,
  Pristine: 3,
};

const PACK_KIND: Record<PackKey, ItemKind> = {
  bobby_pin: "trinket",
  stimpak: "consumable",
  mentats: "consumable",
  holotape: "special",
  sarsaparilla: "consumable",
  probe_kit: "special",
};

const PACK_VALUE: Record<PackKey, number> = {
  bobby_pin: 25,
  stimpak: 250,
  mentats: 300,
  holotape: 180,
  sarsaparilla: 90,
  probe_kit: 420,
};

function toast(msg: string | null) {
  if (!msg) return;
  useGame.setState((st) => ({ s: { ...st.s, toast: msg } }));
}

function ownedRow(item: Item, source: "vault" | "operative", owner: string, ownerId?: string): InventoryRow {
  return {
    key: `${source}:${ownerId ?? "vault"}:${item.id}`,
    source,
    name: item.name,
    kind: item.kind,
    rarity: item.rarity,
    condition: item.condition,
    effect: item.effect,
    lore: item.lore,
    value: item.value,
    owner,
    ownerId,
    item,
    equipped: !!item.equipped,
    classHint: item.classHint,
    damage: item.damage,
    defense: item.defense,
    sourceRegion: item.sourceRegion,
  };
}

export function InventoryView() {
  const s = useGame((g) => g.s);
  const equip = useGame((g) => g.equipItem);
  const stash = useGame((g) => g.stashItem);
  const take = useGame((g) => g.takeFromVault);
  const repair = useGame((g) => g.repairItem);
  const usePack = useGame((g) => g.usePack);

  const [mode, setMode] = useState<Mode>("owned");
  const [category, setCategory] = useState<InventoryCategory>("all");
  const [scope, setScope] = useState<InventoryScope>("all");
  const [sort, setSort] = useState<InventorySort>("rarity");
  const [query, setQuery] = useState("");
  const [equippedOnly, setEquippedOnly] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const idle = s.operatives.filter((o) => o.status === "idle" && o.hp > 0);
  const [targetOp, setTargetOp] = useState<string>("");

  const owned = useMemo<InventoryRow[]>(() => {
    const rows: InventoryRow[] = [
      ...s.vault.map((item) => ownedRow(item, "vault", "Vault 13")),
      ...s.operatives.flatMap((op) =>
        op.inventory.map((item) => ownedRow(item, "operative", op.name, op.id)),
      ),
    ];
    for (const key of PACK_KEYS) {
      const quantity = s.pack?.[key] ?? 0;
      if (quantity <= 0) continue;
      const def = PACK_CATALOG[key];
      rows.push({
        key: `pack:${key}`,
        source: "pack",
        name: def.name,
        kind: PACK_KIND[key],
        rarity: def.rarity,
        effect: def.use,
        lore: def.blurb,
        value: PACK_VALUE[key],
        owner: "Vault 13 supply pack",
        packKey: key,
        quantity,
      });
    }
    return rows;
  }, [s.vault, s.operatives, s.pack]);

  const catalogue = useMemo<InventoryRow[]>(() => {
    const rows: InventoryRow[] = [];
    for (const w of WEAPONS) {
      rows.push({
        key: `catalogue:weapon:${w.name}`,
        source: "catalogue",
        name: w.name,
        kind: "weapon",
        rarity: w.rarity,
        effect: w.effect,
        lore: w.lore,
        value: w.value,
        owner: "Field catalogue",
        classHint: w.cls,
        damage: w.damage,
      });
    }
    for (const a of ARMOR) {
      rows.push({
        key: `catalogue:armor:${a.name}`,
        source: "catalogue",
        name: a.name,
        kind: "armor",
        rarity: a.rarity,
        effect: a.effect,
        lore: "Recorded Vault 13 armor pattern.",
        value: a.value,
        owner: "Field catalogue",
        classHint: a.cls,
        defense: a.defense,
      });
    }
    for (const tier of Object.values(LEDGER_POOLS)) {
      for (const o of tier) {
        rows.push({
          key: `catalogue:exchange:${o.name}`,
          source: "catalogue",
          name: o.name,
          kind: o.kind,
          rarity: o.rarity,
          effect: o.effect,
          lore: "Quartermaster Exchange stock record.",
          value: o.price,
          owner: "Exchange catalogue",
        });
      }
    }
    for (const key of PACK_KEYS) {
      const def = PACK_CATALOG[key];
      rows.push({
        key: `catalogue:pack:${key}`,
        source: "catalogue",
        name: def.name,
        kind: PACK_KIND[key],
        rarity: def.rarity,
        effect: def.use,
        lore: def.blurb,
        value: PACK_VALUE[key],
        owner: "Supply catalogue",
      });
    }
    for (const x of HOLLOW_CATALOG) {
      rows.push({
        key: `catalogue:hollow:${x.sourceRegion}:${x.name}`,
        source: "catalogue",
        name: x.name,
        kind: x.kind,
        rarity: x.rarity,
        effect: x.effect,
        lore: x.lore,
        value: x.value,
        owner: `${regionById(x.sourceRegion).name} field record`,
        classHint: x.classHint,
        damage: x.damage,
        defense: x.defense,
        sourceRegion: x.sourceRegion,
      });
    }

    const seen = new Set<string>();
    return rows.filter((row) => {
      const key = `${row.kind}:${row.name.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, []);

  const base = mode === "owned" ? owned : catalogue;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = base.filter((row) => {
      if (category !== "all" && row.kind !== category) return false;
      if (mode === "owned") {
        if (scope === "vault" && row.source !== "vault" && row.source !== "pack") return false;
        if (scope === "operatives" && row.source !== "operative") return false;
        if (equippedOnly && !row.equipped) return false;
      }
      if (!q) return true;
      const classText = row.classHint ? classLabel(row.classHint) : "";
      const regionText = row.sourceRegion ? regionById(row.sourceRegion).name : "";
      return [row.name, row.effect, row.lore, row.owner, row.kind, row.rarity, classText, regionText]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
    return rows.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "value") return b.value - a.value;
      if (sort === "owner") return a.owner.localeCompare(b.owner) || a.name.localeCompare(b.name);
      if (sort === "condition") {
        return (CONDITION_RANK[b.condition ?? "Pristine"] ?? 0) - (CONDITION_RANK[a.condition ?? "Pristine"] ?? 0);
      }
      return RARITY_RANK[b.rarity] - RARITY_RANK[a.rarity] || b.value - a.value;
    });
  }, [base, category, equippedOnly, mode, query, scope, sort]);

  const selected = filtered.find((row) => row.key === selectedKey) ?? base.find((row) => row.key === selectedKey) ?? null;
  const actualCount = s.vault.length + s.operatives.reduce((n, op) => n + op.inventory.length, 0);
  const packCount = PACK_KEYS.reduce((n, key) => n + (s.pack?.[key] ?? 0), 0);

  const choose = (row: InventoryRow) => {
    setSelectedKey(row.key);
    if (row.source === "vault" && idle.length) setTargetOp((current) => current || idle[0]!.id);
  };

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <SectionLabel>Vault 13 · stores</SectionLabel>
          <h2 className="font-display text-2xl">Inventory</h2>
          <p className="mt-1 text-sm text-muted">
            {actualCount} gear pieces · {packCount} supply items · {catalogue.length} known catalogue records
          </p>
        </div>
        <div className="hidden text-right sm:block">
          <p className="font-display text-[10px] uppercase tracking-[0.18em] text-ember">Hollow Realm</p>
          <p className="text-xs text-muted">Every pocket. One screen.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setMode("owned")}
          className={cn(
            "min-h-12 rounded-[var(--radius-md)] border px-3 text-left",
            mode === "owned" ? "border-ember bg-ember/10 text-paper" : "border-line bg-raised text-muted",
          )}
        >
          <span className="block font-display text-xs uppercase tracking-[0.14em]">🎒 Owned</span>
          <span className="mt-0.5 block text-[11px]">Vault + every resident</span>
        </button>
        <button
          type="button"
          onClick={() => setMode("catalogue")}
          className={cn(
            "min-h-12 rounded-[var(--radius-md)] border px-3 text-left",
            mode === "catalogue" ? "border-ember bg-ember/10 text-paper" : "border-line bg-raised text-muted",
          )}
        >
          <span className="block font-display text-xs uppercase tracking-[0.14em]">📚 Catalogue</span>
          <span className="mt-0.5 block text-[11px]">Known Hollow Realm loot</span>
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((id) => {
          const p = id === "all" ? { emoji: "🧰", plural: "All" } : ITEM_KIND_PRESENTATION[id];
          const count = base.filter((row) => id === "all" || row.kind === id).length;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setCategory(id)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-2 font-display text-[10px] uppercase tracking-[0.12em]",
                category === id ? "border-ember bg-ember/15 text-ember-bright" : "border-line bg-ink/60 text-muted",
              )}
            >
              {p.emoji} {p.plural} · {count}
            </button>
          );
        })}
      </div>

      <Panel className="bg-raised p-3 md:p-4">
        <div className="flex flex-col gap-2 md:flex-row">
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search item, effect, class, region or owner"
              className="min-h-11 w-full rounded-[var(--radius-sm)] bg-ink pl-10 pr-3 text-sm text-paper shadow-[var(--shadow-border)] outline-none"
            />
          </label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as InventorySort)}
            className="min-h-11 rounded-[var(--radius-sm)] bg-ink px-3 text-sm text-paper shadow-[var(--shadow-border)] outline-none"
            aria-label="Sort inventory"
          >
            <option value="rarity">Rarity</option>
            <option value="name">Name</option>
            <option value="value">Value</option>
            <option value="condition">Condition</option>
            <option value="owner">Owner</option>
          </select>
        </div>
        {mode === "owned" ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {(["all", "vault", "operatives"] as InventoryScope[]).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setScope(id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs capitalize",
                  scope === id ? "border-moon bg-moon/10 text-paper" : "border-line text-muted",
                )}
              >
                {id === "vault" ? "Vault 13" : id === "operatives" ? "Residents" : "Everyone"}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setEquippedOnly((v) => !v)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs",
                equippedOnly ? "border-ok bg-ok/10 text-ok" : "border-line text-muted",
              )}
            >
              {equippedOnly ? <Check className="mr-1 inline size-3" /> : null} Equipped only
            </button>
          </div>
        ) : null}
      </Panel>

      {filtered.length === 0 ? (
        <Panel>
          <p className="text-sm text-muted">Nothing matches those filters.</p>
        </Panel>
      ) : (
        <div className="grid gap-2 md:grid-cols-2">
          {filtered.map((row) => {
            const classMeta = row.classHint ? CLASS_PRESENTATION[row.classHint] : null;
            return (
              <button
                key={row.key}
                type="button"
                onClick={() => choose(row)}
                className="group flex min-h-[7.5rem] items-start gap-3 rounded-[var(--radius-lg)] border border-line/80 bg-raised p-3 text-left shadow-[var(--shadow-border)] transition-[border-color,transform] hover:border-ember/55 active:scale-[0.99]"
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-ink text-2xl shadow-[inset_0_0_0_1px_var(--color-line)]">
                  {itemEmoji(row.kind)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-2">
                    <span className="min-w-0">
                      <span className="block truncate font-display text-sm text-paper">{row.name}</span>
                      <span className="mt-0.5 block text-[11px] text-muted">
                        {ITEM_KIND_PRESENTATION[row.kind].label}
                        {row.condition ? ` · ${row.condition}` : ""}
                        {row.equipped ? " · EQUIPPED" : ""}
                      </span>
                    </span>
                    <RarityMark rarity={row.rarity} />
                  </span>
                  <span className="mt-2 line-clamp-2 block text-xs leading-relaxed text-moon">{row.effect}</span>
                  <span className="mt-2 flex items-center justify-between gap-2 text-[11px] text-muted">
                    <span className="truncate">
                      {row.source === "catalogue" ? row.owner : `📍 ${row.owner}`}
                      {classMeta ? ` · ${classMeta.emoji} ${classMeta.name}` : ""}
                    </span>
                    {row.quantity && row.quantity > 1 ? <span className="font-display text-ember">×{row.quantity}</span> : null}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {selected ? (
        <div className="fixed inset-0 z-[70] flex items-end bg-ink/70 p-3 backdrop-blur-sm md:items-center md:justify-center" onClick={() => setSelectedKey(null)}>
          <div
            className="ms-pop max-h-[88vh] w-full overflow-y-auto rounded-[var(--radius-xl)] border border-line bg-surface p-5 shadow-2xl md:max-w-lg ms-scroll"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-ink text-3xl shadow-[inset_0_0_0_1px_var(--color-line)]">
                {itemEmoji(selected.kind)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-[10px] uppercase tracking-[0.18em] text-ember">
                      {ITEM_KIND_PRESENTATION[selected.kind].label}
                    </p>
                    <h3 className="font-display text-xl text-paper">{selected.name}</h3>
                  </div>
                  <button type="button" onClick={() => setSelectedKey(null)} className="flex size-10 items-center justify-center rounded-full border border-line text-muted">
                    <X className="size-4" />
                  </button>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <RarityMark rarity={selected.rarity} />
                  {selected.condition ? <span className="text-xs text-muted">{selected.condition}</span> : null}
                  {selected.equipped ? <span className="font-display text-[10px] uppercase tracking-wider text-ok">Equipped</span> : null}
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              {selected.damage ? <Detail label="Damage" value={selected.damage} /> : null}
              {selected.defense ? <Detail label="Defense" value={`+${selected.defense}`} /> : null}
              <Detail label="Value" value={<Coin n={selected.value} />} />
              <Detail label="Location" value={selected.owner} />
              {selected.quantity ? <Detail label="Quantity" value={`×${selected.quantity}`} /> : null}
              {selected.classHint ? <Detail label="Best fit" value={classLabel(selected.classHint)} /> : null}
              {selected.sourceRegion ? <Detail label="Origin" value={regionById(selected.sourceRegion).name} /> : null}
            </div>

            <Panel className="mt-4 bg-raised p-3">
              <SectionLabel>Effect</SectionLabel>
              <p className="text-sm leading-relaxed text-paper">{selected.effect}</p>
              <p className="mt-3 text-sm italic leading-relaxed text-moon">{selected.lore}</p>
            </Panel>

            {selected.source === "operative" && selected.item && selected.ownerId ? (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {selected.item.slot ? (
                  <Button variant={selected.equipped ? "quiet" : "ember"} onClick={() => equip(selected.ownerId!, selected.item!.id)}>
                    {selected.equipped ? "Unequip" : "Equip"}
                  </Button>
                ) : null}
                <Button variant="ghost" onClick={() => toast(repair(selected.ownerId!, selected.item!.id))}>
                  <Wrench className="size-4" /> Repair
                </Button>
                <Button
                  variant="quiet"
                  className="col-span-2"
                  disabled={selected.equipped}
                  onClick={() => {
                    const msg = stash(selected.ownerId!, selected.item!.id);
                    toast(msg);
                    if (!msg) setSelectedKey(null);
                  }}
                >
                  <Archive className="size-4" /> Move to Vault 13
                </Button>
              </div>
            ) : null}

            {selected.source === "vault" && selected.item ? (
              <div className="mt-4 space-y-2">
                {idle.length ? (
                  <select
                    value={targetOp || idle[0]?.id || ""}
                    onChange={(e) => setTargetOp(e.target.value)}
                    className="min-h-11 w-full rounded-[var(--radius-sm)] bg-ink px-3 text-sm text-paper shadow-[var(--shadow-border)] outline-none"
                  >
                    {idle.map((op) => (
                      <option key={op.id} value={op.id}>
                        {op.name} · {classLabel(op.cls)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-muted">No healthy resident is currently idle at Vault 13.</p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="ghost" onClick={() => toast(repair("vault", selected.item!.id))}>
                    <Wrench className="size-4" /> Repair
                  </Button>
                  <Button
                    variant="ember"
                    disabled={!idle.length}
                    onClick={() => {
                      const id = targetOp || idle[0]?.id;
                      if (!id) return;
                      const msg = take(id, selected.item!.id);
                      toast(msg);
                      if (!msg) setSelectedKey(null);
                    }}
                  >
                    <UserRound className="size-4" /> Issue gear
                  </Button>
                </div>
              </div>
            ) : null}

            {selected.source === "pack" && selected.packKey ? (
              <Button
                className="mt-4 w-full"
                variant="ember"
                onClick={() => {
                  const msg = usePack(selected.packKey!);
                  toast(msg);
                  if (!msg) setSelectedKey(null);
                }}
              >
                Use {selected.name}
              </Button>
            ) : null}

            {selected.source === "catalogue" ? (
              <p className="mt-4 rounded-[var(--radius-md)] border border-line bg-ink/50 px-3 py-3 text-sm text-muted">
                📚 Catalogue record only. Find, buy or recover this item in Hollow Realm before it appears under Owned.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-md)] bg-ink px-3 py-2">
      <div className="font-display text-[9px] uppercase tracking-[0.16em] text-muted">{label}</div>
      <div className="mt-0.5 truncate text-sm text-paper">{value}</div>
    </div>
  );
}
