import { Button } from "@/components/ui/button";
import { hasPlayerProfile } from "@/game/engine";
import { PACK_CATALOG, PACK_KEYS } from "@/game/inventory";
import { sfx, unlockAudio } from "@/game/audio";
import { stampedUrl } from "@/game/discord";
import { seatedMember } from "@/game/squad";
import { useGame } from "@/game/store";
import type { PackKey } from "@/game/types";
import { cn } from "@/lib/cn";
import {
  Archive,
  BookOpen,
  Copy,
  Cpu,
  Disc3,
  Pin,
  Pill,
  Syringe,
  Wine,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { CapMark, Coin, Panel, RarityMark, SectionLabel } from "./primitives";
import { HelpChrome, TalkOverlay } from "./talk-overlay";
import { OpeningBoot, TitleBackdrop } from "./title-scene";
import { WakeScene } from "./wake-scene";
import { useOpeningBeat } from "@/game/opening";

export { TitleBackdrop };

const PACK_ICON: Record<PackKey, typeof Pin> = {
  bobby_pin: Pin,
  stimpak: Syringe,
  mentats: Pill,
  holotape: Disc3,
  sarsaparilla: Wine,
  probe_kit: Cpu,
};

function fail(msg: string | null) {
  if (!msg) return;
  sfx.hurt();
  useGame.setState((st) => ({ s: { ...st.s, toast: msg } }));
}

function copyText(text: string) {
  void navigator.clipboard?.writeText(text);
}

export function ProfileStamp({
  prefill,
  prefillHandle,
  handleLocked,
}: {
  prefill?: string;
  prefillHandle?: string;
  handleLocked?: boolean;
}) {
  const stamp = useGame((g) => g.stampProfile);
  const rider = useGame((g) => seatedMember(g.s));
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (prefill) setName((current) => current || prefill);
    if (prefillHandle) setHandle((current) => current || prefillHandle.replace(/^@/, ""));
  }, [prefill, prefillHandle]);

  const liveHandle = (handle || prefillHandle || "").replace(/^@/, "");

  return (
    <form
      className="space-y-3"
      data-profile="1"
      onSubmit={(e) => {
        e.preventDefault();
        unlockAudio();
        const msg = stamp(name, liveHandle);
        if (msg) {
          setErr(msg);
          sfx.hurt();
          return;
        }
        sfx.unlock();
      }}
    >
      <SectionLabel>Rider file</SectionLabel>
      <p className="text-sm leading-relaxed text-moon">
        {handleLocked
          ? "Stamp the name Tyrone found east of the highway. Discord stays locked underneath."
          : "Stamp the name Tyrone found east of the highway. Discord sits under it on the black card."}
      </p>
      <label className="block">
        <span className="font-display text-[10px] uppercase tracking-[0.18em] text-muted">Chosen name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="nickname"
          maxLength={24}
          placeholder="Your name"
          suppressHydrationWarning
          className="mt-1 min-h-12 w-full rounded-[var(--radius-sm)] bg-ink px-3 text-sm text-paper shadow-[var(--shadow-border)] outline-none"
        />
      </label>
      <label className="block">
        <span className="font-display text-[10px] uppercase tracking-[0.18em] text-muted">
          {handleLocked ? "Discord handle" : "Handle · optional"}
        </span>
        <input
          value={liveHandle ? `@${liveHandle}` : handle}
          onChange={(e) => {
            if (handleLocked) return;
            setHandle(e.target.value.replace(/^@/, ""));
          }}
          readOnly={handleLocked}
          autoComplete="username"
          maxLength={25}
          placeholder="@callsign"
          suppressHydrationWarning
          className="mt-1 min-h-12 w-full rounded-[var(--radius-sm)] bg-ink px-3 text-sm text-paper shadow-[var(--shadow-border)] outline-none read-only:text-ember"
        />
      </label>
      <div className="rounded-[var(--radius-md)] border border-line/70 bg-ink px-3 py-3">
        <p className="font-display text-[10px] uppercase tracking-[0.2em] text-muted">Moon Squad plate</p>
        <p className="mt-1 truncate font-display text-lg text-paper">{name.trim() || "Unclaimed"}</p>
        <p className="truncate font-mono text-[12px] text-moon">
          {liveHandle ? `@${liveHandle}` : "Discord handle lands here"}
        </p>
        <p className="mt-2 text-[11px] leading-relaxed text-muted">
          {rider.personalCaps.toLocaleString()} caps on the seated card
        </p>
      </div>
      {err ? <p className="text-sm text-danger">{err}</p> : null}
      <Button type="submit" variant="ember" size="lg" className="w-full" disabled={name.trim().length < 2}>
        Stamp the black card
      </Button>
      <p className="font-display text-[10px] uppercase tracking-[0.18em] text-muted">
        Name on the plate · Discord underneath
      </p>
    </form>
  );
}

