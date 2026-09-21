import { Button } from "@/components/ui/button";
import { CLASS_GIFT, COMPANIONS, PRIMARY_STAT, locById, villainById, WORLD } from "@/game/data";
import { className, displayLineage, displayRace } from "@/game/presentation";
import { BAND_COPY, combatActor, computeStats, equippedWeapon, healCost } from "@/game/engine";
import { magLine, isAmmoConsumable } from "@/game/weapon-ops";
import { restPenalties, WATCH_LABEL } from "@/game/shift";
import { sfx, rumble } from "@/game/audio";
import { useGame } from "@/game/store";
import type { Operative } from "@/game/types";
import { STAT_COPY, STAT_ORDER } from "@/game/stats-copy";
import { cn } from "@/lib/cn";
import { CommandBar, EncounterBackdrop, EventChips, EventLog } from "./encounter-scene";
import { KIND_LABEL, eventChips, eventStatHint, shiftRadio, dawnLines } from "@/game/event-theater";
import { currentPorch } from "@/game/porch";
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
    <div className="ms-toast" data-toast="1">
      <div className="ms-rise ms-shake rounded-[var(--radius-md)] bg-panel px-4 py-3 text-center text-body text-paper shadow-[var(--shadow-border-hover)]">
        {toast}
      </div>
    </div>
  );
}

