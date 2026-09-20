import type { ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";
import { useEffect } from "react";
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
