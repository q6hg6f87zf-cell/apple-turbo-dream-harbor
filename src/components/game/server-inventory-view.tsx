import { Button } from "@/components/ui/button";
import { AUTHORITY_ITEM_CATALOG } from "@/game/authority-items";
import { CANONICAL_REGION_IDS, regionById } from "@/game/data";
import { cloneState } from "@/game/engine";
import { AMMO_GRADE_META, coupleFromWeapon, gradeFromLoad, gradeLabel, weaponDiceMod } from "@/game/ammo-matrix";
import {
  CALIBERS,
  INVENTORY_FILTERS,
  WEAPON_LANES,
  matchesCaliber,
  matchesInventoryCategory,
  matchesRegion,
  matchesWeaponLane,
  type WeaponLane,
} from "@/game/inventory-filters";
import { itemArt, itemThumbUrl, preloadItemArt } from "@/game/item-art";
import { ITEM_KIND_PRESENTATION, classLabel } from "@/game/presentation";
import { magLine } from "@/game/weapon-ops";
import { previewItem, residentProgress, type ActiveItemEffect, type ProgressiveOperative } from "@/game/resident-progression";
import {
  attachServerEnchantment,
  consumeServerItem,
  issueEquipServerItem,
  repairServerItem,
  setServerItemEquipped,
  stashServerItem,
} from "@/game/server-inventory";
import { useGame } from "@/game/store";
import type { AmmoType, InventoryCategory, Item, Operative, Rarity, RegionId } from "@/game/types";
import { cn } from "@/lib/cn";
import { Archive, Check, CircleHelp, Crosshair, PackageCheck, Search, Sparkles, Wrench, X, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ItemThumb } from "./item-thumb";
import { inventorySession, rememberInventory } from "@/game/inventory-session";
import { ItemInspectShell } from "./item-inspect";
import { ChipScroller, FilterChip, InventoryFrame, InventoryRow } from "./inventory-chrome";
import { Panel, RarityMark, SectionLabel } from "./primitives";

const SESSION_ID = "inventory-server";

type Mode = "owned" | "catalogue";
type Row = {
  key: string;
  item: Item;
  source: "vault" | "resident" | "catalogue";
  owner: string;
  residentId?: string;
};

const RARITY_RANK: Record<Rarity, number> = { Common: 0, Uncommon: 1, Rare: 2, Legendary: 3, Mythic: 4, Cursed: 5 };

function toast(message: string) {
  useGame.setState((store) => ({ s: { ...store.s, toast: message } }));
}

function refreshAuthority() {
  window.dispatchEvent(new Event("focus"));
}

function applyConsumableFieldEffect(item: Item, targetId: string) {
  useGame.setState((store) => {
    const s = cloneState(store.s);
    const index = s.operatives.findIndex((op) => op.id === targetId);
    if (index < 0) return store;
    const op = { ...s.operatives[index] } as ProgressiveOperative;
    const effect = item.effect.toLowerCase();
    const full = effect.includes("restore full hp");
    const healMatch = effect.match(/restore\s+(\d+)\s+hp/);
    const heal = healMatch ? Number(healMatch[1]) : 0;
    if (full) op.hp = op.maxHp;
    else if (heal > 0) op.hp = Math.min(op.maxHp, op.hp + heal);
    if (effect.includes("clear") && op.curses.length) op.curses = op.curses.slice(1);
    const temporary = /[+-]\s*\d+\s*(str|def|int|wis|spd|cha|lck|(?:weapon\s+)?damage)|ignore|resistance|immunity|prevent|bonus|penalt/i.test(item.effect);
    if (temporary) {
      const active: ActiveItemEffect = {
        name: item.name,
        effect: item.effect,
        expires: effect.includes("encounter") ? "encounter" : "sortie",
      };
      op.activeItemEffects = [...(op.activeItemEffects ?? []), active].slice(-6);
    }
    s.operatives[index] = op;
    return { s };
  });
}

