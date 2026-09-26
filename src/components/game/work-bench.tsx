import { Button } from "@/components/ui/button";
import { FACILITY_ART } from "@/game/art";
import { sfx } from "@/game/audio";
import { CAST } from "@/game/cast";
import { BASE_ROOMS, QUARTERS } from "@/game/data";
import { nextQuarterCost, nextRoomCost, repairCost } from "@/game/engine";
import { itemArt } from "@/game/item-art";
import { useGame, type WorkJob } from "@/game/store";
import { fittedModules, pendingModules, travisBayBlurb, TRAVIS_MODULES, travisRepairFactor } from "@/game/travis";
import { allRepairCandidates, travisCanFavorWeld, travisReadItem } from "@/game/item-story";
import type { Item, QuarterId, RoomId } from "@/game/types";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { Coin, SectionLabel } from "./primitives";

const ROOM_LINE: Record<RoomId, string> = {
  vault: "Racks first. Then the cages. Then we stop stacking rifles on the porch.",
  barracks: "Beds. Not cots. People sleep better if the bunk does not fold.",
  forge: "The Machine Shop is how steel remembers how to hold. We do this slow.",
  infirmary: "Old lamps. New gauze. Tyrone insists the cabinet is still in date.",
  watchtower: "Cameras, such as they are. Raise the mast and the berm talks back.",
  ledger: "The stall is closed. The desk still counts. Raise it and the card listens.",
};

const QUARTER_LINE: Record<QuarterId, string> = {
  bunk: "A bunk that does not fold is a person who stays.",
  lockbox: "Gear on a hook, not on the floor. That is a vault inside the vault.",
  hearth: "Hot food is morale. Cold food is a rumor.",
};

const WORK_ART: Record<RoomId, string> = {
  vault: "/art/rooms/vault-raise.jpg",
  barracks: FACILITY_ART.barracks,
  forge: "/art/rooms/workbench.jpg",
  infirmary: FACILITY_ART.infirmary,
  watchtower: FACILITY_ART.watchtower,
  ledger: FACILITY_ART.ledger,
};

type Phase = "inspect" | "working" | "done";

const GUN_HANDS = [
  { short: "Spring", label: "Seat the spring", detail: "Under the bolt. Not beside it." },
  { short: "Pin", label: "Drift the pin", detail: "One punch. Straight. Do not mushroom the head." },
  { short: "Bead", label: "Draw the bead", detail: "Short. If you chase it, you warp the rail." },
];

const PLATE_HANDS = [
  { short: "Rivet", label: "Set the rivet", detail: "Proud first. Then drive it home." },
  { short: "Peen", label: "Peen the edge", detail: "Close the crack. Do not chase it across the plate." },
  { short: "Quench", label: "Quench the plate", detail: "Water after the color drops. Not before." },
];

