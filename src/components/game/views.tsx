import { Button } from "@/components/ui/button";
import {
  BASE_ROOMS,
  CLASS_LORE,
  CLASSES,
  DESTINY,
  ENCHANTS,
  NPCS,
  ORIGINS,
  QUARTERS,
  RACES,
  REP,
  RESIDENT_ROLES,
  SHADOW,
  SIGNATURE,
  VILLAINS,
  WORLD,
  locById,
} from "@/game/data";
import {
  computeStats,
  d20,
  forgeCost,
  hireResidentCost,
  idleAtHq,
  incomePerTick,
  nextQuarterCost,
  nextRoomCost,
  randomName,
  rosterCap,
} from "@/game/engine";
import { sfx, unlockAudio } from "@/game/audio";
import { useGame } from "@/game/store";
import { ARC_ORDER, currentArcLoc, isVacant, seatedMember } from "@/game/squad";
import type { ClassName, LocationId, MissionKind, RoomId } from "@/game/types";
import { cn } from "@/lib/cn";
import {
  Archive,
  BedDouble,
  Crosshair,
  Eye,
  Hammer,
  HeartPulse,
  Landmark,
  Lock,
  Package,
  Scale,
  ScrollText,
  Shield,
  Skull,
  Swords,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Chip,
  ClassGlyph,
  Coin,
  HpBar,
  LevelPips,
  Panel,
  Portrait,
  RarityMark,
  SectionLabel,
  StatusPill,
} from "./primitives";
import { TerminalCard, TitleBackdrop, TyroneHandshake } from "./menu";
import { WorldAtlas } from "./atlas";
import { Dice20 } from "./dice";
import { MoonCard } from "./card";

function err(msg: string | null) {
  if (!msg) {
    sfx.coin();
    return;
  }
  sfx.hurt();
  useGame.setState((st) => ({ s: { ...st.s, toast: msg } }));
}

const ROOM_ICON: Record<RoomId, typeof Hammer> = {
  vault: Archive,
  barracks: Shield,
  forge: Hammer,
  infirmary: HeartPulse,
  watchtower: Eye,
  ledger: ScrollText,
};

const KIND_HELP: Record<MissionKind, string> = {
  scout: "Walk the edges. Intel, low blood.",
  forage: "Take what the land offers. Caps, ore, scraps.",
  raid: "Kick a door. Combat likely. Better loot.",
  trade: "Find the regional merchant and pay their price.",
  bounty: "Hunt a named target. The board pays.",
  boss: "The name that surfaced. Bring a party.",
};

export { MainMenu as TitleScreen } from "./menu";

