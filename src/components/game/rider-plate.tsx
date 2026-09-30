import type { RiderKit, RiderLook, RiderMark, RiderWash } from "@/game/types";
import { cn } from "@/lib/cn";

export const EMPTY_LOOK: RiderLook = { mark: "none", kit: "none", wash: "plain" };

export const MARKS: { id: RiderMark; label: string }[] = [
  { id: "none", label: "Clean" },
  { id: "slag", label: "Slag scar" },
  { id: "stitch", label: "Stitches" },
  { id: "burn", label: "Bay burn" },
  { id: "soot", label: "Soot" },
  { id: "brow", label: "Split brow" },
];

export const KITS: { id: RiderKit; label: string }[] = [
  { id: "none", label: "Bare" },
  { id: "goggles", label: "Goggles" },
  { id: "mask", label: "Respirator" },
  { id: "hood", label: "Hood" },
  { id: "collar", label: "Iron collar" },
  { id: "pin", label: "Moon pin" },
];

export const WASHES: { id: RiderWash; label: string }[] = [
  { id: "plain", label: "Plate" },
  { id: "ember", label: "Ember" },
  { id: "slag", label: "Slag" },
  { id: "tide", label: "Tide" },
  { id: "brass", label: "Brass" },
  { id: "ash", label: "Ash" },
];

function washFilter(wash: RiderWash | undefined): string | undefined {
  switch (wash) {
    case "ember":
      return "sepia(0.45) saturate(1.35) hue-rotate(-8deg) contrast(1.05)";
    case "slag":
      return "sepia(0.35) saturate(0.55) brightness(0.92) contrast(1.05)";
    case "tide":
      return "saturate(0.8) hue-rotate(18deg) brightness(0.96)";
    case "brass":
      return "sepia(0.55) saturate(1.15) brightness(1.02)";
    case "ash":
      return "grayscale(0.72) contrast(1.08) brightness(0.95)";
    default:
      return undefined;
  }
}

function Mark({ mark }: { mark: RiderMark }) {
  if (mark === "none") return null;
  if (mark === "soot") {
    return <span className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/70 to-transparent" />;
  }
  return (
    <svg viewBox="0 0 100 140" className="pointer-events-none absolute inset-0 size-full" aria-hidden>
      {mark === "slag" ? (
        <path d="M62 48 C68 62 74 78 70 96" fill="none" stroke="#6a3a28" strokeWidth="1.7" strokeLinecap="round" />
      ) : null}
      {mark === "stitch" ? (
        <g stroke="#d7c4a2" strokeWidth="0.7">
          <path d="M58 44 l4 0 M60 42 l0 4" />
          <path d="M64 46 l4 0 M66 44 l0 4" />
          <path d="M70 48 l4 0 M72 46 l0 4" />
        </g>
      ) : null}
      {mark === "burn" ? (
        <ellipse cx="72" cy="78" rx="10" ry="7" fill="#5a2a18" opacity="0.55" />
      ) : null}
      {mark === "brow" ? (
        <path d="M40 40 l8 3 M58 43 l10 -2" fill="none" stroke="#1a120c" strokeWidth="1.4" strokeLinecap="round" />
      ) : null}
    </svg>
  );
}

function Kit({ kit }: { kit: RiderKit }) {
  if (kit === "none") return null;
  if (kit === "hood") {
    return <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_42%,rgba(0,0,0,0.72)_78%)]" />;
  }
  return (
    <svg viewBox="0 0 100 140" className="pointer-events-none absolute inset-0 size-full" aria-hidden>
      {kit === "goggles" ? (
        <g fill="none" stroke="#c8d0d4" strokeWidth="1.3">
          <ellipse cx="42" cy="52" rx="10" ry="7" fill="#1c2428" fillOpacity="0.45" />
          <ellipse cx="62" cy="52" rx="10" ry="7" fill="#1c2428" fillOpacity="0.45" />
          <path d="M22 52 H32 M72 52 H84" />
        </g>
      ) : null}
      {kit === "mask" ? (
        <g>
          <path d="M34 70 h36 v16 c0 8 -8 14 -18 14 s-18 -6 -18 -14z" fill="#1a1e18" stroke="#6a7058" strokeWidth="0.8" />
          <circle cx="44" cy="80" r="1.2" fill="#9aa080" />
          <circle cx="52" cy="80" r="1.2" fill="#9aa080" />
          <circle cx="60" cy="80" r="1.2" fill="#9aa080" />
        </g>
      ) : null}
      {kit === "collar" ? (
        <g>
          <path d="M28 112 h44 l-6 16 H34z" fill="#2a241c" stroke="#8a7040" strokeWidth="0.8" />
          <path d="M40 118 h20" stroke="#c4a15a" strokeWidth="0.7" />
        </g>
      ) : null}
      {kit === "pin" ? (
        <g>
          <circle cx="70" cy="108" r="5" fill="#1a140c" stroke="#e2b15a" strokeWidth="0.8" />
          <path d="M70 104.5c1.6 1.2 2.4 2.4 2.4 3.6 0 2-1.6 3.4-2.4 3.4s-2.4-1.4-2.4-3.4c0-1.2.8-2.4 2.4-3.6z" fill="#e2b15a" />
        </g>
      ) : null}
    </svg>
  );
}

export function RiderPlate({
  src,
  look,
  className,
  imgClassName,
}: {
  src: string;
  look?: RiderLook | null;
  className?: string;
  imgClassName?: string;
}) {
  const cut = look ?? EMPTY_LOOK;
  return (
    <span className={cn("relative block overflow-hidden bg-ink", className)}>
      <img
        src={src}
        alt=""
        className={cn("size-full object-cover object-top", imgClassName)}
        style={washFilter(cut.wash) ? { filter: washFilter(cut.wash) } : undefined}
      />
      <Mark mark={cut.mark} />
      <Kit kit={cut.kit} />
    </span>
  );
}