function tyrone(item: Item, target: Operative | null) {
  if (item.kind === "material") return "Construction stock. Leave it in Vault 13. The server ledger will spend it only when an expansion actually calls for it.";
  if (item.kind === "special") return "Tagged relic or key item. Do not sell it to a machine with a blinking light just because the machine asked politely.";
  if (item.kind === "enchantment") return "Pick a resident and a compatible piece of gear. Attach consumes this physical instance. The server records the socket, so refreshing the browser cannot bring the coil back.";
  if (item.kind === "attachment") return "Optics, muzzles, barrels, mags, stocks, grips, receivers. Seat it on a firearm. One per slot. The server keeps the socket.";
  if (item.kind === "consumable") return item.ammoType ? `Ammunition. ${item.ammoCount ?? "?"} rounds of ${item.ammoType}. Issue it to the shooter. Do not drink it.` : "Use is permanent. The server consumes the item first, then I apply its field effect to the resident. Double taps cannot drink the same syringe twice.";
  if (!target) return "Pick a resident. I will compare the item against their live loadout before we move anything.";
  const fit = item.classHint ? (item.classHint === target.cls ? `Built for ${classLabel(target.cls)}.` : `Designed for ${classLabel(item.classHint)}, not ${classLabel(target.cls)}.`) : "Universal fit.";
  const p = previewItem(target, item);
  return `${fit} Power ${p.currentPower} → ${p.projectedPower}${p.powerDelta ? ` (${p.powerDelta > 0 ? "+" : ""}${p.powerDelta})` : ""}. ${p.replaced ? `Replaces ${p.replaced.name}.` : "Open slot."}`;
}

function chamberLine(item: Item): string | null {
  if (item.kind === "weapon" && item.weaponFamily !== "melee") return magLine(item);
  if (item.kind === "weapon" && item.ammoType) return `Chambers ${item.ammoType}`;
  if (item.kind === "consumable" && item.ammoType) {
    const grade = item.ammoGrade ?? gradeFromLoad(item.name);
    return `${item.ammoType} · ${gradeLabel(grade)}${item.ammoCount ? ` · ${item.ammoCount} rds` : ""}`;
  }
  return null;
}

