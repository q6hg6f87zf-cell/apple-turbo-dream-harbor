import { Button } from "@/components/ui/button";
import { cloneState, defaultState, hasPlayerProfile, seatSoul } from "@/game/engine";
import { isPlaceholderName } from "@/game/discord";
import { seatedMember } from "@/game/squad";
import { sfx, unlockAudio } from "@/game/audio";
import { useGame } from "@/game/store";
import { playFoundYou } from "@/game/radio";
import { beginGuestPlay } from "@/game/guest-play";
import { signInAsGuest, signInWithDiscord, signOutDiscord, stampDiscordPlate, useDiscordAccess } from "@/lib/auth/discord-access";
import { LogOut, RefreshCw, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { CapMark, SectionLabel } from "./primitives";
import { HelpChrome, TalkOverlay } from "./talk-overlay";
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

function DiscordMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M19.7 5.3A18 18 0 0 0 15.2 4l-.2.4a16.4 16.4 0 0 1 4 1.6c-4-2-8.4-2-12.3 0A16 16 0 0 1 6.7 4.4L6.5 4a18 18 0 0 0-4.5 1.3C.3 9.2-.4 13 0 16.7A18.4 18.4 0 0 0 5.7 19.4l.7-1.1a12 12 0 0 1-1.9-.9l.5-.4c3.7 1.7 7.7 1.7 11.4 0l.5.4a12 12 0 0 1-1.9.9l.7 1.1a18.4 18.4 0 0 0 5.7-2.7c.5-4.2-.7-7.9-2.2-11.4ZM8.3 14.6c-1.1 0-2-1-2-2.2s.9-2.2 2-2.2 2 1 2 2.2-.9 2.2-2 2.2Zm7.4 0c-1.1 0-2-1-2-2.2s.9-2.2 2-2.2 2 1 2 2.2-.9 2.2-2 2.2Z"
      />
    </svg>
  );
}

