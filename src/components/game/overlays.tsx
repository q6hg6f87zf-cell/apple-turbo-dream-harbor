import { Button } from "@/components/ui/button";
import { CLASS_GIFT, COMPANIONS, PRIMARY_STAT, locById, villainById } from "@/game/data";
import { BAND_COPY, combatActor, computeStats, healCost } from "@/game/engine";
import { sfx, rumble } from "@/game/audio";
import { useGame } from "@/game/store";
import type { Operative } from "@/game/types";
import { cn } from "@/lib/cn";
import {
  ClassGlyph,
  Coin,
  DiceFace,
  FloatNum,
  HpBar,
  ItemLine,
  Panel,
  Portrait,
  RarityMark,
  SectionLabel,
  StatGrid,
} from "./primitives";
import { Heart, Package, Shield, Sparkles, Swords, Wind, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function ToastHost() {
  const toast = useGame((g) => g.s.toast);
  const clear = useGame((g) => g.toastClear);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clear, 2800);
    return () => clearTimeout(t);
  }, [toast, clear]);
  if (!toast) return null;
  return (
    <div className="pointer-events-none fixed bottom-32 left-1/2 z-50 w-[min(92vw,420px)] -translate-x-1/2 md:bottom-20">
      <div className="ms-rise ms-shake rounded-[var(--radius-md)] bg-panel px-4 py-3 text-center text-sm text-paper shadow-[var(--shadow-border-hover)]">
        {toast}
      </div>
    </div>
  );
}