export function TyroneHandshake() {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState("");
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);
  const example = origin
    ? stampedUrl(origin, { id: "123456789012345678", name: "Mira", caps: 2400, xp: 80 })
    : "https://your-game/?d=DISCORD_ID&n=NAME&caps=2400&xp=80";
  const snippet = `// Tyrone — stamp a rider into Hollow Realm
const origin = process.env.HOLLOW_REALM_URL; // this site
const u = new URL(origin);
u.searchParams.set("d", interaction.user.id);
u.searchParams.set("n", interaction.user.username);
u.searchParams.set("caps", String(caps));
u.searchParams.set("xp", String(xp));
await interaction.reply({ content: \`Your porch: \${u}\`, ephemeral: true });
fetch(\`\${origin}/api/tyrone/sync\`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    discord: interaction.user.id,
    name: interaction.user.username,
    caps,
    xp,
  }),
}).catch(() => {});`;

  const copy = (key: string, text: string) => {
    copyText(text);
    setCopied(key);
    window.setTimeout(() => setCopied(""), 1600);
  };

  return (
    <Panel className="bg-raised">
      <SectionLabel>Tyrone API</SectionLabel>
      <p className="text-sm leading-relaxed text-moon">
        Discord cannot see who clicked a generic link. Tyrone has to stamp a personal URL with their snowflake, name,
        and arcade totals. That URL is the login. Their black card paints on arrival.
      </p>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-moon">
        <li>
          Open{" "}
          <a
            className="text-ember underline-offset-2 hover:underline"
            href="https://discord.com/developers/applications"
            target="_blank"
            rel="noreferrer"
          >
            Discord Developer Portal
          </a>{" "}
          and use the Tyrone bot you already run.
        </li>
        <li>
          Set <span className="font-mono text-ember">HOLLOW_REALM_URL</span> to this site:{" "}
          <span className="font-mono text-paper">{origin || "this porch"}</span>
        </li>
        <li>Add a slash command that replies with the stamped link. Copy the snippet below.</li>
      </ol>
      <p className="mt-3 break-all font-mono text-[11px] text-ember">{example}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => copy("url", example)}>
          <Copy className="size-3.5" /> {copied === "url" ? "Copied" : "Copy link"}
        </Button>
        <Button type="button" variant="quiet" size="sm" onClick={() => copy("js", snippet)}>
          <Copy className="size-3.5" /> {copied === "js" ? "Copied" : "Copy bot snippet"}
        </Button>
      </div>
      <pre className="mt-3 max-h-48 overflow-auto rounded-[var(--radius-sm)] bg-ink p-3 font-mono text-[10px] leading-relaxed text-muted ms-scroll">
        {snippet}
      </pre>
    </Panel>
  );
}

