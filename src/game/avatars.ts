export type RiderGender = "female" | "male";

export type RiderAvatar = {
  id: string;
  gender: RiderGender;
  label: string;
  hair: string;
  eyes: string;
  src: string;
};

export const RIDER_AVATARS: RiderAvatar[] = [
  { id: "f-ash", gender: "female", label: "Ash", hair: "cropped dark", eyes: "brown", src: "/art/avatars/f-ash.jpg" },
  { id: "f-mira", gender: "female", label: "Mira", hair: "dark", eyes: "brown", src: "/art/avatars/f-mira.jpg" },
  { id: "f-rhea", gender: "female", label: "Rhea", hair: "copper braid", eyes: "grey-green", src: "/art/avatars/f-rhea.jpg" },
  { id: "f-kite", gender: "female", label: "Kite", hair: "dark ponytail", eyes: "brown", src: "/art/avatars/f-kite.jpg" },
  { id: "f-wren", gender: "female", label: "Wren", hair: "blonde", eyes: "blue", src: "/art/avatars/f-wren.jpg" },
  { id: "f-nara", gender: "female", label: "Nara", hair: "dark bob", eyes: "green", src: "/art/avatars/f-nara.jpg" },
  { id: "m-cole", gender: "male", label: "Cole", hair: "beanie", eyes: "brown", src: "/art/avatars/m-cole.jpg" },
  { id: "m-joss", gender: "male", label: "Joss", hair: "dark curls", eyes: "brown", src: "/art/avatars/m-joss.jpg" },
  { id: "m-vex", gender: "male", label: "Vex", hair: "short dark", eyes: "brown", src: "/art/avatars/m-vex.jpg" },
  { id: "m-rook", gender: "male", label: "Rook", hair: "windswept dark", eyes: "brown", src: "/art/avatars/m-rook.jpg" },
  { id: "m-hale", gender: "male", label: "Hale", hair: "blonde", eyes: "blue-green", src: "/art/avatars/m-hale.jpg" },
  { id: "m-reed", gender: "male", label: "Reed", hair: "fade", eyes: "amber", src: "/art/avatars/m-reed.jpg" },
];

const BY_ID = new Map(RIDER_AVATARS.map((row) => [row.id, row]));

export function avatarById(id?: string | null): RiderAvatar | null {
  if (!id) return null;
  return BY_ID.get(id) ?? null;
}

export function avatarSrc(id?: string | null): string | null {
  return avatarById(id)?.src ?? null;
}

export function avatarsForGender(gender: RiderGender): RiderAvatar[] {
  return RIDER_AVATARS.filter((row) => row.gender === gender);
}

export function randomAvatarId(rand: () => number = Math.random, gender?: RiderGender): string {
  const pool = gender ? avatarsForGender(gender) : RIDER_AVATARS;
  const row = pool[Math.floor(rand() * pool.length)];
  return row?.id ?? "f-ash";
}
