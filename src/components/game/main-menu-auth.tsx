import { Button } from "@/components/ui/button";
import { hasPlayerProfile } from "@/game/engine";
import { seatedMember } from "@/game/squad";
import { sfx, unlockAudio } from "@/game/audio";
import { useGame } from "@/game/store";
import { signInWithDiscord, useDiscordAccess } from "@/lib/auth/discord-access";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { CapMark, SectionLabel } from "./primitives";
import { HelpChrome, TalkOverlay } from "./talk-overlay";
import { ProfileStamp } from "./menu";
import { OpeningBoot, TitleBackdrop, SynapseLoadBar } from "./title-scene";
import { MoonCard } from "./card";
import { RadioChip, RadioDeckSheet, RadioDirector } from "./radio-deck";

function FileStat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-[var(--radius-sm)] bg-ink/55 px-2 py-3 text-center shadow-[var(--shadow-border)]">
      <div className="font-display text-lg tabular-nums text-paper">{value}</div>
      <div className="mt-1 font-display text-[9px] uppercase tracking-[0.14em] text-muted">{label}</div>
    </div>
  );
}

export function AuthenticatedMainMenu() {
  const assume = useGame((g) => g.assumeCommand);
  const resume = useGame((g) => g.resumeSession);
  const reset = useGame((g) => g.reset);
  const openTerminal = useGame((g) => g.openTerminal);
  const linkDiscord = useGame((g) => g.linkDiscord);
  const started = useGame((g) => g.s.started);
  const day = useGame((g) => g.s.day);
  const coins = useGame((g) => g.s.coins);
  const level = useGame((g) => g.s.level);
  const xp = useGame((g) => g.s.xp);
  const xpToNext = useGame((g) => g.s.xpToNext);
  const ops = useGame((g) => g.s.operatives);
  const rooms = useGame((g) => g.s.rooms);
  const riderId = useGame((g) => g.s.discordId);
  const playerName = useGame((g) => g.s.playerName);
  const playerHandle = useGame((g) => g.s.playerHandle);
  const me = useGame((g) => seatedMember(g.s));
  const named = useGame((g) => hasPlayerProfile(g.s));
  const talking = useGame((g) => !!g.s.talk);
  const hydrated = useGame((g) => g.hydrated);
  const { access, pending, refresh } = useDiscordAccess();
  const [ask, setAsk] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  const allowed = !!access?.allowed;
  const roster = ops.filter((op) => op.status !== "dead").length;
  const beds = 3 + rooms.barracks * 2;
  const roomN = Object.values(rooms).filter((n) => n > 0).length;

  useEffect(() => {
    if (!allowed || !access?.discordId) return;
    const handle = access.handle || (access.name && !/\s/.test(access.name) ? access.name : "");
    if (riderId === access.discordId && (!handle || playerHandle === handle)) return;
    linkDiscord(access.discordId, handle);
  }, [access?.discordId, access?.handle, access?.name, allowed, linkDiscord, riderId, playerHandle]);

  const boot = () => {
    if (!allowed || !named) return;
    unlockAudio();
    sfx.click();
    if (started) resume();
    else assume();
  };

  const connectDiscord = async () => {
    if (signingIn) return;
    setSigningIn(true);
    setAuthError(null);
    unlockAudio();
    try {
      await signInWithDiscord();
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Discord sign-in failed.");
      setSigningIn(false);
    }
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (ask || talking || !named) {
        if (event.key === "Escape") setAsk(false);
        return;
      }
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, button")) return;
      if (event.key !== "Enter") return;
      if (allowed) boot();
      else if (!pending && access?.stage !== "tyrone") void connectDiscord();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-ink text-paper" data-ready="1">
      <TitleBackdrop />
      <div className="title-veil pointer-events-none absolute inset-0 z-[1]" />
      <OpeningBoot gateReady={hydrated && !pending}>
      <div className="relative z-[2] flex min-h-0 flex-1 flex-col justify-end px-4 pb-8 pt-16 md:px-10 md:pb-10">
        <div className="mx-auto flex w-full max-w-lg flex-col gap-3 md:max-w-xl">
          {started && allowed ? <RadioChip /> : null}
          <div className="ms-title-dock rounded-[var(--radius-xl)] bg-ink/62 p-4 shadow-[var(--shadow-border)] backdrop-blur-md md:p-5">
            <p className="font-display text-[11px] uppercase tracking-[0.42em] text-ember">S.Y.N.A.P.S.E T-0880</p>
            <p className="mt-1 text-xs text-moon">
              {!allowed ? "Vault 13 recognizes verified riders only." : named ? "Tyrone keeps the porch light on." : "Stamp a name. Then we wake you."}
            </p>
            {!allowed ? (
              <div>
                <div className="flex items-center justify-between gap-3">
                  <SectionLabel>Vault 13 access control</SectionLabel>
                  <ShieldCheck className="size-4 text-ember" />
                </div>
                {pending ? (
                  <div className="mt-3">
                    <p className="text-sm text-moon">Tyrone is checking the Discord uplink…</p>
                    <div className="mt-3">
                      <SynapseLoadBar value={null} label="Discord uplink" />
                    </div>
                  </div>
                ) : access?.stage === "tyrone" ? (
                  <>
                    <p className="mt-3 font-display text-sm text-paper">Discord authenticated{access.name ? ` · ${access.name}` : ""}</p>
                    <p className="mt-2 text-sm leading-relaxed text-moon">
                      One more handshake. Ask TyroneBot in Discord for your one-time Hollow Realm verification link, open it in this browser, then refresh the gate. No caps or XP travel in the URL.
                    </p>
                    <Button variant="ember" size="lg" className="mt-4 w-full" onClick={refresh}>
                      <RefreshCw className="size-4" /> I verified with Tyrone
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="mt-3 text-sm leading-relaxed text-moon">
                      Sign in with Discord before a save can start, resume, access the terminal, or enter the shared Moon Squad campaign.
                    </p>
                    <Button variant="ember" size="lg" className="mt-4 w-full" onClick={() => void connectDiscord()} disabled={signingIn}>
                      <ShieldCheck className="size-4" /> {signingIn ? "Opening Discord…" : "Continue with Discord"}
                    </Button>
                  </>
                )}
                {(authError || access?.error) ? <p className="mt-3 text-xs leading-relaxed text-danger">{authError ?? access?.error}</p> : null}
              </div>
            ) : !named ? (
              <div className="mt-4">
                <ProfileStamp
                  prefill={playerName || ""}
                  prefillHandle={playerHandle || access?.handle || ""}
                  handleLocked={Boolean(access?.handle || playerHandle)}
                />
              </div>
            ) : (
              <>
                {started ? (
                  <div className="mt-4">
                    <div className="flex items-center justify-between gap-3">
                      <SectionLabel>Verified active file</SectionLabel>
                      <p className="font-display text-[10px] uppercase tracking-[0.18em] text-muted">Rank {level} · {xp}/{xpToNext} XP</p>
                    </div>
                    <div className="mt-3 grid grid-cols-4 gap-2">
                      <FileStat label="Day" value={String(day)} />
                      <FileStat label="Caps" value={<span className="inline-flex items-center justify-center gap-1"><CapMark className="text-ember" />{coins.toLocaleString()}</span>} />
                      <FileStat label="Roster" value={`${roster}/${beds}`} />
                      <FileStat label="Rooms" value={String(roomN)} />
                    </div>
                  </div>
                ) : (
                  <div className="mt-4">
                    <SectionLabel>File stamped</SectionLabel>
                    <p className="mt-2 text-sm leading-relaxed text-moon">
                      {playerName}. I found you east of the highway. No tracks. Wake up and I will walk you into Vault 13.
                    </p>
                    {playerHandle ? (
                      <p className="mt-3 font-display text-[10px] uppercase tracking-[0.18em] text-ember">@{playerHandle}</p>
                    ) : null}
                    <div className="mt-4">
                      <MoonCard member={me} />
                    </div>
                  </div>
                )}

                <div className="mt-5 flex flex-col gap-2">
                  <Button
                    variant="ember"
                    size="lg"
                    className="w-full"
                    onPointerDown={() => {
                      unlockAudio();
                    }}
                    onClick={boot}
                    disabled={talking}
                  >
                    {started ? `Assume command · Day ${day}` : "Wake up"}
                  </Button>
                  {started ? <Button variant="ghost" className="w-full" onClick={() => setAsk(true)} disabled={talking}>New file</Button> : null}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      </OpeningBoot>

      {allowed ? (
      <button
        type="button"
        onClick={() => {
          unlockAudio();
          const message = openTerminal();
          if (message) useGame.setState((store) => ({ s: { ...store.s, toast: message } }));
        }}
        className="absolute right-3 top-3 z-[2] w-[7.5rem] touch-manipulation overflow-hidden rounded-[var(--radius-md)] shadow-[var(--shadow-border)] transition-[box-shadow,transform] hover:shadow-[var(--shadow-border-hover)] active:scale-[0.98] md:right-6 md:top-6 md:w-40"
        aria-label="Sit the SYNAPSE terminal"
        data-sit-crt="1"
      >
        <img src="/art/terminal.jpg" alt="" className="aspect-[4/3] w-full object-cover" />
        <span className="absolute inset-x-0 bottom-0 bg-ink/75 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-ember">
          SIT THE CRT
        </span>
      </button>
      ) : null}

      {ask ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/70 p-4 md:items-center"
          onClick={() => setAsk(false)}
          role="presentation"
        >
          <div
            className="ms-pop glass-strong w-full max-w-md rounded-[var(--radius-xl)] p-5 text-left"
            role="dialog"
            aria-modal="true"
            aria-label="Confirm new local file"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="font-display text-xl">Wipe this local file?</h2>
            <p className="mt-3 text-sm leading-relaxed text-moon">The local roster/cache resets. Server-authoritative campaign value remains governed by Vault 13.</p>
            <div className="mt-5 flex gap-2">
              <Button
                variant="danger"
                className="flex-1"
                onClick={() => {
                  reset();
                  setAsk(false);
                  unlockAudio();
                  useGame.getState().assumeCommand();
                }}
              >
                New file
              </Button>
              <Button variant="quiet" className="flex-1" onClick={() => setAsk(false)}>Hold</Button>
            </div>
          </div>
        </div>
      ) : null}

      <RadioDirector />
      <TalkOverlay />
      <HelpChrome />
      <RadioDeckSheet />
    </div>
  );
}
