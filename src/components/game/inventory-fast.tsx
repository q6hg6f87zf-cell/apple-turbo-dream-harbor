import { Button } from "@/components/ui/button";
import { ARMOR, LEDGER_POOLS, WEAPONS, regionById } from "@/game/data";
import { cloneState } from "@/game/engine";
import { HOLLOW_CATALOG } from "@/game/hollow-catalog";
import { attachEnchantment, supportedConsumableSummary, useConsumable, type ItemSource } from "@/game/inventory-ops";
import { PACK_CATALOG, PACK_KEYS } from "@/game/inventory";
import { CLASS_PRESENTATION, ITEM_KIND_PRESENTATION, classLabel, itemEmoji } from "@/game/presentation";
import { grantItemMastery, previewItem, residentProgress, residentPower } from "@/game/resident-progression";
import { useGame } from "@/game/store";
import type {
  ClassName,
  Condition,
  InventoryCategory,
  Item,
  ItemKind,
  Operative,
  PackKey,
  Rarity,
  RegionId,
} from "@/game/types";
import { cn } from "@/lib/cn";
import {
  Archive,
  Check,
  CircleHelp,
  PackageCheck,
  Search,
  Sparkles,
  UserRound,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Coin, Panel, RarityMark, SectionLabel } from "./primitives";

type Mode = "owned" | "catalogue";
type Source = "vault" | "operative" | "pack" | "catalogue";
type HelpMode = "explain" | "fit" | "action";

type Row = {
  key: string;
  source: Source;
  name: string;
  kind: ItemKind;
  rarity: Rarity;
  value: number;
  effect: string;
  lore: string;
  owner: string;
  ownerId?: string;
  item?: Item;
  packKey?: PackKey;
  quantity?: number;
  classHint?: ClassName;
  sourceRegion?: RegionId;
};

const CATEGORIES: InventoryCategory[] = ["all", "weapon", "armor", "trinket", "consumable", "enchantment", "material", "special"];
const RARITY_RANK: Record<Rarity, number> = { Common: 0, Uncommon: 1, Rare: 2, Legendary: 3, Mythic: 4, Cursed: 5 };
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

function rowFromItem(item: Item, source: "vault" | "operative", owner: string, ownerId?: string): Row {
  return {
    key: `${source}:${ownerId ?? "vault"}:${item.id}`,
    source,
    name: item.name,
    kind: item.kind,
    rarity: item.rarity,
    value: item.value,
    effect: item.effect,
    lore: item.lore,
    owner,
    ownerId,
    item,
    classHint: item.classHint,
    sourceRegion: item.sourceRegion,
  };
}

function setToast(message: string) {
  useGame.setState((store) => ({ s: { ...store.s, toast: message } }));
}

function mutateGame(fn: (state: ReturnType<typeof useGame.getState>["s"]) => string) {
  let message = "";
  useGame.setState((store) => {
    const state = cloneState(store.s);
    message = fn(state);
    state.toast = message;
    return { s: state };
  });
  return message;
}

function sourceFor(row: Row): ItemSource | null {
  if (row.source === "vault") return { kind: "vault" };
  if (row.source === "operative" && row.ownerId) return { kind: "operative", opId: row.ownerId };
  return null;
}

