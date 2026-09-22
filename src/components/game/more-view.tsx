import { useGame } from "@/game/store";
import { characterForged } from "@/game/engine";
import { availableScenarios } from "@/game/scenario";
import { actTitle, storyObjective } from "@/game/story-spine";
import type { StoryActId } from "@/game/narrative-state";
import type { Screen } from "@/game/types";
import { cn } from "@/lib/cn";
import {
  Archive,
  AudioLines,
  BookOpen,
  Film,
  Hammer,
  ScrollText,
  Settings2,
} from "lucide-react";
import { sfx } from "@/game/audio";
import { openRadioDeck } from "@/game/radio";
import { SectionLabel } from "./primitives";

/**
 * Field systems — not a SaaS "More" grid. Destinations and one open situation.
 * Journal / companions live in the Pause field menu (Escape / World HUD).
 */
const ROUTES: {
  screen?: Screen;
  action?: "radio" | "journal";
  name: string;
  place: string;
  desc: string;
  icon: typeof Archive;
  needUnforged?: boolean;
}[] = [
  {
    action: "journal",
    name: "Field journal",
    place: "What you know",
    desc: "Story marks, situations, and the ledger of what you chose.",
    icon: BookOpen,
  },
  {
    action: "radio",
    name: "Tyrone's radio",
    place: "Porch deck",
    desc: "ICR tapes and station breaks. The Hollow argues with itself here.",
    icon: AudioLines,
  },
  {
    screen: "forge",
    name: "Machine Shop",
    place: "One file",
    desc: "Cut your body once. Two rerolls. Then it locks.",
    icon: Hammer,
    needUnforged: true,
  },
  {
    screen: "market",
    name: "Iron Gate stalls",
    place: "Moon Squad Market",
    desc: "Limited stock. Dawn reset. Kane's surveyors already bought a table.",
    icon: ScrollText,
  },
  {
    screen: "ledger",
    name: "Quartermaster",
    place: "Caps & plate",
    desc: "Debts, the black card, and what the compound still owes.",
    icon: Archive,
  },
  {
    screen: "codex",
    name: "Archive terminal",
    place: "Lore",
    desc: "Kane, AEGIS, villains, and what the Hollow remembers.",
    icon: BookOpen,
  },
  {
    screen: "gallery",
    name: "Vault reels",
    place: "Media",
    desc: "Wake film. Title plate. Stills from the east highway.",
    icon: Film,
  },
  {
    screen: "rules",
    name: "Field manual",
    place: "Systems",
    desc: "Roll bands, combat basics, survival notes.",
    icon: Settings2,
  },
];

export function MoreView() {
  const s = useGame((g) => g.s);
  const setScreen = useGame((g) => g.setScreen);
  const forged = characterForged(s);
  const act = s.narrative?.act ?? "prologue";
  const objective = storyObjective(s);
  const endingId = s.narrative?.endingId ?? null;
  const scenarios = availableScenarios(s);
  const open = scenarios[0];
  const routes = ROUTES.filter((r) => (r.needUnforged ? !forged : true));

  return (
    <div className="space-y-5 pb-8">
      <div>
        <SectionLabel>Vault 13 · field systems</SectionLabel>
        <h2 className="font-display text-2xl">Systems</h2>
        <p className="mt-1 text-secondary text-muted">
          {actTitle(act as StoryActId)}. Secondary routes only — the world stays on World.
        </p>
      </div>

      <p className="border-l-2 border-ember/70 pl-3 text-secondary text-paper">
        <span className="font-display text-label uppercase tracking-[0.12em] text-ember">Objective</span>
        <br />
        {endingId ? `Epilogue recorded · ${endingId.replaceAll("_", " ")}` : objective}
      </p>

      {open ? (
        <button
          type="button"
          data-more-situation="1"
          className="flex w-full flex-col items-start gap-1 border border-ember/50 bg-ember/10 px-3 py-3 text-left"
          onClick={() => {
            sfx.click();
            window.dispatchEvent(new CustomEvent("hollow:open-situation"));
          }}
        >
          <span className="font-display text-[10px] uppercase tracking-[0.14em] text-ember">Open situation</span>
          <span className="font-display text-body text-paper">{open.title}</span>
          <span className="text-label text-muted">{open.locationLabel} — choices matter.</span>
        </button>
      ) : null}

      <ul className="divide-y divide-line/50 border-y border-line/50">
        {routes.map((tool) => {
          const Icon = tool.icon;
          return (
            <li key={`${tool.screen ?? tool.action}-${tool.name}`}>
              <button
                type="button"
                className={cn(
                  "flex min-h-14 w-full items-start gap-3 py-3 text-left hover:bg-raised/60",
                )}
                onClick={() => {
                  sfx.click();
                  if (tool.action === "radio") openRadioDeck();
                  else if (tool.action === "journal") {
                    window.dispatchEvent(new CustomEvent("hollow:open-journal"));
                  } else if (tool.screen) setScreen(tool.screen);
                }}
              >
                <Icon className="mt-0.5 size-5 shrink-0 text-ember" />
                <span className="min-w-0 flex-1">
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">{tool.place}</span>
                  <span className="block font-display text-body text-paper">{tool.name}</span>
                  <span className="block text-label text-muted">{tool.desc}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