export function ServerInventoryView() {
  const state = useGame((g) => g.s);
  const session = inventorySession(SESSION_ID);
  const [mode, setMode] = useState<Mode>(session.mode);
  const [category, setCategory] = useState<InventoryCategory>(session.category);
  const [lane, setLane] = useState<WeaponLane>(session.lane);
  const [caliber, setCaliber] = useState<AmmoType | "all">(session.caliber);
  const [region, setRegion] = useState<RegionId | "all">(session.region);
  const [query, setQuery] = useState(session.query);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [targetId, setTargetId] = useState("");
  const [targetGearId, setTargetGearId] = useState("");
  const [pending, setPending] = useState(false);
  const [help, setHelp] = useState(false);
  const showCaliber = category === "ammo";

  useEffect(() => {
    rememberInventory(SESSION_ID, { mode, category, lane, caliber, region, query });
  }, [mode, category, lane, caliber, region, query]);

  const residents = state.operatives.filter((op) => op.status !== "dead" && op.location === "hq");
  const owned = useMemo<Row[]>(() => [
    ...state.vault.map((item) => ({ key: `v:${item.id}`, item, source: "vault" as const, owner: "Vault 13" })),
    ...state.operatives.flatMap((op) => op.inventory.map((item) => ({ key: `r:${op.id}:${item.id}`, item, source: "resident" as const, owner: op.name, residentId: op.id }))),
  ], [state.vault, state.operatives]);

  useEffect(() => {
    preloadItemArt(
      owned.map((row) =>
        itemThumbUrl(
          itemArt({
            kind: row.item.kind,
            name: row.item.name,
            ammoType: row.item.ammoType,
            weaponFamily: row.item.weaponFamily,
          }),
        ),
      ),
    );
  }, [owned]);

  const catalogue = useMemo<Row[]>(() => AUTHORITY_ITEM_CATALOG.map((template) => ({
    key: `c:${template.key}`,
    source: "catalogue" as const,
    owner: template.sourceRegion ? `${regionById(template.sourceRegion).name} record` : "Vault 13 record",
    item: {
      id: `catalogue:${template.key}`,
      name: template.name,
      kind: template.kind,
      rarity: template.rarity,
      condition: "Pristine" as const,
      slot: template.slot,
      classHint: template.classHint,
      damage: template.damage,
      defense: template.defense,
      effect: template.effect,
      lore: template.lore,
      value: template.value,
      sourceRegion: template.sourceRegion,
      ammoType: template.ammoType,
      weaponFamily: template.weaponFamily,
      ammoCount: template.ammoCount,
      ammoGrade: template.ammoGrade ?? gradeFromLoad(template.name),
      mag: template.mag,
      magSize: template.magSize,
      ap: template.ap,
      accuracy: template.accuracy,
      rangeBand: template.rangeBand,
    },
  })), []);

  const base = mode === "owned" ? owned : catalogue;
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return base.filter((row) => {
      if (!matchesInventoryCategory(row.item.kind, row.item.ammoType, category)) return false;
      if (category === "weapon" && !matchesWeaponLane({ name: row.item.name, weaponFamily: row.item.weaponFamily, ammoType: row.item.ammoType }, lane)) return false;
      if (showCaliber && !matchesCaliber(row.item.ammoType, caliber)) return false;
      if (!matchesRegion(row.item.sourceRegion, region)) return false;
      if (!q) return true;
      return [row.item.name, row.item.effect, row.item.rarity, row.item.kind, row.owner, row.item.ammoType ?? "", row.item.classHint ? classLabel(row.item.classHint) : "", row.item.sourceRegion ? regionById(row.item.sourceRegion).name : ""].join(" ").toLowerCase().includes(q);
    }).sort((a, b) => RARITY_RANK[b.item.rarity] - RARITY_RANK[a.item.rarity] || b.item.value - a.item.value);
  }, [base, category, caliber, region, query, showCaliber, lane]);

  const selected = base.find((row) => row.key === selectedKey) ?? null;
  const owner = selected?.residentId ? state.operatives.find((op) => op.id === selected.residentId) ?? null : null;
  const resolvedTargetId = selected?.residentId ?? (targetId || residents[0]?.id || "");
  const target = state.operatives.find((op) => op.id === resolvedTargetId) ?? owner;
  const preview = selected && target && selected.source !== "catalogue" ? previewItem(target, selected.item) : null;
  const gear = target?.inventory.filter((item) => !!item.slot) ?? [];
  const guns = target?.inventory.filter((item) => item.kind === "weapon") ?? [];
  const attachPool = selected?.item.kind === "attachment" ? guns : gear;
  const resolvedGearId = targetGearId && attachPool.some((item) => item.id === targetGearId) ? targetGearId : attachPool[0]?.id ?? "";
  const couple = selected?.item.kind === "weapon" && selected.item.ammoType ? coupleFromWeapon(selected.item) : null;
  const diceHint = selected?.item.kind === "weapon" ? weaponDiceMod(selected.item, "STR") : 0;
  const selectedArt = selected
    ? itemArt({
        kind: selected.item.kind,
        name: selected.item.name,
        ammoType: selected.item.ammoType,
        weaponFamily: selected.item.weaponFamily,
      })
    : null;

  const act = async (work: () => Promise<unknown>, success: string, after?: () => void) => {
    if (pending) return;
    setPending(true);
    try {
      await work();
      after?.();
      toast(success);
      setSelectedKey(null);
      refreshAuthority();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Tyrone rejected that inventory order.");
    } finally {
      setPending(false);
    }
  };

  return (
    <InventoryFrame
      sessionId={SESSION_ID}
      header={
        <>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <SectionLabel>Vault 13 · server loadout</SectionLabel>
              <h2 className="font-display text-xl">Inventory</h2>
            </div>
            <button type="button" onClick={() => setHelp((v) => !v)} className="flex size-11 shrink-0 items-center justify-center rounded-full border border-ember/40 bg-ember/10 text-ember" aria-label="Ask Tyrone">
              <CircleHelp className="size-4" />
            </button>
          </div>

          {help ? <Panel className="border-ember/30 bg-ember/5"><div className="flex items-start gap-3"><img src="/art/tyrone.jpg" alt="" className="size-12 rounded-[var(--radius-sm)] object-cover" /><p className="flex-1 text-sm leading-relaxed text-moon">Owned is sealed on the server. Catalogue is the design record. Weapons split into rifles, melee, sidearms, shotguns, energy, heavy.</p><button type="button" onClick={() => setHelp(false)}><X className="size-4 text-muted" /></button></div></Panel> : null}

          <div className="grid grid-cols-2 gap-1 rounded-[var(--radius-md)] border border-line bg-ink/50 p-1">
            <button type="button" onClick={() => { setMode("owned"); setSelectedKey(null); }} className={cn("min-h-11 rounded-[var(--radius-sm)] px-3 text-left", mode === "owned" ? "bg-ember/15 text-paper" : "text-muted")}><span className="block font-display text-[10px] uppercase tracking-[0.13em]">Owned</span><span className="mt-0.5 block truncate text-[11px]">{owned.length} sealed</span></button>
            <button type="button" onClick={() => { setMode("catalogue"); setSelectedKey(null); }} className={cn("min-h-11 rounded-[var(--radius-sm)] px-3 text-left", mode === "catalogue" ? "bg-ember/15 text-paper" : "text-muted")}><span className="block font-display text-[10px] uppercase tracking-[0.13em]">Catalogue</span><span className="mt-0.5 block truncate text-[11px]">{catalogue.length} records</span></button>
          </div>

          <ChipScroller>
            {INVENTORY_FILTERS.map((chip) => (
              <FilterChip key={chip.id} active={category === chip.id} onClick={() => { setCategory(chip.id); if (chip.id !== "weapon") setLane("all"); if (chip.id !== "ammo") setCaliber("all"); }}>
                {chip.label}
              </FilterChip>
            ))}
          </ChipScroller>

          {category === "weapon" ? (
            <ChipScroller>
              {WEAPON_LANES.map((chip) => (
                <FilterChip key={chip.id} compact active={lane === chip.id} onClick={() => setLane(chip.id)}>
                  {chip.label}
                </FilterChip>
              ))}
            </ChipScroller>
          ) : null}

          {showCaliber ? (
            <ChipScroller>
              <FilterChip compact active={caliber === "all"} onClick={() => setCaliber("all")}>Any cartridge</FilterChip>
              {CALIBERS.map((id) => (
                <FilterChip key={id} compact active={caliber === id} onClick={() => setCaliber(id)}>{id}</FilterChip>
              ))}
            </ChipScroller>
          ) : null}

          <ChipScroller>
            <FilterChip compact active={region === "all"} onClick={() => setRegion("all")}>All continents</FilterChip>
            {CANONICAL_REGION_IDS.map((id) => {
              const def = regionById(id);
              return <FilterChip key={id} compact active={region === id} onClick={() => setRegion(id)}>{def.short} · {def.continent}</FilterChip>;
            })}
          </ChipScroller>

          <label className="flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-line bg-raised px-3"><Search className="size-4 text-muted" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search gear…" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted" /></label>
        </>
      }
    >
      <div className="space-y-1.5 pb-4">
        {rows.map((row) => {
          const chamber = chamberLine(row.item);
          return (
            <InventoryRow key={row.key} onOpen={() => { setSelectedKey(row.key); setHelp(false); setTargetGearId(""); if (!targetId && residents[0]) setTargetId(residents[0].id); }} className="flex min-h-14 w-full min-w-0 items-center gap-2.5 overflow-hidden rounded-[var(--radius-md)] bg-raised px-2.5 py-2 text-left shadow-[var(--shadow-border)]">
              <ItemThumb kind={row.item.kind} name={row.item.name} ammoType={row.item.ammoType} weaponFamily={row.item.weaponFamily} size="sm" />
              <div className="min-w-0 flex-1 overflow-hidden">
                <div className="flex min-w-0 items-center justify-between gap-2"><span className="min-w-0 truncate font-display text-sm">{row.item.name}</span><RarityMark rarity={row.item.rarity} /></div>
                {chamber ? <p className="min-w-0 truncate font-display text-[9px] uppercase tracking-[0.08em] text-ember">{chamber}</p> : null}
                <p className="truncate text-[10px] text-muted">{row.owner}{row.item.equipped ? " · Equipped" : ""}</p>
              </div>
            </InventoryRow>
          );
        })}
        {!rows.length ? <Panel><p className="text-sm text-muted">Nothing matches that filter.</p></Panel> : null}
      </div>

      {selected ? (
        <ItemInspectShell
          onClose={() => !pending && setSelectedKey(null)}
          heroSrc={selectedArt}
          hero={<ItemThumb kind={selected.item.kind} name={selected.item.name} ammoType={selected.item.ammoType} weaponFamily={selected.item.weaponFamily} size="hero" />}
          eyebrow={<SectionLabel>{selected.owner}</SectionLabel>}
          title={<h3 className="font-display text-xl">{selected.item.name}</h3>}
          badges={
            <>
              <RarityMark rarity={selected.item.rarity} />
              <span className="text-xs text-muted">{ITEM_KIND_PRESENTATION[selected.item.kind].label}</span>
              <span className="text-xs text-muted">{selected.item.condition}</span>
              {selected.item.classHint ? <span className="text-xs text-muted">{classLabel(selected.item.classHint)}</span> : null}
            </>
          }
          actions={
            selected.source !== "catalogue" ? (
              <>
                {selected.source === "vault" && selected.item.slot && target ? <Button variant="ember" className="w-full" disabled={pending} onClick={() => void act(() => issueEquipServerItem(selected.item.id, target.id), `${selected.item.name} issued and equipped to ${target.name}.`)}><PackageCheck className="size-4" /> Issue & Equip to {target.name}</Button> : null}
                {selected.source === "resident" && selected.item.slot ? <Button variant={selected.item.equipped ? "quiet" : "ember"} className="w-full" disabled={pending} onClick={() => void act(() => setServerItemEquipped(selected.item.id, !selected.item.equipped), `${selected.item.name} ${selected.item.equipped ? "unequipped" : "equipped"}.`)}>{selected.item.equipped ? <><Check className="size-4" /> Unequip</> : <><Zap className="size-4" /> Equip</>}</Button> : null}
                {selected.item.kind === "consumable" && target && !selected.item.ammoType ? <Button variant="ember" className="w-full" disabled={pending} onClick={() => void act(() => consumeServerItem(selected.item.id, target.id), `${selected.item.name} used on ${target.name}.`, () => applyConsumableFieldEffect(selected.item, target.id))}><Zap className="size-4" /> Use on {target.name}</Button> : null}
                {selected.item.kind === "enchantment" && target && resolvedGearId ? <Button variant="ember" className="w-full" disabled={pending} onClick={() => void act(() => attachServerEnchantment(selected.item.id, resolvedGearId, target.id), `${selected.item.name} fused into the selected gear.`)}><Sparkles className="size-4" /> Attach to gear</Button> : null}
                {selected.item.kind === "attachment" && target && resolvedGearId ? <Button variant="ember" className="w-full" disabled={pending} onClick={() => void act(() => attachServerEnchantment(selected.item.id, resolvedGearId, target.id), `${selected.item.name} seated on the firearm.`)}><Crosshair className="size-4" /> Seat on firearm</Button> : null}
                {selected.item.condition !== "Pristine" ? <Button variant="ghost" className="w-full" disabled={pending} onClick={() => void act(() => repairServerItem(selected.item.id), `${selected.item.name} repaired by the Machine Shop.`)}><Wrench className="size-4" /> Repair</Button> : null}
                {selected.source === "resident" && !selected.item.equipped ? <Button variant="quiet" className="w-full" disabled={pending} onClick={() => void act(() => stashServerItem(selected.item.id), `${selected.item.name} returned to Vault 13.`)}><Archive className="size-4" /> Move to Vault 13</Button> : null}
                {pending ? <p className="text-center font-mono text-[10px] uppercase tracking-[0.18em] text-ember">Tyrone settling server serial…</p> : null}
              </>
            ) : (
              <p className="text-center text-xs text-muted">Catalogue record only. Find the real item in the Hollow Realm.</p>
            )
          }
        >
            <p className="text-sm leading-relaxed text-paper">{selected.item.effect}</p>
            <p className="mt-2 text-xs leading-relaxed text-muted">{selected.item.lore}</p>
            {chamberLine(selected.item) ? (
              <p className="mt-2 min-w-0 break-words font-display text-[10px] uppercase tracking-[0.08em] text-ember">{chamberLine(selected.item)}{selected.item.rangeBand ? ` · ${selected.item.rangeBand}` : ""}</p>
            ) : null}
            {couple ? (
              <div className="mt-3 rounded-[var(--radius-sm)] border border-ember/25 bg-ember/5 px-3 py-2">
                <p className="font-display text-[9px] uppercase tracking-[0.16em] text-ember">Load matrix</p>
                <p className="mt-1 text-xs text-paper">{selected.item.ammoType} · {gradeLabel(selected.item.ammoGrade ?? gradeFromLoad(selected.item.ammoLoad ?? selected.item.name))} · {Math.round(couple.efficiency * 100)}% of this barrel</p>
                <p className="mt-1 text-xs text-muted">Die {diceHint >= 0 ? "+" : ""}{diceHint} · Acc {couple.accuracy >= 0 ? "+" : ""}{couple.accuracy} · Dmg {couple.damage >= 0 ? "+" : ""}{couple.damage}{couple.ap ? ` · AP ${couple.ap}` : ""}{couple.wasted > 0.15 ? " · this rifle cannot hold the extra quality" : ""}</p>
              </div>
            ) : null}
            {selected.item.kind === "consumable" && selected.item.ammoType ? (
              <p className="mt-2 text-xs text-muted">{AMMO_GRADE_META[selected.item.ammoGrade ?? gradeFromLoad(selected.item.name)].blurb}</p>
            ) : null}

            {selected.source !== "catalogue" && residents.length ? <div className="mt-4"><SectionLabel>Resident</SectionLabel><select value={resolvedTargetId} onChange={(e) => { setTargetId(e.target.value); setTargetGearId(""); }} disabled={!!selected.residentId || pending} className="mt-1 min-h-11 w-full rounded-[var(--radius-sm)] bg-ink px-3 text-sm text-paper shadow-[var(--shadow-border)]">{residents.map((op) => <option key={op.id} value={op.id}>{op.name} · Lv {residentProgress(op).level} · {classLabel(op.cls)}</option>)}</select></div> : null}

            {preview ? <div className="mt-3 grid grid-cols-2 gap-2"><Panel className="bg-raised"><SectionLabel>Level</SectionLabel><p className="font-display text-xl">{preview.currentLevel}<span className="text-xs text-muted"> · mastery verified server-side</span></p></Panel><Panel className="bg-raised"><SectionLabel>Power preview</SectionLabel><p className={cn("font-display text-xl", preview.powerDelta > 0 ? "text-ok" : preview.powerDelta < 0 ? "text-danger" : "text-paper")}>{preview.currentPower} → {preview.projectedPower}</p><p className="text-xs text-muted">{preview.powerDelta >= 0 ? "+" : ""}{preview.powerDelta} loadout</p></Panel></div> : null}

            {selected.item.kind === "enchantment" && target && gear.length ? <div className="mt-4"><SectionLabel>Attach to</SectionLabel><select value={resolvedGearId} onChange={(e) => setTargetGearId(e.target.value)} disabled={pending} className="mt-1 min-h-11 w-full rounded-[var(--radius-sm)] bg-ink px-3 text-sm text-paper shadow-[var(--shadow-border)]">{gear.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.rarity}</option>)}</select></div> : null}

            {selected.item.kind === "attachment" && target && guns.length ? <div className="mt-4"><SectionLabel>Seat on firearm</SectionLabel><select value={resolvedGearId} onChange={(e) => setTargetGearId(e.target.value)} disabled={pending} className="mt-1 min-h-11 w-full rounded-[var(--radius-sm)] bg-ink px-3 text-sm text-paper shadow-[var(--shadow-border)]">{guns.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.rarity}</option>)}</select></div> : null}

            <Panel className="mt-4 border-ember/20 bg-ember/5"><div className="flex gap-3"><img src="/art/tyrone.jpg" alt="" className="size-11 rounded-[var(--radius-sm)] object-cover" /><p className="text-sm leading-relaxed text-moon">{tyrone(selected.item, target)}</p></div></Panel>
        </ItemInspectShell>
      ) : null}
    </InventoryFrame>
  );
}