export function AuthenticatedMainMenu() {
  const assume = useGame((g) => g.assumeCommand);
  const resume = useGame((g) => g.resumeSession);
  const openTerminal = useGame((g) => g.openTerminal);
  const adoptVerifiedDiscord = useGame((g) => g.adoptVerifiedDiscord);
  const stamp = useGame((g) => g.stampProfile);
  const reviseGuest = useGame((g) => g.reviseGuestPlate);
  const started = useGame((g) => g.s.started);
  const day = useGame((g) => g.s.day);
  const coins = useGame((g) => g.s.coins);
  const level = useGame((g) => g.s.level);
  const xp = useGame((g) => g.s.xp);
  const xpToNext = useGame((g) => g.s.xpToNext);
  const ops = useGame((g) => g.s.operatives);
  const rooms = useGame((g) => g.s.rooms);
  const playerName = useGame((g) => g.s.playerName);
  const playerHandle = useGame((g) => g.s.playerHandle);
  const me = useGame((g) => seatedMember(g.s));
  const named = useGame((g) => hasPlayerProfile(g.s));
  const talking = useGame((g) => !!g.s.talk);
  const hydrated = useGame((g) => g.hydrated);
  const { access, pending, refresh } = useDiscordAccess();
  const [authError, setAuthError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftHandle, setDraftHandle] = useState("");
  const guestSeeded = useRef(false);

  const allowed = !!access?.allowed;
  const discordHandle = (() => {
    const raw = (access?.handle || playerHandle || "").replace(/^@/, "");
    return isPlaceholderName(raw) ? "" : raw;
  })();
  const chosenName =
    (!isPlaceholderName(playerName) && playerName) ||
    (!isPlaceholderName(access?.name) && access?.name) ||
    "Rider";
  const roster = ops.filter((op) => op.status !== "dead").length;
  const beds = 3 + rooms.barracks * 2;
  const roomN = Object.values(rooms).filter((n) => n > 0).length;

  useEffect(() => {
    if (!allowed || !access?.discordId) return;
    if (access.guest) {
      beginGuestPlay();
      const file = useGame.getState().s;
      const carried = file.started || !!file.discordId || file.operatives.length > 0;
      if (carried) {
        useGame.setState({ s: defaultState(), hydrated: true, handshake: null });
      }
      return;
    }
    adoptVerifiedDiscord(access.discordId, access.name ?? "", access.handle ?? "");
  }, [access?.discordId, access?.handle, access?.name, access?.guest, allowed, adoptVerifiedDiscord]);

  useEffect(() => {
    if (!allowed || access?.guest) return;
    const name = (access?.name ?? "").trim();
    const handle = (access?.handle ?? "").replace(/^@/, "");
    if (!isPlaceholderName(name)) {
      stamp(name, handle);
      return;
    }
    if (access?.devBypass) stamp("Rider", "sandbox");
  }, [allowed, access?.name, access?.handle, access?.devBypass, stamp]);

  useEffect(() => {
    if (!allowed || !access?.soul || access.guest) return;
    const soul = access.soul;
    useGame.setState((store) => {
      const next = cloneState(store.s);
      if (!seatSoul(next, soul)) return store;
      return { s: next };
    });
  }, [allowed, access?.soul]);

  useEffect(() => {
    if (!allowed || !named || access?.devBypass || access?.guest || !access?.discordId) return;
    if (isPlaceholderName(playerName) || isPlaceholderName(playerHandle)) return;
    void stampDiscordPlate(playerName ?? "", playerHandle ?? "");
  }, [allowed, named, access?.devBypass, access?.guest, access?.discordId, playerName, playerHandle]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reason = params.get("reason");
    const failed = params.get("auth") === "error" || params.get("discord") === "error";
    if (failed) {
      setAuthError(
        reason === "access_denied"
          ? "Discord sign-in was cancelled."
          : reason === "not-configured"
            ? "Discord login is not seated on this host yet."
            : reason === "guest-unavailable"
          ? "Guest login is not seated on this host yet."
          : "Discord sign-in failed. Try again.",
      );
    }
  }, []);

  useEffect(() => {
    if (!access?.guest || !hydrated || guestSeeded.current) return;
    guestSeeded.current = true;
    const name = !isPlaceholderName(playerName) && playerName && playerName !== "Guest" ? playerName : "";
    const handle = (playerHandle ?? "").replace(/^@/, "");
    setDraftName(name);
    setDraftHandle(/^guest\d{4}$/.test(handle) ? "" : handle);
  }, [access?.guest, hydrated, playerName, playerHandle]);

  useEffect(() => {
    if (!allowed || !access?.guest) return;
    const name = draftName.trim();
    const handle = draftHandle.trim().replace(/^@/, "");
    if (name.length < 2 || handle.length < 2) return;
    reviseGuest(name, handle);
  }, [allowed, access?.guest, draftName, draftHandle, reviseGuest]);

  const enterFile = () => {
    if (!allowed) return;
    if (access?.guest) {
      const name = draftName.trim();
      const handle = draftHandle.trim().replace(/^@/, "");
      if (name.length < 2 || handle.length < 2) {
        setAuthError("Name and @ go on the card first.");
        return;
      }
      setAuthError(null);
      reviseGuest(name, handle);
    } else if (!named) {
      const name = (access?.name ?? "").trim() || (access?.devBypass ? "Rider" : "");
      const handle = (access?.handle ?? "").replace(/^@/, "") || (access?.devBypass ? "sandbox" : "");
      if (!isPlaceholderName(name)) stamp(name, handle);
      else return;
    }
    unlockAudio();
    sfx.click();
    if (access?.guest || !started) assume();
    else resume();
  };

  const connectGuest = () => {
    if (signingIn) return;
    setSigningIn(true);
    setAuthError(null);
    unlockAudio();
    sfx.click();
    signInAsGuest();
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

  const onLogin = () => {
    if (allowed) enterFile();
    else void connectDiscord();
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (talking) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, button")) return;
      if (event.key !== "Enter") return;
      if (pending) return;
      onLogin();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [talking, pending, allowed, named, started, signingIn, access?.guest, draftName, draftHandle]);

  const loginLabel = !allowed
    ? signingIn
      ? "Opening Discord…"
      : "Log in to Discord"
    : started
      ? "Log in"
      : "Wake up";

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-ink text-paper" data-ready="1">
      <TitleBackdrop />
      <div className="title-veil pointer-events-none absolute inset-0 z-[1]" />
      <OpeningBoot gateReady={hydrated && !pending}>
      <div className="relative z-[2] flex min-h-0 flex-1 flex-col justify-end overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-16 md:px-10 md:pb-10">
        <div className="mx-auto flex w-full max-w-lg flex-col gap-3 md:max-w-xl">
          {started && allowed ? <RadioChip /> : null}
          <div className="ms-title-dock rounded-[var(--radius-xl)] bg-ink/62 p-3 shadow-[var(--shadow-border)] backdrop-blur-md md:p-5">
            <p className="font-display text-[11px] uppercase tracking-[0.42em] text-ember">S.Y.N.A.P.S.E T-0880</p>
            <p className="mt-1 text-xs text-moon">
              {!allowed
                ? "The porch stays up. Discord cuts the black card. Name and handle lock to that file."
                : access?.guest
                  ? "Guest walk. Nothing is saved. Name the card, then the opening starts."
                  : started
                    ? "Tyrone keeps the porch light on."
                    : "Your black card is cut from Discord. Wake up and we roll the body. Two rerolls. Then it locks."}
            </p>
            {!allowed ? (
              <div>
                <div className="flex items-center justify-between gap-3">
                  <SectionLabel>Vault 13 rider login</SectionLabel>
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
                      One more handshake. Ask TyroneBot in Discord for your one-time Hollow Realm verification link, open it in this browser, then refresh the gate.
                    </p>
                    <Button variant="ember" size="lg" className="mt-4 w-full" onClick={refresh}>
                      <RefreshCw className="size-4" /> I verified with Tyrone
                    </Button>
                    <Button variant="ghost" className="mt-2 w-full" onClick={connectGuest} disabled={signingIn}>
                      Continue as guest
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="mt-3 text-sm leading-relaxed text-moon">
                      New riders authenticate once. Returning riders tap login and walk back in. Discord name and @ stamp the black card and never move.
                    </p>
                    <Button variant="ember" size="lg" className="mt-4 w-full" onClick={onLogin} disabled={signingIn || pending}>
                      <DiscordMark className="size-4" /> {loginLabel}
                    </Button>
                    <Button variant="ghost" className="mt-2 w-full" onClick={connectGuest} disabled={signingIn || pending}>
                      Continue as guest
                    </Button>
                    <p className="mt-2 text-xs leading-relaxed text-muted">Test walk. Saves nothing. Starts at the opening.</p>
                  </>
                )}
                {(authError || access?.error) ? <p className="mt-3 text-xs leading-relaxed text-danger">{authError ?? access?.error}</p> : null}
              </div>
            ) : access?.guest ? (
              <>
                <div className="mt-4">
                  <SectionLabel>Black card</SectionLabel>
                  <p className="mt-2 text-sm leading-relaxed text-moon">
                    Type the name and @. The card takes them for this walk only. Refresh starts over. Discord files stay put.
                  </p>
                  <label className="mt-3 block">
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">Name</span>
                    <input
                      value={draftName}
                      maxLength={24}
                      autoComplete="nickname"
                      placeholder="Name on the card"
                      onChange={(event) => setDraftName(event.target.value)}
                      className="mt-1 min-h-12 w-full rounded-[var(--radius-sm)] bg-ink px-3 text-sm text-paper shadow-[var(--shadow-border)] outline-none placeholder:text-muted"
                    />
                  </label>
                  <label className="mt-2 block">
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">Handle</span>
                    <input
                      value={draftHandle}
                      maxLength={24}
                      autoComplete="username"
                      placeholder="handle"
                      onChange={(event) => setDraftHandle(event.target.value.replace(/^@/, "").replace(/\s+/g, ""))}
                      className="mt-1 min-h-12 w-full rounded-[var(--radius-sm)] bg-ink px-3 text-sm text-paper shadow-[var(--shadow-border)] outline-none placeholder:text-muted"
                    />
                  </label>
                  <div className="mt-4">
                    <MoonCard member={me} />
                  </div>
                </div>
                <div className="mt-5 flex flex-col gap-2">
                  <Button
                    variant="ember"
                    size="lg"
                    className="w-full"
                    onPointerDown={() => {
                      unlockAudio();
                      const name = draftName.trim();
                      const handle = draftHandle.trim().replace(/^@/, "");
                      if (name.length < 2 || handle.length < 2) return;
                      void playFoundYou();
                    }}
                    onClick={onLogin}
                    disabled={talking}
                  >
                    {loginLabel}
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      unlockAudio();
                      sfx.click();
                      void signOutDiscord();
                    }}
                  >
                    <LogOut className="size-4" /> Log out
                  </Button>
                </div>
              </>
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
                    {discordHandle ? (
                      <p className="mt-3 font-display text-[10px] uppercase tracking-[0.18em] text-ember">
                        {chosenName} · @{discordHandle}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-4">
                    <SectionLabel>Black card · locked</SectionLabel>
                    <p className="mt-2 text-sm leading-relaxed text-moon">
                      {chosenName || "Rider"}. {access?.guest ? "A guest file for testing. The name is not a Discord card." : "Scraped from Discord. The name and @ do not edit."} Two rerolls when we cut the body. Then the Machine Shop closes.
                    </p>
                    {discordHandle ? (
                      <p className="mt-3 font-display text-[10px] uppercase tracking-[0.18em] text-ember">@{discordHandle}</p>
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
                    onClick={onLogin}
                    disabled={talking}
                  >
                    {access?.discord ? <DiscordMark className="size-4" /> : null}
                    {loginLabel}
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      unlockAudio();
                      sfx.click();
                      void signOutDiscord();
                    }}
                  >
                    <LogOut className="size-4" /> Log out
                  </Button>
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

      <RadioDirector />
      <TalkOverlay />
      <HelpChrome />
      <RadioDeckSheet />
    </div>
  );
}
