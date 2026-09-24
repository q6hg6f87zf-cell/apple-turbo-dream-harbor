export const CANON_KANE_TRANSCRIPT=true;
import { TALK } from "./talk";

export const WAKE_REEL = {
  src: "/art/opening/wake-9x16.mp4",
  poster: "/art/opening/wake-9x16.jpg",
  duration: 108.83,
  audioEnds: 93.75,
} as const;

export const TITLE_REEL = {
  src: "/art/opening/title-hollow.mp4",
  poster: "/art/opening/title-hollow.jpg",
  duration: 25,
} as const;

export const SCORE = {
  src: "/audio/chronicles-of-the-unseen.mp3",
  duration: 120.03,
  title: "Chronicles of the Unseen",
} as const;

export type IntroChapter = "found-you" | "kane" | "reply" | "done";

export const KANE_TAPE = {
  src: "/audio/kane-recording.mp3",
  duration: 204.72,
} as const;

/** Recorder-button click + tape hiss before Kane's first word. */
export const KANE_ARM = 1.88;

/** Picture plays first. Kane's recording starts this many seconds into the reel. */
export const KANE_AUDIO_AT = 4;

/** Keeps the iPhone play-chain alive for those 4 seconds. Tape hiss, not silence. */
export const KANE_LEAD = {
  src: "/audio/kane-lead.mp3",
  duration: KANE_AUDIO_AT,
} as const;

/**
 * Kane intro picture — the office reel. Mute is intentional: captions follow
 * kane-recording.mp3, which arms at KANE_AUDIO_AT.
 */
export const KANE_REEL = {
  src: "/art/opening/kane-intro.mp4",
  poster: "/art/opening/kane-01.jpg",
  duration: 210.87,
  loop: false,
} as const;

export const TYRONE_REPLY_TAPE = {
  src: "/audio/tyrone-historically-significant.mp3",
  duration: 11.36,
} as const;

export const TYRONE_REPLY_REEL = {
  src: "/art/opening/tyrone-reply.mp4",
  poster: "/art/opening/tyrone-reply-01.jpg",
  duration: 13.42,
} as const;

export type Cue = { at: number; i: number };
export type StillCue = { at: number; src: string };
export type KaneShot = {
  at: number;
  kind: "clip" | "still";
  src: string;
  poster: string;
  subject: "kane" | "tyrone" | "aegis";
  blend?: "fade" | "hold";
  /** Seconds into the clip. Used so one Tyrone file can cover two tape lines. */
  startAt?: number;
};

/** Spoken-line starts, mapped from tyrone-found-you.mp3. Captions follow the tape, not the cut. */
export const WAKE_CUES = [
  { at: 0, i: 0 },
  { at: 12.6, i: 1 },
  { at: 21.5, i: 2 },
  { at: 30.2, i: 3 },
  { at: 41.9, i: 4 },
  { at: 58.3, i: 5 },
  { at: 76.0, i: 6 },
  { at: 87.3, i: 7 },
] as const satisfies readonly Cue[];

/** Kane recording (~3:23). Captions follow the tape word-for-word. Office stills only. */
export const KANE_CUES = [
  { at: 0, i: 0 },
  { at: KANE_ARM + 2.7, i: 1 },
  { at: KANE_ARM + 6.74, i: 2 },
  { at: KANE_ARM + 12.64, i: 3 },
  { at: KANE_ARM + 18.02, i: 4 },
  { at: KANE_ARM + 21.2, i: 5 },
  { at: KANE_ARM + 27.3, i: 6 },
  { at: KANE_ARM + 31.37, i: 7 },
  { at: KANE_ARM + 38.16, i: 8 },
  { at: KANE_ARM + 41.87, i: 9 },
  { at: KANE_ARM + 45.28, i: 10 },
  { at: KANE_ARM + 50.46, i: 11 },
  { at: KANE_ARM + 59.08, i: 12 },
  { at: KANE_ARM + 69.72, i: 13 },
  { at: 80.43, i: 14 },
  { at: KANE_ARM + 87.76, i: 15 },
  { at: KANE_ARM + 95.5, i: 16 },
  { at: 105.3, i: 17 },
  { at: 107.13, i: 18 },
  { at: 108.54, i: 19 },
  { at: 109.92, i: 20 },
  { at: 111.96, i: 21 },
  { at: 116.28, i: 22 },
  { at: 120.93, i: 23 },
  { at: 126.54, i: 24 },
  { at: 133.92, i: 25 },
  { at: 136.83, i: 26 },
  { at: 142.83, i: 27 },
  { at: 147.12, i: 28 },
  { at: 155.25, i: 29 },
  { at: 159.3, i: 30 },
  { at: 163.38, i: 31 },
  { at: 168.39, i: 32 },
  { at: 174.57, i: 33 },
  { at: 179.25, i: 34 },
  { at: 184.89, i: 35 },
  { at: 188.1, i: 36 },
  { at: 192.9, i: 37 },
  { at: 196.02, i: 38 },
  { at: 199.68, i: 39 },
] as const satisfies readonly Cue[];

