import { sfx, isMuted, toggleMute, unlockAudio } from "@/game/audio";
import { openRadioDeck } from "@/game/radio";
import { guidanceSignal, isTaskScreen, navSignalKey, TASK_META } from "@/game/shell";
import { isVacant, plateMember } from "@/game/squad";
import { useGame } from "@/game/store";
import { characterForged } from "@/game/engine";
import { signOutDiscord } from "@/lib/auth/discord-access";
import type { Screen, TyroneAssist } from "@/game/types";
import { cn } from "@/lib/cn";
import {
  AudioLines,
  BookOpen,
  ChevronLeft,
  CircleHelp,
  Ellipsis,
  Globe2,
  Hammer,
  IdCard,
  Landmark,
  LogOut,
  Moon,
  MoreHorizontal,
  PackageOpen,
  Spade,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useMemo, useState } from "react";
import { MoonCrest } from "./primitives";

export const NAV: { id: Screen; label: string; short: string; icon: typeof Landmark; hint?: string }[] = [
  { id: "hq", label: "Vault 13", short: "13", icon: Landmark },
  { id: "file", label: "File", short: "File", icon: IdCard },
  { id: "map", label: "World", short: "World", icon: Globe2, hint: "sortie" },
  { id: "arcade", label: "Thirty-Eight", short: "38", icon: Spade },
  { id: "inventory", label: "Inventory", short: "Pack", icon: PackageOpen },
  { id: "more", label: "Systems", short: "More", icon: MoreHorizontal },
];

export const VAULT_SCREENS: Screen[] = ["hq"];
export const FILE_SCREENS: Screen[] = ["file", "roster", "squad"];
export const MORE_SCREENS: Screen[] = ["forge", "ledger", "market", "vault", "codex"];

const ASSIST: TyroneAssist[] = ["off", "minimal", "normal", "helpful", "high"];

export function SceneBreath() {
  return <div className="ms-scene-breath" data-scene-breath="1" aria-hidden />;
}

export function HubHeader() {
  const s = useGame((g) => g.s);
  const rest = useGame((g) => g.rest);
  const setScreen = useGame((g) => g.setScreen);
  const openGuide = useGame((g) => g.openGuide);
  const me = useGame((g) => plateMember(g.s));
  const busy = !!s.mission || !!s.combat;
  const [overflow, setOverflow] = useState(false);
  const vacant = isVacant(me);

  return (
    <>
      <header
        data-hub-header="1"
        style={{ paddingTop: "max(0.25rem, env(safe-area-inset-top))" }}
        className="flex shrink-0 items-center gap-2 border-b border-line/50 bg-ink/45 px-2 pb-1 backdrop-blur-md md:gap-3 md:px-4"
      >
        <button
          type="button"
          className="flex size-11 shrink-0 items-center justify-center"
          onClick={() => {
            sfx.click();
            setScreen("title");
          }}
          aria-label="Main menu"
        >
          <MoonCrest className="size-7" />
        </button>
        <button
          type="button"
          className="ms-hud-plate min-h-11 min-w-0 flex-1 px-2.5 py-1.5 text-left"
          onClick={() => {
            sfx.click();
            setScreen("file");
          }}
          aria-label="Open S.Y.N.A.P.S.E OS"
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="ms-hud-chip" aria-hidden />
            <span className="min-w-0 flex-1 truncate font-display text-body leading-tight text-paper">
              {vacant ? "Unclaimed plate" : me.name}
            </span>
            <span className="shrink-0 text-label tabular-nums text-muted">D{s.day}</span>
            <span className="shrink-0 font-display text-value tabular-nums text-ember">
              Plate · {Number(me.personalCaps ?? 0).toLocaleString()}
            </span>
          </span>
        </button>
        {/* Ask lives in the header on every screen now, hub and task alike. The
            floating button it replaces sat on top of list rows. */}
        <button
          type="button"
          data-help="1"
          aria-label="Ask Tyrone"
          onClick={() => {
            sfx.click();
            openGuide();
          }}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-ember shadow-[var(--shadow-border)]"
        >
          <CircleHelp className="size-5" />
        </button>
        <button
          type="button"
          data-overflow="1"
          aria-label="More controls"
          aria-expanded={overflow}
          onClick={() => {
            sfx.click();
            setOverflow((v) => !v);
          }}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-ember shadow-[var(--shadow-border)]"
        >
          <Ellipsis className="size-5" />
        </button>
      </header>
      {overflow ? (
        <OverflowMenu
          busy={busy}
          onRest={() => {
            setOverflow(false);
            rest();
          }}
          onClose={() => setOverflow(false)}
        />
      ) : null}
    </>
  );
}