export function MainMenu() {
  const assume = useGame((g) => g.assumeCommand);
  const resume = useGame((g) => g.resumeSession);
  const started = useGame((g) => g.s.started);
  const setScreen = useGame((g) => g.setScreen);
  const day = useGame((g) => g.s.day);
  const coins = useGame((g) => g.s.coins);
  const level = useGame((g) => g.s.level);
  const xp = useGame((g) => g.s.xp);
  const xpToNext = useGame((g) => g.s.xpToNext);
  const ops = useGame((g) => g.s.operatives);
  const rooms = useGame((g) => g.s.rooms);
  const openTerminal = useGame((g) => g.openTerminal);
  const hack = useGame((g) => g.s.hack);
  const term = useGame((g) => g.s.term);
  const rider = useGame((g) => g.s.discordName);
  const riderId = useGame((g) => g.s.discordId);
  const handshake = useGame((g) => g.handshake);
  const squadN = useGame((g) => g.s.squad.length);
  const linkDiscord = useGame((g) => g.linkDiscord);
  const talking = useGame((g) => !!g.s.talk);
  const talkScript = useGame((g) => g.s.talk?.script);
  const named = useGame((g) => hasPlayerProfile(g.s));
  const playerName = useGame((g) => g.s.playerName);
  const beat = useOpeningBeat();
  const waking = talkScript === "wake" || beat === "wake";
  const [ask, setAsk] = useState(false);
  const [link, setLink] = useState(false);
  const [did, setDid] = useState("");
  const [dname, setDname] = useState("");
  const roster = ops.filter((o) => o.status !== "dead").length;
  const beds = 3 + rooms.barracks * 2;
  const roomN = Object.values(rooms).filter((n) => n > 0).length;

  const boot = () => {
    if (!named) return;
    unlockAudio();
    if (started) resume();
    else assume();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (ask || talking || !named) {
        if (e.key === "Escape") setAsk(false);
        return;
      }
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, select")) return;
      if (e.key === "Enter") boot();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ask, started, talking, named]);

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-ink text-paper" data-ready="1">
      {waking ? <WakeScene /> : <TitleBackdrop />}
      {waking ? null : <div className="title-veil pointer-events-none absolute inset-0 z-[1]" />}
      <OpeningBoot>
      <div className={cn("relative z-[2] flex min-h-0 flex-1 flex-col justify-end px-4 pb-8 pt-16 md:px-10 md:pb-10", waking && "pointer-events-none opacity-0")}>
        <div className="mx-auto flex w-full max-w-lg flex-col gap-3 md:max-w-xl">
          <div className="ms-title-dock rounded-[var(--radius-xl)] bg-ink/62 p-4 shadow-[var(--shadow-border)] backdrop-blur-md md:p-5">
            <p className="font-display text-[11px] uppercase tracking-[0.42em] text-ember">S.Y.N.A.P.S.E T-0880</p>
            <p className="mt-1 text-xs text-moon">Tyrone keeps the porch light on.</p>
            {!named && !started ? (
              <div className="mt-4">
                <ProfileStamp />
              </div>
            ) : started ? (
              <div>
                <div className="flex items-center justify-between gap-3">
                  <SectionLabel>Active file</SectionLabel>
                  <p className="font-display text-[10px] uppercase tracking-[0.18em] text-muted">
                    Rank {level} · {xp}/{xpToNext} XP
                  </p>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  <FileStat label="Day" value={String(day)} />
                  <FileStat
                    label="Caps"
                    value={
                      <span className="inline-flex items-center justify-center gap-1">
                        <CapMark className="text-ember" />
                        {coins.toLocaleString()}
                      </span>
                    }
                  />
                  <FileStat label="Roster" value={`${roster}/${beds}`} />
                  <FileStat label="Rooms" value={String(roomN)} />
                </div>
                {squadN > 1 ? (
                  <p className="mt-3 font-display text-[10px] uppercase tracking-[0.18em] text-moon">
                    {squadN} riders on this file
                  </p>
                ) : null}
                {riderId ? (
                  <p className="mt-3 font-display text-[10px] uppercase tracking-[0.18em] text-ember">
                    Linked {rider} · {riderId}
                    {handshake && handshake.caps + handshake.xp > 0
                      ? ` · +${handshake.caps} caps · +${handshake.xp} XP`
                      : " · file current"}
                  </p>
                ) : (
                  <p className="mt-3 text-xs leading-relaxed text-muted">
                    No rider on this CRT. Stamp a Discord link or paste an ID and the arcade floor lands before boot.
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-4">
                <SectionLabel>File stamped</SectionLabel>
                <p className="mt-2 text-sm leading-relaxed text-moon">
                  {playerName}. I found you east of the highway. No tracks. Wake up and I will walk you into Vault 13.
                </p>
              </div>
            )}
            {named ? (
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
              {started ? (
                <Button variant="ghost" className="w-full" onClick={() => setAsk(true)} disabled={talking}>
                  New file
                </Button>
              ) : null}
              {started ? (
              <div className="grid grid-cols-2 gap-2">
                <Button variant="quiet" className="w-full" onClick={() => setScreen("rules")}>
                  <BookOpen className="size-4" /> Rules
                </Button>
                <Button variant="quiet" className="w-full" onClick={() => setLink((v) => !v)}>
                  {riderId ? "Switch rider" : "Link rider"}
                </Button>
              </div>
              ) : null}
            </div>
            ) : null}
            {link ? (
              <form
                className="mt-3 space-y-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  unlockAudio();
                  linkDiscord(did, dname);
                  setLink(false);
                }}
              >
                <input
                  value={dname}
                  onChange={(e) => setDname(e.target.value)}
                  placeholder="Player name"
                  className="min-h-11 w-full rounded-[var(--radius-sm)] bg-ink px-3 text-sm text-paper shadow-[var(--shadow-border)] outline-none"
                />
                <div className="flex gap-2">
                  <input
                    value={did}
                    onChange={(e) => setDid(e.target.value)}
                    placeholder="Tyrone link, @handle, or snowflake"
                    className="min-h-11 min-w-0 flex-1 rounded-[var(--radius-sm)] bg-ink px-3 text-sm text-paper shadow-[var(--shadow-border)] outline-none"
                  />
                  <Button type="submit" variant="ember">
                    Sit
                  </Button>
                </div>
              </form>
            ) : null}
            {started ? (
            <p className="mt-4 font-display text-[10px] uppercase tracking-[0.22em] text-muted">
              Resume · New · The word is SYNAPSE
            </p>
            ) : null}
          </div>
        </div>
      </div>
      </OpeningBoot>

      {named || started ? (
      <button
        type="button"
        onClick={() => {
          unlockAudio();
          const msg = openTerminal();
          if (msg) fail(msg);
        }}
        className={cn(
          "absolute right-3 top-3 z-[2] w-[7.5rem] overflow-hidden rounded-[var(--radius-md)] shadow-[var(--shadow-border)] transition-[box-shadow] hover:shadow-[var(--shadow-border-hover)] md:right-6 md:top-6 md:w-40",
          waking && "pointer-events-none opacity-0",
        )}
        aria-label="Sit the SYNAPSE terminal"
        data-sit-crt="1"
      >
        <img src="/art/terminal.jpg" alt="" className="aspect-[4/3] w-full object-cover" />
        <span className="absolute inset-x-0 bottom-0 bg-ink/70 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-ember">
          {hack || term ? "LINK LIVE" : "SYNAPSE LINK"}
        </span>
      </button>
      ) : null}

      {ask ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/70 p-4 md:items-center">
          <div className="ms-pop glass-strong w-full max-w-md rounded-[var(--radius-xl)] p-5 text-left">
            <h2 className="font-display text-xl">Wipe this file?</h2>
            <p className="mt-3 text-sm leading-relaxed text-moon">
              Caps, vault, roster — gone. Tyrone will not remember them.
            </p>
            <div className="mt-5 flex gap-2">
              <Button
                variant="danger"
                className="flex-1"
                onClick={() => {
                  useGame.getState().reset();
                  setAsk(false);
                  unlockAudio();
                  useGame.getState().assumeCommand();
                }}
              >
                New file
              </Button>
              <Button variant="quiet" className="flex-1" onClick={() => setAsk(false)}>
                Hold
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <TerminalOverlay />
      <TalkOverlay />
      <HelpChrome />
    </div>
  );
}