/**
 * Picture on the Kane tape. One office reel — cuts were fighting the dialogue.
 * Reduced-motion stills use the poster.
 */
export const KANE_SHOTS: readonly KaneShot[] = [
  { at: 0, kind: "clip", src: KANE_REEL.src, poster: KANE_REEL.poster, subject: "kane", blend: "hold" },
];

export const KANE_SHOT_FADE = 0.4;

export const KANE_STILLS: readonly StillCue[] = KANE_SHOTS.map((shot) => ({
  at: shot.at,
  src: shot.kind === "still" ? shot.src : shot.poster,
}));

export const REPLY_CUES = [
  { at: 0, i: 0 },
  { at: 1.8, i: 1 },
  { at: 6.8, i: 2 },
] as const satisfies readonly Cue[];

export const REPLY_STILLS: readonly StillCue[] = [
  { at: 0, src: "/art/opening/tyrone-reply-01.jpg" },
  { at: 2.2, src: "/art/opening/tyrone-reply-02.jpg" },
  { at: 4.6, src: "/art/opening/tyrone-reply-03.jpg" },
  { at: 7.2, src: "/art/opening/tyrone-reply-04.jpg" },
  { at: 9.6, src: "/art/opening/tyrone-reply-05.jpg" },
];

export function cueIndexAt(cues: readonly Cue[], time: number): number {
  const t = Number.isFinite(time) ? time : 0;
  let i = 0;
  for (const cue of cues) {
    if (t >= cue.at) i = cue.i;
  }
  return i;
}

export function stillSrcAt(stills: readonly StillCue[], time: number): string {
  const t = Number.isFinite(time) ? time : 0;
  let src = stills[0]?.src ?? "";
  for (const still of stills) {
    if (t >= still.at) src = still.src;
  }
  return src;
}

export function kaneShotIndex(time: number): number {
  const t = Number.isFinite(time) ? time : 0;
  let i = 0;
  for (let n = 0; n < KANE_SHOTS.length; n++) {
    if (t >= KANE_SHOTS[n]!.at) i = n;
  }
  return i;
}

export function kaneShotAt(time: number): KaneShot {
  return KANE_SHOTS[kaneShotIndex(time)] ?? KANE_SHOTS[0]!;
}

export function kaneEdgeFade(time: number): number {
  const t = Number.isFinite(time) ? time : 0;
  const tail = KANE_TAPE.duration - t;
  if (tail < 1.8) return Math.min(1, Math.max(0, 1 - tail / 1.8));
  return 0;
}

export function wakeLineAt(time: number): number {
  return cueIndexAt(WAKE_CUES, time);
}

export function kaneLineAt(time: number): number {
  return cueIndexAt(KANE_CUES, time);
}

export function replyLineAt(time: number): number {
  return cueIndexAt(REPLY_CUES, time);
}

export function wakeCaption(i: number): string {
  return TALK.wake[i]?.text ?? "";
}

export type GalleryItem =
  | {
      id: string;
      kind: "reel";
      title: string;
      eyebrow: string;
      blurb: string;
      src: string;
      poster: string;
      duration: number;
      captions: boolean;
    }
  | {
      id: string;
      kind: "still";
      title: string;
      eyebrow: string;
      blurb: string;
      src: string;
    };

