import { Button } from "@/components/ui/button";
import { sfx, unlockAudio } from "@/game/audio";
import { useGame } from "@/game/store";
import { signInWithDiscord, useDiscordAccess } from "@/lib/auth/discord-access";
import { BookOpen, RefreshCw, ShieldCheck, Terminal } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { CapMark, SectionLabel } from "./primitives";
import { HelpChrome, TalkOverlay } from "./talk-overlay";
import { TitleBackdrop } from "./menu";

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
  const setScreen = useGame((g) => g.setScreen);
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
  const talking = useGame((g) => !!g.s.talk);
  const { access, pending, user, refresh } = useDiscordAccess();
  const [ask, setAsk] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  const allowed = !!access?.allowed;
  const roster = ops.filter((op) => op.status !== "dead").length;
  const beds = 3 + rooms.barracks * 2;
  const roomN = Object.values(rooms).filter((n) => n > 0).length;

  useEffect(() => {
    if (!allowed || !access?.discordId || access.discordId === riderId) return;
    linkDiscord(access.discordId, access.name ?? user?.displayName ?? "Discord Rider");
  }, [access?.discordId, access?.name, allowed, linkDiscord, riderId, user?.displayName]);

  const boot = () => {
    if (!allowed) return;
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
      if (ask || talking) {
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
      <div className="crt-scan absolute inset-0 opacity-20" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-ink)_12%,transparent),color-mix(in_oklab,var(--color-ink)_38%,transparent)_42%,color-mix(in_oklab,var(--color-ink)_88%,transparent)_78%,var(--color-ink))]" />

      <div className="relative z-[1] flex min-h-0 flex-1 flex-col justify-end px-4 pb-8 pt-16 md:px-10 md:pb-10">
        <div className="mx-auto flex w-full max-w-lg flex-col gap-5 md:max-w-xl">
          <div className="flex items-end gap-4">
            <img
              src="/art/tyrone.jpg"
              alt="Tyrone Bot, S.Y.N.A.P.S.E T-0880"
              className="size-20 rounded-[var(--radius-md)] object-cover shadow-[var(--shadow-border-hover)] md:size-24"
            />
            <div className="min-w-0">
              <p className="font-display text-[11px] uppercase tracking-[0.42em] text-ember">S.Y.N.A.P.S.E T-0880</p>
              <h1 className="mt-1 font-display text-4xl tracking-[0.08em] text-paper md:text-5xl">HOLLOW<span className="block text-ember">REALM</span></h1>
              <p className="mt-2 text-xs text-moon">Vault 13 recognizes verified riders only.</p>
            </div>
          </div>

          <div className="glass-strong rounded-[var(--radius-xl)] p-4 md:p-5">
            {!allowed ? (
              <div>
                <div className="flex items-center justify-between gap-3">
                  <SectionLabel>Vault 13 access control</SectionLabel>
                  <ShieldCheck className="size-4 text-ember" />
                </div>
                {pending ? (
                  <p className="mt-3 text-sm text-moon">Tyrone is checking the Discord uplink…</p>
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
                <Button variant="quiet" className="mt-3 w-full" onClick={() => setScreen("rules")}>
                  <BookOpen className="size-4" /> View field manual
                </Button>
              </div>
            ) : (
              <>
                {started ? (
                  <div>
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
                  <div>
                    <SectionLabel>Verified rider</SectionLabel>
                    <p className="mt-2 text-sm leading-relaxed text-moon">
                      {access?.devBypass ? "Development authority is active." : `${access?.name ?? user?.displayName ?? "Discord rider"} is cleared through Discord.`} Tyrone will walk the first resident through Vault 13 before the campaign opens up.
                    </p>
                  </div>
                )}

                <div className="mt-5 flex flex-col gap-2">
                  <Button variant="ember" size="lg" className="w-full" onClick={boot} disabled={talking}>
                    {started ? `Resume · Day ${day}` : "Assume command"}
                  </Button>
                  {started ? <Button variant="ghost" className="w-full" onClick={() => setAsk(true)} disabled={talking}>New file</Button> : null}
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="quiet" className="w-full" onClick={() => setScreen("rules")}><BookOpen className="size-4" /> Rules</Button>
                    <Button
                      variant="quiet"
                      className="w-full"
                      onClick={() => {
                        unlockAudio();
                        const message = openTerminal();
                        if (message) useGame.setState((store) => ({ s: { ...store.s, toast: message } }));
                      }}
                    >
                      <Terminal className="size-4" /> Black channel
                    </Button>
                  </div>
                </div>
                <p className="mt-4 font-display text-[9px] uppercase tracking-[0.2em] text-muted">
                  Discord verified · server authority online · terminal password rotates per breach
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <button
        type="button"
        disabled={!allowed}
        onClick={() => {
          unlockAudio();
          const message = openTerminal();
          if (message) useGame.setState((store) => ({ s: { ...store.s, toast: message } }));
        }}
        className="absolute right-3 top-3 z-[2] w-[7.5rem] touch-manipulation overflow-hidden rounded-[var(--radius-md)] shadow-[var(--shadow-border)] transition-[box-shadow,transform] hover:shadow-[var(--shadow-border-hover)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 md:right-6 md:top-6 md:w-40"
        aria-label={allowed ? "Open the SYNAPSE black-channel terminal" : "Discord verification required"}
      >
        <img src="/art/terminal.jpg" alt="" className="aspect-[4/3] w-full object-cover" />
        <span className="absolute inset-x-0 bottom-0 bg-ink/75 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-ember">
          {allowed ? "BLACK CHANNEL · ARMED" : "AUTH REQUIRED"}
        </span>
      </button>

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

      <TalkOverlay />
      <HelpChrome />
    </div>
  );
}