function faultsFor(item: Item) {
  const plate = item.kind === "armor" || item.weaponFamily === "melee";
  if (item.condition === "Broken") {
    return plate
      ? [
          { id: "tang", label: "Cracked tang", detail: "The steel let go where the handle meets the work.", right: true, miss: "The wrap is ugly. The tang is why it failed." },
          { id: "wrap", label: "Loose wrap", detail: "Tape. Not the failure.", right: false, miss: "The wrap is ugly. The tang is why it failed." },
          { id: "tip", label: "Chipped tip", detail: "A scar. It still would have cut.", right: false, miss: "The tip is a scar. Look where the handle meets the steel." },
        ]
      : [
          { id: "pin", label: "Sheared crosspin", detail: "The action is in two pieces that used to be one.", right: true, miss: "The sight is a lie. The pin is the break." },
          { id: "sight", label: "Bent front sight", detail: "It would still fire. It would not group.", right: false, miss: "The sight is a lie. The pin is the break." },
          { id: "stock", label: "Cracked stock", detail: "Wood. The steel is the patient.", right: false, miss: "Wood can wait. The pin cannot." },
        ];
  }
  if (item.condition === "Damaged") {
    return plate
      ? [
          { id: "edge", label: "Rolled edge", detail: "It hits and skates.", right: true, miss: "The scuff is nothing. The edge is the job." },
          { id: "scuff", label: "Scuffed face", detail: "Paint. Not structure.", right: false, miss: "The scuff is nothing. The edge is the job." },
          { id: "strap", label: "Tired strap", detail: "It still hangs. It does not cut.", right: false, miss: "The strap can wait. Look at the edge." },
        ]
      : [
          { id: "extractor", label: "Burred extractor", detail: "It feeds. It does not let go.", right: true, miss: "The swivel is a noise. The extractor is the stoppage." },
          { id: "swivel", label: "Loose sling swivel", detail: "Annoying. Not the stoppage.", right: false, miss: "The swivel is a noise. The extractor is the stoppage." },
          { id: "finish", label: "Scuffed finish", detail: "The gun is not a painting.", right: false, miss: "Finish does not stop a gun. Look at the extractor." },
        ];
  }
  return plate
    ? [
        { id: "dry", label: "Dry wrap", detail: "The grip slips because nobody asked it to hold.", right: true, miss: "Dust is not wear. The wrap is dry." },
        { id: "dust", label: "Dust in the lettering", detail: "It looks tired. It is not.", right: false, miss: "Dust is not wear. The wrap is dry." },
        { id: "chip", label: "Small chip", detail: "Old. Not why it is worn.", right: false, miss: "That chip has been there for years. Oil the wrap." },
      ]
    : [
        { id: "rails", label: "Dry rails", detail: "The action drags. Oil, then it remembers.", right: true, miss: "The tape is tired. The rails are dry." },
        { id: "tape", label: "Tired tape on the grip", detail: "Looks neglected. Not the drag.", right: false, miss: "The tape is tired. The rails are dry." },
        { id: "letter", label: "Dust in the lettering", detail: "A story. Not a fault.", right: false, miss: "Dust is not why it drags. Look at the rails." },
      ];
}