export const GALLERY: GalleryItem[] = [
  {
    id: "found-you",
    kind: "reel",
    title: "Found You",
    eyebrow: "Opening",
    blurb: "East of the old highway. Tyrone talks. Captions follow the tape. Kane waits after.",
    src: WAKE_REEL.src,
    poster: WAKE_REEL.poster,
    duration: WAKE_REEL.duration,
    captions: true,
  },
  {
    id: "title-plate",
    kind: "reel",
    title: "The Hollow Realm",
    eyebrow: "Title",
    blurb: "Brass lockup. Gears in the wall. Chronicles of the Unseen. Title bed — not a holotape.",
    src: TITLE_REEL.src,
    poster: TITLE_REEL.poster,
    duration: TITLE_REEL.duration,
    captions: false,
  },
  {
    id: "bedside",
    kind: "still",
    title: "Infirmary",
    eyebrow: "Vault 13",
    blurb: "Surgical lamps. A CRT face. He found you breathing.",
    src: "/art/opening/wake-bedside.jpg",
  },
  {
    id: "highway",
    kind: "still",
    title: "Old Highway",
    eyebrow: "Three miles",
    blurb: "Facedown in the dirt. No tracks leading in.",
    src: "/art/opening/wake-highway.jpg",
  },
  {
    id: "vault-door",
    kind: "still",
    title: "Door 13",
    eyebrow: "Shelter",
    blurb: "Roof leaks. Door sticks. Something scratches the east wall.",
    src: "/art/opening/wake-vault13.jpg",
  },
  {
    id: "hall",
    kind: "still",
    title: "Gear hall",
    eyebrow: "Inside",
    blurb: "Come on, wanderer. Kane already wants the town.",
    src: "/art/opening/wake-hall.jpg",
  },
  {
    id: "kane",
    kind: "still",
    title: "Dr. Vesper Kane",
    eyebrow: "Project Vesper",
    blurb: "She signed the T-0880 shutdown. Then she built the people who replaced him.",
    src: "/art/npcs/kane.jpg",
  },
  {
    id: "kane-recording",
    kind: "reel",
    title: "A recording you were not meant to hear",
    eyebrow: "Kane tape",
    blurb: "Hull plate. A chassis that named himself. Super suits waiting in the dark.",
    src: KANE_REEL.src,
    poster: KANE_REEL.poster,
    duration: KANE_REEL.duration,
    captions: true,
  },
  {
    id: "t0880-line",
    kind: "still",
    title: "T-0880 shutdown",
    eyebrow: "Delivery line",
    blurb: "Chassis with a clipboard. They walked packages. One of them named himself.",
    src: "/art/npcs/t0880-line.jpg",
  },
  {
    id: "aegis-suit",
    kind: "still",
    title: "AEGIS 2753",
    eyebrow: "Human-operated",
    blurb: "Halo-grade frames. A person inside the plate, not a delivery chassis.",
    src: "/art/npcs/aegis-suit.jpg",
  },
  {
    id: "aegis-line",
    kind: "still",
    title: "AEGIS 2753",
    eyebrow: "First wing",
    blurb: "Orion, the lance. Vera, the rifle. Drake, the twelve-gauge. Lyra, the long gun.",
    src: "/art/npcs/aegis-line.jpg",
  },
  {
    id: "aegis-field",
    kind: "still",
    title: "Field team",
    eyebrow: "Ironclad",
    blurb: "Violet and amber visors on the slag road. The rest of the wing is never far.",
    src: "/art/npcs/aegis-field.jpg",
  },
  {
    id: "historically-significant",
    kind: "reel",
    title: "Historically Significant",
    eyebrow: "Tyrone replies",
    blurb: "The recording ends. He is still standing over the bed.",
    src: TYRONE_REPLY_REEL.src,
    poster: TYRONE_REPLY_REEL.poster,
    duration: TYRONE_REPLY_REEL.duration,
    captions: false,
  },
];
