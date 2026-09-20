import { Button } from "@/components/ui/button";
import {
  BASE_ROOMS,
  CLASS_LORE,
  CLASSES,
  NPCS,
  ORIGINS,
  QUARTERS,
  RACES,
  RESIDENT_ROLES,
  VILLAINS,
  WORLD,
  locById,
  regionById,
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
import { currentArcLoc, isVacant, seatedMember } from "@/game/squad";
import type { ClassName, LocationId, LocationProgress, MissionApproach, MissionKind, RoomId } from "@/game/types";
import { cn } from "@/lib/cn";
import {
  Archive,
  BedDouble,
  Crosshair,
  Eye,
  Globe2,
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
  Radio,
} from "lucide-react";
import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
import { TerminalCard, TyroneHandshake } from "./menu";
import { WakeScene } from "./wake-scene";
import { PorchStrip } from "./porch-presence";
import { useOpeningBeat } from "@/game/opening";
import { RadioChip } from "./radio-deck";
import { Dice20 } from "./dice";
import { ForgeBody } from "./forge-body";
import { MoonCard } from "./card";
import { regionThumb } from "@/game/art";
import { CALIBER_ROSTER, ARC_OPEN, campaignOpenRegions } from "@/game/arsenal";
import { APPROACHES, KANE_STAKES, defaultPoi, kaneBand, knownPois, locationToRegion } from "@/game/field-ops";
import { WATCH_LABEL } from "@/game/shift";
import { className, displayRace } from "@/game/presentation";
import { FATE_COPY, FATE_KEYS, STAT_ORDER, fateLanding } from "@/game/stats-copy";
import { punchClick, shockwaveAt } from "@/game/juice";
import { OrbitTheater, RegionMapOverlay } from "./orbit-theater";

function err(msg: string | null) {
  if (!msg) {
    sfx.coin();
    return;
  }
  sfx.hurt();
  useGame.setState((st) => ({ s: { ...st.s, toast: msg } }));
}

function DayBoard() {
  const s = useGame((g) => g.s);
  const openTask = useGame((g) => g.openTask);
  const rest = useGame((g) => g.rest);
  const board = s.shift?.board ?? [];
  const left = s.shift?.watchesLeft ?? 6;
  const watch = s.shift?.watch ?? "dawn";
  if (!board.length) return null;
  return (
    <div className="mt-4 rounded-[var(--radius-md)] bg-ink/55 p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="font-display text-[10px] uppercase tracking-[0.2em] text-ember">Today's board</div>
          <p className="mt-0.5 text-sm text-moon">
            {WATCH_LABEL[watch]} · {left} watch{left === 1 ? "" : "es"} left
          </p>
        </div>
        {left <= 0 ? (
          <Button size="sm" variant="ember" onClick={() => rest()}>
            Rest
          </Button>
        ) : null}
      </div>
      <div className="mt-3 space-y-2">
        {board.map((task) => {
          const closed = task.status === "done" || task.status === "failed";
          return (
            <button
              key={task.id}
              type="button"
              disabled={closed || left < task.watchCost}
              onClick={(e) => {
                punchClick(e.clientX, e.clientY);
                const msg = openTask(task.id);
                if (msg) err(msg);
              }}
              className={cn(
                "flex min-h-14 w-full items-center justify-between gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-left",
                closed ? "bg-surface/40 text-muted" : "bg-surface/90 shadow-[var(--shadow-border)]",
                task.required && !closed && "shadow-[var(--shadow-border-hover)]",
              )}
            >
              <span className="min-w-0">
                <span className="block truncate font-display text-sm text-paper">{task.title}</span>
                <span className="block truncate text-[11px] text-muted">
                  {task.required ? "Required · " : ""}
                  {task.watchCost}w · {task.kind}
                  {task.report ? ` · ${task.report}` : ""}
                </span>
              </span>
              <span className="shrink-0 font-display text-[10px] uppercase tracking-[0.14em] text-ember">
                {closed ? task.status : "Take"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
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
  scout: "Walk the edges. You mark sites on the ground map and come home with intel, not a body count. Low blood. Kane is slower to notice. This is how a new region opens.",
  forage: "Take what the land already dropped. Caps, ore, scraps, the odd crate. Combat is rare. The haul is thinner than a raid, and you keep your name off AEGIS paper.",
  raid: "Kick a door. Combat is likely. Better loot, more heat. Kane's people hear it. Bring someone who can take a hit and do not go alone.",
  trade: "Find this region's merchant and pay their price. No dice for blood. Caps in, goods out. Daily stalls live at the Moon Squad Market. This button is the region's own trader.",
  bounty: "Hunt the named target Tyrone posted on today's board. Combat is the point. The card pays if they drop. Fail and the name walks.",
  boss: "The name that surfaced for this arc. Not a daily job. Bring a party of three if you have them. Win and the region closes that chapter.",
};

const KIND_TAG: Record<MissionKind, string> = {
  scout: "Intel, low blood",
  forage: "Salvage, rare fights",
  raid: "Combat, richer haul",
  trade: "Caps for goods",
  bounty: "Named hunt",
  boss: "Arc closer",
};

export { MainMenu as TitleScreen } from "./menu";

export function Briefing() {
  const go = useGame((g) => g.finishBriefing);
  const talk = useGame((g) => g.s.talk);
  const beat = useOpeningBeat();
  const [curtain, setCurtain] = useState(true);
  const wakeLine = talk?.script === "wake" ? talk.i : 0;

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hold = beat === "wake" && !reduced ? 420 : reduced ? 80 : 280;
    const t = window.setTimeout(() => setCurtain(false), hold);
    return () => window.clearTimeout(t);
  }, [beat]);

  return (
    <div className="relative flex h-dvh flex-col justify-end overflow-hidden bg-ink px-5 py-8" data-briefing="1">
      <WakeScene line={wakeLine} />
      <div
        className={cn("ms-opening-curtain", !curtain && "is-up")}
        data-opening={curtain ? "black" : "wake"}
        aria-hidden
      />
      <div className="relative z-[2] mx-auto mb-36 w-full max-w-xl">
        {!talk ? (
          <>
            <p className="font-display text-[11px] uppercase tracking-[0.42em] text-ember">S.Y.N.A.P.S.E · T-0880</p>
            <h2 className="mt-2 font-display text-4xl text-paper">On your feet.</h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-moon">
              He found you three miles east of the old highway. Vault 13 is waiting.
            </p>
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
          </>
        ) : null}
      </div>
    </div>
  );
}

function PlateClock() {
  const me = useGame((g) => seatedMember(g.s));
  const tapped = useGame((g) => g.s.clocks?.cardTap ?? 0);
  const clock = useGame((g) => g.clockPlate);
  const setScreen = useGame((g) => g.setScreen);
  const vacant = isVacant(me);
  return (
    <button
      type="button"
      onClick={() => {
        if (vacant) {
          sfx.hurt();
          setScreen("ledger");
          return;
        }
        const msg = clock();
        if (msg) sfx.hurt();
        else {
          sfx.swipe();
          sfx.coin();
        }
      }}
      className="mt-3 flex min-h-14 w-full items-center justify-between gap-3 rounded-[var(--radius-md)] bg-ink/55 px-3 py-2 text-left shadow-[var(--shadow-border)]"
    >
      <span className="min-w-0">
        <span className="flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.18em] text-ember">
          Black card
        </span>
        <span className="mt-0.5 block font-display text-sm text-paper">
          {vacant ? "Stamp a plate to clock in" : tapped ? `${me.name} already clocked` : `Clock ${me.name}'s plate`}
        </span>
        <span className="block truncate text-[11px] text-muted">
          Daily personal caps. Slots buy in from this plate.
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block font-display text-base tabular-nums text-ember">{me.personalCaps.toLocaleString()}</span>
        <span className="font-display text-[10px] uppercase tracking-[0.14em] text-ember">
          {vacant ? "Stamp" : tapped ? "Done" : "Clock"}
        </span>
      </span>
    </button>
  );
}


const EMPTY_PROGRESS: LocationProgress = {
  unlocked: false,
  intel: 0,
  missions: 0,
  bossUnlocked: false,
  bossDefeated: false,
  discoveredPois: [],
};

class MapErrorBoundary extends Component<{ children: ReactNode; onReset?: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    console.warn("hollow map", error);
  }
  render() {
    if (this.state.failed) {
      return (
        <Panel className="bg-raised">
          <p className="text-sm text-muted">The map blinked. Use the list until the CRT settles.</p>
          <Button
            className="mt-3"
            variant="ghost"
            onClick={() => {
              this.setState({ failed: false });
              this.props.onReset?.();
            }}
          >
            Dismiss
          </Button>
        </Panel>
      );
    }
    return this.props.children;
  }
}

function SquadWing() {
  return (
    <div className="space-y-5" data-moon-squad="1">
      <div className="relative min-h-40 overflow-hidden rounded-[var(--radius-xl)] shadow-[var(--shadow-border)]">
        <img src="/art/rooms/squad.jpg" alt="" className="absolute inset-0 size-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/25" />
        <div className="relative px-5 py-6">
          <SectionLabel>Vault 13 · briefing</SectionLabel>
          <h2 className="mt-1 font-display text-2xl text-paper">Moon Squad</h2>
          <p className="mt-1 max-w-xl text-sm text-moon">The briefing room. Roster and the rider file live here now — not a dock tab.</p>
        </div>
      </div>
      <RosterView />
      <SquadView />
    </div>
  );
}

export function HQView() {
  const [pane, setPane] = useState<"compound" | "squad">("compound");
  return (
    <div className="space-y-5 pb-4" data-hq-pane={pane}>
      <div className="flex flex-wrap gap-2" data-hq-tabs="1">
        <Chip active={pane === "compound"} onClick={() => setPane("compound")}>
          Compound
        </Chip>
        <Chip active={pane === "squad"} onClick={() => setPane("squad")}>
          Moon Squad
        </Chip>
      </div>
      {pane === "squad" ? <SquadWing /> : <CompoundWing />}
    </div>
  );
}

function CompoundWing() {
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

        <DayBoard />

        <PorchStrip />

        <PlateClock />

        <button
          type="button"
          onClick={(e) => {
            punchClick(e.clientX, e.clientY);
            setScreen("arcade");
          }}
          className="mt-3 flex min-h-14 w-full items-center justify-between gap-3 rounded-[var(--radius-md)] bg-ink/55 px-3 py-2 text-left shadow-[var(--shadow-border)]"
        >
          <span className="min-w-0">
            <span className="flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.18em] text-ember">
              <Radio className="size-3.5" /> T-0888
            </span>
            <span className="mt-0.5 block font-display text-sm text-paper">Sit the cabinet</span>
            <span className="block truncate text-[11px] text-muted">Buy-in is the black card. House takes a rake.</span>
          </span>
          <span className="shrink-0 font-display text-[10px] uppercase tracking-[0.14em] text-ember">Play</span>
        </button>

        <div className="mt-3">
          <RadioChip />
        </div>

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
                      {className(op.cls)} · {displayRace(op.race)} · {op.repTitle}
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
  const stamped = (s.playerName ?? "").trim();
  const nameLocked = Boolean(stamped);
  const [step, setStep] = useState(() => (nameLocked && s.operatives.length === 0 ? 2 : 0));
  const [name, setName] = useState(() => stamped || randomName());
  const [cls, setCls] = useState<ClassName>("Warrior");
  const [race, setRace] = useState(Object.keys(RACES)[0]);
  const [origin, setOrigin] = useState(ORIGINS[0]);
  const lineages = Object.keys(RACES[race].lineage);
  const [lineage, setLineage] = useState(lineages[0]);
  const [bodyI, setBodyI] = useState(0);
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
      const next: Record<string, number> = {
        rep: d20(),
        trait: d20(),
        skill: d20(),
        shadow: d20(),
        enchant: d20(),
        destiny: d20(),
      };
      for (const k of STAT_ORDER) next[k] = d20();
      setRolls(next);
      setSpinAll(false);
      setBodyI(7);
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
    const next: Record<string, number> = {
      rep: d20(),
      trait: d20(),
      skill: d20(),
      shadow: d20(),
      enchant: d20(),
      destiny: d20(),
    };
    for (const k of STAT_ORDER) next[k] = d20();
    setCls(nextCls);
    setRaceAndLine(nextRace);
    setLineage(nextLin);
    setOrigin(nextOrigin);
    setRolls(next);
    setStep(2);
    setBodyI(7);
    useGame.setState((st) => ({
      s: { ...st.s, toast: wild ? "Tyrone picked the whole card. Read the recap, then stamp." : "Tyrone rolled the thirteen. Read them. Then stamp." },
    }));
  };

  const canForge =
    Boolean((nameLocked ? stamped : name).trim()) &&
    FATE_KEYS.every((k) => typeof rolls[k] === "number") &&
    STAT_ORDER.every((k) => typeof rolls[k] === "number");

  return (
    <div className="space-y-4 pb-8">
      <SectionLabel>Character Forge</SectionLabel>
      <h2 className="font-display text-2xl">{nameLocked && s.operatives.length === 0 ? "Roll their fate" : "Make them real"}</h2>
      <p className="text-sm text-muted">
        {nameLocked && s.operatives.length === 0
          ? `${stamped} is already on the black card. Class and blood can wait. The body dice do not.`
          : cost === 0
            ? "First operative is a gift of the moon."
            : <>Next forge costs <Coin n={cost} />.</>}{" "}
        {!(nameLocked && s.operatives.length === 0) ? "Three steps. Body and fate. Thirteen dice. One life." : "Seven body dice. Six fate dice. One life."}
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
          {nameLocked ? (
            <div className="rounded-[var(--radius-sm)] bg-ink px-3 py-3 shadow-[var(--shadow-border)]">
              <p className="font-display text-[10px] uppercase tracking-wider text-ember">Stamped name</p>
              <p className="mt-1 font-display text-lg text-paper">{stamped}</p>
              <p className="mt-1 text-xs text-muted">Tyrone already has this from the black card. The dice do the rest.</p>
            </div>
          ) : (
            <>
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
            </>
          )}
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
                  <ClassGlyph cls={c} className="text-ember" /> {className(c)}
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
                {o}
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
          <ForgeBody
            cls={cls}
            raceStats={raceDef.stats}
            rolls={rolls}
            spinKey={spinKey}
            spinAll={spinAll}
            bodyI={bodyI}
            setBodyI={setBodyI}
            onRoll={rollOne}
            onRollAll={rollAll}
          />
          {bodyI >= STAT_ORDER.length ? (
            <>
          <div data-forge-fate="1">
          <Panel className="bg-raised">
            <SectionLabel>Fate · six rolls</SectionLabel>
            <p className="mt-2 text-sm leading-relaxed text-moon">
              These stamp who they were. Each die lands a real bonus, penalty, or thread — not flavor. Read the buff before you stamp.
            </p>
            {FATE_KEYS.map((k) => {
              const n = rolls[k];
              const landing = fateLanding(cls, k, n ?? 0);
              return (
              <button
                key={k}
                type="button"
                data-fate-key={k}
                onClick={() => rollOne(k)}
                className="mt-2 flex w-full min-h-16 items-start gap-3 rounded-[var(--radius-md)] bg-ink px-3 py-2.5 pr-14 text-left shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]"
              >
                <Dice20 value={rolls[k]} spinning={spinAll || spinKey === k} size={52} />
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-[10px] uppercase tracking-wider text-muted">
                    {FATE_COPY[k].label}
                  </span>
                  <span className="mt-0.5 block text-sm leading-snug text-paper">{n ? landing.title : "Tap to roll"}</span>
                  {n ? (
                    <>
                      <span className="mt-1 block text-[12px] leading-relaxed text-paper">{landing.buff}</span>
                      <span className="mt-1.5 block font-display text-[9px] uppercase tracking-[0.12em] text-ember">
                        d20 {n} · {landing.band.label}
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-relaxed text-moon">{landing.band.meaning}</span>
                    </>
                  ) : (
                    <span className="mt-1 block text-[11px] leading-relaxed text-moon">{FATE_COPY[k].does}</span>
                  )}
                </span>
              </button>
              );
            })}
          </Panel>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              className="w-full"
              variant="ember"
              disabled={!canForge}
              onClick={() => err(forge({ name: (nameLocked ? stamped : name) || randomName(), cls, race, lineage, origin, rolls }))}
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
        </>
      ) : null}
    </div>
  );
}

export function MapView() {
  const s = useGame((g) => g.s);
  const selectLoc = useGame((g) => g.selectLoc);
  const selectPoi = useGame((g) => g.selectPoi);
  const deploy = useGame((g) => g.deploy);
  const openRegionMap = useGame((g) => g.openRegionMap);
  const closeRegionMap = useGame((g) => g.closeRegionMap);
  const loc = s.selectedLoc && s.selectedLoc !== "hq" ? s.selectedLoc : "ironclad";
  const L = locById(loc);
  const idle = idleAtHq(s);
  const [party, setParty] = useState<string[]>([]);
  const [kind, setKind] = useState<MissionKind>("scout");
  const [approach, setApproach] = useState<MissionApproach>("standard");
  const [orbit, setOrbit] = useState(false);
  const touched = useRef(false);
  const progress = s.locations[loc] ?? EMPTY_PROGRESS;
  const merchant = NPCS.find((n) => n.loc === loc);
  const buy = useGame((g) => g.buyNpc);
  const regionId = locationToRegion(loc) ?? "ironclad";
  const stake = KANE_STAKES[regionId];
  const sites = knownPois(s, loc);
  const poi = defaultPoi(s, loc);
  const mapOpen = !!s.regionMapOpen;

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
  const heat = kaneBand(s.kaneHeat ?? 0);

  return (
    <div className="space-y-4 pb-8">
      <div>
        <SectionLabel>The Hollow Realm</SectionLabel>
        <h2 className="font-display text-2xl">World</h2>
        <p className="mt-1 text-sm text-muted">Pick a region. Orbit is the planet. Ground is the job.</p>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {WORLD.filter((w) => w.id !== "hq").map((w) => {
          const unlocked = !!s.locations[w.id]?.unlocked;
          const rid = locationToRegion(w.id) ?? "ironclad";
          const here = loc === w.id;
          return (
            <button
              key={w.id}
              type="button"
              disabled={!unlocked}
              onClick={(e) => {
                if (!unlocked) return;
                punchClick(e.clientX, e.clientY);
                shockwaveAt(e.clientX, e.clientY);
                sfx.click();
                selectLoc(w.id as LocationId);
              }}
              className={cn(
                "flex min-h-[4.75rem] items-center gap-3 overflow-hidden rounded-[var(--radius-lg)] text-left shadow-[var(--shadow-border)] disabled:opacity-45",
                here ? "bg-ink shadow-[var(--shadow-border-hover)] ring-1 ring-ember/40" : "bg-ink/92",
              )}
            >
              <img src={regionThumb(rid)} alt="" className="h-[4.75rem] w-[5.6rem] shrink-0 object-cover" loading="lazy" decoding="async" />
              <span className="min-w-0 flex-1 py-2 pr-3">
                <span className="flex items-center gap-2 font-display text-[11px] uppercase tracking-[0.18em] text-ember">
                  {!unlocked ? <Lock className="size-3.5" /> : null}
                  {w.short}
                </span>
                <span className="mt-0.5 block text-sm leading-snug text-moon">
                  {unlocked ? w.desc : "Sealed · finish the last arc"}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <Button
        variant="ember"
        className="w-full min-h-14"
        onClick={(e) => {
          punchClick(e.clientX, e.clientY);
          shockwaveAt(e.clientX, e.clientY);
          sfx.whoosh();
          closeRegionMap();
          setOrbit(true);
        }}
      >
        <Globe2 className="size-4" /> Orbit the Hollow
      </Button>

      <Panel className="bg-ink/92">
        <div>
          <p className="font-display text-[10px] uppercase tracking-[0.2em] text-ember">{regionById(regionId).continent}</p>
          <h3 className="font-display text-lg">{L.name}</h3>
          <p className="text-sm text-muted">{L.desc}</p>
          {stake ? (
            <p className="mt-2 text-sm text-ember">
              Kane wants {stake.resource}. {stake.why}
            </p>
          ) : null}
          <p className={cn("mt-1 font-display text-[10px] uppercase tracking-[0.16em]", dangerTone)}>
            Danger {L.danger} · intel {progress.intel} · sorties {progress.missions}
            <span className={cn("ml-2", heat.tone)}>{heat.label}</span>
          </p>
        </div>

        {sites.length ? (
          <>
            <SectionLabel>Site</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {sites.map((site) => (
                <Chip
                  key={site.id}
                  active={poi?.id === site.id}
                  onClick={() => {
                    sfx.click();
                    selectPoi(site.id);
                  }}
                >
                  {site.name}
                </Chip>
              ))}
            </div>
            {poi ? <p className="mt-2 text-xs text-muted">{poi.description}</p> : null}
            {poi ? (
              <Button
                variant="ember"
                className="mt-3 w-full min-h-12"
                data-poi-act={poi.id}
                onClick={() => {
                  sfx.unlock();
                  const act = poi.action ?? poi.kind;
                  if (act === "shop" || poi.id.includes("market")) {
                    useGame.getState().openMarket();
                    return;
                  }
                  const msg = useGame.getState().workSite(poi.id);
                  if (msg) err(msg);
                }}
              >
                {poi.action === "shop" || poi.kind === "merchant"
                  ? "Open stalls"
                  : poi.action === "listen" || poi.kind === "radio"
                    ? "Climb and listen"
                    : poi.action === "home"
                      ? "Return to Vault 13"
                      : poi.action === "boss"
                        ? "This hill has a name"
                        : poi.action === "salvage"
                          ? "Salvage this site · 1 watch"
                          : "Scout this site · 1 watch"}
              </Button>
            ) : null}
          </>
        ) : null}

        {!progress.unlocked ? (
          <p className="mt-3 text-sm text-muted">Sealed. Survive more days.</p>
        ) : (
          <>
            <Button
              variant="ghost"
              className="mt-3 w-full"
              onClick={(e) => {
                punchClick(e.clientX, e.clientY);
                sfx.unlock();
                openRegionMap();
              }}
            >
              Open ground map
            </Button>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {kinds.map((k) => {
                const Icon = KIND_ICON[k.id];
                return (
                  <button
                    key={k.id}
                    type="button"
                    disabled={k.locked}
                    onClick={(e) => {
                      punchClick(e.clientX, e.clientY);
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
                    <span className="mt-1 text-[11px] leading-snug text-muted">{KIND_TAG[k.id]}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-moon" data-kind-help={kind}>
              {KIND_HELP[kind]}
            </p>
            {kind === "bounty" && s.bounty ? (
              <p className="mt-3 text-sm text-moon">
                {s.bounty.name} · DC {s.bounty.dc} · {s.bounty.reward}
              </p>
            ) : null}
            {kind === "boss" ? (
              <p className="mt-3 text-sm text-ember">{VILLAINS.find((v) => v.loc === loc)?.tagline}</p>
            ) : null}

            <SectionLabel>Approach</SectionLabel>
            <div className="grid grid-cols-3 gap-2">
              {APPROACHES.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={(e) => {
                    punchClick(e.clientX, e.clientY);
                    sfx.click();
                    setApproach(a.id);
                  }}
                  className={cn(
                    "min-h-16 rounded-[var(--radius-md)] px-2.5 py-2 text-left",
                    approach === a.id
                      ? "bg-ember/15 shadow-[var(--shadow-border-hover)]"
                      : "bg-ink shadow-[var(--shadow-border)]",
                  )}
                >
                  <span className="block font-display text-[11px] uppercase tracking-wider">{a.label}</span>
                  <span className="mt-1 block text-[11px] leading-snug text-muted">{a.blurb}</span>
                </button>
              ))}
            </div>

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
                      onClick={(e) => {
                        punchClick(e.clientX, e.clientY);
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
                        <span className="block text-[11px] text-muted">{className(op.cls)}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <Button
              className={cn("mt-4 w-full", s.tutorial === "sortie" && "ms-nudge")}
              variant="ember"
              sound="none"
              disabled={!party.length}
              onClick={(e) => {
                const msg = deploy(loc, kind, party, { poiId: poi?.id, approach });
                if (msg) err(msg);
                else {
                  punchClick(e.clientX, e.clientY);
                  shockwaveAt(e.clientX, e.clientY);
                  sfx.deploy();
                  touched.current = false;
                  setParty([]);
                }
              }}
            >
              Deploy {party.length ? `· ${party.length} to ${L.short}` : "— pick who walks"}
            </Button>
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

      {orbit ? (
        <MapErrorBoundary onReset={() => setOrbit(false)}>
          <OrbitTheater
            loc={loc}
            onClose={() => setOrbit(false)}
            onSelect={(id) => { if (s.locations[id]?.unlocked) selectLoc(id); }}
          />
        </MapErrorBoundary>
      ) : null}
      {mapOpen ? (
        <MapErrorBoundary onReset={closeRegionMap}>
          <RegionMapOverlay />
        </MapErrorBoundary>
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
  const deposit = useGame((g) => g.depositCard);
  const withdraw = useGame((g) => g.withdrawCard);
  const register = useGame((g) => g.registerRider);
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
        Compound vault is shared. The black card is whoever is seated. Chosen name on the plate. Discord handle
        underneath.
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

      <h3 className="font-display text-xl">The Exchange is closed</h3>
      <Panel className="bg-raised">
        <p className="text-sm text-moon">
          Vault 13 does not keep a daily stall anymore. Caps walk to the Moon Squad Market under the Iron Gate.
          Limited inventory. Dawn reset. Visiting merchants sit the high table. The black card pays.
        </p>
        <Button
          className="mt-3 w-full min-h-12"
          variant="ember"
          onClick={() => {
            sfx.unlock();
            useGame.getState().openMarket();
          }}
        >
          Walk the Market
        </Button>
      </Panel>
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

export function MarketView() {
  const s = useGame((g) => g.s);
  const buyLot = useGame((g) => g.buyLot);
  const setScreen = useGame((g) => g.setScreen);
  const me = seatedMember(s);
  const market = s.market;
  const disc = s.rooms.ledger >= 3 ? 0.85 : 1;
  const visitor = market?.visitor ?? null;
  const stalls = (market?.lots ?? []).filter((l) => !l.visitor);
  const guests = (market?.lots ?? []).filter((l) => l.visitor);
  const left = s.shift?.watchesLeft ?? 0;

  return (
    <div className="space-y-4 pb-8" data-market="1">
      <SectionLabel>Ironclad · under the Gate</SectionLabel>
      <h2 className="font-display text-2xl">Moon Squad Market</h2>
      <p className="text-sm text-muted">
        Limited stalls. Dawn reprint. The black card pays — not the vault drawer. Tyrone keeps a radio over this yard:
        Relay Tower Three.
      </p>
      <p className="text-sm text-moon">
        {left} watch{left === 1 ? "" : "es"} left · plate <Coin n={me.personalCaps} />
      </p>

      {visitor ? (
        <Panel className="bg-ember/10" data-market-visitor={visitor.id}>
          <SectionLabel>Visiting stall</SectionLabel>
          <h3 className="font-display text-lg">{visitor.name}</h3>
          <p className="text-[11px] uppercase tracking-[0.16em] text-ember">{visitor.title}</p>
          <p className="mt-2 text-sm text-moon">{visitor.blurb}</p>
          <div className="mt-3 space-y-2">
            {guests.map((lot) => {
              const price = Math.round(lot.price * disc);
              const sold = lot.qty <= 0;
              return (
                <div
                  key={lot.id}
                  data-lot={lot.id}
                  className="flex items-start justify-between gap-3 rounded-[var(--radius-sm)] bg-ink/60 px-3 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <RarityMark rarity={lot.rarity} />
                      <span className="font-display text-sm text-paper">{lot.name}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted">{lot.effect}</p>
                    <p className="mt-1 text-[11px] text-moon">{sold ? "Gone" : `${lot.qty} left`}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ember"
                    disabled={sold || me.personalCaps < price}
                    onClick={() => err(buyLot(lot.id))}
                  >
                    {sold ? "Sold" : <Coin n={price} />}
                  </Button>
                </div>
              );
            })}
          </div>
        </Panel>
      ) : (
        <Panel>
          <p className="text-sm text-muted">
            No visiting merchant today. They sit every third dawn — Marrow, Cinder Bess, Nine-Lift, Salt Wren, White
            Glove. Climb the tower if you want the rumor first.
          </p>
        </Panel>
      )}

      <SectionLabel>Daily stalls</SectionLabel>
      {!stalls.length ? (
        <Panel>
          <p className="text-sm">Stalls are dark until you assume command.</p>
        </Panel>
      ) : (
        stalls.map((lot) => {
          const price = Math.round(lot.price * disc);
          const sold = lot.qty <= 0;
          return (
            <Panel key={lot.id} className="bg-raised">
              <div className="flex items-start justify-between gap-3" data-lot={lot.id}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <RarityMark rarity={lot.rarity} />
                    <span className="font-display text-[10px] uppercase tracking-[0.16em] text-muted">
                      {lot.sourceRegion}
                    </span>
                  </div>
                  <div className="mt-1 font-display text-lg">{lot.name}</div>
                  <p className="text-sm text-muted">{lot.effect}</p>
                  <p className="mt-1 text-[11px] text-moon">{sold ? "Sold out until dawn" : `${lot.qty} in crate`}</p>
                </div>
                <Button variant="ghost" onClick={() => err(buyLot(lot.id))} disabled={sold || me.personalCaps < price}>
                  {sold ? "Sold" : <Coin n={price} />}
                </Button>
              </div>
            </Panel>
          );
        })
      )}

      <div className="grid grid-cols-2 gap-2">
        <Button variant="ghost" className="min-h-12" onClick={() => setScreen("map")}>
          Ground map
        </Button>
        <Button
          variant="ghost"
          className="min-h-12"
          onClick={() => {
            useGame.getState().selectLoc("ironclad");
            useGame.getState().selectPoi("ironclad-tower");
            useGame.getState().setScreen("map");
            useGame.getState().openRegionMap();
          }}
        >
          Relay Tower
        </Button>
      </div>
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
  const day = useGame((g) => g.s.day);
  const locations = useGame((g) => g.s.locations);
  const open = campaignOpenRegions(day, locations);
  const [tab, setTab] = useState<"arcs" | "races" | "rules" | "rifles">("arcs");
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
        t: "Rifles",
        d: "Real models, real chambers. M4 and M16 take 5.56. M94 and M336 take .30-30. M700 takes .270. M70 Springfield takes .30-06. M14, M10 and M24 take .308. M70 Magnum takes .300. Calibers do not mix. Improved loads (AP, Match, Soft Point, Hot, Bonded) stamp the mag when you reload.",
      },
      {
        t: "Lasers",
        d: "Not a week-one stall. L4 pulse after Blackspire (Arc III). L6 carbine after Brasswater (Arc IV). L8 and L9 after Veyra opens — and Veyra waits on the Sink. Coil cells will not seat. Powered plate and AEGIS take coherent light personally.",
      },
      {
        t: "Arcs",
        d: "Ironclad first, then Slag Town, Blackspire, Brasswater, Veyra City last. Raid, bounty, and the chapter boss wait on the rider whose turn it is.",
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
      <div className="flex flex-wrap gap-2">
        {(["arcs", "races", "rules", "rifles"] as const).map((t) => (
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
      {tab === "rifles" &&
        CALIBER_ROSTER.map((row) => {
          const locked = row.unlockRegion ? !open.includes(row.unlockRegion) : false;
          const gate = row.unlockRegion ? ARC_OPEN[row.unlockRegion] : null;
          return (
            <Panel key={row.model} className="bg-raised">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-display text-[10px] uppercase tracking-[0.2em] text-ember">
                    {row.ammo} · {row.family}
                  </div>
                  <h3 className="mt-1 font-display text-lg text-paper">{row.model}</h3>
                </div>
                <span className="font-display text-[10px] uppercase tracking-[0.14em] text-muted">
                  {locked ? gate?.label ?? "Later" : row.unlockRegion ? "Unlocked" : "Issue"}
                </span>
              </div>
              <p className="mt-2 text-sm text-moon">{row.note}</p>
              {locked ? (
                <p className="mt-2 text-xs text-muted">
                  {row.unlockRegion === "veyra"
                    ? "Veyra waits on the Sink. Not a ten-day walk."
                    : `Locked until ${gate?.label ?? "the next arc"}. Play the region. Resting will not skip it.`}
                </p>
              ) : null}
            </Panel>
          );
        })}
    </div>
  );
}
