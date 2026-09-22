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
  duration: 202.8,
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

/** Kane recording (~3:22). Captions follow the tape. Existing wake stills stay in the mix. */
export const KANE_CUES = [
  { at: 0, i: 0 },
  { at: 6.2, i: 1 },
  { at: 18.2, i: 2 },
  { at: 38.0, i: 3 },
  { at: 48.0, i: 4 },
  { at: 59.0, i: 5 },
  { at: 69.0, i: 6 },
  { at: 87.0, i: 7 },
  { at: 95.0, i: 8 },
  { at: 115.0, i: 9 },
  { at: 135.0, i: 10 },
  { at: 154.0, i: 11 },
  { at: 172.0, i: 12 },
  { at: 192.0, i: 13 },
] as const satisfies readonly Cue[];

export const KANE_STILLS: readonly StillCue[] = [
  { at: 0, src: "/art/opening/kane-01.jpg" },
  { at: 12, src: "/art/npcs/kane.jpg" },
  { at: 22, src: "/art/opening/kane-02.jpg" },
  { at: 36, src: "/art/npcs/t0880-line.jpg" },
  { at: 50, src: "/art/opening/kane-03.jpg" },
  { at: 64, src: "/art/opening/kane-04.jpg" },
  { at: 80, src: "/art/opening/kane-05.jpg" },
  { at: 96, src: "/art/opening/wake-vault13.jpg" },
  { at: 114, src: "/art/opening/kane-06.jpg" },
  { at: 136, src: "/art/npcs/aegis-suit.jpg" },
  { at: 150, src: "/art/npcs/aegis-line.jpg" },
  { at: 168, src: "/art/opening/kane-07.jpg" },
  { at: 186, src: "/art/opening/kane-06.jpg" },
  { at: 196, src: "/art/opening/kane-08.jpg" },
];

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
    kind: "still",
    title: "A recording you were not meant to hear",
    eyebrow: "Kane tape",
    blurb: "Hull plate. A chassis that named himself. Super suits waiting in the dark.",
    src: "/art/opening/kane-01.jpg",
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
    blurb: "Orion. Vera. Drake. Lyra. Human pilots in successor-suits.",
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
