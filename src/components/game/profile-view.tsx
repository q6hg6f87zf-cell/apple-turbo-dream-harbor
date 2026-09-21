import { CLASS_GIFT, DANGER_LABELS, PRIMARY_STAT, WORLD, locById, villainById } from "@/game/data";
import { computeStats, equippedWeapon } from "@/game/engine";
import { kaneBand, locationToRegion } from "@/game/field-ops";
import { analyzeLoadout } from "@/game/loadout-effects";
import { className, displayLineage, displayRace } from "@/game/presentation";
import { DEPTH_LABELS, liveLeads, regionMastery, threadFor, threadStage } from "@/game/recon";
import { WATCH_LABEL } from "@/game/shift";
import { plateMember } from "@/game/squad";
import { useGame } from "@/game/store";
import { isAmmoConsumable, magLine, resolveWeapon, socketList } from "@/game/weapon-ops";
import type { Item, LocationId, Operative } from "@/game/types";
import { cn } from "@/lib/cn";
import { sfx } from "@/game/audio";
import { HpBar, LevelPips, Panel, Portrait, RarityMark, SectionLabel, StatGrid, StatusPill } from "./primitives";

/**
 * Profile — the one screen that answers "what am I, and what am I carrying?"
 *
 * Everything on it already existed somewhere: stats behind the roster sheet,
 * the mag behind the inventory row, intel behind the region sheet, records in
 * nothing at all. Mid-run, none of that was reachable without leaving what you
 * were doing. This is a read-only board that collects it, because the decisions
 * it informs — who walks, what they carry, which ground is worth a watch — are
 * made in the middle of a shift, not at a menu.
 */