function OverflowMenu({
  busy,
  onRest,
  onClose,
}: {
  busy: boolean;
  onRest: () => void;
  onClose: () => void;
}) {
  const [mute, setMute] = useState(isMuted);
  const assist = useGame((g) => g.s.tyrone?.settings?.assist ?? "normal");
  const setAssist = useGame((g) => g.setTyroneAssist);
  const setScreen = useGame((g) => g.setScreen);
  const forged = useGame((g) => characterForged(g.s));

  return (
    <div className="relative z-30">
      <button type="button" className="fixed inset-0 cursor-default bg-ink/20" aria-label="Close controls" onClick={onClose} />
      <div
        data-overflow-menu="1"
        role="dialog"
        aria-label="Controls"
        className="absolute right-2 z-40 w-[min(18rem,calc(100vw-1rem))] rounded-[var(--radius-md)] border border-line/70 bg-surface/95 p-2 shadow-xl backdrop-blur-md"
      >
        <button
          type="button"
          className="flex min-h-11 w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 text-left text-body text-paper hover:bg-raised"
          onClick={() => {
            const next = toggleMute();
            setMute(next);
            if (!next) sfx.click();
          }}
        >
          {mute ? <VolumeX className="size-4 text-muted" /> : <Volume2 className="size-4 text-ember" />}
          {mute ? "Unmute" : "Mute"}
        </button>
        <button
          type="button"
          className="flex min-h-11 w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 text-left text-body text-paper hover:bg-raised"
          onClick={() => {
            unlockAudio();
            sfx.click();
            openRadioDeck();
            onClose();
          }}
        >
          <AudioLines className="size-4 text-ember" />
          Tyrone's radio
        </button>
        <button
          type="button"
          className="flex min-h-11 w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 text-left text-body text-paper hover:bg-raised"
          onClick={() => {
            sfx.click();
            const i = ASSIST.indexOf(assist);
            setAssist(ASSIST[(i + 1) % ASSIST.length]!);
          }}
        >
          <CircleHelp className="size-4 text-ember" />
          Assist · {assist}
        </button>
        <button
          type="button"
          className="flex min-h-11 w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 text-left text-body text-paper hover:bg-raised"
          onClick={() => {
            sfx.click();
            window.dispatchEvent(new CustomEvent("hollow:open-journal"));
            onClose();
          }}
        >
          <BookOpen className="size-4 text-ember" />
          Field journal
        </button>
        <button
          type="button"
          disabled={busy}
          className="flex min-h-11 w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 text-left text-body text-moon hover:bg-raised disabled:opacity-40"
          onClick={onRest}
        >
          <Moon className="size-4" />
          Rest until dawn
        </button>
        <button
          type="button"
          className="flex min-h-11 w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 text-left text-body text-paper hover:bg-raised"
          onClick={() => {
            unlockAudio();
            sfx.click();
            onClose();
            void signOutDiscord();
          }}
        >
          <LogOut className="size-4 text-ember" />
          Log out
        </button>
        {forged ? null : (
        <button
          type="button"
          className="flex min-h-11 w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 text-left text-body text-paper hover:bg-raised"
          onClick={() => {
            unlockAudio();
            sfx.click();
            setScreen("forge");
            onClose();
          }}
        >
          <Hammer className="size-4 text-ember" />
          Cut your file
        </button>
        )}
      </div>
    </div>
  );
}

export function TaskHeader() {
  const screen = useGame((g) => g.s.screen);
  const leaveTask = useGame((g) => g.leaveTask);
  const openGuide = useGame((g) => g.openGuide);
  const me = useGame((g) => plateMember(g.s));
  const meta = isTaskScreen(screen) ? TASK_META[screen] : { title: "Back", plate: false };

  return (
    <header
      data-task-header="1"
      className="flex shrink-0 items-center gap-2 border-b border-line/50 bg-ink/55 px-2 pb-1 backdrop-blur-md md:px-4"
      style={{ paddingTop: "max(0.25rem, env(safe-area-inset-top))" }}
    >
      <button
        type="button"
        data-task-back="1"
        onClick={() => {
          sfx.click();
          leaveTask();
        }}
        className="inline-flex min-h-11 min-w-11 shrink-0 items-center gap-1 rounded-[var(--radius-sm)] px-2 text-paper"
        aria-label="Back"
      >
        <ChevronLeft className="size-5" />
        <span className="font-display text-label uppercase tracking-[0.12em]">Back</span>
      </button>
      <h1 className="min-w-0 flex-1 truncate text-center font-display text-body text-paper">{meta.title}</h1>
      {meta.plate ? (
        <span className="shrink-0 font-display text-value tabular-nums text-ember">Plate · {Number(me.personalCaps ?? 0).toLocaleString()}</span>
      ) : (
        <span className="w-11 shrink-0" aria-hidden />
      )}
      <button
        type="button"
        data-help="1"
        aria-label="Ask Tyrone"
        onClick={() => {
          sfx.click();
          openGuide();
        }}
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-ember shadow-[var(--shadow-border)]"
      >
        <CircleHelp className="size-5" />
      </button>
    </header>
  );
}