function WeldJob({
  item,
  cost,
  favor,
  opId,
  forgeReady,
  onClose,
}: {
  item: Item | null;
  cost: number | null;
  favor: boolean;
  opId: string | "vault";
  forgeReady: boolean;
  onClose: () => void;
}) {
  const repairItem = useGame((g) => g.repairItem);
  const favorRepair = useGame((g) => g.travisFavorRepair);
  const [step, setStep] = useState<"fault" | "hands" | "prove" | "done">("fault");
  const [hands, setHands] = useState(0);
  const [cycles, setCycles] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  if (!item) return <p className="mt-4 text-sm text-muted">No steel on the bench.</p>;

  const plan = item.kind === "armor" ? PLATE_HANDS : GUN_HANDS;
  const prove = item.kind === "armor" ? "Flex the plate" : "Cycle the action";
  const faults = faultsFor(item);
  const steps = ["Fault", "Hands", "Proof"] as const;
  const stepIndex = step === "fault" ? 0 : step === "hands" ? 1 : 2;

  const pickFault = (id: string, right: boolean, miss: string) => {
    if (!right) {
      setError(miss);
      sfx.hurt();
      return;
    }
    if (!favor && !forgeReady) {
      setError("The Machine Shop is still a rumor. Raise the forge, then bring it back.");
      sfx.hurt();
      return;
    }
    if (cost == null) {
      setError("Already pristine.");
      return;
    }
    const coins = useGame.getState().s.coins;
    if (coins < cost) {
      setError(`Need ${cost} caps on the bench before the torch.`);
      sfx.hurt();
      return;
    }
    setError(null);
    setHands(0);
    setStep("hands");
    sfx.click();
  };

  const doHand = (index: number) => {
    if (index < hands) return;
    if (index !== hands) {
      setHands(0);
      setError(`Order. ${plan.map((h) => h.short).join(", then ")}.`);
      sfx.hurt();
      return;
    }
    const next = hands + 1;
    setHands(next);
    setError(null);
    sfx.forge();
    if (next >= plan.length) {
      setCycles(0);
      setStep("prove");
    }
  };

  const cycle = () => {
    if (step !== "prove") return;
    const next = cycles + 1;
    if (next < 3) {
      setCycles(next);
      sfx.click();
      return;
    }
    const msg = favor ? favorRepair(item.id) : repairItem(opId, item.id);
    if (msg) {
      setError(msg);
      setCycles(0);
      sfx.hurt();
      return;
    }
    setCycles(3);
    setNote(favor ? "Travis leans off the jig. It holds. Do not thank him twice." : "It holds. Do not drop it on the way to the bunk.");
    setStep("done");
    sfx.unlock();
  };

  return (
    <div className="mt-4" data-weld="1" data-weld-step={step}>
      <div className="flex gap-2">
        {steps.map((label, i) => (
          <span
            key={label}
            className={i === stepIndex && step !== "done" ? "font-display text-[10px] uppercase tracking-[0.16em] text-ember" : i < stepIndex || step === "done" ? "font-display text-[10px] uppercase tracking-[0.16em] text-ok" : "font-display text-[10px] uppercase tracking-[0.16em] text-muted"}
          >
            {i < stepIndex || step === "done" ? "●" : i === stepIndex ? "●" : "○"} {label}
          </span>
        ))}
      </div>

      {step === "fault" ? (
        <div className="mt-3 space-y-2">
          <p className="text-sm text-paper">Find the fault. The wrong scratch wastes the torch.</p>
          {faults.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => pickFault(f.id, f.right, f.miss)}
              className="flex min-h-14 w-full flex-col items-start justify-center rounded-[var(--radius-md)] bg-ink px-3 py-2 text-left"
            >
              <span className="font-display text-paper">{f.label}</span>
              <span className="mt-0.5 text-sm text-muted">{f.detail}</span>
            </button>
          ))}
        </div>
      ) : null}

      {step === "hands" ? (
        <div className="mt-3 space-y-2">
          <p className="text-sm text-paper">Hands, in order. Miss the order and you start the sequence again.</p>
          {plan.map((h, i) => (
            <button
              key={h.short}
              type="button"
              onClick={() => doHand(i)}
              className="flex min-h-14 w-full flex-col items-start justify-center rounded-[var(--radius-md)] bg-ink px-3 py-2 text-left"
            >
              <span className="font-display text-paper">
                {i < hands ? "Done · " : ""}
                {h.label}
              </span>
              <span className="mt-0.5 text-sm text-muted">{h.detail}</span>
            </button>
          ))}
        </div>
      ) : null}

      {step === "prove" ? (
        <div className="mt-3">
          <p className="text-sm text-paper">Prove it. Three clean cycles, then the caps come off.</p>
          <div className="mt-2 flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span key={i} className={i < cycles ? "h-1.5 flex-1 rounded-full bg-ok" : "h-1.5 flex-1 rounded-full bg-line"} />
            ))}
          </div>
          <Button className="mt-3 w-full" variant="ember" onClick={cycle}>
            {prove}
            {cost != null ? (
              <>
                {" · "}
                <Coin n={cost} />
              </>
            ) : null}
          </Button>
        </div>
      ) : null}

      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      {note ? <p className="mt-3 text-sm text-ok">{note}</p> : null}

      <div className="mt-4 flex gap-2">
        {step === "done" ? (
          <Button className="flex-1" variant="ember" onClick={onClose}>
            Back to Vault 13
          </Button>
        ) : (
          <Button variant="quiet" onClick={onClose}>
            Leave it
          </Button>
        )}
      </div>
    </div>
  );
}

function jobTitle(job: WorkJob, rooms: Record<RoomId, number>, quarters: Record<QuarterId, number>) {
  if (job.kind === "travis") {
    return { eyebrow: "Ironclad Mechanical Shop", title: "Last T-0880 bay", lvl: 0 };
  }
  if (job.kind === "room") {
    const room = BASE_ROOMS[job.room];
    const lvl = rooms[job.room];
    return { eyebrow: lvl > 0 ? "Upgrade" : "Raise from ruin", title: room.name, lvl };
  }
  if (job.kind === "quarter") {
    const q = QUARTERS[job.quarter];
    return { eyebrow: "Bunkhouse", title: q.name, lvl: quarters[job.quarter] };
  }
  return { eyebrow: "Machine Shop", title: "Lay it on the bench", lvl: 0 };
}