export function MissionOverlay() {
  const mission = useGame((g) => g.s.mission);
  const combat = useGame((g) => g.s.combat);
  const ops = useGame((g) => g.s.operatives);
  const rollBeat = useGame((g) => g.rollBeat);
  const cont = useGame((g) => g.continueMission);
  const [spin, setSpin] = useState(false);
  const waiting = !!mission?.waiting;
  const open = !!mission && !combat;

  const onRoll = () => {
    const m = useGame.getState().s.mission;
    if (!m?.waiting || spin) return;
    setSpin(true);
    sfx.dice();
    rumble(10);
    window.setTimeout(() => {
      rollBeat();
      setSpin(false);
      const b = useGame.getState().s.mission?.lastRoll?.band;
      if (b === "crit") {
        sfx.crit();
        rumble(28);
      } else if (b === "fumble" || b === "fail") {
        sfx.hurt();
        rumble(18);
      } else if (b === "strong") sfx.win();
    }, 920);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, select")) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (waiting) onRoll();
        else {
          sfx.click();
          cont();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, waiting, spin, cont, rollBeat]);

  if (!mission || combat) return null;
  const beat = mission.beats[mission.beatIndex];
  const last = mission.beatIndex >= mission.beats.length - 1;
  const lead = ops.find((o) => o.id === mission.partyIds[0]);
  const loc = locById(mission.locationId);
  const leadStats = lead ? computeStats(lead) : null;
  const party = mission.partyIds
    .map((id) => ops.find((o) => o.id === id))
    .filter(Boolean) as Operative[];
  const partyDown = party.length > 0 && party.every((o) => o.hp <= 0 || o.status === "dead");

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/80 p-3 md:items-center">
      <div className="ms-pop max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[var(--radius-xl)] bg-surface p-5 shadow-[var(--shadow-border)] ms-scroll">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-display text-[10px] uppercase tracking-[0.22em] text-ember">
              {loc.short} · {mission.kind} · beat {mission.beatIndex + 1}/{mission.beats.length}
            </div>
            <h2 className="mt-1 font-display text-xl">{beat?.title ?? "Return"}</h2>
          </div>
          <div className="text-right text-xs text-muted">
            <Coin n={mission.coins} />
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          {party.map((op) => (
            <div key={op.id} className="flex items-center gap-1.5">
              <Portrait op={op} size={28} />
              <span className="hidden text-[11px] text-muted sm:inline">{op.name}</span>
            </div>
          ))}
        </div>

        <div className="mt-3 flex gap-1.5">
          {mission.beats.map((b, i) => (
            <span
              key={`${b.id}-${i}`}
              className={cn(
                "h-1.5 flex-1 rounded-full",
                i < mission.beatIndex ? "bg-ok" : i === mission.beatIndex ? "bg-ember" : "bg-line",
              )}
            />
          ))}
        </div>

        <p className="mt-4 text-[15px] leading-relaxed text-moon">{beat?.prompt}</p>
        {beat && lead ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wider text-muted">
            <span className="rounded-full bg-ink px-2 py-1 text-ember">
              {beat.stat} {leadStats ? leadStats[beat.stat] : ""} · DC {beat.dc}
            </span>
            <span>{lead.name} rolls</span>
          </div>
        ) : null}

        <div className="mt-5 flex justify-center">
          <DiceFace value={mission.lastRoll?.value} band={mission.lastRoll?.band} spinning={spin} size={128} />
        </div>
        {mission.lastRoll ? (
          <p className="mt-3 text-center text-sm text-muted">
            {mission.lastRoll.text}. {BAND_COPY[mission.lastRoll.band]}
          </p>
        ) : null}

        <ul className="mt-4 space-y-1.5 text-sm text-muted">
          {mission.narrative.slice(-4).map((n, i) => (
            <li key={i} className={i === mission.narrative.slice(-4).length - 1 ? "text-paper" : ""}>
              {n}
            </li>
          ))}
        </ul>

        {mission.loot.length ? (
          <div className="mt-4 border-t border-line pt-3">
            <SectionLabel>Recovered</SectionLabel>
            {mission.loot.map((it) => (
              <ItemLine key={it.id} item={it} />
            ))}
          </div>
        ) : null}

        <div className="mt-5">
          {mission.waiting ? (
            <Button className="w-full" variant="ember" onClick={onRoll} disabled={spin} sound="none" autoFocus>
              Roll d20
            </Button>
          ) : (
            <Button
              className="w-full"
              sound="none"
              autoFocus
              onClick={() => {
                sfx.click();
                cont();
              }}
            >
              {last || partyDown ? "Return to HQ" : "Continue"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

const ACT_SHORT = {
  strike: "d20 vs DC",
  guard: "+2 DEF",
  skill: "Signature",
  gift: "Once / day",
  item: "Consumable",
  flee: "SPD check",
} as const;

const ACT_HELP = {
  strike: "d20 + primary vs DC. Steel talks.",
  guard: "Hold. +2 DEF this round.",
  skill: "Signature. The thing they are known for.",
  gift: "Once per day. Do not waste it.",
  item: "Burn a consumable from the rucksack.",
  flee: "SPD check. Shame is cheaper than a grave.",
} as const;

export function CombatOverlay() {
  const combat = useGame((g) => g.s.combat);
  const s = useGame((g) => g.s);
  const act = useGame((g) => g.combatAct);
  const extract = useGame((g) => g.extractCombat);
  const [flash, setFlash] = useState(false);
  const [help, setHelp] = useState<keyof typeof ACT_HELP>("strike");
  const [float, setFloat] = useState({ n: 0, tick: 0 });
  const [hurtId, setHurtId] = useState<string | null>(null);
  const [lock, setLock] = useState(false);
  const lockRef = useRef(false);
  const prevHp = useRef<number | null>(null);
  const prevParty = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!combat) return;
    setFlash(true);
    const t = window.setTimeout(() => setFlash(false), 280);
    return () => window.clearTimeout(t);
  }, [combat?.log.length, combat]);

  const enemy = combat?.enemies.find((e) => e.hp > 0) ?? combat?.enemies[0];
  useEffect(() => {
    if (!enemy) return;
    if (prevHp.current != null && prevHp.current !== enemy.hp) {
      setFloat({ n: prevHp.current - enemy.hp, tick: Date.now() });
    }
    prevHp.current = enemy.hp;
  }, [enemy?.hp, enemy]);

  useEffect(() => {
    if (!combat) {
      lockRef.current = false;
      setLock(false);
      prevParty.current = {};
      return;
    }
    const next: Record<string, number> = {};
    combat.partyIds.forEach((id) => {
      const hp = s.operatives.find((o) => o.id === id)?.hp ?? 0;
      next[id] = hp;
      const prev = prevParty.current[id];
      if (prev != null && hp < prev) setHurtId(id);
    });
    prevParty.current = next;
  }, [combat, s.operatives]);

  useEffect(() => {
    if (!hurtId) return;
    const t = window.setTimeout(() => setHurtId(null), 320);
    return () => window.clearTimeout(t);
  }, [hurtId]);

  const go = (a: keyof typeof ACT_HELP) => {
    if (lockRef.current) return;
    const before = useGame.getState().s;
    if (!before.combat) return;
    const eHp =
      before.combat.enemies.find((e) => e.hp > 0)?.hp ?? before.combat.enemies[0]?.hp ?? 0;
    const pHp = before.combat.partyIds.reduce((n, id) => {
      const o = before.operatives.find((x) => x.id === id);
      return n + (o?.hp ?? 0);
    }, 0);
    lockRef.current = true;
    setLock(true);
    act(a);
    const after = useGame.getState().s;
    const eHp2 =
      after.combat?.enemies.find((e) => e.hp > 0)?.hp ?? after.combat?.enemies[0]?.hp ?? 0;
    const pHp2 = (after.combat?.partyIds ?? []).reduce((n, id) => {
      const o = after.operatives.find((x) => x.id === id);
      return n + (o?.hp ?? 0);
    }, 0);
    const line = (after.combat?.log ?? []).at(-1) ?? "";
    if (after.combat) {
      if (eHp2 < eHp) {
        if (line.includes("Critical")) {
          sfx.crit();
          rumble(28);
        } else {
          sfx.hit();
          rumble(12);
        }
      } else if (a === "strike" || a === "skill") sfx.miss();
      else if (a === "item") sfx.coin();
      else if (a === "gift") sfx.dice();
      else if (a === "flee") sfx.whoosh();
      else sfx.click();
      if (pHp2 < pHp) {
        sfx.hurt();
        rumble(20);
      }
    }
    window.setTimeout(() => {
      lockRef.current = false;
      setLock(false);
    }, 260);
  };

  useEffect(() => {
    if (!combat) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || lockRef.current) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, select")) return;
      const actorNow = combatActor(useGame.getState().s);
      if (!actorNow || actorNow.hp <= 0) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          extract();
        }
        return;
      }
      const map: Record<string, keyof typeof ACT_HELP> = {
        "1": "strike",
        "2": "guard",
        "3": "skill",
        "4": "gift",
        "5": "item",
        "6": "flee",
      };
      const a = map[e.key];
      if (!a) return;
      e.preventDefault();
      if (a === "gift" && actorNow.giftUsed) return;
      if (a === "item" && !actorNow.inventory.some((i) => i.kind === "consumable")) return;
      setHelp(a);
      go(a);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [combat, extract]);

  if (!combat) return null;
  const actor = combatActor(s);
  const party = combat.partyIds
    .map((id) => s.operatives.find((o) => o.id === id))
    .filter(Boolean) as Operative[];
  const v = combat.bossId ? villainById(combat.bossId) : null;
  const phase = v && enemy ? v.phases[Math.min(enemy.phase ?? 0, v.phases.length - 1)] : null;

  const hasItem = !!actor?.inventory.some((i) => i.kind === "consumable");
  const actions: { id: keyof typeof ACT_HELP; label: string; icon: typeof Swords; variant: "ember" | "ghost" | "quiet" | "danger"; disabled?: boolean }[] = actor
    ? [
        { id: "strike", label: "Strike", icon: Swords, variant: "ember" },
        { id: "guard", label: "Guard", icon: Shield, variant: "ghost" },
        { id: "skill", label: actor.skillName, icon: Sparkles, variant: "ghost" },
        { id: "gift", label: CLASS_GIFT[actor.cls].name, icon: Heart, variant: "ghost", disabled: actor.giftUsed },
        { id: "item", label: "Item", icon: Package, variant: "quiet", disabled: !hasItem },
        { id: "flee", label: "Flee", icon: Wind, variant: "danger" },
      ]
    : [];

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/85 p-3 md:items-center">
      <div
        className={cn(
          "ms-pop max-h-[94vh] w-full max-w-lg overflow-y-auto rounded-[var(--radius-xl)] bg-surface p-5 shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-danger)_40%,transparent)] ms-scroll",
          flash && "ms-hit ms-shake",
        )}
      >
        <div className="relative">
          <div className="font-display text-[10px] uppercase tracking-[0.22em] text-danger">
            Contact · round {combat.turn}
          </div>
          <h2 className="mt-1 font-display text-xl">{enemy?.name}</h2>
          {v ? (
            <p className="text-xs text-muted">
              {v.title} · {v.arc}
            </p>
          ) : null}
          {phase ? (
            <p className="mt-1 font-display text-[10px] uppercase tracking-wider text-ember">{phase.name}</p>
          ) : null}
          <p className="mt-2 text-sm italic text-moon">{enemy?.flavor}</p>
          {enemy ? <HpBar hp={enemy.hp} max={enemy.maxHp} className="mt-3 h-2.5" /> : null}
          <div className="mt-1 text-xs tabular-nums text-muted">
            {enemy?.hp}/{enemy?.maxHp} · DC {enemy?.dc}
            {combat.enemies.length > 1
              ? ` · ${combat.enemies.filter((e) => e.hp > 0).length}/${combat.enemies.length} standing`
              : ""}
          </div>
          {float.n ? <FloatNum n={float.n} kind={float.n > 0 ? "dmg" : "heal"} tick={float.tick} /> : null}
        </div>

        <div className="mt-4 grid gap-2">
          {party.map((op) => (
            <div
              key={op.id}
              className={cn(
                "flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 transition-colors duration-150",
                actor?.id === op.id ? "bg-ember/10 shadow-[var(--shadow-border-hover)]" : "shadow-[var(--shadow-border)]",
                hurtId === op.id && "ms-hit",
              )}
            >
              <Portrait op={op} size={36} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate">
                    {op.name}
                    {actor?.id === op.id ? (
                      <span className="ml-2 font-display text-[9px] uppercase tracking-wider text-ember">acting</span>
                    ) : null}
                  </span>
                  <span className="tabular-nums text-muted">
                    {op.hp}/{op.maxHp}
                  </span>
                </div>
                <HpBar hp={op.hp} max={op.maxHp} className="mt-1" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 max-h-28 space-y-1 overflow-y-auto text-sm text-muted ms-scroll" aria-live="polite">
          {combat.log.slice(-6).map((line, i) => (
            <p key={i} className={i === combat.log.slice(-6).length - 1 ? "text-paper" : ""}>
              {line}
            </p>
          ))}
        </div>

        {actor && actor.hp > 0 ? (
          <>
            <p className="mt-3 text-xs text-moon">{ACT_HELP[help]}</p>
            <p className="mt-1 font-display text-[10px] uppercase tracking-[0.16em] text-muted">Keys 1–6</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {actions.map((a) => {
                const Icon = a.icon;
                return (
                  <button
                    key={a.id}
                    type="button"
                    disabled={a.disabled || lock}
                    onClick={() => {
                      setHelp(a.id);
                      go(a.id);
                    }}
                    className={cn(
                      "flex min-h-14 flex-col items-start justify-center rounded-[var(--radius-sm)] px-3 py-2 text-left transition-transform active:scale-[0.96] disabled:opacity-40",
                      a.variant === "ember" && "bg-ember text-ink",
                      a.variant === "ghost" && "bg-transparent text-paper shadow-[var(--shadow-border)]",
                      a.variant === "quiet" && "bg-raised text-muted",
                      a.variant === "danger" && "bg-danger/15 text-danger",
                    )}
                  >
                    <span className="flex items-center gap-2 font-display text-[11px] uppercase tracking-[0.14em]">
                      <Icon className="size-4" /> <span className="truncate">{a.label}</span>
                    </span>
                    <span className="mt-0.5 font-body text-[11px] normal-case tracking-normal text-current/70">
                      {ACT_SHORT[a.id]}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div className="mt-4">
            <p className="text-sm text-danger">No one standing.</p>
            <Button className="mt-3 w-full" variant="danger" sound="none" onClick={() => { sfx.whoosh(); extract(); }}>
              Extract the fallen
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function OperativeSheet() {
  const s = useGame((g) => g.s);
  const select = useGame((g) => g.selectOp);
  const equip = useGame((g) => g.equipItem);
  const stash = useGame((g) => g.stashItem);
  const take = useGame((g) => g.takeFromVault);
  const heal = useGame((g) => g.healOp);
  const stab = useGame((g) => g.stabilize);
  const repair = useGame((g) => g.repairItem);
  const bond = useGame((g) => g.bondCompanion);
  const hof = useGame((g) => g.hof);
  const [tab, setTab] = useState<"soul" | "kit" | "bonds">("soul");
  const op = s.operatives.find((o) => o.id === s.selectedId);
  useEffect(() => {
    if (!op) return;
    const broken = op.inventory.some(
      (i) => i.equipped && (i.condition === "Broken" || i.condition === "Damaged"),
    );
    setTab(broken ? "kit" : "soul");
  }, [op?.id]); // reset tab when opening a different operative
  if (!op || s.mission || s.combat) return null;
  const stats = computeStats(op);
  const fail = (m: string | null) => {
    if (m) {
      sfx.hurt();
      useGame.setState((st) => ({ s: { ...st.s, toast: m } }));
    } else sfx.coin();
  };

  return (
    <div className="fixed inset-0 z-30 flex justify-end bg-ink/50" onClick={() => select(null)}>
      <aside
        className="ms-sheet h-full w-full max-w-md overflow-y-auto border-l border-line bg-surface p-5 ms-scroll"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 -mx-5 -mt-5 mb-4 flex items-start justify-between bg-surface/95 px-5 pt-5 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <Portrait op={op} size={52} />
            <div>
              <div className="flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.2em] text-ember">
                <ClassGlyph cls={op.cls} /> {op.cls}
              </div>
              <h2 className="mt-1 font-display text-2xl">{op.name}</h2>
              <p className="text-sm text-muted">
                {op.race} · {op.lineage} · {op.origin}
              </p>
            </div>
          </div>
          <Button variant="quiet" size="sm" onClick={() => select(null)} aria-label="Close dossier">
            <X className="size-4" />
          </Button>
        </div>
        <div className="mt-1 flex items-center justify-between text-sm">
          <span className="tabular-nums">
            HP {op.hp}/{op.maxHp}
          </span>
          <span className="text-muted">{op.repTitle}</span>
        </div>
        <HpBar hp={op.hp} max={op.maxHp} className="mt-2 h-2" />
        <div className="mt-4">
          <StatGrid stats={stats} primary={PRIMARY_STAT[op.cls]} />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <Button
            variant="ghost"
            size="sm"
            className={op.status === "downed" || op.hp < op.maxHp ? "ms-nudge" : undefined}
            onClick={() => fail(heal(op.id))}
            disabled={op.hp >= op.maxHp || (op.hp < op.maxHp && s.coins < healCost(s, op.maxHp - op.hp))}
          >
            Treat{op.hp < op.maxHp ? <> · <Coin n={healCost(s, op.maxHp - op.hp)} /></> : null}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fail(stab(op.id))}
            disabled={op.status !== "downed" || (s.rooms.infirmary < 1 && s.coins < 180)}
          >
            Stabilise{op.status === "downed" && s.rooms.infirmary < 1 ? " · 180 caps" : null}
          </Button>
          <Button variant="quiet" size="sm" onClick={() => hof(op.id)}>
            Fame
          </Button>
        </div>

        <div className="mt-5 flex gap-2">
          {(["soul", "kit", "bonds"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                sfx.click();
                setTab(t);
              }}
              className={cn(
                "flex-1 rounded-full py-2 font-display text-[10px] uppercase tracking-[0.16em]",
                tab === t ? "bg-ember text-ink" : "bg-raised text-muted",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "soul" ? (
          <div className="mt-4 space-y-3">
            <Panel className="bg-raised">
              <SectionLabel>Gift · {CLASS_GIFT[op.cls].name}</SectionLabel>
              <p className="text-sm text-moon">
                {CLASS_GIFT[op.cls].desc} {op.giftUsed ? "Spent today." : "Ready."}
              </p>
            </Panel>
            <Panel className="bg-raised">
              <SectionLabel>Signature · {op.skillName}</SectionLabel>
              <p className="text-sm">{op.skillDesc}</p>
            </Panel>
            <Panel className="bg-raised">
              <SectionLabel>Enchantment · {op.enchantName}</SectionLabel>
              <p className="text-sm">{op.enchantDesc}</p>
            </Panel>
            <Panel className="bg-raised">
              <SectionLabel>Shadow · {op.shadowName}</SectionLabel>
              <p className="text-sm text-muted">{op.shadowDesc}</p>
            </Panel>
            <Panel className="bg-raised">
              <SectionLabel>Destiny</SectionLabel>
              <p className="text-sm italic text-moon">{op.destiny}</p>
            </Panel>
            <p className="text-xs text-muted">{op.repPassive}</p>
          </div>
        ) : null}

        {tab === "kit" ? (
          <div className="mt-4">
            <SectionLabel>Rucksack</SectionLabel>
            {op.inventory.length === 0 ? <p className="text-sm text-muted">Empty.</p> : null}
            {op.inventory.map((it) => (
              <div key={it.id} className="border-b border-line/60 py-2">
                <ItemLine item={it} />
                <div className="mt-1 flex flex-wrap gap-2">
                  {it.slot ? (
                    <Button variant="quiet" size="sm" onClick={() => equip(op.id, it.id)}>
                      {it.equipped ? "Unequip" : "Equip"}
                    </Button>
                  ) : null}
                  <Button variant="quiet" size="sm" onClick={() => fail(stash(op.id, it.id))}>
                    Vault
                  </Button>
                  {it.condition !== "Pristine" && it.kind === "weapon" ? (
                    <Button variant="ghost" size="sm" onClick={() => fail(repair(op.id, it.id))}>
                      Repair
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
            <div className="mt-5">
              <SectionLabel>Vault</SectionLabel>
              {s.vault.length === 0 ? <p className="text-sm text-muted">Nothing stored.</p> : null}
              {s.vault.slice(0, 8).map((it) => (
                <div key={it.id} className="flex items-center justify-between gap-2 py-1">
                  <span className="text-sm">
                    {it.name} <RarityMark rarity={it.rarity} />
                  </span>
                  <Button variant="quiet" size="sm" onClick={() => fail(take(op.id, it.id))}>
                    Take
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {tab === "bonds" ? (
          <div className="mt-4">
            <SectionLabel>Companion</SectionLabel>
            {op.companion ? (
              <Panel className="bg-raised">
                <p className="font-display text-sm">{op.companion.type}</p>
                <p className="text-sm text-muted">
                  {op.companion.hp}/{op.companion.maxHp} · {op.companion.status}
                </p>
                <p className="mt-2 text-xs text-moon">{COMPANIONS[op.companion.type]?.desc}</p>
                <p className="mt-1 text-xs text-muted">{COMPANIONS[op.companion.type]?.passive}</p>
              </Panel>
            ) : (
              <div className="grid gap-2">
                {Object.values(COMPANIONS).map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => {
                      sfx.click();
                      fail(bond(op.id, c.name));
                    }}
                    className="rounded-[var(--radius-md)] bg-raised p-3 text-left shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-display text-sm">{c.name}</span>
                      <span className="text-xs tabular-nums text-ember">{c.cost}c</span>
                    </div>
                    <p className="mt-1 text-xs text-muted">{c.desc}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </aside>
    </div>
  );
}

export function RestConfirm() {
  const open = useGame((g) => g.confirmRest);
  const rest = useGame((g) => g.rest);
  const cancel = useGame((g) => g.cancelRest);
  const select = useGame((g) => g.selectOp);
  const setScreen = useGame((g) => g.setScreen);
  const downedNames = useGame((g) =>
    g.s.operatives
      .filter((o) => o.status === "downed")
      .map((o) => o.name)
      .join(", "),
  );
  const downedId = useGame((g) => g.s.operatives.find((o) => o.status === "downed")?.id ?? null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, cancel]);
  if (!open) return null;
  const many = downedNames.includes(",");
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/70 p-4 md:items-center">
      <div className="ms-pop w-full max-w-md rounded-[var(--radius-xl)] bg-surface p-5 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-xl">Dawn is a decision</h2>
        <p className="mt-3 text-sm leading-relaxed text-moon">
          {downedNames || "Someone"} {many ? "are" : "is"} downed. Resting without an Infirmary kills them for good.
          Treat them from the dossier, or raise an Infirmary, before you sleep.
        </p>
        <div className="mt-5 flex gap-2">
          <Button
            variant="danger"
            className="flex-1"
            onClick={() => {
              sfx.click();
              rest();
            }}
          >
            Rest anyway
          </Button>
          <Button variant="quiet" className="flex-1" onClick={cancel}>
            Hold
          </Button>
        </div>
        <Button
          variant="ember"
          className="mt-2 w-full"
          onClick={() => {
            cancel();
            if (downedId) select(downedId);
            setScreen("roster");
          }}
        >
          Treat the downed
        </Button>
      </div>
    </div>
  );
}

