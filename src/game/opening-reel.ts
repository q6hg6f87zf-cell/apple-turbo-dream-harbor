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
] as const;

export function wakeLineAt(time: number): number {
  const t = Number.isFinite(time) ? time : 0;
  let i = 0;
  for (const cue of WAKE_CUES) {
    if (t >= cue.at) i = cue.i;
  }
  return i;
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
];