export function Briefing() {
  const go = useGame((g) => g.finishBriefing);
  const talk = useGame((g) => g.s.talk);
  return (
    <div className="ms-grain relative flex h-dvh flex-col justify-end overflow-hidden px-5 py-8">
      <TitleBackdrop className="opacity-70" />
      <div className="crt-scan absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,color-mix(in_oklab,var(--color-ember)_16%,transparent),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent,color-mix(in_oklab,var(--color-ink)_82%,transparent)_70%,var(--color-ink))]" />
      <div className="relative z-[1] mx-auto mb-36 w-full max-w-xl">
        <p className="font-display text-[11px] uppercase tracking-[0.42em] text-ember">S.Y.N.A.P.S.E · T-0880</p>
        <h2 className="mt-2 font-display text-4xl text-paper">The porch.</h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-moon">
          Tyrone talks first. No shortcuts. Tap his panel until the ranch opens.
        </p>
        {!talk ? (
          <Button
            className="mt-8 w-full sm:w-auto"
            variant="ember"
            onClick={() => {
              sfx.click();
              go();
            }}
          >
            Forge the first
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function HQView() {
  const s = useGame((g) => g.s);
  const upgradeRoom = useGame((g) => g.upgradeRoom);
  const upgradeQuarter = useGame((g) => g.upgradeQuarter);
  const hire = useGame((g) => g.hireResident);
  const rest = useGame((g) => g.rest);
  const setScreen = useGame((g) => g.setScreen);
  const select = useGame((g) => g.selectOp);
  const [staff, setStaff] = useState("Rook");
  const [role, setRole] = useState<keyof typeof RESIDENT_ROLES>("guard");
  const income = incomePerTick(s);
  const living = s.operatives.filter((o) => o.status !== "dead");

  return (
    <div className="space-y-5 pb-4">
      <div className="ms-well overflow-hidden rounded-[var(--radius-xl)] p-4 shadow-[var(--shadow-border)] md:p-5">
        <div className="flex items-center gap-4">
          <div className="ms-moon !size-14 shrink-0" />
          <div className="min-w-0 flex-1">
            <SectionLabel>SYNAPSE Compound</SectionLabel>
            <h2 className="font-display text-2xl">The compound</h2>
            <p className="mt-1 text-sm text-muted">
              Earns {income} caps while you wait · roster {living.length}/{rosterCap(s)}
            </p>
          </div>
          <Button
            variant="ember"
            disabled={!!s.mission || !!s.combat}
            className={cn("shrink-0", s.tutorial === "rest" && "ms-nudge")}
            onClick={() => {
              sfx.click();
              rest();
            }}
          >
            Rest
          </Button>
        </div>

        {s.nightNote ? (
          <div className="ms-rise mt-4 rounded-[var(--radius-md)] bg-ink/50 px-4 py-3">
            <div className="font-display text-[10px] uppercase tracking-[0.2em] text-ember">Dawn dispatch</div>
            <p className="mt-1 text-sm italic text-moon">{s.nightNote}</p>
          </div>
        ) : null}

        <div className="mt-4 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {(Object.keys(BASE_ROOMS) as RoomId[]).map((id) => {
            const room = BASE_ROOMS[id];
            const lvl = s.rooms[id];
            const cost = nextRoomCost(s, id);
            const Icon = ROOM_ICON[id];
            const built = lvl > 0;
            return (
              <div
                key={id}
                className={cn(
                  "rounded-[var(--radius-md)] p-3",
                  built ? "bg-surface/90 shadow-[var(--shadow-border)]" : "bg-ink/40 shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-line)_80%,transparent)]",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex size-8 items-center justify-center rounded-[var(--radius-xs)]",
                        built ? "bg-ember/15 text-ember" : "bg-ink text-muted",
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <div>
                      <div className="font-display text-sm">{room.name}</div>
                      <div className="flex items-center gap-2 text-[11px] text-muted">
                        <LevelPips level={lvl} />
                        {built ? `+${room.income * Math.max(1, lvl)} caps` : "Ruin"}
                      </div>
                    </div>
                  </div>
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-muted">{room.desc}</p>
                {cost != null ? (
                  <Button
                    size="sm"
                    variant={built ? "ghost" : "ember"}
                    className="mt-3 w-full"
                    onClick={() => err(upgradeRoom(id))}
                    disabled={s.coins < cost}
                  >
                    {built ? "Upgrade" : "Raise"} · <Coin n={cost} />
                  </Button>
                ) : (
                  <p className="mt-3 font-display text-[10px] uppercase tracking-wider text-ok">Peak</p>
                )}
                {id === "vault" && built ? (
                  <Button size="sm" variant="quiet" className="mt-2 w-full" onClick={() => setScreen("vault")}>
                    Open vault
                  </Button>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <SectionLabel>Who is home</SectionLabel>
        {living.length === 0 ? (
          <Panel className="bg-raised">
            <p className="text-sm text-muted">The bunks are empty. Forge someone who can walk the Hollow.</p>
            <Button className="mt-3 ms-nudge" variant="ember" onClick={() => setScreen("forge")}>
              <Users className="size-4" /> Forge the first
            </Button>
          </Panel>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {living.map((op) => (
              <button
                key={op.id}
                type="button"
            onClick={() => {
              sfx.click();
              select(op.id);
            }}
                className="flex min-w-[10rem] items-center gap-3 rounded-[var(--radius-md)] bg-raised px-3 py-3 text-left shadow-[var(--shadow-border)] transition-[box-shadow] hover:shadow-[var(--shadow-border-hover)]"
              >
                <Portrait op={op} size={40} />
                <div className="min-w-0">
                  <div className="truncate font-display text-sm">{op.name}</div>
                  <StatusPill status={op.status} />
                  <HpBar hp={op.hp} max={op.maxHp} className="mt-1.5" />
                </div>
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                sfx.click();
                setScreen("forge");
              }}
              className="flex min-h-[4.5rem] min-w-[4.5rem] flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] bg-ink text-ember shadow-[var(--shadow-border)]"
            >
              <span className="font-display text-lg leading-none">+</span>
              <span className="font-display text-[9px] uppercase tracking-[0.16em]">Forge</span>
            </button>
          </div>
        )}
      </div>

      <SectionLabel>Bunkhouse</SectionLabel>
      <div className="grid gap-2 sm:grid-cols-3">
        {(Object.keys(QUARTERS) as (keyof typeof QUARTERS)[]).map((q) => {
          const cost = nextQuarterCost(s, q);
          const lvl = s.quarters[q];
          return (
            <Panel key={q} className="bg-raised p-3 md:p-4">
              <div className="flex items-center gap-2 font-display text-sm">
                <BedDouble className="size-4 text-ember" /> {QUARTERS[q].name}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <LevelPips level={lvl} />
                <span className="text-[11px] text-muted">Tier {lvl}</span>
              </div>
              <p className="mt-2 text-xs text-muted">
                {QUARTERS[q].tiers[Math.min(lvl, QUARTERS[q].tiers.length - 1)]?.bonus}
              </p>
              {cost != null ? (
                <Button className="mt-3 w-full" size="sm" variant="ghost" onClick={() => err(upgradeQuarter(q))}>
                  Upgrade · <Coin n={cost} />
                </Button>
              ) : (
                <p className="mt-2 text-xs text-ok">Peak</p>
              )}
            </Panel>
          );
        })}
      </div>

      <SectionLabel>Staff</SectionLabel>
      <Panel className="bg-raised">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={staff}
            onChange={(e) => setStaff(e.target.value)}
            className="h-11 flex-1 rounded-[var(--radius-sm)] bg-ink px-3 text-sm text-paper shadow-[var(--shadow-border)] outline-none focus:shadow-[var(--shadow-border-hover)]"
            placeholder="Name"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as typeof role)}
            className="h-11 rounded-[var(--radius-sm)] bg-ink px-3 text-sm shadow-[var(--shadow-border)]"
          >
            {Object.entries(RESIDENT_ROLES).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
          <Button variant="ghost" onClick={() => err(hire(staff, role))}>
            Hire · <Coin n={hireResidentCost(s)} />
          </Button>
        </div>
        <div className="mt-3 space-y-1 text-sm text-muted">
          {s.residents.length === 0 ? <p>No staff. Barracks first — then hire a watch.</p> : null}
          {s.residents.map((r) => (
            <div key={r.id} className="flex justify-between">
              <span>{r.name}</span>
              <span className="text-ember">{RESIDENT_ROLES[r.role].label}</span>
            </div>
          ))}
        </div>
      </Panel>

      <TerminalCard />

      <div className="flex flex-wrap gap-2">
        <Button variant="quiet" onClick={() => setScreen("map")}>
          <Swords className="size-4" /> Deploy
        </Button>
        <Button variant="quiet" onClick={() => setScreen("ledger")}>
          <Landmark className="size-4" /> Ledger
        </Button>
      </div>
    </div>
  );
}

export function RosterView() {
  const s = useGame((g) => g.s);
  const select = useGame((g) => g.selectOp);
  const setScreen = useGame((g) => g.setScreen);
  const [tab, setTab] = useState<"living" | "fallen" | "hof">("living");
  const living = s.operatives.filter((o) => o.status !== "dead");
  const fallen = s.operatives.filter((o) => o.status === "dead");
  const hof = living.filter((o) => o.isHoF);
  const list = tab === "living" ? living : tab === "fallen" ? fallen : hof;

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-end justify-between">
        <div>
          <SectionLabel>Roster</SectionLabel>
          <h2 className="font-display text-2xl">Moon Squad</h2>
        </div>
        <Button variant="ember" size="sm" onClick={() => setScreen("forge")}>
          Forge
        </Button>
      </div>
      <div className="flex gap-2">
        {(["living", "fallen", "hof"] as const).map((t) => (
          <Chip key={t} active={tab === t} onClick={() => setTab(t)}>
            {t === "hof" ? "Fame" : t} · {t === "living" ? living.length : t === "fallen" ? fallen.length : hof.length}
          </Chip>
        ))}
      </div>
      {list.length === 0 ? (
        <Panel>
          <p className="text-sm text-muted">
            {tab === "living" ? "Empty. Forge someone who can walk the Hollow." : "None yet."}
          </p>
          {tab === "living" ? (
            <Button className="mt-3" variant="ember" onClick={() => setScreen("forge")}>
              Forge an operative
            </Button>
          ) : null}
        </Panel>
      ) : null}
      <div className="grid gap-2">
        {list.map((op) => {
          const stats = computeStats(op);
          const primary = stats[op.cls === "Rogue" ? "SPD" : op.cls === "Wizard" ? "INT" : op.cls === "Healer" ? "WIS" : op.cls === "Warrior" ? "STR" : "CHA"];
          return (
            <button
              key={op.id}
              type="button"
              onClick={() => {
                sfx.click();
                select(op.id);
              }}
              className="rounded-[var(--radius-lg)] bg-raised p-4 text-left shadow-[var(--shadow-border)] transition-[box-shadow] hover:shadow-[var(--shadow-border-hover)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Portrait op={op} size={44} />
                  <div>
                    <div className="font-display text-base">{op.name}</div>
                    <div className="text-xs text-muted">
                      {op.cls} · {op.race} · {op.repTitle}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs tabular-nums text-muted">
                    {op.hp}/{op.maxHp}
                  </div>
                  <StatusPill status={op.status} />
                </div>
              </div>
              <HpBar hp={op.hp} max={op.maxHp} className="mt-3 h-2" />
              <p className="mt-2 line-clamp-1 text-xs italic text-moon">{op.destiny}</p>
              <div className="mt-1 flex justify-between text-xs text-muted">
                <span>{op.skillName}</span>
                <span className="tabular-nums">
                  {op.raids} raids · primary {primary}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ForgeView() {
  const s = useGame((g) => g.s);
  const forge = useGame((g) => g.forge);
  const [step, setStep] = useState(0);
  const [name, setName] = useState(() => randomName());
  const [cls, setCls] = useState<ClassName>("Warrior");
  const [race, setRace] = useState(Object.keys(RACES)[0]);
  const [origin, setOrigin] = useState(ORIGINS[0]);
  const lineages = Object.keys(RACES[race].lineage);
  const [lineage, setLineage] = useState(lineages[0]);
  const [rolls, setRolls] = useState<Record<string, number>>({});
  const [spinKey, setSpinKey] = useState<string | null>(null);
  const [spinAll, setSpinAll] = useState(false);
  const cost = forgeCost(s);
  const raceDef = RACES[race];

  const setRaceAndLine = (r: string) => {
    setRace(r);
    setLineage(Object.keys(RACES[r].lineage)[0]);
  };

  const rollOne = (k: string) => {
    if (spinKey || spinAll) return;
    sfx.dice();
    setSpinKey(k);
    window.setTimeout(() => {
      setRolls((p) => ({ ...p, [k]: d20() }));
      setSpinKey(null);
    }, 900);
  };
  const rollAll = () => {
    if (spinKey || spinAll) return;
    sfx.dice();
    setSpinAll(true);
    window.setTimeout(() => {
      setRolls({
        rep: d20(),
        trait: d20(),
        skill: d20(),
        shadow: d20(),
        enchant: d20(),
        destiny: d20(),
      });
      setSpinAll(false);
    }, 980);
  };

  const hollowDecide = (wild = false) => {
    sfx.dice();
    const nextCls = wild ? CLASSES[Math.floor(Math.random() * CLASSES.length)] : cls;
    const raceKeys = Object.keys(RACES);
    const nextRace = wild ? raceKeys[Math.floor(Math.random() * raceKeys.length)] : race;
    const linKeys = Object.keys(RACES[nextRace].lineage);
    const nextLin = wild ? linKeys[Math.floor(Math.random() * linKeys.length)] : lineage;
    const nextOrigin = wild ? ORIGINS[Math.floor(Math.random() * ORIGINS.length)] : origin;
    const next = {
      rep: d20(),
      trait: d20(),
      skill: d20(),
      shadow: d20(),
      enchant: d20(),
      destiny: d20(),
    };
    setCls(nextCls);
    setRaceAndLine(nextRace);
    setLineage(nextLin);
    setOrigin(nextOrigin);
    setRolls(next);
    const msg = forge({
      name: name || randomName(),
      cls: nextCls,
      race: nextRace,
      lineage: nextLin,
      origin: nextOrigin,
      rolls: next,
    });
    err(msg);
  };

  const preview = (
    table: { r: [number, number]; title?: string; name?: string; thread?: string }[],
    n?: number,
  ) => {
    if (!n) return "—";
    const hit = table.find((t) => n >= t.r[0] && n <= t.r[1]);
    return hit?.title || hit?.name || hit?.thread || "—";
  };

  const canForge = name.trim() && Object.keys(rolls).length >= 6;

  return (
    <div className="space-y-4 pb-8">
      <SectionLabel>Character Forge</SectionLabel>
      <h2 className="font-display text-2xl">Make them real</h2>
      <p className="text-sm text-muted">
        {cost === 0 ? "First operative is a gift of the moon." : <>Next forge costs <Coin n={cost} />.</>} Three steps. Six rolls. One life.
      </p>

      <div className="flex gap-2">
        {["Identity", "Blood", "Fate"].map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => {
              sfx.click();
              setStep(i);
            }}
            className={cn(
              "flex min-h-11 flex-1 items-center justify-center rounded-full font-display text-[10px] uppercase tracking-[0.16em]",
              step === i ? "bg-ember text-ink" : "bg-raised text-muted",
            )}
          >
            {i + 1}. {label}
          </button>
        ))}
      </div>

      {step === 0 ? (
        <Panel className="bg-raised">
          <label className="font-display text-[10px] uppercase tracking-wider text-ember">Name</label>
          <div className="mt-1 flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Given name"
              className="h-11 flex-1 rounded-[var(--radius-sm)] bg-ink px-3 text-sm outline-none shadow-[var(--shadow-border)] focus:shadow-[var(--shadow-border-hover)]"
            />
            <Button variant="quiet" onClick={() => setName(randomName())}>
              Random
            </Button>
          </div>
          <label className="mt-5 block font-display text-[10px] uppercase tracking-wider text-ember">Class</label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {CLASSES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  sfx.click();
                  setCls(c);
                }}
                className={cn(
                  "min-h-[4.5rem] rounded-[var(--radius-md)] px-3 py-3 text-left",
                  cls === c ? "bg-ember/10 shadow-[var(--shadow-border-hover)]" : "bg-ink shadow-[var(--shadow-border)]",
                )}
              >
                <span className="flex items-center gap-2 font-display text-sm">
                  <ClassGlyph cls={c} className="text-ember" /> {c}
                </span>
                <p className="mt-1 line-clamp-2 text-[11px] text-muted">{CLASS_LORE[c].tagline}</p>
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-moon">{CLASS_LORE[cls].playstyle}</p>
          <Button className="mt-4 w-full" variant="ember" onClick={() => setStep(1)}>
            Blood and origin
          </Button>
          <Button className="mt-2 w-full" variant="ghost" onClick={() => hollowDecide(true)}>
            Let the Hollow decide
          </Button>
        </Panel>
      ) : null}

      {step === 1 ? (
        <Panel className="bg-raised">
          <label className="font-display text-[10px] uppercase tracking-wider text-ember">Race</label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {Object.keys(RACES).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  sfx.click();
                  setRaceAndLine(r);
                }}
                className={cn(
                  "min-h-14 rounded-[var(--radius-md)] px-3 py-2 text-left text-sm",
                  race === r ? "bg-ember/10 shadow-[var(--shadow-border-hover)]" : "bg-ink shadow-[var(--shadow-border)]",
                )}
              >
                {r}
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm italic text-moon">{raceDef.tagline}</p>
          <p className="mt-1 text-xs text-muted">{raceDef.ability}</p>
          <label className="mt-4 block font-display text-[10px] uppercase tracking-wider text-ember">Lineage</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.keys(raceDef.lineage).map((l) => (
              <Chip key={l} active={lineage === l} onClick={() => setLineage(l)}>
                {l}
              </Chip>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">{raceDef.lineage[lineage]}</p>
          <label className="mt-4 block font-display text-[10px] uppercase tracking-wider text-ember">Origin</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {ORIGINS.map((o) => (
              <Chip key={o} active={origin === o} onClick={() => setOrigin(o)}>
                {o.replace("Dark Enchanted ", "").replace("The ", "")}
              </Chip>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="quiet" className="flex-1" onClick={() => setStep(0)}>
              Back
            </Button>
            <Button className="flex-1" variant="ember" onClick={() => setStep(2)}>
              Roll their fate
            </Button>
          </div>
        </Panel>
      ) : null}

      {step === 2 ? (
        <>
          <Panel className="bg-raised">
            <div className="flex items-center justify-between">
              <SectionLabel>The six rolls</SectionLabel>
              <Button size="sm" variant="ghost" onClick={rollAll}>
                Roll all
              </Button>
            </div>
            {(
              [
                ["rep", "Reputation", REP[cls]],
                [
                  "trait",
                  "Trait",
                  [
                    { r: [1, 4] as [number, number], title: "Weakened" },
                    { r: [5, 9], title: "Standard" },
                    { r: [10, 14], title: "Strong" },
                    { r: [15, 19], title: "Exceptional" },
                    { r: [20, 20], title: "Legendary" },
                  ],
                ],
                ["skill", "Signature", SIGNATURE[cls]],
                ["shadow", "Shadow", SHADOW[cls]],
                ["enchant", "Enchantment", ENCHANTS[cls]],
                ["destiny", "Destiny", DESTINY[cls]],
              ] as const
            ).map(([k, label, table]) => (
              <button
                key={k}
                type="button"
                onClick={() => rollOne(k)}
                className="mt-2 flex w-full min-h-16 items-center gap-3 rounded-[var(--radius-md)] bg-ink px-3 py-2 text-left shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]"
              >
                <Dice20
                  value={rolls[k]}
                  spinning={spinAll || spinKey === k}
                  size={52}
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-[10px] uppercase tracking-wider text-muted">{label}</span>
                  <span className="block truncate text-sm">{preview(table as never, rolls[k])}</span>
                </span>
                <span className="font-display text-[10px] uppercase tracking-wider text-muted">d20</span>
              </button>
            ))}
          </Panel>
          <div className="flex flex-col gap-2">
            <Button
              className="w-full"
              variant="ember"
              disabled={!canForge}
              onClick={() => err(forge({ name, cls, race, lineage, origin, rolls }))}
            >
              {cost === 0 ? "Forge" : <>Forge · <Coin n={cost} /></>}
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => hollowDecide(false)}>
              Let the Hollow decide
            </Button>
            <Button variant="quiet" onClick={() => setStep(1)}>
              Back
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}

export function MapView() {
  const s = useGame((g) => g.s);
  const selectLoc = useGame((g) => g.selectLoc);
  const deploy = useGame((g) => g.deploy);
  const loc = s.selectedLoc ?? "ironclad";
  const L = locById(loc);
  const idle = idleAtHq(s);
  const [party, setParty] = useState<string[]>([]);
  const [kind, setKind] = useState<MissionKind>("scout");
  const touched = useRef(false);
  const progress = s.locations[loc];
  const merchant = NPCS.find((n) => n.loc === loc);
  const buy = useGame((g) => g.buyNpc);

  const idleIds = idle.map((o) => o.id).join(",");
  const lastPartyKey = (s.lastParty ?? []).join(",");
  useEffect(() => {
    const present = idleIds.split(",").filter(Boolean);
    const same = (a: string[], b: string[]) => a.length === b.length && a.every((id, i) => id === b[i]);
    if (touched.current) {
      setParty((p) => {
        const next = p.filter((id) => present.includes(id));
        return same(p, next) ? p : next;
      });
      return;
    }
    const remembered = lastPartyKey.split(",").filter((id) => present.includes(id));
    if (remembered.length) {
      setParty((p) => (same(p, remembered) ? p : remembered));
      return;
    }
    if (s.tutorial === "sortie" && present.length) {
      const next = [present[0]];
      setParty((p) => (same(p, next) ? p : next));
      setKind((k) => (k === "scout" ? k : "scout"));
    }
  }, [s.tutorial, idleIds, lastPartyKey]);

  const kinds: { id: MissionKind; label: string; locked?: boolean }[] = [
    { id: "scout", label: "Scout" },
    { id: "forage", label: "Forage" },
    { id: "raid", label: "Raid" },
    { id: "trade", label: "Trade", locked: !merchant },
    { id: "bounty", label: "Bounty", locked: !s.bounty || s.bounty.location !== loc },
    {
      id: "boss",
      label: progress.bossDefeated ? "Cleared" : "Arc boss",
      locked: !progress.bossUnlocked || progress.bossDefeated,
    },
  ];

  const toggle = (id: string) => {
    touched.current = true;
    setParty((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 3 ? p : [...p, id]));
  };

  const dangerTone = ["text-ok", "text-ok", "text-ember", "text-danger", "text-danger"][Math.max(0, L.danger - 1)];

  return (
    <div className="space-y-4 pb-8">
      <div>
        <SectionLabel>The Hollow Realm</SectionLabel>
        <h2 className="font-display text-2xl">Deploy</h2>
      </div>

      <WorldAtlas loc={loc} onSelect={(id) => s.locations[id].unlocked && selectLoc(id)} />

      <div className="flex gap-1 overflow-x-auto pb-1">
        {ARC_ORDER.map((id, i) => {
          const w = locById(id);
          const p = s.locations[id];
          const here = currentArcLoc(s) === id;
          return (
            <span
              key={id}
              className={cn(
                "shrink-0 rounded-full px-2.5 py-1 font-display text-[10px] uppercase tracking-[0.14em]",
                p.bossDefeated ? "bg-ok/15 text-ok" : here ? "bg-ember/15 text-ember" : "bg-ink text-muted",
              )}
            >
              {i + 1}. {w.short}
            </span>
          );
        })}
      </div>
      {s.arc && s.squad.length > 1 ? (
        <Panel className="glass-strong bg-transparent">
          <p className="font-display text-[10px] uppercase tracking-[0.2em] text-ember">
            Main ARC · turn {s.arc.turn} · {s.squad.find((m) => m.id === s.arc?.turnMemberId)?.name}
          </p>
          <p className="mt-1 text-sm text-moon">
            Raid, bounty, and boss in {locById(currentArcLoc(s)).short} wait on that rider. Scout and forage stay open.
          </p>
        </Panel>
      ) : null}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {WORLD.filter((w) => w.id !== "hq").map((w) => {
          const unlocked = s.locations[w.id].unlocked;
          return (
            <Chip
              key={w.id}
              active={loc === w.id}
              disabled={!unlocked}
              onClick={() => unlocked && selectLoc(w.id as LocationId)}
            >
              {!unlocked ? <Lock className="mr-1 inline size-3" /> : null}
              {w.short}
            </Chip>
          );
        })}
      </div>

      <Panel className="bg-raised">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-lg">{L.name}</h3>
            <p className="text-sm text-muted">{L.desc}</p>
            <p className={cn("mt-1 font-display text-[10px] uppercase tracking-[0.16em]", dangerTone)}>
              Danger {L.danger} · intel {progress.intel} · sorties {progress.missions}
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {L.features.map((f) => (
            <span key={f} className="rounded-full bg-ink px-2 py-1 text-[11px] text-muted">
              {f}
            </span>
          ))}
        </div>
        {loc === "hq" ? (
          <p className="mt-3 text-sm text-muted">HQ is rest, not a sortie. Pick a region.</p>
        ) : !progress.unlocked ? (
          <p className="mt-3 text-sm text-muted">Sealed. Survive more days.</p>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {kinds.map((k) => {
                const Icon = KIND_ICON[k.id];
                return (
                  <button
                    key={k.id}
                    type="button"
                    disabled={k.locked}
                    onClick={() => {
                      sfx.click();
                      setKind(k.id);
                    }}
                    className={cn(
                      "flex min-h-16 flex-col items-start justify-center rounded-[var(--radius-md)] px-2.5 py-2 text-left disabled:opacity-30",
                      kind === k.id
                        ? "bg-ember/15 shadow-[var(--shadow-border-hover)]"
                        : "bg-ink shadow-[var(--shadow-border)]",
                    )}
                  >
                    <span className="flex items-center gap-1.5 font-display text-[11px] uppercase tracking-wider">
                      <Icon className="size-3.5 text-ember" /> {k.label}
                    </span>
                    <span className="mt-1 line-clamp-2 text-[11px] text-muted">{KIND_HELP[k.id]}</span>
                  </button>
                );
              })}
            </div>
            {kind === "bounty" && s.bounty ? (
              <p className="mt-3 text-sm text-moon">
                {s.bounty.name} · DC {s.bounty.dc} · {s.bounty.reward}
              </p>
            ) : null}
            {kind === "boss" ? (
              <p className="mt-3 text-sm text-ember">{VILLAINS.find((v) => v.loc === loc)?.tagline}</p>
            ) : null}

            <SectionLabel>Party · max 3</SectionLabel>
            {idle.length === 0 ? (
              <p className="text-sm text-muted">No idle operatives at HQ. Heal, rest, or wait for a return.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {idle.map((op) => {
                  const on = party.includes(op.id);
                  return (
                    <button
                      key={op.id}
                      type="button"
                      onClick={() => {
                        sfx.click();
                        toggle(op.id);
                      }}
                      className={cn(
                        "flex min-h-14 items-center gap-2 rounded-[var(--radius-md)] px-2.5 py-2",
                        on ? "bg-ember/15 shadow-[var(--shadow-border-hover)]" : "bg-ink shadow-[var(--shadow-border)]",
                      )}
                    >
                      <Portrait op={op} size={32} />
                      <span className="text-left">
                        <span className="block font-display text-sm">{op.name}</span>
                        <span className="block text-[11px] text-muted">{op.cls}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </Panel>

      {merchant && progress.unlocked ? (
        <Panel>
          <SectionLabel>
            {merchant.name} · {merchant.title}
          </SectionLabel>
          <p className="text-sm italic text-moon">“{merchant.quote}”</p>
          <div className="mt-3 space-y-2">
            {merchant.stock.map((st) => (
              <div key={st.name} className="flex items-center justify-between gap-3 text-sm">
                <span>{st.name}</span>
                <Button size="sm" variant="ghost" onClick={() => err(buy(st.name, st.price))}>
                  <Coin n={st.price} />
                </Button>
              </div>
            ))}
          </div>
        </Panel>
      ) : null}

      {loc !== "hq" && progress.unlocked ? (
        <div className="sticky bottom-20 z-10 -mx-4 bg-gradient-to-t from-ink via-ink/95 to-transparent px-4 pt-8 pb-1 md:bottom-4 md:mx-0 md:px-0">
          <Button
            className={cn("w-full", s.tutorial === "sortie" && "ms-nudge")}
            variant="ember"
            sound="none"
            disabled={!party.length}
            onClick={() => {
              const msg = deploy(loc, kind, party);
              if (msg) err(msg);
              else {
                sfx.deploy();
                touched.current = false;
                setParty([]);
              }
            }}
          >
            Deploy {party.length ? `· ${party.length} to ${L.short}` : "— pick who walks"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

const KIND_ICON: Record<MissionKind, typeof Eye> = {
  scout: Eye,
  forage: Package,
  raid: Swords,
  trade: Scale,
  bounty: Crosshair,
  boss: Skull,
};

export function LedgerView() {
  const s = useGame((g) => g.s);
  const buy = useGame((g) => g.buyOffer);
  const deposit = useGame((g) => g.depositCard);
  const withdraw = useGame((g) => g.withdrawCard);
  const register = useGame((g) => g.registerRider);
  const shop = s.shop;
  const me = seatedMember(s);
  const [amt, setAmt] = useState("100");
  const [plateName, setPlateName] = useState(isVacant(me) ? "" : me.name);
  const [plateHandle, setPlateHandle] = useState(me.discordHandle?.replace(/^@/, "") ?? "");
  const n = Math.max(0, Math.floor(Number(amt) || 0));

  useEffect(() => {
    setPlateName(isVacant(me) ? "" : me.name);
    setPlateHandle(me.discordHandle?.replace(/^@/, "") ?? "");
  }, [me.id, me.name, me.discordHandle]);

  return (
    <div className="space-y-4 pb-8">
      <SectionLabel>The Ledger</SectionLabel>
      <h2 className="font-display text-2xl">Personal balance</h2>
      <p className="text-sm text-muted">
        Compound vault is shared. The black card is whoever is seated. Stamp a name and handle — a new rider gets their
        own plate.
      </p>

      <MoonCard member={me} />

      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          err(register(plateName, plateHandle));
        }}
      >
        <SectionLabel>{isVacant(me) ? "Claim this plate" : "Stamp this plate"}</SectionLabel>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={plateName}
            onChange={(e) => setPlateName(e.target.value)}
            placeholder="Player name"
            aria-label="Cardholder name"
            className="min-h-11 min-w-0 flex-1 rounded-[var(--radius-sm)] bg-ink px-3 text-sm text-paper shadow-[var(--shadow-border)] outline-none"
          />
          <input
            value={plateHandle}
            onChange={(e) => setPlateHandle(e.target.value)}
            placeholder="@handle or snowflake"
            aria-label="Discord handle"
            className="min-h-11 min-w-0 flex-1 rounded-[var(--radius-sm)] bg-ink px-3 text-sm text-paper shadow-[var(--shadow-border)] outline-none"
          />
          <Button type="submit" variant="ember">
            {isVacant(me) ? "Claim" : "Stamp"}
          </Button>
        </div>
        <p className="text-xs text-muted">
          Paste a Tyrone link in the handle field and it will sit that rider. Squad holds everyone else on this file.
        </p>
      </form>

      <div className="grid grid-cols-2 gap-2">
        <Panel className="bg-raised">
          <SectionLabel>Compound</SectionLabel>
          <p className="font-display text-2xl tabular-nums">
            <Coin n={s.coins} />
          </p>
        </Panel>
        <Panel className="bg-raised">
          <SectionLabel>Your card</SectionLabel>
          <p className="font-display text-2xl tabular-nums text-ember">
            <Coin n={me.personalCaps} />
          </p>
        </Panel>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={amt}
          onChange={(e) => setAmt(e.target.value.replace(/[^\d]/g, ""))}
          inputMode="numeric"
          aria-label="Amount"
          className="min-h-11 min-w-0 flex-1 rounded-[var(--radius-sm)] bg-ink px-3 text-sm text-paper shadow-[var(--shadow-border)] outline-none"
        />
        <Button variant="ember" className="flex-1" onClick={() => err(deposit(n))}>
          Deposit
        </Button>
        <Button variant="ghost" className="flex-1" onClick={() => err(withdraw(n))}>
          Withdraw
        </Button>
      </div>

      <h3 className="font-display text-xl">Daily stock</h3>
      <p className="text-sm text-muted">Pays from the compound vault. Refreshes at dawn. Ledger 3 grants a discount.</p>
      {!shop ? (
        <Panel>
          <p className="text-sm">No stock until you assume command.</p>
        </Panel>
      ) : (
        (["bargain", "essential", "artifact"] as const).map((tier) => {
          const o = shop[tier];
          const sold = shop.bought?.[tier];
          const disc = s.rooms.ledger >= 3 ? 0.85 : 1;
          const price = Math.round(o.price * disc);
          return (
            <Panel key={tier} className="bg-raised">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-[10px] uppercase tracking-[0.2em] text-ember">{tier}</span>
                    <RarityMark rarity={o.rarity} />
                  </div>
                  <div className="mt-1 font-display text-lg">{o.name}</div>
                  <p className="text-sm text-muted">{o.effect}</p>
                </div>
                <Button variant="ghost" onClick={() => err(buy(tier))} disabled={sold || s.coins < price}>
                  {sold ? "Sold" : <Coin n={price} />}
                </Button>
              </div>
            </Panel>
          );
        })
      )}
      <Panel>
        <SectionLabel>Treasury</SectionLabel>
        <p className="mt-1 text-sm text-muted">
          Hollow Ore {s.ore} · Moon Favor {s.moonFavor}
          {s.challengeCoin ? " · Challenge Coin held" : ""}
        </p>
        <p className="mt-3 text-xs text-muted">
          Vault holds {s.vault.length} gear pieces. Idle income {incomePerTick(s)} caps per tick.
        </p>
      </Panel>
      <Panel>
        <SectionLabel>Command log</SectionLabel>
        <div className="max-h-64 space-y-2 overflow-y-auto ms-scroll">
          {s.log.length === 0 ? <p className="text-sm text-muted">Nothing written yet.</p> : null}
          {s.log.slice(0, 24).map((e) => (
            <div key={e.id} className="border-b border-line/40 pb-2 text-sm last:border-0">
              <div className="font-display text-[10px] uppercase tracking-wider text-ember">
                Day {e.day} · {e.who}
              </div>
              <div className="text-moon">{e.what}</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

export function SquadView() {
  const s = useGame((g) => g.s);
  const register = useGame((g) => g.registerRider);
  const playAs = useGame((g) => g.playAs);
  const gift = useGame((g) => g.giftRider);
  const pass = useGame((g) => g.passTurn);
  const me = seatedMember(s);
  const turn = s.squad.find((m) => m.id === s.arc?.turnMemberId);
  const [q, setQ] = useState("");
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [giftAmt, setGiftAmt] = useState("50");
  const [picked, setPicked] = useState<string | null>(null);
  const query = q.trim().toLowerCase();
  const rows = s.squad.filter((m) => {
    if (!query) return true;
    return (
      m.name.toLowerCase().includes(query) ||
      (m.discordHandle ?? "").toLowerCase().includes(query) ||
      (m.discordId ?? "").toLowerCase().includes(query)
    );
  });
  const profile = s.squad.find((m) => m.id === picked) ?? null;

  return (
    <div className="space-y-4 pb-8">
      <SectionLabel>Moon Squad</SectionLabel>
      <h2 className="font-display text-2xl">The file</h2>
      <p className="text-sm text-muted">
        One campaign. Many riders. Register a name and handle, search the list, sit in their chair when the ARC turn
        comes around. Their black card paints the moment they sit.
      </p>

      <TyroneHandshake />

      <Panel className="glass-strong bg-transparent">
        <p className="font-display text-[10px] uppercase tracking-[0.2em] text-ember">
          Arc {s.arc?.chapter ?? 1} · {locById(currentArcLoc(s)).name}
        </p>
        <p className="mt-2 text-sm text-moon">
          Seated as {me.name}
          {turn ? ` · ARC turn ${turn.name}` : ""}
        </p>
        {s.squad.length > 1 ? (
          <Button variant="quiet" className="mt-3" onClick={() => pass()}>
            Pass ARC turn
          </Button>
        ) : null}
      </Panel>

      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          err(register(name, handle));
          setName("");
          setHandle("");
        }}
      >
        <SectionLabel>Register a rider</SectionLabel>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Player name"
            className="min-h-11 min-w-0 flex-1 rounded-[var(--radius-sm)] bg-ink px-3 text-sm text-paper shadow-[var(--shadow-border)] outline-none"
          />
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="Discord handle"
            className="min-h-11 min-w-0 flex-1 rounded-[var(--radius-sm)] bg-ink px-3 text-sm text-paper shadow-[var(--shadow-border)] outline-none"
          />
          <Button type="submit" variant="ember">
            Register
          </Button>
        </div>
      </form>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search name or handle"
        aria-label="Search squad"
        className="min-h-11 w-full rounded-[var(--radius-sm)] bg-ink px-3 text-sm text-paper shadow-[var(--shadow-border)] outline-none"
      />

      <div className="space-y-2">
        {rows.length === 0 ? (
          <Panel>
            <p className="text-sm text-muted">No rider matches.</p>
          </Panel>
        ) : (
          rows.map((m) => {
            const onTurn = s.arc?.turnMemberId === m.id;
            const seated = s.activeMemberId === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  sfx.click();
                  setPicked(m.id);
                }}
                className={cn(
                  "flex w-full min-h-14 items-center gap-3 rounded-[var(--radius-md)] px-3 py-3 text-left shadow-[var(--shadow-border)]",
                  seated ? "bg-ember/10" : "bg-raised",
                )}
              >
                <span className="flex size-11 items-center justify-center rounded-full bg-ink font-display text-sm text-ember">
                  {m.name.slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-sm">{m.name}</span>
                  <span className="block truncate text-[11px] text-muted">
                    {m.discordHandle ?? "no handle"} · <Coin n={m.personalCaps} />
                  </span>
                </span>
                {onTurn ? (
                  <span className="font-display text-[10px] uppercase tracking-[0.16em] text-ember">Turn</span>
                ) : null}
              </button>
            );
          })
        )}
      </div>

      {profile ? (
        <Panel className="bg-raised">
          <SectionLabel>Profile</SectionLabel>
          <h3 className="font-display text-xl">{profile.name}</h3>
          <p className="text-sm text-moon">{profile.discordHandle ?? "Unlinked"}</p>
          <p className="mt-2 text-sm text-muted">
            Joined day {profile.joinedDay} · card <Coin n={profile.personalCaps} /> · XP {profile.xp}
          </p>
          {profile.note ? <p className="mt-2 text-sm text-moon">{profile.note}</p> : null}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button variant="ember" className="flex-1" onClick={() => playAs(profile.id)}>
              Sit as {profile.name.split(" ")[0]}
            </Button>
            {profile.id !== me.id ? (
              <div className="flex flex-1 gap-2">
                <input
                  value={giftAmt}
                  onChange={(e) => setGiftAmt(e.target.value.replace(/[^\d]/g, ""))}
                  inputMode="numeric"
                  aria-label="Gift amount"
                  className="min-h-11 w-24 rounded-[var(--radius-sm)] bg-ink px-3 text-sm text-paper shadow-[var(--shadow-border)] outline-none"
                />
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => err(gift(profile.id, Number(giftAmt) || 0))}
                >
                  Send caps
                </Button>
              </div>
            ) : null}
          </div>
        </Panel>
      ) : null}

      {s.arc?.log.length ? (
        <Panel>
          <SectionLabel>ARC log</SectionLabel>
          <ul className="space-y-1.5 text-sm text-muted">
            {s.arc.log.slice(0, 8).map((line, i) => (
              <li key={`${i}-${line.slice(0, 12)}`}>{line}</li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </div>
  );
}

export function CodexView() {
  const [tab, setTab] = useState<"arcs" | "races" | "rules">("arcs");
  const how = useMemo(
    () => [
      {
        t: "d20",
        d: "1 fumble. 2–4 fail. 5–9 weak. 10–14 success. 15–19 strong. 20 critical.",
      },
      {
        t: "Power",
        d: "Class + race + trait on the primary stat + gear + companion − curses.",
      },
      {
        t: "Downed",
        d: "0 HP. Infirmary can stand them up. Rest without an Infirmary kills them permanently.",
      },
      {
        t: "Fumble",
        d: "Weapons degrade Pristine → Worn → Damaged → Broken. Broken deals nothing. Pay the Forge.",
      },
      {
        t: "Arcs",
        d: "Ironclad first, then Kingdom, Caverns, Library, Veyra City last. Raid, bounty, and the chapter boss wait on the rider whose turn it is.",
      },
      {
        t: "Moon Squad",
        d: "We walk the Hollow so others don't have to.",
      },
    ],
    [],
  );
  return (
    <div className="space-y-4 pb-8">
      <SectionLabel>Codex</SectionLabel>
      <h2 className="font-display text-2xl">What the Hollow remembers</h2>
      <div className="flex gap-2">
        {(["arcs", "races", "rules"] as const).map((t) => (
          <Chip key={t} active={tab === t} onClick={() => setTab(t)}>
            {t}
          </Chip>
        ))}
      </div>
      {tab === "arcs" &&
        VILLAINS.map((v) => (
          <Panel key={v.id} className="bg-raised">
            <div className="font-display text-[10px] uppercase tracking-[0.2em] text-ember">{v.arc}</div>
            <h3 className="mt-1 font-display text-lg">{v.name}</h3>
            <p className="text-xs text-muted">
              {v.title} · {v.threat}
            </p>
            <p className="mt-2 text-sm italic text-moon">{v.tagline}</p>
            <p className="mt-2 text-sm text-muted">{v.lore}</p>
          </Panel>
        ))}
      {tab === "races" &&
        Object.values(RACES).map((r) => (
          <Panel key={r.name} className="bg-raised">
            <h3 className="font-display text-lg">{r.name}</h3>
            <p className="text-sm italic text-moon">{r.tagline}</p>
            <p className="mt-2 text-sm">{r.ability}</p>
            <p className="mt-2 text-xs text-muted">{r.desc}</p>
          </Panel>
        ))}
      {tab === "rules" && (
        <Panel className="space-y-4 text-sm leading-relaxed text-moon">
          {how.map((h) => (
            <p key={h.t}>
              <strong className="text-paper">{h.t}.</strong> {h.d}
            </p>
          ))}
        </Panel>
      )}
    </div>
  );
}
