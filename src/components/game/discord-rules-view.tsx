import { Button } from "@/components/ui/button";
import { useGame } from "@/game/store";
import { ShieldCheck, TerminalSquare } from "lucide-react";
import { Panel, SectionLabel } from "./primitives";
import { TitleBackdrop } from "./menu";

export function DiscordRulesView() {
  const setScreen = useGame((store) => store.setScreen);
  const started = useGame((store) => store.s.started);

  const rows = [
    {
      title: "Discord is the front door",
      text: "A real campaign requires Discord authentication before Start, Resume, the black-channel terminal, or shared Vault 13 state becomes available. Tyrone's one-time claim verifies the Moon Squad rider when needed.",
    },
    {
      title: "Vault 13 is shared",
      text: "Bottle caps, Hollow Ore, Moon Favor, regional materials, bosses and facility tiers form the communal long campaign. Your 3D Moon Squad card remains your personal bottle-cap account.",
    },
    {
      title: "Progression is earned",
      text: "Later Vault tiers require campaign days, Command Rank, trained residents, multiple riders, boss clears and regional salvage. One lucky haul cannot skip the campaign.",
    },
    {
      title: "Raids need people",
      text: "Regional bosses require qualified Moon Squad riders, field-party depth, class diversity, intel and resident training. Bosses are campaign events, not solo loot piñatas.",
    },
    {
      title: "Inventory has consequences",
      text: "Equipment, buffs and enchantments use diminishing returns, resonance limits and strain. Extreme builds gain power by accepting weaknesses elsewhere.",
    },
    {
      title: "Black-channel terminal",
      text: "The Easter-egg terminal synthesizes a new password and decoy field every breach. Likeness counts letters in the exact position. Delimiter exploits can purge a dud or restore a probe, but trace pressure rises quickly.",
    },
  ];

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-ink text-paper" data-ready="1">
      <TitleBackdrop className="opacity-30" />
      <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
        <header className="flex items-center gap-3 px-4 py-3 md:px-6">
          <img src="/art/tyrone.jpg" alt="Tyrone Bot" className="size-12 rounded-[var(--radius-sm)] object-cover" />
          <div className="min-w-0 flex-1">
            <p className="font-display text-[10px] uppercase tracking-[0.28em] text-ember">Vault 13 field manual</p>
            <h1 className="font-display text-xl">How Hollow Realm works</h1>
          </div>
          <Button variant="quiet" size="sm" onClick={() => setScreen("title")}>Menu</Button>
        </header>

        <div className="ms-scroll min-h-0 flex-1 overflow-y-auto px-4 pb-10 md:px-6">
          <div className="mx-auto w-full max-w-2xl space-y-3">
            <Panel className="glass-strong bg-transparent">
              <div className="flex items-center gap-2 text-ember"><ShieldCheck className="size-4" /><SectionLabel>Authority</SectionLabel></div>
              <p className="mt-2 text-sm leading-relaxed text-moon">
                Tyrone handles guidance. The server handles value. LocalStorage is becoming a cache, not a printing press for caps, XP, boss clears or rare gear.
              </p>
            </Panel>

            {rows.map((row) => (
              <Panel key={row.title} className="bg-raised">
                <SectionLabel>{row.title}</SectionLabel>
                <p className="mt-1 text-sm leading-relaxed text-moon">{row.text}</p>
              </Panel>
            ))}

            <Panel className="bg-raised">
              <div className="flex items-center gap-2 text-ember"><TerminalSquare className="size-4" /><SectionLabel>Terminal hint</SectionLabel></div>
              <p className="mt-2 text-sm leading-relaxed text-moon">
                Wrong guesses reveal exact-position likeness. Use that information to eliminate candidates. The terminal has no static word list and no permanent master password.
              </p>
            </Panel>

            <Button variant="ember" className="w-full" onClick={() => setScreen(started ? "title" : "title")}>Back to main menu</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
