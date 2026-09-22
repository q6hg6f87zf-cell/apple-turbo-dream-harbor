import { Button } from "@/components/ui/button";
import { CLASS_PORTRAIT, OS_PHOSPHOR } from "@/game/art";
import { avatarSrc } from "@/game/avatars";
import { sfx } from "@/game/audio";
import { BOARD_KIND_LABEL, boardStake, boardWatchLabel, liveJobs, unansweredWatches } from "@/game/board-copy";
import { CLASS_GIFT, locById, villainById } from "@/game/data";
import { PRIMARY_STAT } from "@/game/data-legacy";
import { characterForged, computeStats, equippedWeapon } from "@/game/engine";
import { className, displayRace } from "@/game/presentation";
import { WATCH_LABEL } from "@/game/shift";
import { currentArcLoc, isVacant, plateHandle, plateMember, seatedMember } from "@/game/squad";
import { bandForRoll, STAT_COPY, STAT_ORDER } from "@/game/stats-copy";
import { useGame } from "@/game/store";
import { knownCast } from "@/game/cast";
import { kaneFileBlurb } from "@/game/story";
import { fittedModules, travisBayBlurb } from "@/game/travis";
import { currentPorch } from "@/game/porch";
import type { Operative, Screen } from "@/game/types";
import { resolveWeapon } from "@/game/weapon-ops";
import { cn } from "@/lib/cn";
import { CreditCard, Database, IdCard, ScanFace, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { MoonCard, MoonCardSheet } from "./card";
import { Coin, HpBar, Portrait, SectionLabel, StatusPill } from "./primitives";

type OsTab = "stat" | "plate" | "roster" | "data" | "people";
type StatSub = "status" | "special" | "gear";

const TABS: { id: OsTab; label: string; icon: typeof IdCard }[] = [
  { id: "stat", label: "STAT", icon: IdCard },
  { id: "plate", label: "PLATE", icon: CreditCard },
  { id: "roster", label: "ROSTER", icon: Users },
  { id: "data", label: "DATA", icon: Database },
  { id: "people", label: "PEOPLE", icon: ScanFace },
];

const SUBS: { id: StatSub; label: string }[] = [
  { id: "status", label: "STATUS" },
  { id: "special", label: "SPECIAL" },
  { id: "gear", label: "GEAR" },
];

function tabFromScreen(screen: Screen): OsTab {
  if (screen === "roster" || screen === "squad") return "roster";
  return "stat";
}

function err(msg: string | null) {
  if (!msg) {
    sfx.coin();
    return;
  }
  sfx.hurt();
  useGame.setState((st) => ({ s: { ...st.s, toast: msg } }));
}

function loadoutVerdict(op: Operative, loc: ReturnType<typeof currentArcLoc>): string {
  const gun = equippedWeapon(op);
  if (!gun) return "Unarmed. The board will notice.";
  const v = villainById(locById(loc).bossId);
  const profile = resolveWeapon(gun);
  const family = profile.family;
  if (v?.weakness?.includes(family)) return `${gun.name} opens ${v.name} up.`;
  if (v?.resist?.includes(family)) return `${v.name} shrugs ${gun.name}.`;
  return `${gun.name} · ${family}`;
}

function hullLine(op: Operative): string {
  if (op.status === "dead") return "File closed.";
  if (op.status === "downed") return "Downed. Dawn will finish this if Med Bay is dark.";
  const ratio = op.hp / Math.max(1, op.maxHp);
  if (ratio <= 0.3) return "Critical hull. Do not walk them into a raid.";
  if (ratio < 1) return "Wounded. A med pass closes this before rest.";
  if (op.status === "deployed") return "In the field.";
  return "Sound. Ready for a watch.";
}

function Bust({ op }: { op: Operative }) {
  const face = avatarSrc(op.portraitId) ?? CLASS_PORTRAIT[op.cls];
  return (
    <div className="ms-os-bust">
      <img src={face} alt="" className={cn("size-full object-cover", op.status === "dead" && "grayscale opacity-50")} />
    </div>
  );
}

function StatPane() {
  const s = useGame((g) => g.s);
  const setScreen = useGame((g) => g.setScreen);
  const op = s.operatives.find((o) => o.status !== "dead") ?? s.operatives[0];
  const [sub, setSub] = useState<StatSub>("status");
  const loc = currentArcLoc(s);
  if (!op) {
    return (
      <div className="space-y-4 p-4">
        <p className="font-mono text-secondary text-moon">No rider file seated.</p>
        {characterForged(s) ? (
          <p className="text-secondary text-muted">The Machine Shop already cut your one soul.</p>
        ) : (
          <Button variant="ember" onClick={() => setScreen("forge")}>
            Cut your file
          </Button>
        )}
      </div>
    );
  }
  const stats = computeStats(op);
  const plate = plateMember(s);
  const armor = op.inventory.find((i) => i.equipped && i.slot === "armor");
  const gun = equippedWeapon(op);
  const primary = PRIMARY_STAT[op.cls];
  const gift = CLASS_GIFT[op.cls];
  const equipped = op.inventory.filter((i) => i.equipped);
  return (
    <div className="p-3 md:p-4">
      <nav className="ms-os-sub" aria-label="STAT pages">
        {SUBS.map((item) => {
          const on = sub === item.id;
          return (
            <button
              key={item.id}
              type="button"
              data-os-sub={item.id}
              aria-current={on ? "page" : undefined}
              onClick={() => {
                sfx.click();
                setSub(item.id);
              }}
              className={cn("ms-os-sub-tab", on && "ms-os-sub-on")}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="ms-os-stat">
      <aside className="ms-os-rail">
        <Bust op={op} />
        <HpBar hp={op.hp} max={op.maxHp} className="mt-2 h-2.5" />
        <p className="mt-1 font-mono text-label tabular-nums text-ember">
          {op.hp}/{op.maxHp} HULL
        </p>
        <p className="mt-1 font-mono text-label uppercase tracking-[0.16em] text-muted">{plateHandle(plate)}</p>
        <StatusPill status={op.status} />
      </aside>
      <div className="min-w-0">
        <p className="font-mono text-label uppercase tracking-[0.2em] text-ember">Rider file</p>
        <h2 className="mt-0.5 font-display text-2xl text-paper">{op.name}</h2>
        <p className="text-secondary text-moon">
          {className(op.cls)} · {displayRace(op.race)} · {op.repTitle}
        </p>
        {sub === "status" ? (
          <div className="space-y-3">
            <p className="text-secondary leading-relaxed text-moon">{hullLine(op)}</p>
            <p className="text-secondary italic leading-relaxed text-moon">{op.destiny}</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-[var(--radius-xs)] bg-ink/55 px-2 py-2">
                <p className="font-mono text-label uppercase tracking-[0.14em] text-ember">Skill</p>
                <p className="mt-0.5 text-secondary text-paper">{op.skillName}</p>
              </div>
              <div className="rounded-[var(--radius-xs)] bg-ink/55 px-2 py-2">
                <p className="font-mono text-label uppercase tracking-[0.14em] text-ember">Gift</p>
                <p className="mt-0.5 text-secondary text-paper">{gift?.name ?? "—"}</p>
              </div>
            </div>
            <p className="font-mono text-label text-muted">
              {op.raids} raids · {op.battles} fights · Kane heat {s.kaneHeat ?? 0} · day {s.day} ·{" "}
              {WATCH_LABEL[s.shift?.watch ?? "dawn"]}
            </p>
            {op.companion ? (
              <p className="text-secondary text-moon">
                Companion {op.companion.type} · {op.companion.status} · {op.companion.hp}/{op.companion.maxHp}
              </p>
            ) : null}
            {op.curses.length ? (
              <p className="text-secondary text-danger">{op.curses.join(" · ")}</p>
            ) : (
              <p className="font-mono text-label text-muted">No curses on file.</p>
            )}
            <p className="text-label text-muted">{op.shadowName}. {op.traitLevel} blood.</p>
          </div>
        ) : null}
        {sub === "special" ? (
          <ul className="space-y-2">
            {STAT_ORDER.map((key) => {
              const n = stats[key];
              const roll = op.statDice?.[key] ?? 10;
              const pct = Math.max(8, Math.min(100, (n / 18) * 100));
              const copy = STAT_COPY[key];
              const band = bandForRoll(roll);
              const isPrimary = key === primary;
              return (
                <li
                  key={key}
                  className={cn("rounded-[var(--radius-xs)] bg-ink/55 px-2.5 py-2", isPrimary && "ms-os-primary")}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-mono text-label uppercase tracking-[0.16em] text-ember">
                      {key}
                      {isPrimary ? " · primary" : ""}
                    </p>
                    <p className="font-mono text-label tabular-nums text-paper">
                      {n} · {band.label}
                    </p>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-ink">
                    <div className="h-full bg-ember" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1.5 text-secondary leading-relaxed text-moon">
                    {copy.name}. {copy.short}. {copy.does}
                  </p>
                </li>
              );
            })}
          </ul>
        ) : null}
        {sub === "gear" ? (
          <div className="space-y-3">
            <div className="rounded-[var(--radius-xs)] bg-ink/55 px-3 py-2.5">
              <p className="font-mono text-label uppercase tracking-[0.16em] text-ember">Loadout verdict</p>
              <p className="mt-1 text-secondary text-paper">{loadoutVerdict(op, loc)}</p>
              <p className="mt-1 text-label text-muted">
                Arc {s.arc?.chapter ?? 1} · {locById(loc).name}
              </p>
            </div>
            <div>
              <p className="font-mono text-label uppercase tracking-[0.16em] text-ember">Seated steel</p>
              {gun ? (
                <p className="mt-1 text-secondary text-paper">
                  {gun.name}
                  {gun.condition ? ` · ${gun.condition}` : ""}
                </p>
              ) : (
                <p className="mt-1 text-secondary text-muted">No weapon seated.</p>
              )}
              {armor ? (
                <p className="mt-1 text-secondary text-paper">
                  {armor.name}
                  {armor.condition ? ` · ${armor.condition}` : ""}
                </p>
              ) : (
                <p className="mt-1 text-secondary text-muted">No armor on the ribs.</p>
              )}
            </div>
            {equipped.length ? (
              <ul className="space-y-1">
                {equipped.map((item) => (
                  <li key={item.id} className="font-mono text-label text-moon">
                    {item.slot ?? item.kind} · {item.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="font-mono text-label text-muted">Empty pockets. The board will notice.</p>
            )}
            <p className="text-label italic text-muted">{gift?.desc}</p>
          </div>
        ) : null}
      </div>
      </div>
    </div>
  );
}

function PlatePane() {
  const s = useGame((g) => g.s);
  const me = seatedMember(s);
  const plate = plateMember(s);
  const clock = useGame((g) => g.clockPlate);
  const setScreen = useGame((g) => g.setScreen);
  const [inspect, setInspect] = useState(false);
  const vacant = isVacant(me);
  const tapped = s.clocks?.cardTap ?? 0;
  return (
    <div className="space-y-4 overflow-x-hidden p-4">
      <div className="relative z-[2]">
        <p className="font-mono text-label uppercase tracking-[0.2em] text-ember">Black card</p>
        <h2 className="mt-0.5 font-display text-2xl text-paper">{vacant ? "Unclaimed plate" : me.name}</h2>
        <p className="text-secondary text-moon">{plateHandle(plate)} · personal ledger, not the vault drawer</p>
      </div>
      <MoonCard member={me} className="relative z-[1]" />
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-[var(--radius-sm)] bg-ink/55 p-3">
          <p className="font-mono text-label uppercase tracking-[0.16em] text-ember">Plate</p>
          <p className="mt-1 font-display text-xl tabular-nums text-paper">
            <Coin n={me.personalCaps} />
          </p>
        </div>
        <div className="rounded-[var(--radius-sm)] bg-ink/55 p-3">
          <p className="font-mono text-label uppercase tracking-[0.16em] text-ember">Vault 13</p>
          <p className="mt-1 font-display text-xl tabular-nums text-paper">
            <Coin n={s.coins} />
          </p>
        </div>
      </div>
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
        className="flex min-h-14 w-full items-center justify-between gap-3 rounded-[var(--radius-sm)] bg-ink/55 px-3 py-2 text-left"
      >
        <span className="min-w-0">
          <span className="block font-mono text-label uppercase tracking-[0.16em] text-ember">Clock-in</span>
          <span className="mt-0.5 block text-secondary text-paper">
            {vacant ? "Stamp a plate first" : tapped ? `${me.name} already clocked` : `Clock ${me.name}'s plate`}
          </span>
        </span>
        <span className="shrink-0 font-display text-label uppercase tracking-[0.14em] text-ember">
          {vacant ? "Stamp" : tapped ? "Done" : "Clock"}
        </span>
      </button>
      <Button variant="ghost" className="w-full" onClick={() => setInspect(true)}>
        Inspect plate
      </Button>
      <MoonCardSheet open={inspect} onClose={() => setInspect(false)} />
    </div>
  );
}

function OsRoster() {
  const s = useGame((g) => g.s);
  const select = useGame((g) => g.selectOp);
  const setScreen = useGame((g) => g.setScreen);
  const [filter, setFilter] = useState<"living" | "fallen" | "hof">("living");
  const living = s.operatives.filter((o) => o.status !== "dead");
  const fallen = s.operatives.filter((o) => o.status === "dead");
  const hof = living.filter((o) => o.isHoF);
  const list = filter === "living" ? living : filter === "fallen" ? fallen : hof;
  return (
    <div className="space-y-3">
      <div>
        <p className="font-mono text-label uppercase tracking-[0.18em] text-ember">Who still breathes</p>
        <p className="mt-1 text-secondary text-moon">Tap a name for the full dossier.</p>
      </div>
      <div className="flex gap-1">
        {(["living", "fallen", "hof"] as const).map((id) => {
          const n = id === "living" ? living.length : id === "fallen" ? fallen.length : hof.length;
          const on = filter === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                sfx.click();
                setFilter(id);
              }}
              className={cn("ms-os-sub-tab", on && "ms-os-sub-on")}
            >
              {id === "hof" ? "Fame" : id} · {n}
            </button>
          );
        })}
      </div>
      {list.length === 0 ? (
        <div className="space-y-2">
          <p className="text-secondary text-muted">
            {filter === "living" ? "Empty. Your file is waiting in the Machine Shop." : "None yet."}
          </p>
          {filter === "living" && !characterForged(s) ? (
            <Button variant="ember" onClick={() => setScreen("forge")}>
              Cut your file
            </Button>
          ) : null}
        </div>
      ) : (
        <ul className="space-y-1.5">
          {list.map((op) => {
            const stats = computeStats(op);
            const primary = stats[PRIMARY_STAT[op.cls]];
            return (
              <li key={op.id}>
                <button
                  type="button"
                  onClick={() => {
                    sfx.click();
                    select(op.id);
                  }}
                  className="flex min-h-14 w-full items-center gap-3 rounded-[var(--radius-xs)] bg-ink/55 px-2 py-2 text-left"
                >
                  <Portrait op={op} size={40} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-sm text-paper">{op.name}</span>
                    <span className="block truncate text-label text-muted">
                      {className(op.cls)} · {PRIMARY_STAT[op.cls]} {primary} · {op.hp}/{op.maxHp}
                    </span>
                  </span>
                  <StatusPill status={op.status} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function OsRegistry() {
  const s = useGame((g) => g.s);
  const register = useGame((g) => g.registerRider);
  const playAs = useGame((g) => g.playAs);
  const pass = useGame((g) => g.passTurn);
  const me = seatedMember(s);
  const turn = s.squad.find((m) => m.id === s.arc?.turnMemberId);
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  return (
    <div className="space-y-3">
      <div>
        <p className="font-mono text-label uppercase tracking-[0.18em] text-ember">Campaign registry</p>
        <p className="mt-1 text-secondary text-moon">
          Seated as {me.name}
          {turn ? ` · ARC turn ${turn.name}` : ""} · chapter {s.arc?.chapter ?? 1}
        </p>
      </div>
      {s.squad.length > 1 ? (
        <Button variant="quiet" className="w-full" onClick={() => pass()}>
          Pass ARC turn
        </Button>
      ) : null}
      <ul className="space-y-1.5">
        {s.squad.map((m) => (
          <li key={m.id}>
            <button
              type="button"
              onClick={() => {
                sfx.click();
                playAs(m.id);
              }}
              className={cn(
                "flex min-h-11 w-full items-center justify-between gap-2 rounded-[var(--radius-xs)] bg-ink/55 px-3 text-left",
                m.id === me.id && "ms-os-primary",
              )}
            >
              <span className="min-w-0 truncate text-secondary text-paper">{m.name}</span>
              <span className="shrink-0 font-mono text-label text-muted">{m.discordHandle ?? "local"}</span>
            </button>
          </li>
        ))}
      </ul>
      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          err(register(name, handle));
          setName("");
          setHandle("");
        }}
      >
        <p className="font-mono text-label uppercase tracking-[0.16em] text-ember">Register a rider</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="h-11 w-full rounded-[var(--radius-xs)] bg-ink px-3 text-secondary text-paper shadow-[var(--shadow-border)] outline-none"
        />
        <input
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder="Discord handle"
          className="h-11 w-full rounded-[var(--radius-xs)] bg-ink px-3 text-secondary text-paper shadow-[var(--shadow-border)] outline-none"
        />
        <Button type="submit" variant="ghost" className="w-full">
          Seat them
        </Button>
      </form>
    </div>
  );
}

function DataPane() {
  const s = useGame((g) => g.s);
  const openTask = useGame((g) => g.openTask);
  const board = s.shift?.board ?? [];
  const left = s.shift?.watchesLeft ?? 6;
  const live = liveJobs(board);
  const dark = unansweredWatches(board, left);
  const loc = locById(currentArcLoc(s));
  const [sel, setSel] = useState<string | null>(live[0]?.id ?? null);
  const task = live.find((t) => t.id === sel) ?? live[0];
  return (
    <div className="space-y-4 p-4">
      <div>
        <p className="font-mono text-label uppercase tracking-[0.2em] text-ember">Field data</p>
        <h2 className="mt-0.5 font-display text-2xl text-paper">
          Day {s.day} · {WATCH_LABEL[s.shift?.watch ?? "dawn"]}
        </h2>
        <p className="text-secondary text-moon">
          Arc {s.arc?.chapter ?? 1} · {loc.name}. {live.length} jobs live.
          {dark > 0 ? ` ${boardWatchLabel(dark)} will go dark.` : " The day can cover the wall."}
        </p>
      </div>
      {live.length === 0 ? (
        <p className="text-secondary text-muted">Board is clear. Rest when you are ready.</p>
      ) : (
        <ul className="space-y-1.5">
          {live.map((job) => {
            const on = job.id === task?.id;
            return (
              <li key={job.id}>
                <button
                  type="button"
                  onClick={() => {
                    sfx.click();
                    setSel(job.id);
                  }}
                  className={cn("ms-os-file w-full text-left", on && "ms-os-file-on")}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-mono text-label uppercase tracking-[0.14em] text-ember">
                      {BOARD_KIND_LABEL[job.kind]}
                      {job.required ? " · req" : ""}
                    </span>
                    <span className="font-mono text-label text-muted">{boardWatchLabel(job.watchCost)}</span>
                  </span>
                  <span className="mt-0.5 block font-display text-sm text-paper">{job.title}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {task ? (
        <div className="rounded-[var(--radius-sm)] bg-ink/55 px-3 py-3">
          <p className="font-mono text-label uppercase tracking-[0.16em] text-ember">
            {BOARD_KIND_LABEL[task.kind]} file
          </p>
          <p className="mt-1 font-display text-body text-paper">{task.title}</p>
          <p className="mt-2 text-secondary leading-relaxed text-moon">{task.brief}</p>
          <p className="mt-2 text-label italic text-ember">If you skip: {boardStake(task)}</p>
          <Button
            variant="ember"
            className="mt-3 w-full"
            onClick={() => err(openTask(task.id))}
            disabled={left < task.watchCost}
          >
            Take job
          </Button>
        </div>
      ) : null}
      {s.shift?.log.length ? (
        <div>
          <SectionLabel>Shift log</SectionLabel>
          <ul className="mt-2 space-y-1 font-mono text-label text-muted">
            {s.shift.log.slice(0, 8).map((line, i) => (
              <li key={`${i}-${line.slice(0, 16)}`}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function PeoplePane() {
  const s = useGame((g) => g.s);
  const known = knownCast(s);
  const porch = currentPorch();
  const live = porch.seats.filter((seat) => !seat.self);
  const fitted = fittedModules(s);
  return (
    <div className="space-y-4 p-4">
      <div>
        <p className="font-mono text-label uppercase tracking-[0.2em] text-ember">Known files</p>
        <h2 className="mt-0.5 font-display text-2xl text-paper">People</h2>
        <p className="text-secondary text-moon">{kaneFileBlurb(s)}</p>
        {live.length ? (
          <p className="mt-2 font-mono text-label text-muted">
            Live riders · {live.map((seat) => seat.name).join(", ")}
          </p>
        ) : null}
      </div>
      {known.map((person) => {
        const banner = person.banner ?? person.still;
        return (
          <article key={person.id} data-cast={person.id} className="overflow-hidden rounded-[var(--radius-sm)] bg-ink/55">
            <div className="relative">
              <img
                src={banner}
                alt=""
                className="h-52 w-full object-cover object-[center_22%] sm:h-64"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink via-ink/85 to-transparent px-3 pb-3 pt-16">
                <div className="flex items-end gap-3">
                  <img
                    src={person.portrait}
                    alt=""
                    className="h-20 w-14 shrink-0 rounded-[var(--radius-xs)] object-cover object-top shadow-[var(--shadow-border)]"
                  />
                  <div className="min-w-0 flex-1 pb-0.5">
                    <p className="font-mono text-label uppercase tracking-[0.16em] text-ember">{person.title}</p>
                    <h3 className="mt-0.5 font-display text-lg text-paper">{person.name}</h3>
                    <p className="text-label text-muted">
                      {person.callsign}
                      {person.visor ? ` · ${person.visor} visor` : ""}
                      {" · on file"}
                    </p>
                    <p className="mt-1 text-secondary italic leading-relaxed text-moon">{person.tagline}</p>
                  </div>
                </div>
              </div>
            </div>
            <p className="px-3 pb-3 pt-3 text-secondary leading-relaxed text-muted">{person.dossier}</p>
            {person.voice[0] ? (
              <p className="px-3 pb-3 text-secondary italic leading-relaxed text-ember">“{person.voice[0]}”</p>
            ) : null}
            {person.id === "travis" ? (
              <p className="px-3 pb-3 font-mono text-label leading-relaxed text-ember">{travisBayBlurb(s)}</p>
            ) : null}
            {person.id === "tyrone" && fitted.length ? (
              <p className="px-3 pb-3 font-mono text-label leading-relaxed text-ember">
                Travis fittings · {fitted.map((m) => m.part).join(", ")}
              </p>
            ) : null}
          </article>
        );
      })}
      <p className="font-mono text-label text-muted">
        TyroneBot first. Kane second. Then Lyra, Vera-3, Drake, Orion. Then Ironclad: Travis, Holt Kade, Sister Vex, Calder Rourke. Then the names on the hills.
      </p>
    </div>
  );
}

export function FileView() {
  const screen = useGame((g) => g.s.screen);
  const pane = useGame((g) => g.filePane);
  const [tab, setTab] = useState<OsTab>(() => pane ?? tabFromScreen(screen));
  const plate = useGame((g) => plateMember(g.s));

  useEffect(() => {
    setTab(pane ?? tabFromScreen(screen));
  }, [screen, pane]);

  return (
    <div className="ms-os pb-6" data-synapse-os="1">
      <div className="ms-os-bezel">
        <span className="ms-os-rivet ms-os-rivet-tl" aria-hidden />
        <span className="ms-os-rivet ms-os-rivet-tr" aria-hidden />
        <span className="ms-os-rivet ms-os-rivet-bl" aria-hidden />
        <span className="ms-os-rivet ms-os-rivet-br" aria-hidden />
        <header className="ms-os-top">
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-mono text-label uppercase tracking-[0.22em] text-ember">S.Y.N.A.P.S.E OS</p>
            <p className="inline-flex items-center gap-2 font-mono text-label tabular-nums text-muted">
              <span className="ms-os-led" aria-hidden />
              T-0880
            </p>
          </div>
          <p className="mt-1 truncate font-mono text-label text-moon">
            {isVacant(plate) ? "NO RIDER SEATED" : plate.name.toUpperCase()} · VAULT 13
          </p>
        </header>
        <nav className="ms-os-tabs" aria-label="SYNAPSE OS">
          {TABS.map((item) => {
            const Icon = item.icon;
            const on = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                data-os-tab={item.id}
                aria-current={on ? "page" : undefined}
                onClick={() => {
                  sfx.click();
                  setTab(item.id);
                }}
                className={cn("ms-os-tab", on && "ms-os-tab-on")}
              >
                <Icon className="hidden size-3.5 sm:inline" />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="ms-os-screen">
          <img src={OS_PHOSPHOR} alt="" className="ms-os-grain" />
          {tab === "stat" ? (
            <StatPane />
          ) : tab === "plate" ? (
            <PlatePane />
          ) : tab === "roster" ? (
            <div className="space-y-6 p-4">
              <OsRoster />
              <OsRegistry />
            </div>
          ) : tab === "people" ? (
            <PeoplePane />
          ) : (
            <DataPane />
          )}
        </div>
        <footer className="ms-os-foot">
          <span>Developed by S.Y.N.A.P.S.E</span>
          <span>Unit T-0880</span>
        </footer>
      </div>
    </div>
  );
}