export function MissionOverlay() {
  const s = useGame((g) => g.s);
  const mission = s.mission;
  const combat = s.combat;
  const ops = s.operatives;
  const rollBeat = useGame((g) => g.rollBeat);
  const pickTactic = useGame((g) => g.pickTactic);
  const cont = useGame((g) => g.continueMission);
  const [spin, setSpin] = useState(false);
  const waiting = !!mission?.waiting;
  const open = !!mission && !combat;

  const onRoll = () => {
    const m = useGame.getState().s.mission;
    if (!m?.waiting || spin) return;
    const current = m.beats[m.beatIndex];
    if (current?.tactics && !current.tacticId) return;
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
        if (useGame.getState().s.talk) return;
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
  const loc = locById(mission.locationId);
  const party = mission.partyIds
    .map((id) => ops.find((o) => o.id === id))
    .filter(Boolean) as Operative[];
  const partyDown = party.length > 0 && party.every((o) => o.hp <= 0 || o.status === "dead");

  const choosing = !!(mission.waiting && beat?.tactics && !beat.tacticId);
  const chips = eventChips(s, mission);
  const porchLive = currentPorch().seats.filter((seat) => !seat.self);

  return (
    <div className="fixed inset-0 z-40 flex flex-col" data-mission="1">
      <EncounterBackdrop locationId={mission.locationId} tone={mission.kind === "boss" || mission.kind === "raid" ? "danger" : "neutral"} />

      <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-display text-label uppercase tracking-[0.22em] text-ember">
                {KIND_LABEL[mission.kind]} · {loc.short} · {mission.approach ?? "standard"} · beat {mission.beatIndex + 1}/
                {mission.beats.length}
              </div>
              <h2 className="mt-1 font-display text-2xl leading-tight">{beat?.title ?? "Debrief"}</h2>
              <p className="mt-1 text-secondary text-moon">{mission.briefing ?? beat?.prompt}</p>
            </div>
            <div className="shrink-0 text-right text-label text-muted">
              <Coin n={mission.coins} />
            </div>
          </div>
          {mission.stakes ? <p className="mt-2 text-label text-muted">{mission.stakes}</p> : null}
          <EventChips chips={chips} />
          {porchLive.length ? (
            <p className="mt-2 text-label text-muted">
              Porch · {porchLive.map((seat) => seat.name).join(", ")} · quiet jobs never wait
            </p>
          ) : (
            <p className="mt-2 text-label text-muted">Porch · yours until someone sits</p>
          )}

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
        </div>

        {choosing ? (
          <div className="ms-scroll min-h-0 flex-1 overflow-y-auto px-4 pb-4">
            <p className="text-body leading-relaxed text-moon">{beat?.prompt}</p>
            <div className="mt-4 space-y-2">
              <p className="font-display text-label uppercase tracking-[0.16em] text-ember">Call it</p>
              {beat?.tactics?.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    sfx.click();
                    pickTactic(t.id);
                  }}
                  className="flex min-h-14 w-full flex-col items-start justify-center rounded-[var(--radius-md)] bg-ink/75 px-3 py-2 text-left shadow-[var(--shadow-border)] backdrop-blur-sm"
                >
                  <span className="font-display text-body text-paper">{t.label}</span>
                  <span className="mt-0.5 text-secondary text-muted">{t.blurb}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <EventLog lines={mission.narrative} />
            {mission.lastRoll ? (
              <div className="shrink-0 px-4 pb-2">
                <div className="flex items-center justify-center gap-3">
                  <DiceFace value={mission.lastRoll.value} band={mission.lastRoll.band} spinning={spin} size={72} />
                  <p className="text-secondary text-moon">
                    {mission.lastRoll.text}. {BAND_COPY[mission.lastRoll.band]}
                  </p>
                </div>
              </div>
            ) : spin ? (
              <div className="flex shrink-0 justify-center px-4 pb-2">
                <DiceFace spinning size={72} />
              </div>
            ) : null}
            {mission.loot.length ? (
              <div className="shrink-0 border-t border-line/50 px-4 py-2">
                <SectionLabel>Recovered</SectionLabel>
                {mission.loot.map((it) => (
                  <ItemLine key={it.id} item={it} />
                ))}
              </div>
            ) : null}
          </>
        )}

        <div className="shrink-0 px-3 py-2">
          <div className="grid grid-cols-3 gap-2">
            {party.map((op) => (
              <div key={op.id} className="min-w-0 rounded-[var(--radius-sm)] bg-ink/70 px-2 py-2 backdrop-blur-sm shadow-[var(--shadow-border)]">
                <div className="flex min-w-0 items-center gap-2">
                  <Portrait op={op} size={28} />
                  <span className="min-w-0 flex-1 truncate text-label text-paper">{op.name}</span>
                </div>
                <HpBar hp={op.hp} max={op.maxHp} className="mt-1.5" />
              </div>
            ))}
          </div>
        </div>

        {choosing ? null : (
          <CommandBar>
            {mission.waiting ? (
              <>
                {beat ? (
                  <p className="mb-2 min-h-8 text-secondary text-moon">{eventStatHint(beat.stat, beat.dc)}</p>
                ) : null}
                <Button className="w-full" variant="ember" onClick={onRoll} disabled={spin} sound="none" autoFocus>
                  Roll d20
                </Button>
              </>
            ) : (
              <Button
                className="w-full"
                variant="ember"
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
          </CommandBar>
        )}
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
  strike: "d20 + primary vs DC. Magazines matter. Dry click is half damage and a -4.",
  guard: "Hold. +2 DEF this round.",
  skill: "Signature. The thing they are known for.",
  gift: "Once per day. Do not waste it.",
  item: "Burn a consumable from the rucksack. Ammo is not a drink.",
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
      if (a === "item" && !actorNow.inventory.some((i) => i.kind === "consumable" && !isAmmoConsumable(i))) return;
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

  const hasItem = !!actor?.inventory.some((i) => i.kind === "consumable" && !isAmmoConsumable(i));
  const actorGun = actor ? equippedWeapon(actor) : undefined;
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

  const standing = combat.enemies.filter((e) => e.hp > 0).length;
  const hullPct = enemy ? Math.max(0, Math.min(100, (enemy.hp / Math.max(1, enemy.maxHp)) * 100)) : 0;

  return (
    <div className="fixed inset-0 z-40 flex flex-col" data-combat="1">
      <EncounterBackdrop locationId={combat.locationId} tone="danger" />

      <div className={cn("relative z-[1] flex min-h-0 flex-1 flex-col", flash && "ms-hit")}>
        <div className="shrink-0 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-display text-label uppercase tracking-[0.22em] text-danger">
              Contact · round {combat.turn}
            </span>
            {combat.enemies.length > 1 ? (
              <span className="text-label tabular-nums text-muted">
                {standing}/{combat.enemies.length} standing
              </span>
            ) : null}
          </div>

          <h2 className="mt-1 font-display text-3xl leading-tight text-paper">{enemy?.name}</h2>
          {v ? (
            <p className="text-label text-muted">
              {v.title} · {v.arc}
            </p>
          ) : null}
          {phase ? (
            <p className="mt-1 font-display text-label uppercase tracking-[0.16em] text-ember">{phase.name}</p>
          ) : enemy?.flavor ? (
            <p className="mt-1 text-secondary text-moon">{enemy.flavor}</p>
          ) : null}

          <div className="relative mt-3">
            <div className="ms-hull-track">
              <div className="ms-hull-fill" style={{ width: `${hullPct}%` }} />
            </div>
            <div className="mt-1 flex items-center justify-between text-label tabular-nums text-muted">
              <span>
                Hull {enemy?.hp ?? 0}/{enemy?.maxHp ?? 0}
              </span>
              <span>
                DC {enemy?.dc}
                {enemy?.armorClass ? ` · ${enemy.armorClass}` : ""}
                {enemy?.preferredRange ? ` · ${enemy.preferredRange}` : ""}
              </span>
            </div>
            {float.n ? <FloatNum n={float.n} kind={float.n > 0 ? "dmg" : "heal"} tick={float.tick} /> : null}
          </div>

          {combat.incomingSoft ? (
            <p className="mt-1 font-display text-label uppercase tracking-[0.16em] text-ember">
              Bracing · next hit lands softer
            </p>
          ) : null}
        </div>

        {/* The room fills the gap; the fight's words sit down against the party. */}
        <EventLog lines={combat.log} />

        <div className="shrink-0 px-3 py-3">
          <div className="grid grid-cols-3 gap-2">
            {party.map((op) => (
              <div
                key={op.id}
                className={cn(
                  "min-w-0 rounded-[var(--radius-sm)] bg-ink/70 px-2 py-2 backdrop-blur-sm transition-colors duration-150",
                  actor?.id === op.id
                    ? "shadow-[var(--shadow-border-hover)]"
                    : "shadow-[var(--shadow-border)]",
                  hurtId === op.id && "ms-hit",
                )}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <Portrait op={op} size={28} />
                  <span className="min-w-0 flex-1 truncate text-label text-paper">{op.name}</span>
                </div>
                <HpBar hp={op.hp} max={op.maxHp} className="mt-1.5" />
                {actor?.id === op.id ? (
                  <p className="mt-1 truncate font-display text-label uppercase tracking-[0.14em] text-ember">
                    {actorGun ? magLine(actorGun) : "acting"}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <CommandBar>
          {actor && actor.hp > 0 ? (
            <>
              <p className="mb-2 min-h-8 text-secondary text-moon">{ACT_HELP[help]}</p>
              <div className="grid grid-cols-3 gap-2">
                {actions.map((a) => {
                  const Icon = a.icon;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      disabled={a.disabled || lock}
                      data-juice={a.variant === "ember" ? "commit" : undefined}
                      onClick={() => {
                        setHelp(a.id);
                        go(a.id);
                      }}
                      className={cn(
                        "flex min-h-16 flex-col items-center justify-center gap-1 rounded-[var(--radius-sm)] px-2 py-2 text-center disabled:opacity-40",
                        a.variant === "ember" && "bg-ember text-ink",
                        a.variant === "ghost" && "bg-ink/60 text-paper shadow-[var(--shadow-border)]",
                        a.variant === "quiet" && "bg-raised/80 text-muted",
                        a.variant === "danger" && "bg-danger/20 text-danger",
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="line-clamp-2 w-full font-display text-label uppercase leading-tight tracking-[0.08em]">
                        {a.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <p className="mb-2 text-secondary text-danger">No one standing.</p>
              <Button
                className="w-full"
                variant="danger"
                sound="none"
                onClick={() => {
                  sfx.whoosh();
                  extract();
                }}
              >
                Extract the fallen
              </Button>
            </>
          )}
        </CommandBar>
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
                <ClassGlyph cls={op.cls} /> {className(op.cls)}
              </div>
              <h2 className="mt-1 font-display text-2xl">{op.name}</h2>
              <p className="text-sm text-muted">
                {displayRace(op.race)} · {displayLineage(op.race, op.lineage)} · {op.origin}
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
          <StatGrid stats={stats} primary={PRIMARY_STAT[op.cls]} dice={op.statDice} />
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
              <SectionLabel>Body · seven scores</SectionLabel>
              <p className="text-sm leading-relaxed text-moon">
                Tap a score above. These are the numbers every check uses. A class primary is the one this rider lives on.
              </p>
              <div className="mt-3 space-y-2">
                {STAT_ORDER.map((k) => {
                  const copy = STAT_COPY[k];
                  const roll = op.statDice?.[k];
                  return (
                    <p key={k} className="text-xs leading-relaxed">
                      <span className="font-display uppercase tracking-wider text-ember">{k}</span>
                      <span className="text-paper"> {copy.name}</span>
                      <span className="text-muted"> — {copy.short}. </span>
                      <span className="text-moon">{copy.does}</span>
                      {typeof roll === "number" ? (
                        <span className="mt-0.5 block text-[11px] text-ember">Body die {roll}.</span>
                      ) : null}
                    </p>
                  );
                })}
              </div>
            </Panel>
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
  const s = useGame((g) => g.s);
  const downedNames = s.operatives
    .filter((o) => o.status === "downed")
    .map((o) => o.name)
    .join(", ");
  const downedId = s.operatives.find((o) => o.status === "downed")?.id ?? null;
  const penalties = restPenalties(s);
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
        <h2 className="font-display text-xl">{downedNames ? "Dawn is a decision" : "Turn the shift in?"}</h2>
        {downedNames ? (
          <p className="mt-3 text-sm leading-relaxed text-moon">
            {downedNames} {many ? "are" : "is"} downed. Resting without an Infirmary kills them for good.
          </p>
        ) : null}
        <ul className="mt-3 space-y-2 text-sm text-moon">
          {dawnLines(s).map((line) => {
            const parsed = line.includes(" · ") ? line.split(" · ") : ["", line];
            return (
              <li key={line}>
                <span className="font-display text-[10px] uppercase tracking-[0.14em] text-ember">{parsed[0]}</span>
                <span className="mt-0.5 block">{parsed.slice(1).join(" · ")}</span>
              </li>
            );
          })}
        </ul>
        {penalties.length ? (
          <ul className="mt-3 space-y-1.5 text-sm text-ember">
            {penalties.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-moon">
            Open jobs will lapse. Kane does not wait. Rest reprints the board at dawn.
          </p>
        )}
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
        {downedId ? (
          <Button
            variant="ember"
            className="mt-2 w-full"
            onClick={() => {
              cancel();
              select(downedId);
              setScreen("roster");
            }}
          >
            Treat the downed
          </Button>
        ) : (
          <Button
            variant="ember"
            className="mt-2 w-full"
            onClick={() => {
              cancel();
              setScreen("hq");
            }}
          >
            Back to the board
          </Button>
        )}
      </div>
    </div>
  );
}

export function ShiftSheet() {
  const s = useGame((g) => g.s);
  const close = useGame((g) => g.closeTask);
  const resolve = useGame((g) => g.resolveTask);
  const task = s.shift?.board.find((t) => t.id === s.shift.activeId);
  const idle = s.operatives.filter((o) => o.status === "idle" && o.hp > 0);
  const wounded = s.operatives.filter((o) => o.status === "downed" || (o.hp < o.maxHp && o.status !== "dead"));
  if (!task || task.kind === "sortie" || task.kind === "cabinet") return null;
  if (s.combat || s.mission) return null;

  const go = (payload: Parameters<typeof resolve>[0]) => {
    sfx.click();
    const msg = resolve(payload);
    if (msg) sfx.hurt();
    else rumble(8);
  };

  return (
    <div className="fixed inset-0 z-[45] flex flex-col" data-shift-event="1">
      <EncounterBackdrop locationId={task.loc ?? s.selectedLoc ?? "ironclad"} />
      <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-display text-label uppercase tracking-[0.2em] text-ember">
                {WATCH_LABEL[s.shift.watch]} · {task.watchCost} watch{task.watchCost > 1 ? "es" : ""}
                {task.required ? " · required" : ""}
              </p>
              <h2 className="mt-1 font-display text-xl">{task.title}</h2>
            </div>
            <button
              type="button"
              aria-label="Close job"
              onClick={() => {
                sfx.click();
                close();
              }}
              className="flex size-11 items-center justify-center rounded-lg border border-line text-moon"
            >
              <X className="size-5" />
            </button>
          </div>
          <EventChips
            chips={[
              { label: "Watch", value: WATCH_LABEL[s.shift.watch] },
              { label: "Cost", value: `${task.watchCost}` },
              { label: "Board", value: task.required ? "required" : "open" },
            ]}
          />
        </div>
        <EventLog lines={[shiftRadio(task.kind), `SYNAPSE · ${task.brief}`, `Hollow · ${task.why}`]} />
        <div className="ms-scroll max-h-[40vh] overflow-y-auto px-4 pb-4">

        {task.kind === "crates" && task.crates ? (
          <div className="mt-5 space-y-2">
            {task.crates.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => go({ crateId: c.id })}
                className="flex min-h-14 w-full items-center rounded-[var(--radius-md)] bg-ink px-3 py-3 text-left shadow-[var(--shadow-border)]"
              >
                <span className="font-display text-sm text-paper">{c.label}</span>
              </button>
            ))}
          </div>
        ) : null}

        {task.kind === "treat" ? (
          <div className="mt-5 space-y-2">
            {wounded.length === 0 ? <p className="text-sm text-muted">Nobody needs the needle.</p> : null}
            {wounded.map((op) => (
              <button
                key={op.id}
                type="button"
                onClick={() => go({ opId: op.id })}
                className="flex min-h-14 w-full items-center gap-3 rounded-[var(--radius-md)] bg-ink px-3 py-3 text-left shadow-[var(--shadow-border)]"
              >
                <Portrait op={op} size={36} />
                <span>
                  <span className="block font-display text-sm">{op.name}</span>
                  <span className="text-[11px] text-muted">
                    {op.status} · {op.hp}/{op.maxHp}
                  </span>
                </span>
              </button>
            ))}
          </div>
        ) : null}

        {task.kind === "run" ? (
          <div className="mt-5 space-y-2">
            {idle.length === 0 ? <p className="text-sm text-muted">Nobody idle to send.</p> : null}
            {idle.map((op) => (
              <button
                key={op.id}
                type="button"
                onClick={() => go({ opId: op.id })}
                className="flex min-h-14 w-full items-center gap-3 rounded-[var(--radius-md)] bg-ink px-3 py-3 text-left shadow-[var(--shadow-border)]"
              >
                <Portrait op={op} size={36} />
                <span>
                  <span className="block font-display text-sm">{op.name}</span>
                  <span className="text-[11px] text-muted">{className(op.cls)} walks. You get the report.</span>
                </span>
              </button>
            ))}
          </div>
        ) : null}

        {task.kind === "scan" ? (
          <div className="mt-5 space-y-2">
            {WORLD.filter((w) => w.id !== "hq" && s.locations[w.id]?.unlocked).map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => go({ loc: w.id })}
                className="flex min-h-14 w-full flex-col items-start justify-center rounded-[var(--radius-md)] bg-ink px-3 py-3 text-left shadow-[var(--shadow-border)]"
              >
                <span className="font-display text-sm">{w.name}</span>
                <span className="text-[12px] text-muted">Intel {s.locations[w.id].intel}</span>
              </button>
            ))}
          </div>
        ) : null}

        {task.kind === "repair" ? (
          <div className="mt-5 space-y-2">
            <Button className="w-full" variant="ember" onClick={() => go({})}>
              Work the line
            </Button>
          </div>
        ) : null}

        {task.choices?.length && task.kind !== "crates" && task.kind !== "treat" && task.kind !== "run" && task.kind !== "scan" ? (
          <div className="mt-5 space-y-2">
            {task.choices.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => go({ choiceId: c.id })}
                className="flex min-h-14 w-full flex-col items-start justify-center rounded-[var(--radius-md)] bg-ink px-3 py-3 text-left shadow-[var(--shadow-border)]"
              >
                <span className="font-display text-sm text-paper">{c.label}</span>
                <span className="mt-0.5 text-[12px] text-muted">{c.blurb}</span>
              </button>
            ))}
          </div>
        ) : null}
        </div>
      </div>
    </div>
  );
}