function tyroneCopy(row: Row, target: Operative | null, mode: HelpMode) {
  const item = row.item;
  if (mode === "fit") {
    if (!target) return "Pick a resident first, partner. I cannot compare steel to an empty bunk.";
    if (!item) return "Catalogue entries are reference only. Bring the real thing home and I will score the fit.";
    if (!item.classHint) return `${row.name} is universal kit. ${target.name} can use it without fighting the design.`;
    const meta = CLASS_PRESENTATION[item.classHint];
    return item.classHint === target.cls
      ? `${row.name} was built for ${meta.emoji} ${meta.name}. ${target.name} is the right set of hands.`
      : `${row.name} favors ${meta.emoji} ${meta.name}. ${target.name} can still carry it, but the fit is not ideal.`;
  }
  if (mode === "action") {
    if (row.kind === "weapon" || row.kind === "armor" || row.kind === "trinket") return "Preview the power change, then Equip. If it is in Vault 13, Issue & Equip does both steps at once.";
    if (row.kind === "consumable") return item ? supportedConsumableSummary(item) : "Consumables are one-use tools. Pick who needs it before burning the dose.";
    if (row.kind === "enchantment") return "Enchantments are not worn by themselves. Pick a resident, choose one piece of gear, then Attach. The enchantment is consumed into that item.";
    if (row.kind === "material") return "Material stays in Vault 13. Expansion Protocol consumes the right regional stock automatically when you build.";
    return "Special items are keys, relics, records or future system pieces. Keep them unless a screen specifically asks for one.";
  }
  if (row.kind === "material") return `${row.name}. Construction stock, not pocket clutter. Its real value is what Vault 13 can build with it.`;
  if (row.kind === "special") return `${row.name}. Keep this one tagged. Special means a door, story, boss chain or late system may care about it.`;
  return `${row.name}. ${row.effect} I care about three things: who uses it, what it replaces, and whether the power gain is worth the slot.`;
}

function powerTone(delta: number) {
  if (delta > 0) return "text-ok";
  if (delta < 0) return "text-danger";
  return "text-muted";
}

