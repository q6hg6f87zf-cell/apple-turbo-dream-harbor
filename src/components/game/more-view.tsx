import { useGame } from "@/game/store";
import type { Screen } from "@/game/types";
import { cn } from "@/lib/cn";
import {
  Archive,
  AudioLines,
  BookOpen,
  Bot,
  CreditCard,
  Hammer,
  IdCard,
  ScrollText,
  Settings2,
  Users,
} from "lucide-react";
import { sfx } from "@/game/audio";
import { openRadioDeck } from "@/game/radio";
import { Panel, SectionLabel } from "./primitives";

const TOOLS: {
  screen?: Screen;
  action?: "radio";
  name: string;
  eyebrow: string;
  desc: string;
  icon: typeof Archive;
}[] = [
  {
    action: "radio",
    name: "Tyrone's Radio",
    eyebrow: "Holotape deck",
    desc: "Keep the Radio On. Ironclad dust. Slag Town neon. Original tapes, more coming.",
    icon: AudioLines,
  },
  {
    screen: "ledger",
    name: "Moon Squad Card",
    eyebrow: "Personal plate",
    desc: "3D black card. Identity, daily clock-in, casino buy-in. Name, Discord handle, personal caps.",
    icon: CreditCard,
  },
  {
    screen: "forge",
    name: "Resident Forge",
    eyebrow: "Recruitment",
    desc: "Create a new Vault 13 resident and roll their Hollow profile.",
    icon: Hammer,
  },
  {
    screen: "squad",
    name: "Rider Registry",
    eyebrow: "Moon Squad",
    desc: "Also lives under Vault 13. Manage the people sharing this campaign file and ARC turns.",
    icon: Users,
  },
  {
    screen: "market",
    name: "Moon Squad Market",
    eyebrow: "Ironclad stalls",
    desc: "The Exchange is closed. Buy under the Iron Gate. Limited stock. Dawn reset. Visiting merchants sit the high table.",
    icon: ScrollText,
  },
  {
    screen: "ledger",
    name: "Quartermaster Exchange",
    eyebrow: "Caps & plate",
    desc: "Black card, compound vault, bounty board. Gear moved to the Moon Squad Market.",
    icon: CreditCard,
  },
  {
    screen: "vault",
    name: "Salvage Depot",
    eyebrow: "Legacy Stores",
    desc: "The old crate-and-pack view. Inventory is now the primary stores screen.",
    icon: Archive,
  },
  {
    screen: "codex",
    name: "Archive Terminal",
    eyebrow: "Lore",
    desc: "Kane, AEGIS 2753, villains, races, rifle models and what the Hollow remembers.",
    icon: BookOpen,
  },
  {
    screen: "rules",
    name: "Field Manual",
    eyebrow: "Systems",
    desc: "Rules, roll bands, combat basics and survival notes.",
    icon: Settings2,
  },
];

export function MoreView() {
  const setScreen = useGame((g) => g.setScreen);
  const openGuide = useGame((g) => g.openGuide);
  const residentCount = useGame((g) => g.s.operatives.filter((o) => o.status !== "dead").length);
  const staffCount = useGame((g) => g.s.residents.length);

  return (
    <div className="space-y-4 pb-8">
      <div>
        <SectionLabel>Vault 13 · systems</SectionLabel>
        <h2 className="font-display text-2xl">More</h2>
        <p className="mt-1 text-sm text-muted">
          Secondary systems live here so the main navigation stays focused on playing the game.
        </p>
      </div>

      <Panel className="glass-strong bg-transparent">
        <div className="flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-[var(--radius-md)] bg-ink">
            <Bot className="size-6 text-ember" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm text-paper">Ask TyroneBot</p>
            <p className="text-xs text-muted">Context help, current objective and Vault 13 guidance.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              sfx.click();
              openGuide();
            }}
            className="flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] border border-ember/40 bg-ember/10 px-3 font-display text-[10px] uppercase tracking-[0.14em] text-ember"
          >
            <Bot className="size-4" /> Talk
          </button>
        </div>
      </Panel>

      <div className="grid gap-2 sm:grid-cols-2">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={`${tool.screen ?? tool.action}-${tool.name}`}
              type="button"
              onClick={() => {
                sfx.click();
                if (tool.action === "radio") openRadioDeck();
                else if (tool.screen) setScreen(tool.screen);
              }}
              className={cn(
                "flex min-h-[8rem] items-start gap-3 rounded-[var(--radius-lg)] border border-line/80 bg-raised p-4 text-left shadow-[var(--shadow-border)]",
                "transition-[border-color,transform] hover:border-ember/55 active:scale-[0.99]",
              )}
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-ink text-ember shadow-[inset_0_0_0_1px_var(--color-line)]">
                <Icon className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 font-display text-[9px] uppercase tracking-[0.18em] text-ember">
                  <Icon className="size-3.5" /> {tool.eyebrow}
                </span>
                <span className="mt-1 block font-display text-base text-paper">{tool.name}</span>
                <span className="mt-1 block text-xs leading-relaxed text-muted">{tool.desc}</span>
              </span>
            </button>
          );
        })}
      </div>

      <Panel className="bg-raised">
        <SectionLabel>Vault census</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-[var(--radius-md)] bg-ink p-3">
            <Users className="size-4 text-ember" />
            <div className="mt-2 font-display text-2xl text-paper">{residentCount}</div>
            <div className="text-xs text-muted">Playable residents</div>
          </div>
          <div className="rounded-[var(--radius-md)] bg-ink p-3">
            <IdCard className="size-4 text-moon" />
            <div className="mt-2 font-display text-2xl text-paper">{staffCount}</div>
            <div className="text-xs text-muted">Vault staff</div>
          </div>
        </div>
      </Panel>
    </div>
  );
}