export function ProfileView() {
  const s = useGame((g) => g.s);
  const setScreen = useGame((g) => g.setScreen);
  const selectOp = useGame((g) => g.selectOp);
  // Everything below is derived from `s`. Selectors that build a fresh array or
  // object every call never compare equal, and zustand re-renders on that
  // forever — so there is exactly one state selector on this screen.
  const me = plateMember(s);
  const leads = liveLeads(s);
  const reports = s.recon?.reports ?? [];

  const living = s.operatives.filter((o) => o.status !== "dead");
  const primary = living.find((o) => o.status !== "downed") ?? living[0] ?? s.operatives[0];
  const heat = kaneBand(s.kaneHeat ?? 0);
  const xpPct = Math.max(0, Math.min(100, (s.xp / Math.max(1, s.xpToNext)) * 100));
  const watches = s.shift?.watchesLeft ?? 0;

  const battles = s.operatives.reduce((n, o) => n + o.battles, 0);
  const raids = s.operatives.reduce((n, o) => n + o.raids, 0);
  const sorties = WORLD.filter((w) => w.id !== "hq").reduce(
    (n, w) => n + (s.locations[w.id]?.missions ?? 0),
    0,
  );
  const bosses = WORLD.filter((w) => w.id !== "hq" && s.locations[w.id]?.bossDefeated).length;

  return (
    <div className="space-y-4 pb-8" data-profile="1">
      <div>
        <SectionLabel>Moon Squad · file</SectionLabel>
        <h2 className="font-display text-2xl">Profile</h2>
        <p className="mt-1 text-sm text-muted">
          Who you are, what is on your body, what the Realm has cost you so far, and which ground still owes you
          something.
        </p>
      </div>

      {/* ---------------- Rider plate ---------------- */}
      <Panel className="glass-strong bg-transparent">
        <SectionLabel>Rider</SectionLabel>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display text-xl leading-tight text-paper">{me.name || "Unclaimed plate"}</p>
            <p className="text-sm text-muted">
              {s.playerHandle ? `@${s.playerHandle}` : s.discordName ? s.discordName : "No handle stamped"}
              {s.discordId ? " · Discord linked" : " · local file"}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-display text-label uppercase tracking-[0.16em] text-ember">SYNAPSE rank {s.level}</p>
            <LevelPips level={Math.min(3, s.level)} />
          </div>
        </div>

        <div className="mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-ember" style={{ width: `${xpPct}%` }} />
          </div>
          <p className="mt-1 font-display text-label uppercase tracking-[0.14em] tabular-nums text-muted">
            {s.xp} / {s.xpToNext} XP to rank {s.level + 1}
          </p>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Tile label="Compound caps" value={s.coins.toLocaleString()} />
          <Tile label="Plate caps" value={(me.personalCaps ?? 0).toLocaleString()} />
          <Tile label="Ore" value={String(s.ore)} />
          <Tile label="Moon favor" value={String(s.moonFavor)} />
          <Tile label="Day" value={String(s.day)} />
          <Tile label="Watch" value={`${WATCH_LABEL[s.shift?.watch ?? "dawn"]} · ${watches} left`} />
          <Tile label="Kane heat" value={`${s.kaneHeat ?? 0} · ${heat.label}`} tone={heat.tone} />
          <Tile label="Bosses down" value={`${bosses} / ${WORLD.length - 1}`} />
        </div>
      </Panel>

      {/* ---------------- Character file ---------------- */}
      {primary ? <CharacterFile op={primary} onOpen={() => { sfx.click(); selectOp(primary.id); }} /> : (
        <Panel>
          <SectionLabel>Character file</SectionLabel>
          <p className="text-sm text-muted">No file cut yet. The Machine Shop stamps one body, once.</p>
        </Panel>
      )}

      {/* ---------------- Loadout ---------------- */}
      {primary ? <Loadout op={primary} onOpen={() => { sfx.click(); setScreen("inventory"); }} /> : null}

      {/* ---------------- Squad ---------------- */}
      {living.length > 1 ? (
        <Panel>
          <SectionLabel>The line</SectionLabel>
          <div className="space-y-2">
            {living.map((op) => (
              <button
                key={op.id}
                type="button"
                onClick={() => {
                  sfx.click();
                  selectOp(op.id);
                }}
                className="flex w-full items-center gap-3 rounded-[var(--radius-md)] bg-ink/70 px-3 py-2 text-left shadow-[var(--shadow-border)]"
              >
                <Portrait op={op} size={32} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-display text-body text-paper">{op.name}</span>
                    <StatusPill status={op.status} />
                  </span>
                  <HpBar hp={op.hp} max={op.maxHp} className="mt-1" />
                </span>
                <span className="shrink-0 text-label text-muted">{className(op.cls)}</span>
              </button>
            ))}
          </div>
        </Panel>
      ) : null}

      {/* ---------------- Campaign ground ---------------- */}
      <Panel>
        <SectionLabel>Ground</SectionLabel>
        <div className="space-y-2">
          {WORLD.filter((w) => w.id !== "hq").map((w) => (
            <RegionRow key={w.id} id={w.id as LocationId} />
          ))}
        </div>
      </Panel>

      {/* ---------------- Live leads ---------------- */}
      <Panel>
        <SectionLabel>Open leads</SectionLabel>
        {leads.length ? (
          <div className="space-y-2">
            {leads.map((lead) => (
              <div key={lead.id} className="rounded-[var(--radius-md)] bg-ink/70 px-3 py-2 shadow-[var(--shadow-border)]">
                <p className="font-display text-body text-paper">{lead.title}</p>
                <p className="mt-0.5 text-secondary leading-relaxed text-moon">{lead.detail}</p>
                <p className="mt-1 font-display text-label uppercase tracking-[0.14em] text-muted">
                  {locById(lead.locationId).short} · {lead.missionKind} · DC {lead.dcMod >= 0 ? "+" : ""}
                  {lead.dcMod} · +{lead.capsBonus} caps · expires day {lead.expiresDay}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">
            Nothing open. Work a site on the world map — a good sweep names its own next job.
          </p>
        )}
      </Panel>

      {/* ---------------- Records ---------------- */}
      <Panel>
        <SectionLabel>Records</SectionLabel>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Tile label="Sorties closed" value={String(sorties)} />
          <Tile label="Fights" value={String(battles)} />
          <Tile label="Deployments" value={String(raids)} />
          <Tile label="Reports filed" value={String(reports.length)} />
        </div>
        {reports.length ? (
          <div className="mt-3 space-y-1.5">
            {reports.slice(0, 6).map((r) => (
              <p key={r.id} className="text-secondary leading-snug text-muted">
                <span className="font-display text-label uppercase tracking-[0.14em] text-ember">D{r.day}</span>{" "}
                {r.headline}
                {r.caps ? ` · +${r.caps}c` : ""}
                {r.intel ? ` · +${r.intel} intel` : ""}
              </p>
            ))}
          </div>
        ) : null}
      </Panel>
    </div>
  );
}

function Tile({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-[var(--radius-sm)] bg-ink/60 px-2.5 py-2">
      <p className="font-display text-[9px] uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className={cn("mt-0.5 font-display text-sm tabular-nums text-paper", tone)}>{value}</p>
    </div>
  );
}

function CharacterFile({ op, onOpen }: { op: Operative; onOpen: () => void }) {
  const stats = computeStats(op);
  const gift = CLASS_GIFT[op.cls];
  return (
    <Panel>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Portrait op={op} size={48} />
          <div className="min-w-0">
            <p className="font-display text-lg leading-tight text-paper">{op.name}</p>
            <p className="text-sm text-muted">
              {className(op.cls)} · {displayRace(op.race)} · {displayLineage(op.race, op.lineage)}
            </p>
            <p className="text-label text-muted">
              {op.origin} · joined day {op.joinedDay} · {op.traitLevel} (+{op.traitBonus} {PRIMARY_STAT[op.cls]})
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpen}
          className="shrink-0 rounded-[var(--radius-sm)] px-2 py-1 font-display text-label uppercase tracking-[0.14em] text-ember shadow-[var(--shadow-border)]"
        >
          Sheet
        </button>
      </div>

      <HpBar hp={op.hp} max={op.maxHp} className="mt-3" />
      <div className="mt-3">
        <StatGrid stats={stats} primary={PRIMARY_STAT[op.cls]} dice={op.statDice} />
      </div>

      <div className="mt-3 space-y-1.5">
        <Line label={op.repTitle} detail={op.repPassive} />
        <Line label={op.skillName} detail={op.skillDesc} />
        <Line label={op.shadowName} detail={op.shadowDesc} />
        <Line label={op.enchantName} detail={op.enchantDesc} />
        <Line label={gift.name} detail={`${gift.desc} ${op.giftUsed ? "Spent today." : "Ready."}`} />
        {op.destiny ? <Line label="Destiny thread" detail={op.destiny} /> : null}
        {op.curses.length ? <Line label="Curses" detail={op.curses.join(", ")} /> : null}
      </div>
    </Panel>
  );
}

function Line({ label, detail }: { label: string; detail: string }) {
  if (!detail) return null;
  return (
    <p className="text-secondary leading-relaxed text-moon">
      <span className="font-display text-label uppercase tracking-[0.14em] text-ember">{label}</span> · {detail}
    </p>
  );
}

function Loadout({ op, onOpen }: { op: Operative; onOpen: () => void }) {
  const weapon = equippedWeapon(op);
  const armor = op.inventory.find((i) => i.equipped && i.slot === "armor");
  const trinket = op.inventory.find((i) => i.equipped && i.slot === "trinket");
  const analysis = analyzeLoadout(op);
  const ammo = op.inventory.filter((i) => isAmmoConsumable(i));
  const chems = op.inventory.filter((i) => i.kind === "consumable" && !isAmmoConsumable(i));

  return (
    <Panel>
      <div className="flex items-center justify-between gap-2">
        <SectionLabel>Equipped</SectionLabel>
        <button
          type="button"
          onClick={onOpen}
          className="mb-3 shrink-0 rounded-[var(--radius-sm)] px-2 py-1 font-display text-label uppercase tracking-[0.14em] text-ember shadow-[var(--shadow-border)]"
        >
          Stores
        </button>
      </div>

      <SlotRow slot="Weapon" item={weapon} />
      <SlotRow slot="Armor" item={armor} />
      <SlotRow slot="Trinket" item={trinket} />

      {weapon ? <WeaponSpec item={weapon} /> : null}

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Tile label="Pack" value={`${op.inventory.length} carried`} />
        <Tile label="Ammo boxes" value={String(ammo.length)} />
        <Tile label="Chems" value={String(chems.length)} />
        <Tile
          label="Load pressure"
          value={analysis.pressure}
          tone={analysis.pressure === "critical" ? "text-danger" : analysis.pressure === "strained" ? "text-ember" : "text-ok"}
        />
      </div>

      {ammo.length ? (
        <p className="mt-2 text-secondary leading-relaxed text-muted">
          On hand · {ammo.map((i) => `${i.name}${i.ammoCount ? ` (${i.ammoCount})` : ""}`).join(" · ")}
        </p>
      ) : (
        <p className="mt-2 text-secondary leading-relaxed text-ember">
          No boxes in the pack. A dry rifle is a -4 and half damage. The market under the Iron Gate sells by caliber.
        </p>
      )}

      {analysis.warnings.length ? (
        <p className="mt-2 text-secondary leading-relaxed text-ember">{analysis.warnings.join(" ")}</p>
      ) : null}
    </Panel>
  );
}

function SlotRow({ slot, item }: { slot: string; item: Item | undefined }) {
  return (
    <div className="mb-2 flex items-start gap-3 rounded-[var(--radius-md)] bg-ink/60 px-3 py-2">
      <span className="w-16 shrink-0 font-display text-[9px] uppercase tracking-[0.18em] text-muted">{slot}</span>
      {item ? (
        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 items-center gap-2">
            <span className="min-w-0 truncate font-display text-body text-paper">{item.name}</span>
            <RarityMark rarity={item.rarity} />
          </span>
          <span className="mt-0.5 block text-secondary leading-relaxed text-moon">{item.effect}</span>
          <span className="mt-0.5 block text-label text-muted">
            {item.condition}
            {item.damage ? ` · ${item.damage}` : ""}
            {item.defense ? ` · +${item.defense} DEF` : ""}
          </span>
        </span>
      ) : (
        <span className="flex-1 text-secondary text-muted">Empty. The Realm charges for empty slots.</span>
      )}
    </div>
  );
}

function WeaponSpec({ item }: { item: Item }) {
  const p = resolveWeapon(item);
  const parts = socketList(item);
  return (
    <div className="rounded-[var(--radius-md)] bg-ink/75 px-3 py-2.5 shadow-[var(--shadow-border)]">
      <p className="font-display text-label uppercase tracking-[0.16em] text-ember">
        {p.family}
        {p.ammoType ? ` · ${p.ammoType}` : ""} · {p.rangeBand} · {magLine(item)}
      </p>
      <p className="mt-1 font-display text-label uppercase tracking-[0.14em] tabular-nums text-muted">
        AP {p.ap} · ACC {p.accuracy >= 0 ? "+" : ""}
        {p.accuracy} · REC {p.recoil} · {p.roundsPerShot} round{p.roundsPerShot === 1 ? "" : "s"} per strike
        {p.dry ? " · DRY" : ""}
      </p>
      <p className="mt-1.5 text-secondary leading-relaxed text-moon">{item.lore}</p>
      {parts.length ? (
        <p className="mt-1 text-label text-muted">
          Fitted · {parts.map((x) => `${x.slot}: ${x.name}`).join(" · ")}
        </p>
      ) : null}
    </div>
  );
}

function RegionRow({ id }: { id: LocationId }) {
  const s = useGame((g) => g.s);
  const region = locationToRegion(id);
  const mastery = regionMastery(s, id);
  const stage = region ? threadStage(s, region) : 0;
  const progress = s.locations[id];
  const L = locById(id);
  const thread = region ? threadFor(region) : undefined;
  const boss = villainById(L.bossId);
  const avgDepth = mastery.total ? Math.round(mastery.depth / mastery.total) : 0;

  if (!progress?.unlocked) {
    return (
      <div className="rounded-[var(--radius-md)] bg-ink/50 px-3 py-2 opacity-60">
        <p className="font-display text-body text-muted">{L.short} · sealed</p>
        <p className="text-label text-muted">Finish the arc before it. The campaign opens on flags, not the calendar.</p>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-md)] bg-ink/70 px-3 py-2 shadow-[var(--shadow-border)]">
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-display text-body text-paper">{L.short}</p>
        <p className="font-display text-label uppercase tracking-[0.14em] text-muted">
          {DANGER_LABELS[Math.max(0, Math.min(DANGER_LABELS.length - 1, L.danger - 1))]}
        </p>
      </div>
      <p className="mt-0.5 font-display text-label uppercase tracking-[0.14em] tabular-nums text-muted">
        Intel {progress.intel} · sorties {progress.missions} · sites {mastery.known}/{mastery.total} ·{" "}
        {DEPTH_LABELS[Math.max(0, Math.min(4, avgDepth))]}
      </p>
      <p className={cn("mt-0.5 text-label", progress.bossDefeated ? "text-ok" : progress.bossUnlocked ? "text-danger" : "text-muted")}>
        {progress.bossDefeated
          ? `${boss?.name ?? "The name"} is down. The arc does not rewind.`
          : progress.bossUnlocked
            ? `${boss?.name ?? "A name"} is in play.`
            : `${boss?.name ?? "A name"} has not surfaced yet.`}
      </p>
      {thread ? <p className="mt-1 text-secondary leading-relaxed text-moon">{thread.stages[stage]}</p> : null}
    </div>
  );
}
