import type { GameState, HackState, TermPage, TermSession } from "./types";

export type { TermPage, TermSession };

export interface TermChoice {
  id: string;
  label: string;
  page?: TermPage;
  action?: "back" | "logoff" | "breach";
}

const TERM_PAGES: TermPage[] = [
  "boot",
  "home",
  "records",
  "squad",
  "radio",
  "ledger",
  "mail",
  "porch",
  "lock",
];

export function emptyTerm(): TermSession {
  return {
    page: "boot",
    booted: false,
    output: [],
    sessionId: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`,
  };
}

export function restoreTerm(raw: unknown): TermSession | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<TermSession>;
  if (!TERM_PAGES.includes(row.page as TermPage)) return null;
  return {
    page: row.page as TermPage,
    booted: !!row.booted,
    output: Array.isArray(row.output) ? row.output.slice(-48).map(String) : [],
    sessionId: typeof row.sessionId === "string" && row.sessionId ? row.sessionId : emptyTerm().sessionId,
  };
}

export function restoreHack(raw: unknown): HackState | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<HackState>;
  if (!Array.isArray(row.words) || typeof row.password !== "string") return null;
  return row as HackState;
}

export function restoreTalk(raw: unknown): GameState["talk"] {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as { script?: string; i?: number };
  if (typeof row.script !== "string" || !row.script) return null;
  return { script: row.script, i: typeof row.i === "number" ? Math.max(0, row.i) : 0 };
}

export function openTermSession(state: GameState): string | null {
  if (state.term) return null;
  state.term = emptyTerm();
  return null;
}

export function closeTermSession(state: GameState) {
  state.term = null;
  state.hack = null;
}

export function termGo(state: GameState, page: TermPage) {
  if (!state.term) state.term = emptyTerm();
  if (page !== "lock") state.hack = null;
  state.term.page = page;
  if (page !== "boot") state.term.booted = true;
}

export function termLog(state: GameState, line: string) {
  if (!state.term) return;
  state.term.output = [...state.term.output, line].slice(-48);
}

export function termSelect(state: GameState, choice: TermChoice): "nav" | "logoff" | "breach" | "idle" {
  if (!state.term) return "idle";
  termLog(state, `> ${choice.label.toUpperCase()}`);
  if (choice.action === "logoff") {
    closeTermSession(state);
    return "logoff";
  }
  if (choice.action === "breach") return "breach";
  if (choice.page) {
    termGo(state, choice.page);
    return "nav";
  }
  if (choice.action === "back") {
    termGo(state, "home");
    return "nav";
  }
  return "idle";
}

export const BOOT_LINES = [
  "S.Y.N.A.P.S.E UNIFIED OPERATING SYSTEM",
  "COPYRIGHT · UNIT T-0880 · VAULT 13",
  "-Server 6-",
  "",
  "S.Y.N.A.P.S.E // UNIT T-0880",
  "VAULT 13 · MOON SQUAD HQ",
  "WELCOME TO SYNAPSE ACCESS",
];

export function homeChoices(state: GameState): TermChoice[] {
  void state;
  return [
    { id: "1", label: "Vault 13 records", page: "records" },
    { id: "2", label: "Squad roster", page: "squad" },
    { id: "3", label: "Radio log", page: "radio" },
    { id: "4", label: "Market & ledger", page: "ledger" },
    { id: "5", label: "Personal mail", page: "mail" },
    { id: "6", label: "Security override", page: "lock", action: "breach" },
    { id: "7", label: "Porch occupancy", page: "porch" },
    { id: "0", label: "Log off", action: "logoff" },
  ];
}

export function pageChoices(page: TermPage): TermChoice[] {
  if (page === "home" || page === "boot" || page === "lock") return [];
  return [
    { id: "1", label: "Return to root", page: "home" },
    { id: "0", label: "Log off", action: "logoff" },
  ];
}

export function pageBody(state: GameState, page: TermPage): string[] {
  const name = state.playerName?.trim() || "UNREGISTERED";
  const handle = state.playerHandle ? `@${state.playerHandle.replace(/^@/, "")}` : "NO HANDLE";
  const living = state.operatives.filter((o) => o.status !== "dead");
  if (page === "home") {
    return [
      `Welcome, ${name}.`,
      `${handle} · plate ${state.started ? "SEATED" : "COLD"}`,
      `Day ${state.day} · Vault ${state.coins.toLocaleString()} caps`,
      "",
      "Select a file.",
    ];
  }
  if (page === "records") {
    const notes = state.log.slice(0, 8).map((row) => `D${row.day} ${row.who}: ${row.what}`);
    return [
      "VAULT 13 // COMMAND LOG",
      `Compound level ${state.level} · XP ${state.xp}/${state.xpToNext}`,
      `Ore ${state.ore} · Moon favor ${state.moonFavor}`,
      `Kane heat ${state.kaneHeat}`,
      "",
      ...(notes.length ? notes : ["No field notes yet. The Hollow is waiting."]),
    ];
  }
  if (page === "squad") {
    if (!living.length) {
      return ["SQUAD ROSTER // EMPTY", "Tyrone is holding a bunk. Forge the first operative."];
    }
    return [
      `SQUAD ROSTER // ${living.length} LIVE`,
      ...living.slice(0, 8).map(
        (op) => `${op.name.slice(0, 12)}  ${op.cls}  HP ${op.hp}/${op.maxHp}  ${op.status.toUpperCase()}`,
      ),
    ];
  }
  if (page === "radio") {
    return [
      "RADIO // T-0880 HOLTAPE DECK",
      "Keep the Radio On sits the porch.",
      "Region tapes cut only on first arrival.",
      "ICR 88 is a station break. It is not a request.",
      "Welcome to the Thirty-Eight is the casino door.",
    ];
  }
  if (page === "ledger") {
    const lots = state.market?.lots?.length ?? 0;
    return [
      "LEDGER // MOON SQUAD MARKET",
      `Daily stalls: ${lots || "closed"}`,
      "The Exchange on the ledger is closed. Buy at the Market.",
      "Personal plate is the casino buy-in.",
      `Probe kits ${state.pack?.probe_kit ?? 0} · Bobby pins ${state.pack?.bobby_pin ?? 0}`,
    ];
  }
  if (page === "mail") {
    return [
      "INBOX // T-0880",
      `${name} —`,
      "I found you east of the highway. The CRT is yours.",
      "Discord stamps the black card. Walk off to answer a ping;",
      "the file holds. Come back on the same stool.",
      state.terminalDrained
        ? "BLACK CHANNEL: prior handshake on file. Coin already recovered."
        : "SECURITY: a lock still sits under option 6. The archive pays once.",
    ];
  }
  if (page === "porch") {
    return [
      "PORCH // OCCUPANCY 10 STOOLS",
      "Vault 13 holds ten live riders. The eleventh waits.",
      "Caps stay on your card. The porch is presence, not a shared vault.",
      "Walk away mid-watch — the file writes. The stool cools in 45 seconds.",
    ];
  }
  return [];
}