export function WorkBench() {
  const s = useGame((g) => g.s);
  const job = useGame((g) => g.work);
  const close = useGame((g) => g.closeWork);
  const upgradeRoom = useGame((g) => g.upgradeRoom);
  const upgradeQuarter = useGame((g) => g.upgradeQuarter);
  const [phase, setPhase] = useState<Phase>("inspect");
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    setPhase("inspect");
    setError(null);
    setNote(null);
  }, [job?.kind, job && "room" in job ? job.room : "", job && "itemId" in job ? job.itemId : ""]);

  useEffect(() => {
    if (!job) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [job, close]);

  if (!job) return null;
  if (job.kind === "travis") return <TravisBay />;

  const meta = jobTitle(job, s.rooms, s.quarters);
  const item =
    job.kind === "repair"
      ? job.opId === "vault"
        ? s.vault.find((i) => i.id === job.itemId)
        : s.operatives.find((o) => o.id === job.opId)?.inventory.find((i) => i.id === job.itemId)
      : null;
  const favor = job.kind === "repair" && !!job.favor;
  const cost =
    job.kind === "room"
      ? nextRoomCost(s, job.room)
      : job.kind === "quarter"
        ? nextQuarterCost(s, job.quarter)
        : item
          ? favor
            ? Math.max(35, Math.round(repairCost(s, item) * Math.min(1, travisRepairFactor(s) + 0.05)))
            : repairCost(s, item)
          : null;
  const weaponArt = job.kind === "repair" && item ? itemArt(item) : null;
  const art =
    job.kind === "repair"
      ? "/art/rooms/weld.jpg"
      : job.kind === "room"
        ? WORK_ART[job.room]
        : FACILITY_ART.barracks;
  const line =
    job.kind === "room"
      ? ROOM_LINE[job.room]
      : job.kind === "quarter"
        ? QUARTER_LINE[job.quarter]
        : favor
          ? "Favor weld. Find the fault. Do the hands in order. Caps come off when it holds."
          : "Machine Shop. Find the fault. Seat it in order. Cycle it until it holds.";
  const nextBonus =
    job.kind === "room"
      ? BASE_ROOMS[job.room].tiers[Math.min(s.rooms[job.room] + 1, BASE_ROOMS[job.room].tiers.length - 1)]?.bonus
      : job.kind === "quarter"
        ? QUARTERS[job.quarter].tiers[Math.min(s.quarters[job.quarter] + 1, QUARTERS[job.quarter].tiers.length - 1)]?.bonus
        : item
          ? `${item.name} · ${item.condition} → better. Steel remembers how to hold.`
          : null;

  const begin = () => {
    if (job.kind !== "room" && job.kind !== "quarter") return;
    if (cost == null) {
      setError("Already at peak.");
      return;
    }
    if (s.coins < cost) {
      setError(`Need ${cost} caps.`);
      sfx.hurt();
      return;
    }
    setError(null);
    setPhase("working");
    sfx.forge();
    window.setTimeout(() => {
      const msg = job.kind === "room" ? upgradeRoom(job.room) : upgradeQuarter(job.quarter);
      if (msg) {
        setError(msg);
        setPhase("inspect");
        sfx.hurt();
        return;
      }
      setNote("It holds. Vault 13 is a little less of a rumor.");
      setPhase("done");
    }, 1400);
  };

  return (
    <div
      className="fixed inset-0 z-[92] flex items-end bg-ink/85 p-3 backdrop-blur-md md:items-center md:justify-center"
      onClick={() => {
        if (phase !== "working" && job.kind !== "repair") close();
      }}
    >
      <div
        className="ms-pop max-h-[92vh] w-full overflow-y-auto rounded-[var(--radius-xl)] border border-line bg-surface shadow-2xl md:max-w-lg ms-scroll"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-44 overflow-hidden sm:h-56">
          <img src={art} alt="" className="size-full object-cover object-center" />
          {weaponArt ? (
            <img
              src={weaponArt}
              alt=""
              className="absolute bottom-3 right-4 h-[72%] w-auto max-w-[46%] object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.65)]"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/15 to-ink/20" />
          <button
            type="button"
            onClick={() => close()}
            className="absolute right-3 top-3 flex size-10 items-center justify-center rounded-full bg-ink/70 text-muted"
            aria-label="Close workbench"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="p-5">
          <SectionLabel>{meta.eyebrow}</SectionLabel>
          <h2 className="font-display text-2xl text-paper">{job.kind === "repair" ? (item?.name ?? "Steel") : meta.title}</h2>
          {job.kind !== "repair" ? (
            <p className="mt-1 text-sm text-muted">Tier {meta.lvl}{cost != null ? ` → ${meta.lvl + 1}` : " · peak"}</p>
          ) : (
            <p className="mt-1 text-sm text-muted">{item ? `${item.condition} · ${item.kind}` : "No steel on the bench."}</p>
          )}
          <p className="mt-3 text-sm italic leading-relaxed text-moon">{favor ? "Travis" : "Tyrone"} · {line}</p>
          {nextBonus && job.kind !== "repair" ? <p className="mt-3 text-sm leading-relaxed text-paper">{nextBonus}</p> : null}
          {job.kind === "repair" && item ? (
            <p className="mt-3 text-sm leading-relaxed text-paper">
              {item.condition} now. One step closer to holding if the work is clean.
              {cost != null ? ` The bench wants ${cost} caps at the end, not at the start.` : ""}
            </p>
          ) : null}

          {job.kind === "repair" ? (
            <WeldJob
              item={item ?? null}
              cost={cost}
              favor={favor}
              opId={job.opId}
              forgeReady={s.rooms.forge >= 1}
              onClose={close}
            />
          ) : (
            <>
          {phase === "working" ? (
            <div className="mt-5">
              <p className="font-display text-label uppercase tracking-[0.18em] text-ember">Sparks. Hold still.</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink">
                <div className="ms-work-bar h-full bg-ember" />
              </div>
            </div>
          ) : null}

          {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
          {note ? <p className="mt-4 text-sm text-ok">{note}</p> : null}

          <div className="mt-5 flex gap-2">
            {phase === "inspect" ? (
              <Button
                className="flex-1"
                variant="ember"
                disabled={cost == null}
                onClick={begin}
              >
                {meta.lvl > 0 ? "Begin the raise" : "Raise it"}
                {cost != null ? (
                  <>
                    {" · "}
                    <Coin n={cost} />
                  </>
                ) : null}
              </Button>
            ) : null}
            {phase === "done" ? (
              <Button className="flex-1" variant="ember" onClick={() => close()}>
                Back to Vault 13
              </Button>
            ) : null}
            {phase !== "working" ? (
              <Button variant="quiet" onClick={() => close()}>
                {phase === "done" ? "Close" : "Not now"}
              </Button>
            ) : null}
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TravisBay() {
  const s = useGame((g) => g.s);
  const close = useGame((g) => g.closeWork);
  const openWork = useGame((g) => g.openWork);
  const deliver = useGame((g) => g.deliverTravis);
  const pending = pendingModules(s);
  const fitted = fittedModules(s);
  const cracked = allRepairCandidates(s);
  const canWeld = travisCanFavorWeld(s);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [read, setRead] = useState<string[] | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  const seat = (itemId: string) => {
    setError(null);
    setBusy(itemId);
    sfx.forge();
    window.setTimeout(() => {
      const msg = deliver(itemId);
      if (msg) {
        setError(msg);
        sfx.hurt();
      } else {
        sfx.unlock();
        setNote(useGame.getState().s.toast);
      }
      setBusy(null);
    }, 900);
  };

  return (
    <div
      className="fixed inset-0 z-[92] flex items-end bg-ink/85 p-3 backdrop-blur-md md:items-center md:justify-center"
      onClick={() => {
        if (!busy) close();
      }}
    >
      <div
        className="ms-pop max-h-[92vh] w-full overflow-y-auto rounded-[var(--radius-xl)] border border-line bg-surface shadow-2xl md:max-w-lg ms-scroll"
        onClick={(e) => e.stopPropagation()}
        data-travis-bay="1"
      >
        <div className="relative h-52 overflow-hidden sm:h-60">
          <img src={CAST.travis.still} alt="" className="size-full object-cover object-top" />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-ink/25" />
          <button
            type="button"
            onClick={() => close()}
            className="absolute right-3 top-3 flex size-10 items-center justify-center rounded-full bg-ink/70 text-muted"
            aria-label="Close shop"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="p-5">
          <SectionLabel>{CAST.travis.title}</SectionLabel>
          <h2 className="font-display text-2xl text-paper">{CAST.travis.name}</h2>
          <p className="mt-1 text-sm text-muted">{CAST.travis.callsign} · {travisBayBlurb(s)}</p>
          <p className="mt-3 text-sm italic leading-relaxed text-moon">“{CAST.travis.voice[s.travis.jobs ? 0 : 1]}”</p>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            T-0880 fittings are the job. Favor welds are a courtesy once the jig trusts you. Optics, strip, and long rebuilds stay at Vault 13&apos;s Machine Shop.
          </p>

          {pending.length ? (
            <div className="mt-5 space-y-2">
              <SectionLabel>On the jig · TyroneBot</SectionLabel>
              {pending.map(({ item, mod }) => (
                <div key={item.id} className="flex gap-3 rounded-[var(--radius-sm)] bg-ink/55 p-3">
                  <img
                    src={itemArt({ kind: item.kind, name: item.name }) ?? CAST.travis.thumb}
                    alt=""
                    className="h-16 w-12 shrink-0 object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-paper">{mod.name}</p>
                    <p className="text-sm text-muted">{mod.fit}</p>
                    <p className="mt-1 font-mono text-label text-ember">Pays {mod.pay} caps · {mod.slot}</p>
                  </div>
                  <Button
                    variant="ember"
                    className="self-center"
                    disabled={!!busy}
                    data-travis-fit={mod.id}
                    onClick={() => seat(item.id)}
                  >
                    {busy === item.id ? "Seating…" : "Fit"}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm leading-relaxed text-muted">
              Nothing on the jig. Run a campaign — rail, Works, Berm, tower, Halo. Tube, wheel, servo, plate, coil, knee. I pay in caps. I put them in him.
            </p>
          )}

          {cracked.length ? (
            <div className="mt-5 space-y-2">
              <SectionLabel>Show him steel</SectionLabel>
              <p className="text-xs text-muted">
                {canWeld
                  ? "Jig trusts you. A favor weld is a job on the bench — fault, hands, then proof."
                  : "Seat a T-0880 part first. Then I favor-weld cracked weapons and plate."}
              </p>
              {cracked.slice(0, 6).map(({ item, opId }) => {
                const cost = repairCost(s, item);
                const favorCost = Math.max(35, Math.round(cost * Math.min(1, travisRepairFactor(s) + 0.05)));
                return (
                  <div key={item.id} className="flex gap-3 rounded-[var(--radius-sm)] bg-ink/40 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-paper">{item.name}</p>
                      <p className="text-sm text-muted">
                        {item.condition} · {item.kind}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 self-center">
                      <Button
                        size="sm"
                        variant="quiet"
                        disabled={!!busy}
                        onClick={() => {
                          sfx.click();
                          setRead(travisReadItem(s, item).lines);
                        }}
                      >
                        Read
                      </Button>
                      <Button
                        size="sm"
                        variant="ember"
                        disabled={!!busy || !canWeld}
                        onClick={() => {
                          sfx.click();
                          openWork({ kind: "repair", opId, itemId: item.id, favor: true });
                        }}
                      >
                        Bench · <Coin n={favorCost} />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          {read ? (
            <div className="mt-4 rounded-[var(--radius-sm)] border border-line bg-ink/55 p-3">
              <p className="font-display text-[9px] uppercase tracking-[0.18em] text-ember">Travis</p>
              {read.map((line) => (
                <p key={line} className="mt-1 text-sm leading-relaxed text-paper">
                  {line}
                </p>
              ))}
              <button type="button" className="mt-2 text-xs text-muted" onClick={() => setRead(null)}>
                Close
              </button>
            </div>
          ) : null}

          <div className="mt-5">
            <SectionLabel>Seated in TyroneBot</SectionLabel>
            <p className="mt-1 font-mono text-label text-muted">
              {fitted.length} of {TRAVIS_MODULES.length} fittings · paid {s.travis.paid} caps
            </p>
            <ul className="mt-2 space-y-1">
              {TRAVIS_MODULES.map((mod) => {
                const on = fitted.some((m) => m.id === mod.id);
                return (
                  <li key={mod.id} className={on ? "text-sm text-paper" : "text-sm text-muted"}>
                    {on ? "●" : "○"} {mod.name}
                    {on ? ` · ${mod.tagline}` : ""}
                  </li>
                );
              })}
            </ul>
          </div>

          {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
          {note ? <p className="mt-4 text-sm text-ok">{note}</p> : null}

          <div className="mt-5 flex gap-2">
            <Button className="flex-1" variant="quiet" onClick={() => close()} disabled={!!busy}>
              Back to the Gate
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
