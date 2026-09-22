import type { ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";
import { Component, useEffect, type ErrorInfo, type ReactNode } from "react";
import { dismissSynapseSplash } from "@/game/opening";

const FALLBACK_MESSAGE = "An unexpected error occurred. Try reloading the page.";

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return FALLBACK_MESSAGE;
}

export function AppErrorComponent({ error }: ErrorComponentProps) {
  useEffect(() => {
    dismissSynapseSplash();
  }, []);
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#0c0a08] px-6 text-center text-[#e8dcc8]">
      <span className="text-[#c45c26]" aria-hidden="true">
        <TriangleAlert className="size-10" strokeWidth={2} />
      </span>
      <h1 className="font-display text-lg font-semibold tracking-wide">The CRT blinked</h1>
      <p className="max-w-md text-sm break-words text-[#9a8f7d]">
        {errorMessage(error)}
      </p>
      <button
        type="button"
        className="mt-2 min-h-11 rounded-md bg-[#c45c26] px-4 font-display text-[11px] uppercase tracking-[0.18em] text-[#0c0a08]"
        onClick={() => window.location.reload()}
      >
        Reload the porch
      </button>
    </main>
  );
}

/** Inner shell catch — keeps the porch seated instead of dumping to the CRT blink. */
export class ShellErrorBoundary extends Component<
  { children: ReactNode; label?: string },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Hollow shell", error, info.componentStack);
    dismissSynapseSplash();
  }

  render() {
    if (this.state.error) {
      return (
        <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-ink px-6 text-center text-paper">
          <p className="font-display text-[11px] uppercase tracking-[0.28em] text-ember">S.Y.N.A.P.S.E T-0880</p>
          <h1 className="font-display text-lg text-paper">{this.props.label ?? "The porch flickered"}</h1>
          <p className="max-w-md text-sm break-words text-muted">{errorMessage(this.state.error)}</p>
          <button
            type="button"
            className="mt-2 min-h-11 rounded-[var(--radius-sm)] bg-ember px-4 font-display text-[11px] uppercase tracking-[0.18em] text-ink"
            onClick={() => {
              this.setState({ error: null });
              window.location.reload();
            }}
          >
            Reseat the file
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}