export function GuidanceRow() {
  const s = useGame((g) => g.s);
  const setScreen = useGame((g) => g.setScreen);
  const rest = useGame((g) => g.rest);
  const selectOp = useGame((g) => g.selectOp);
  const row = guidanceSignal(s);
  if (!row) return null;
  if (s.mission || s.combat) return null;
  if (FILE_SCREENS.includes(s.screen) && row.mode !== "urgent") return null;
  const here = s.screen === row.screen || (row.cta === "Rest" && s.screen === "hq");
  return (
    <button
      type="button"
      data-guidance={row.mode}
      onClick={() => {
        sfx.click();
        if (row.cta === "Rest") {
          rest();
          return;
        }
        if (row.opId) selectOp(row.opId);
        setScreen(row.screen);
      }}
      className={cn(
        "flex min-h-11 w-full items-center justify-between gap-3 border-b border-line/70 bg-raised/90 px-4 text-left md:px-6",
        row.mode === "urgent" && "bg-danger/10",
      )}
    >
      <span className="min-w-0 truncate text-secondary text-paper">{row.text}</span>
      <span className={cn("shrink-0 font-display text-label uppercase tracking-[0.14em] text-ember", !here && "ms-nudge")}>
        {row.cta}
      </span>
    </button>
  );
}

export function NavButtons({ compact }: { compact?: boolean }) {
  const screen = useGame((g) => g.s.screen);
  const setScreen = useGame((g) => g.setScreen);
  const tutorial = useGame((g) => g.s.tutorial);
  const signalKey = useGame((g) => navSignalKey(g.s));
  const signals = useMemo(() => new Set(signalKey.split(",").filter(Boolean)), [signalKey]);

  return (
    <>
      {NAV.map((n) => {
        const Icon = n.icon;
        const active =
          screen === n.id ||
          (n.id === "hq" && VAULT_SCREENS.includes(screen)) ||
          (n.id === "file" && FILE_SCREENS.includes(screen)) ||
          (n.id === "more" && MORE_SCREENS.includes(screen));
        const nudge = n.hint === "sortie" && tutorial === "sortie";
        const waiting = !active && signals.has(n.id);
        return (
          <button
            key={n.id}
            type="button"
            aria-current={active ? "page" : undefined}
            data-nav={n.id}
            onClick={() => {
              unlockAudio();
              sfx.click();
              setScreen(n.id);
            }}
            className={cn(
              "flex min-h-12 items-center gap-3 rounded-[var(--radius-sm)] px-3 text-left transition-colors",
              compact && "flex-1 flex-col justify-center gap-1 px-1",
              active ? "bg-ember/10 text-ember" : "text-muted hover:text-paper",
              nudge && "ms-nudge text-ember",
            )}
          >
            <span className="relative">
              <Icon className="size-5" />
              {waiting ? (
                <span
                  data-nav-dot={n.id}
                  aria-hidden
                  className="absolute -right-1.5 -top-0.5 size-1.5 rounded-full bg-ember"
                />
              ) : null}
            </span>
            <span className={cn("font-display uppercase tracking-[0.12em] text-label", compact && "leading-none")}>
              {compact ? n.short : n.label}
            </span>
          </button>
        );
      })}
    </>
  );
}

export function Rail() {
  const setScreen = useGame((g) => g.setScreen);
  return (
    <aside
      data-rail="1"
      className="relative z-[1] hidden w-[6.25rem] flex-col items-stretch border-r border-line/50 bg-ink/55 py-4 backdrop-blur-md md:flex"
    >
      <button
        type="button"
        className="mx-auto mb-6 flex size-11 items-center justify-center"
        onClick={() => {
          sfx.click();
          setScreen("title");
        }}
        aria-label="Main menu"
      >
        <MoonCrest className="size-9" />
      </button>
      <nav className="flex flex-1 flex-col gap-1 px-2">
        <NavButtons />
      </nav>
    </aside>
  );
}

export function Dock() {
  return (
    <nav
      data-dock="1"
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line/50 bg-ink/95 px-1 pt-1 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}
    >
      <NavButtons compact />
    </nav>
  );
}