function FileStat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-[var(--radius-sm)] bg-ink/55 px-2 py-3 text-center shadow-[var(--shadow-border)]">
      <div className="font-display text-lg tabular-nums text-paper">{value}</div>
      <div className="mt-1 font-display text-[9px] uppercase tracking-[0.14em] text-muted">{label}</div>
    </div>
  );
}

export function RulesView() {
  const setScreen = useGame((g) => g.setScreen);
  const started = useGame((g) => g.s.started);
  return (
    <div className="relative flex h-dvh flex-col bg-ink text-paper" data-ready="1">
      <TitleBackdrop className="opacity-30" />
      <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
        <header className="flex items-center gap-3 px-4 py-3">
          <img src="/art/tyrone.jpg" alt="" className="size-12 rounded-[var(--radius-sm)] object-cover" />
          <div className="min-w-0 flex-1">
            <p className="font-display text-[10px] uppercase tracking-[0.28em] text-ember">Tyrone Bot</p>
            <h1 className="font-display text-xl">How you play</h1>
          </div>
          <Button variant="quiet" size="sm" onClick={() => setScreen("title")}>
            Menu
          </Button>
        </header>
        <div className="ms-scroll min-h-0 flex-1 overflow-y-auto px-4 pb-10">
          <div className="mx-auto w-full max-w-xl space-y-4">
            <Panel className="glass-strong bg-transparent">
              <p className="text-sm leading-relaxed text-moon">
                I hold the CRT. You hold the squad. The word is S.Y.N.A.P.S.E. Forge someone. Deploy them. Caps come
                home — or they do not. Tap the question mark on any screen and I will walk you through that porch.
              </p>
            </Panel>
            <TyroneHandshake />
            {[
              {
                t: "S.Y.N.A.P.S.E",
                d: "That's the unit. That's the password. Seven letters on the CRT. I didn't say that.",
              },
              {
                t: "Squad mode",
                d: "Load a file and run the compound. New file wipes the vault. Rules is this porch talk.",
              },
              {
                t: "Discord rider",
                d: "A website cannot see who clicked a Discord link. Tyrone has to stamp a personal URL with your snowflake and arcade totals. Those numbers floor your vault before the menu paints. Same rider, same black card.",
              },
              {
                t: "Bottle caps",
                d: "Cash. Stacks. Always drop on a win. You cannot Use them. They just count.",
              },
              {
                t: "Vault /inv",
                d: "Profile → Vault. That's the Fallout pack. Use spends one. Gear still lives in rucksacks.",
              },
              {
                t: "How it fills",
                d: "A clean win rolls loot: a few caps always, then a chance at the game's item. Mentats fatten the table.",
              },
              {
                t: "Daily clocks",
                d: "Trivia lives, T/F lives, Unscramble boards. They are clocks, not items. Midnight Mountain refill.",
              },
              {
                t: "Map",
                d: "Ironclad is the first pin — unlocked on day one. Veyra City is last. Drag to pan. Pinch or wheel to zoom.",
              },
              {
                t: "Main ARC",
                d: "One file, many riders. Raid, bounty, and the chapter boss wait on whose turn it is. Scout and forage stay open. Sit as a rider from Squad.",
              },
              {
                t: "Moon Squad card",
                d: "Ledger holds a 3D black card. Stamp a name and handle and the plate is yours. A new rider logging in sits a new plate. Drag to rotate, pinch to zoom, spin, double-tap to flip.",
              },
              {
                t: "d20",
                d: "1 fumble. 2–4 fail. 5–9 weak. 10–14 success. 15–19 strong. 20 crit. The die tumbles. Wait for it.",
              },
              {
                t: "Ask Tyrone",
                d: "The question mark is me. Tap it on any screen for a field manual, then Walk me through it if you want the porch talk. First briefing cannot be skipped. I live for this.",
              },
              {
                t: "The SYNAPSE terminal",
                d: "Don't tap the terminal in the compound. Especially don't tap it. If you do, the word is already in your mouth. Four tries. Likeness is letters in the right chair.",
              },
            ].map((row) => (
              <Panel key={row.t} className="bg-raised">
                <SectionLabel>{row.t}</SectionLabel>
                <p className="text-sm leading-relaxed text-moon">{row.d}</p>
              </Panel>
            ))}
            {started ? (
              <Button variant="ember" className="w-full" onClick={() => setScreen("hq")}>
                Back to squad
              </Button>
            ) : (
              <Button variant="ember" className="w-full" onClick={() => setScreen("title")}>
                Back to menu
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function VaultView() {
  const s = useGame((g) => g.s);
  const usePack = useGame((g) => g.usePack);
  const setScreen = useGame((g) => g.setScreen);
  const take = useGame((g) => g.takeFromVault);
  const idle = s.operatives.find((o) => o.status === "idle" && o.hp > 0);

  return (
    <div className="space-y-5 pb-8">
      <div className="relative overflow-hidden rounded-[var(--radius-xl)] shadow-[var(--shadow-border)]">
        <img src="/art/vault-pack.jpg" alt="Vault pack" className="h-40 w-full object-cover md:h-52" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4">
          <SectionLabel>T-0880 · /inv</SectionLabel>
          <h2 className="font-display text-2xl">The Vault</h2>
        </div>
      </div>
      <Panel className="glass-strong bg-transparent">
        <div className="flex items-center justify-between gap-3">
          <div>
            <SectionLabel>Caps</SectionLabel>
            <p className="font-display text-3xl tabular-nums">
              <Coin n={s.coins} />
            </p>
          </div>
          <p className="max-w-[14rem] text-right text-xs text-muted">
            Cash. Stacks. Always drops on a win. Can't Use. Just counts.
          </p>
        </div>
      </Panel>
      <div>
        <SectionLabel>What you hold</SectionLabel>
        <div className="space-y-2">
          {PACK_KEYS.map((key) => {
            const cat = PACK_CATALOG[key];
            const qty = s.pack?.[key] ?? 0;
            const Icon = PACK_ICON[key];
            return (
              <div
                key={key}
                className="pip-row flex items-center gap-3 rounded-[var(--radius-md)] bg-raised px-3 py-3 shadow-[var(--shadow-border)]"
              >
                <span className="flex size-11 items-center justify-center rounded-[var(--radius-xs)] bg-ink text-ember">
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-sm">{cat.name}</span>
                    <RarityMark rarity={cat.rarity} />
                  </div>
                  <p className="text-xs text-muted">{cat.blurb}</p>
                  <p className="mt-0.5 text-[11px] text-moon">{cat.use}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="font-display text-lg tabular-nums text-ember">{qty}</span>
                  <Button size="sm" variant="ghost" disabled={qty <= 0} onClick={() => fail(usePack(key))}>
                    Use
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {s.mentatsLuck > 0 || s.hackProbes > 0 ? (
        <Panel className="bg-raised">
          <SectionLabel>Active</SectionLabel>
          {s.mentatsLuck > 0 ? (
            <p className="text-sm text-ember">Mentats: next loot roll +3 Luck ×{s.mentatsLuck}</p>
          ) : null}
          {s.hackProbes > 0 ? (
            <p className="text-sm text-ember">Probe kit: next hack +{s.hackProbes} memory probe</p>
          ) : null}
        </Panel>
      ) : null}
      <Panel className="bg-raised">
        <SectionLabel>Daily clocks · Mountain</SectionLabel>
        <p className="text-xs text-muted">Not items. Refill at midnight America/Edmonton. {s.clocks?.dateKey}</p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <ClockStat label="Trivia lives" value={`${s.clocks?.triviaLives ?? 3}/3`} />
          <ClockStat label="T/F lives" value={`${s.clocks?.tfLives ?? 3}/3`} />
          <ClockStat label="Unscramble" value={`${s.clocks?.unscramble ?? 10}/10`} />
        </div>
      </Panel>
      <div>
        <SectionLabel>Gear crate</SectionLabel>
        {s.vault.length === 0 ? (
          <Panel>
            <p className="text-sm text-muted">No weapons or salvage stored. Pack items sit above this crate.</p>
          </Panel>
        ) : (
          <div className="space-y-2">
            {s.vault.map((it) => (
              <div
                key={it.id}
                className="flex items-center justify-between gap-2 rounded-[var(--radius-md)] bg-raised px-3 py-3 shadow-[var(--shadow-border)]"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm">
                    {it.name} <RarityMark rarity={it.rarity} />
                  </div>
                  <div className="text-xs text-muted">
                    {it.kind} · {it.condition}
                  </div>
                </div>
                {idle ? (
                  <Button size="sm" variant="quiet" onClick={() => fail(take(idle.id, it.id))}>
                    Issue
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
      <Button variant="quiet" className="w-full" onClick={() => setScreen("hq")}>
        <Archive className="size-4" /> Compound
      </Button>
    </div>
  );
}

function ClockStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-sm)] bg-ink px-2 py-3">
      <div className="font-display text-lg tabular-nums text-paper">{value}</div>
      <div className="mt-1 font-display text-[9px] uppercase tracking-[0.14em] text-muted">{label}</div>
    </div>
  );
}

export function TerminalOverlay() {
  return null;
}

export function TerminalCard({ children }: { children?: ReactNode }) {
  const started = useGame((g) => g.s.started);
  const open = useGame((g) => g.openTerminal);
  const drained = useGame((g) => g.s.terminalDrained);
  const locked = useGame((g) => g.s.terminalLockDay) > useGame((g) => g.s.day);
  return (
    <button
      type="button"
      onClick={() => {
        unlockAudio();
        if (!started) {
          fail("Boot a file first.");
          return;
        }
        const msg = open();
        if (msg) fail(msg);
      }}
      className="group relative w-full overflow-hidden rounded-[var(--radius-xl)] text-left shadow-[var(--shadow-border)] transition-[box-shadow] hover:shadow-[var(--shadow-border-hover)]"
    >
      <img src="/art/terminal.jpg" alt="" className="h-40 w-full object-cover md:h-48" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
      <div className="absolute bottom-3 left-4 right-4">
        <SectionLabel>Easter egg</SectionLabel>
        <div className="font-display text-lg">SYNAPSE terminal</div>
        <p className="mt-1 text-xs text-moon">
          {drained ? "Archive already recovered." : locked ? "Security lockout. Dawn, or a probe kit." : "Sit the CRT. The files are live."}
        </p>
        {children}
      </div>
    </button>
  );
}
