import { Button } from "@/components/ui/button";
import {
  activeRiders,
  bossClearCount,
  partyReadiness,
  quarterUpgradeQuote,
  raidProfileForLocation,
  raidReadyRiders,
  roomUpgradeQuote,
  upgradeBlockReason,
  vaultMaterialCount,
} from "@/game/campaign-balance";
import { BASE_ROOMS, QUARTERS, regionById } from "@/game/data";
import { sfx } from "@/game/audio";
import { useGame } from "@/game/store";
import type { QuarterId, RoomId } from "@/game/types";
import { cn } from "@/lib/cn";
import { ChevronRight, LockKeyhole, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Coin, Panel, SectionLabel } from "./primitives";

const ROOMS = Object.keys(BASE_ROOMS) as RoomId[];
const QUARTER_IDS = Object.keys(QUARTERS) as QuarterId[];

export function CampaignBalancePanel() {
  const s = useGame((g) => g.s);
  const upgradeRoom = useGame((g) => g.upgradeRoom);
  const upgradeQuarter = useGame((g) => g.upgradeQuarter);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onOpen = () => {
      setOpen(true);
      setError(null);
    };
    window.addEventListener("hollow:open-raid-matrix", onOpen);
    return () => window.removeEventListener("hollow:open-raid-matrix", onOpen);
  }, []);

  if (s.screen !== "hq" && s.screen !== "map") return null;

  const selected = s.selectedLoc ?? "ironclad";
  const raid = raidProfileForLocation(selected);
  const readiness = raid ? partyReadiness(s, selected, s.lastParty ?? []) : 0;
  const readyRiders = raid ? raidReadyRiders(s, raid).length : 0;

  return (
    <>
      {s.screen === "hq" ? (
        <button
          type="button"
          onClick={() => {
            sfx.click();
            setOpen(true);
            setError(null);
          }}
          className="fixed bottom-[5.8rem] right-3 z-30 flex min-h-12 items-center gap-2 rounded-full border border-ember/45 bg-surface/95 px-4 font-display text-[10px] uppercase tracking-[0.14em] text-ember shadow-xl backdrop-blur-md md:bottom-5 md:right-5"
        >
          <LockKeyhole className="size-4" />
          Expansion Board
        </button>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-[90] flex items-end bg-ink/80 p-3 backdrop-blur-md md:items-center md:justify-center" onClick={() => setOpen(false)}>
          <div
            className="ms-pop max-h-[90vh] w-full overflow-y-auto rounded-[var(--radius-xl)] border border-line bg-surface p-5 shadow-2xl md:max-w-2xl ms-scroll"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <SectionLabel>{s.screen === "hq" ? "Vault 13 · Long Campaign" : "Moon Squad · Raid Gate"}</SectionLabel>
                <h2 className="font-display text-2xl">{s.screen === "hq" ? "Expansion Protocol" : raid ? `${regionById(raid.region).name} Raid Matrix` : "Raid Matrix"}</h2>
                <p className="mt-1 text-sm text-muted">
                  {s.screen === "hq"
                    ? "Caps are only one part of construction. Vault 13 consumes regional salvage, Hollow Ore, Moon Favor, boss progress and community participation."
                    : "Bosses are communal endgame checks. Registered riders must contribute before the raid can launch."}
                </p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="flex size-10 shrink-0 items-center justify-center rounded-full border border-line text-muted">
                <X className="size-4" />
              </button>
            </div>

            {error ? <div className="mt-4 rounded-[var(--radius-md)] border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div> : null}

            {s.screen === "hq" ? (
              <>
                <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                  <Metric label="Day" value={s.day} />
                  <Metric label="Bosses" value={bossClearCount(s)} />
                  <Metric label="Riders" value={activeRiders(s).length} />
                  <Metric label="Ore" value={s.ore} />
                </div>

                <SectionLabel>Facilities</SectionLabel>
                <div className="space-y-2">
                  {ROOMS.map((room) => {
                    const quote = roomUpgradeQuote(s, room);
                    const blocked = quote ? upgradeBlockReason(s, quote) : "Maximum tier reached.";
                    return (
                      <Panel key={room} className="bg-raised p-3 md:p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-display text-sm text-paper">{BASE_ROOMS[room].name} · Tier {s.rooms[room]}</div>
                            {quote ? (
                              <p className="mt-1 text-xs leading-relaxed text-muted">
                                Next: <Coin n={quote.caps} /> · {quote.ore} ore · {quote.moonFavor} favor · {quote.materials} {regionById(quote.materialRegion).name} materials · {quote.bossClears} boss clears · {quote.riders} riders · day {quote.minDay}
                              </p>
                            ) : <p className="mt-1 text-xs text-ok">Maximum campaign tier.</p>}
                            {quote ? (
                              <p className="mt-1 text-[11px] text-moon">
                                Materials banked: {vaultMaterialCount(s, quote.materialRegion)}/{quote.materials}
                              </p>
                            ) : null}
                          </div>
                          {quote ? (
                            <Button
                              size="sm"
                              variant={blocked ? "quiet" : "ember"}
                              onClick={() => {
                                const msg = upgradeRoom(room);
                                setError(msg);
                                if (!msg) sfx.forge();
                              }}
                            >
                              Tier {quote.nextLevel} <ChevronRight className="size-3.5" />
                            </Button>
                          ) : null}
                        </div>
                        {blocked && quote ? <p className="mt-2 text-xs text-muted">Locked: {blocked}</p> : null}
                      </Panel>
                    );
                  })}
                </div>

                <SectionLabel>Resident quarters</SectionLabel>
                <div className="grid gap-2 sm:grid-cols-3">
                  {QUARTER_IDS.map((q) => {
                    const quote = quarterUpgradeQuote(s, q);
                    const blocked = quote ? upgradeBlockReason(s, quote) : "Maximum tier reached.";
                    return (
                      <Panel key={q} className="bg-raised p-3">
                        <div className="font-display text-sm">{QUARTERS[q].name} · {s.quarters[q]}</div>
                        {quote ? <p className="mt-2 text-xs text-muted"><Coin n={quote.caps} /> · {quote.materials} {regionById(quote.materialRegion).short} mats · {quote.ore} ore</p> : <p className="mt-2 text-xs text-ok">Maximum</p>}
                        {quote ? (
                          <Button
                            className="mt-3 w-full"
                            size="sm"
                            variant={blocked ? "quiet" : "ghost"}
                            onClick={() => setError(upgradeQuarter(q))}
                          >
                            Upgrade
                          </Button>
                        ) : null}
                      </Panel>
                    );
                  })}
                </div>
              </>
            ) : raid ? (
              <div className="mt-5 space-y-4">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Metric label="Matrix" value={`${readiness}/${raid.minReadiness}`} good={readiness >= raid.minReadiness} />
                  <Metric label="Raid-ready riders" value={`${readyRiders}/${raid.minRiders}`} good={readyRiders >= raid.minRiders} />
                  <Metric label="Intel" value={`${s.locations[selected]?.intel ?? 0}/${raid.minIntel}`} good={(s.locations[selected]?.intel ?? 0) >= raid.minIntel} />
                  <Metric label="Rider XP gate" value={`${raid.minRiderXp}+`} />
                </div>
                <Panel className="bg-raised">
                  <SectionLabel>Boss contract</SectionLabel>
                  <p className="text-sm text-paper">Field party: minimum {raid.minParty} operatives across {raid.minClasses} different classes.</p>
                  <p className="mt-2 text-sm text-moon">Victory treasury: <Coin n={raid.vaultReward} /> to Vault 13.</p>
                  <p className="mt-1 text-sm text-moon">Raid dividend: <Coin n={raid.cardReward} /> to every qualifying Moon Squad bank card.</p>
                  <p className="mt-1 text-sm text-muted">Also pays {raid.oreReward} Hollow Ore and {raid.favorReward} Moon Favor, plus boss-grade treasure rolls.</p>
                </Panel>
                <p className={cn("text-sm", readiness >= raid.minReadiness && readyRiders >= raid.minRiders ? "text-ok" : "text-ember")}>The 3D Moon Squad card remains the personal bottle-cap account. Raid dividends land there automatically.</p>
              </div>
            ) : <p className="mt-5 text-sm text-muted">No boss matrix is attached to this location.</p>}
          </div>
        </div>
      ) : null}
    </>
  );
}

function Metric({ label, value, good }: { label: string; value: string | number; good?: boolean }) {
  return (
    <div className="rounded-[var(--radius-md)] bg-ink p-3">
      <div className="font-display text-[9px] uppercase tracking-[0.14em] text-muted">{label}</div>
      <div className={cn("mt-1 font-display text-lg tabular-nums", good === undefined ? "text-paper" : good ? "text-ok" : "text-ember")}>{value}</div>
    </div>
  );
}