export function InventoryFast() {
  const state = useGame((g) => g.s);
  const equip = useGame((g) => g.equipItem);
  const take = useGame((g) => g.takeFromVault);
  const stash = useGame((g) => g.stashItem);
  const repair = useGame((g) => g.repairItem);
  const usePack = useGame((g) => g.usePack);

  const [mode, setMode] = useState<Mode>("owned");
  const [category, setCategory] = useState<InventoryCategory>("all");
  const [query, setQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [targetOpId, setTargetOpId] = useState("");
  const [targetGearId, setTargetGearId] = useState("");
  const [helpMode, setHelpMode] = useState<HelpMode | null>(null);

  const residents = state.operatives.filter((op) => op.status !== "dead" && op.location === "hq");

  const owned = useMemo<Row[]>(() => {
    const rows = [
      ...state.vault.map((item) => rowFromItem(item, "vault", "Vault 13")),
      ...state.operatives.flatMap((op) => op.inventory.map((item) => rowFromItem(item, "operative", op.name, op.id))),
    ];
    for (const key of PACK_KEYS) {
      const quantity = state.pack?.[key] ?? 0;
      if (!quantity) continue;
      const def = PACK_CATALOG[key];
      rows.push({
        key: `pack:${key}`,
        source: "pack",
        name: def.name,
        kind: PACK_KIND[key],
        rarity: def.rarity,
        value: PACK_VALUE[key],
        effect: def.use,
        lore: def.blurb,
        owner: "Vault 13 supply",
        packKey: key,
        quantity,
      });
    }
    return rows;
  }, [state.vault, state.operatives, state.pack]);

  const catalogue = useMemo<Row[]>(() => {
    const rows: Row[] = [];
    for (const w of WEAPONS) rows.push({ key: `cw:${w.name}`, source: "catalogue", name: w.name, kind: "weapon", rarity: w.rarity, value: w.value, effect: w.effect, lore: w.lore, owner: "Field catalogue", classHint: w.cls });
    for (const a of ARMOR) rows.push({ key: `ca:${a.name}`, source: "catalogue", name: a.name, kind: "armor", rarity: a.rarity, value: a.value, effect: a.effect, lore: "Vault 13 armor record.", owner: "Field catalogue", classHint: a.cls });
    for (const tier of Object.values(LEDGER_POOLS)) {
      for (const x of tier) rows.push({ key: `cl:${x.name}`, source: "catalogue", name: x.name, kind: x.kind, rarity: x.rarity, value: x.price, effect: x.effect, lore: "Quartermaster Exchange record.", owner: "Exchange catalogue" });
    }
    for (const x of HOLLOW_CATALOG) rows.push({ key: `ch:${x.sourceRegion}:${x.name}`, source: "catalogue", name: x.name, kind: x.kind, rarity: x.rarity, value: x.value, effect: x.effect, lore: x.lore, owner: `${regionById(x.sourceRegion).name} record`, classHint: x.classHint, sourceRegion: x.sourceRegion });
    const seen = new Set<string>();
    return rows.filter((row) => {
      const id = `${row.kind}:${row.name.toLowerCase()}`;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, []);

  const base = mode === "owned" ? owned : catalogue;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return base
      .filter((row) => {
        if (category !== "all" && row.kind !== category) return false;
        if (!q) return true;
        return [row.name, row.effect, row.owner, row.rarity, row.kind, row.classHint ? classLabel(row.classHint) : "", row.sourceRegion ? regionById(row.sourceRegion).name : ""]
          .join(" ")
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => RARITY_RANK[b.rarity] - RARITY_RANK[a.rarity] || b.value - a.value);
  }, [base, category, query]);

  const selected = base.find((row) => row.key === selectedKey) ?? null;
  const selectedOwner = selected?.ownerId ? state.operatives.find((op) => op.id === selected.ownerId) ?? null : null;
  const selectedTargetId = selected?.source === "operative" ? selected.ownerId ?? "" : targetOpId || residents[0]?.id || "";
  const target = state.operatives.find((op) => op.id === selectedTargetId) ?? selectedOwner;
  const preview = selected?.item && target ? previewItem(target, selected.item) : null;
  const targetGear = target?.inventory.filter((item) => !!item.slot) ?? [];
  const resolvedTargetGearId = targetGearId && targetGear.some((item) => item.id === targetGearId) ? targetGearId : targetGear[0]?.id ?? "";

  const choose = (row: Row) => {
    setSelectedKey(row.key);
    setHelpMode(null);
    setTargetGearId("");
    if (row.source === "vault" && residents.length) setTargetOpId((current) => current || residents[0]!.id);
  };

  const awardMastery = (opId: string, itemId: string) => {
    mutateGame((next) => {
      const op = next.operatives.find((x) => x.id === opId);
      const item = op?.inventory.find((x) => x.id === itemId);
      if (!op || !item) return "Gear equipped.";
      const mastery = grantItemMastery(op, item);
      if (!mastery.xp) return `${item.name} equipped.`;
      return mastery.after > mastery.before
        ? `${item.name} equipped · +${mastery.xp} mastery XP · Level ${mastery.before} → ${mastery.after}.`
        : `${item.name} equipped · +${mastery.xp} mastery XP.`;
    });
  };

  const issueAndEquip = (opId: string, item: Item) => {
    const msg = take(opId, item.id);
    if (msg) return setToast(msg);
    equip(opId, item.id);
    awardMastery(opId, item.id);
    setSelectedKey(null);
  };

  const useNormalConsumable = (row: Row, opId: string) => {
    if (!row.item) return;
    const source = sourceFor(row);
    if (!source) return;
    mutateGame((next) => useConsumable(next, source, row.item!.id, opId) ?? `${row.name} used.`);
    setSelectedKey(null);
  };

  const attach = (row: Row, opId: string, gearId: string) => {
    if (!row.item) return;
    const source = sourceFor(row);
    if (!source) return;
    mutateGame((next) => attachEnchantment(next, source, row.item!.id, opId, gearId) ?? `${row.name} attached.`);
    setSelectedKey(null);
  };

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-end justify-between gap-3">
        <div>
          <SectionLabel>Vault 13 · quick loadout</SectionLabel>
          <h2 className="font-display text-2xl">Inventory</h2>
          <p className="mt-1 text-sm text-muted">Tap item → preview → act. No crate-diving required.</p>
        </div>
        <button type="button" onClick={() => setHelpMode("explain")} className="flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] border border-ember/40 bg-ember/10 px-3 font-display text-[10px] uppercase tracking-[0.13em] text-ember">
          <CircleHelp className="size-4" /> Tyrone
        </button>
      </div>

      {helpMode && !selected ? (
        <TyronePanel text="Inventory is simple: Owned is what Vault 13 actually has. Catalogue is what we know exists. Tap gear to compare it against a resident before you equip anything. Materials stay in the Vault. Enchantments attach to gear. Consumables disappear when used. I put the important button at the bottom." onClose={() => setHelpMode(null)} />
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <ModeButton active={mode === "owned"} onClick={() => setMode("owned")} title="🎒 Owned" sub={`${owned.length} items in play`} />
        <ModeButton active={mode === "catalogue"} onClick={() => setMode("catalogue")} title="📚 Catalogue" sub={`${catalogue.length} known records`} />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((id) => {
          const meta = id === "all" ? { emoji: "🧰", plural: "All" } : ITEM_KIND_PRESENTATION[id];
          return (
            <button key={id} type="button" onClick={() => setCategory(id)} className={cn("shrink-0 rounded-full border px-3 py-2 font-display text-[10px] uppercase tracking-[0.11em]", category === id ? "border-ember bg-ember/15 text-ember" : "border-line bg-ink/60 text-muted")}>{meta.emoji} {meta.plural}</button>
          );
        })}
      </div>

      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search gear, effect, class, region..." className="min-h-12 w-full rounded-[var(--radius-md)] bg-raised pl-10 pr-3 text-sm text-paper shadow-[var(--shadow-border)] outline-none" />
      </label>

      <div className="grid gap-2 md:grid-cols-2">
        {filtered.map((row) => {
          const equipped = !!row.item?.equipped;
          return (
            <button key={row.key} type="button" onClick={() => choose(row)} className="flex min-h-[6.5rem] items-start gap-3 rounded-[var(--radius-lg)] border border-line/80 bg-raised p-3 text-left shadow-[var(--shadow-border)] transition active:scale-[0.99] hover:border-ember/50">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-ink text-2xl shadow-[inset_0_0_0_1px_var(--color-line)]">{itemEmoji(row.kind)}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-2"><span className="truncate font-display text-sm text-paper">{row.name}</span><RarityMark rarity={row.rarity} /></span>
                <span className="mt-1 block line-clamp-2 text-xs leading-relaxed text-moon">{row.effect}</span>
                <span className="mt-2 flex items-center justify-between gap-2 text-[11px] text-muted"><span className="truncate">{row.owner}{equipped ? " · EQUIPPED" : ""}</span>{row.quantity && row.quantity > 1 ? <span className="text-ember">×{row.quantity}</span> : null}</span>
              </span>
            </button>
          );
        })}
      </div>

      {!filtered.length ? <Panel><p className="text-sm text-muted">Nothing matches. Tyrone recommends fewer filters and more scavenging.</p></Panel> : null}

      {selected ? (
        <div className="fixed inset-0 z-[70] flex items-end bg-ink/75 p-3 backdrop-blur-sm md:items-center md:justify-center" onClick={() => setSelectedKey(null)}>
          <div className="ms-pop max-h-[90vh] w-full overflow-y-auto rounded-[var(--radius-xl)] border border-line bg-surface p-4 shadow-2xl md:max-w-xl md:p-5 ms-scroll" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-ink text-3xl shadow-[inset_0_0_0_1px_var(--color-line)]">{itemEmoji(selected.kind)}</span>
              <div className="min-w-0 flex-1"><SectionLabel>{ITEM_KIND_PRESENTATION[selected.kind].label}</SectionLabel><h3 className="font-display text-xl text-paper">{selected.name}</h3><div className="mt-1 flex items-center gap-2"><RarityMark rarity={selected.rarity} />{selected.item?.condition ? <span className="text-xs text-muted">{selected.item.condition}</span> : null}{selected.item?.equipped ? <span className="text-[10px] font-display uppercase text-ok">Equipped</span> : null}</div></div>
              <button type="button" onClick={() => setSelectedKey(null)} className="flex size-10 items-center justify-center rounded-full border border-line text-muted"><X className="size-4" /></button>
            </div>

            <Panel className="mt-4 bg-raised p-3"><p className="text-sm leading-relaxed text-paper">{selected.effect}</p><p className="mt-2 text-xs italic leading-relaxed text-moon">{selected.lore}</p></Panel>

            {selected.source !== "catalogue" && selected.source !== "pack" && residents.length && selected.source !== "operative" ? (
              <select value={selectedTargetId} onChange={(e) => { setTargetOpId(e.target.value); setTargetGearId(""); }} className="mt-4 min-h-12 w-full rounded-[var(--radius-sm)] bg-ink px-3 text-sm text-paper shadow-[var(--shadow-border)] outline-none">
                {residents.map((op) => <option key={op.id} value={op.id}>{op.name} · {classLabel(op.cls)} · Lv {residentProgress(op).level}</option>)}
              </select>
            ) : null}

            {target && selected.item ? (
              <div className="mt-3 grid grid-cols-3 gap-2">
                <Metric label="Resident" value={`${target.name} · Lv ${preview?.currentLevel ?? 1}${preview && preview.projectedLevel > preview.currentLevel ? ` → ${preview.projectedLevel}` : ""}`} />
                <Metric label="Power" value={<span className={powerTone(preview?.powerDelta ?? 0)}>{preview?.currentPower ?? residentPower(target)}{preview?.powerDelta ? ` → ${preview.projectedPower}` : ""}</span>} />
                <Metric label="Mastery" value={preview?.masteryXp ? `+${preview.masteryXp} XP` : "Known"} />
              </div>
            ) : null}

            {preview?.replaced ? <p className="mt-2 rounded-[var(--radius-sm)] border border-line/70 bg-ink/45 px-3 py-2 text-xs text-muted">Replaces <span className="text-paper">{preview.replaced.name}</span> · power {preview.powerDelta >= 0 ? "+" : ""}{preview.powerDelta}</p> : null}

            {selected.kind === "enchantment" && target ? (
              <div className="mt-3">
                <SectionLabel>Attach to</SectionLabel>
                {targetGear.length ? <select value={resolvedTargetGearId} onChange={(e) => setTargetGearId(e.target.value)} className="min-h-12 w-full rounded-[var(--radius-sm)] bg-ink px-3 text-sm text-paper shadow-[var(--shadow-border)] outline-none">{targetGear.map((item) => <option key={item.id} value={item.id}>{item.name}{item.equipped ? " · equipped" : ""}</option>)}</select> : <p className="text-sm text-muted">This resident needs weapon, armor, or trinket gear first.</p>}
              </div>
            ) : null}

            {helpMode ? <div className="mt-3"><TyronePanel text={tyroneCopy(selected, target ?? null, helpMode)} onClose={() => setHelpMode(null)} /></div> : null}
            <div className="mt-3 grid grid-cols-3 gap-2">
              <HelpButton active={helpMode === "explain"} onClick={() => setHelpMode("explain")}>Explain</HelpButton>
              <HelpButton active={helpMode === "fit"} onClick={() => setHelpMode("fit")}>Best fit</HelpButton>
              <HelpButton active={helpMode === "action"} onClick={() => setHelpMode("action")}>How to use</HelpButton>
            </div>

            <div className="mt-4 space-y-2">
              {selected.source === "operative" && selected.item?.slot && selected.ownerId ? (
                <Button variant={selected.item.equipped ? "quiet" : "ember"} className="w-full" onClick={() => { equip(selected.ownerId!, selected.item!.id); if (!selected.item!.equipped) awardMastery(selected.ownerId!, selected.item!.id); else setToast(`${selected.name} unequipped.`); setSelectedKey(null); }}>
                  {selected.item.equipped ? <><Check className="size-4" /> Unequip</> : <><Zap className="size-4" /> Equip</>}
                </Button>
              ) : null}

              {selected.source === "vault" && selected.item?.slot && target ? <Button variant="ember" className="w-full" onClick={() => issueAndEquip(target.id, selected.item!)}><PackageCheck className="size-4" /> Issue & Equip to {target.name}</Button> : null}

              {(selected.source === "vault" || selected.source === "operative") && selected.item?.kind === "consumable" && target ? <Button variant="ember" className="w-full" onClick={() => useNormalConsumable(selected, target.id)}><Zap className="size-4" /> Use on {target.name}</Button> : null}

              {(selected.source === "vault" || selected.source === "operative") && selected.item?.kind === "enchantment" && target && resolvedTargetGearId ? <Button variant="ember" className="w-full" onClick={() => attach(selected, target.id, resolvedTargetGearId)}><Sparkles className="size-4" /> Attach to gear</Button> : null}

              {selected.source === "pack" && selected.packKey ? <Button variant="ember" className="w-full" onClick={() => { const msg = usePack(selected.packKey!); if (msg) setToast(msg); setSelectedKey(null); }}><Zap className="size-4" /> Use {selected.name}</Button> : null}

              {(selected.source === "vault" || selected.source === "operative") && selected.item && selected.item.condition !== "Pristine" ? <Button variant="ghost" className="w-full" onClick={() => { const msg = repair(selected.source === "vault" ? "vault" : selected.ownerId!, selected.item!.id); if (msg) setToast(msg); }}><Wrench className="size-4" /> Repair</Button> : null}

              {selected.source === "operative" && selected.item && selected.ownerId && !selected.item.equipped ? <Button variant="quiet" className="w-full" onClick={() => { const msg = stash(selected.ownerId!, selected.item!.id); if (msg) setToast(msg); else { setToast(`${selected.name} moved to Vault 13.`); setSelectedKey(null); } }}><Archive className="size-4" /> Move to Vault 13</Button> : null}

              {(selected.kind === "material" || selected.kind === "special") && selected.source !== "catalogue" ? <div className="rounded-[var(--radius-md)] border border-line bg-ink/45 px-3 py-3 text-sm text-muted">{selected.kind === "material" ? "Stored. Vault 13 construction will consume this when the correct expansion asks for it." : "Key/relic item. Keep it until a system specifically requests it."}</div> : null}

              {selected.source === "catalogue" ? <div className="rounded-[var(--radius-md)] border border-line bg-ink/45 px-3 py-3 text-sm text-muted">Catalogue only. Find it in the Hollow Realm before Tyrone lets you touch the buttons.</div> : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ModeButton({ active, onClick, title, sub }: { active: boolean; onClick: () => void; title: string; sub: string }) {
  return <button type="button" onClick={onClick} className={cn("min-h-14 rounded-[var(--radius-md)] border px-3 text-left", active ? "border-ember bg-ember/10 text-paper" : "border-line bg-raised text-muted")}><span className="block font-display text-xs uppercase tracking-[0.13em]">{title}</span><span className="mt-0.5 block text-[11px]">{sub}</span></button>;
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-[var(--radius-sm)] bg-ink p-2.5"><p className="font-display text-[8px] uppercase tracking-[0.16em] text-muted">{label}</p><div className="mt-1 text-xs font-medium text-paper">{value}</div></div>;
}

function HelpButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={cn("min-h-10 rounded-[var(--radius-sm)] border px-2 font-display text-[9px] uppercase tracking-[0.1em]", active ? "border-ember bg-ember/10 text-ember" : "border-line text-muted")}>{children}</button>;
}

function TyronePanel({ text, onClose }: { text: string; onClose: () => void }) {
  return <div className="flex gap-3 rounded-[var(--radius-lg)] border border-ember/30 bg-ink/70 p-3"><img src="/art/tyrone.jpg" alt="" className="size-12 shrink-0 rounded-[var(--radius-sm)] object-cover" /><div className="min-w-0 flex-1"><p className="font-display text-[9px] uppercase tracking-[0.2em] text-ember">TyroneBot · quick help</p><p className="mt-1 text-sm leading-relaxed text-paper">{text}</p></div><button type="button" onClick={onClose} className="flex size-8 shrink-0 items-center justify-center text-muted"><X className="size-3.5" /></button></div>;
}
