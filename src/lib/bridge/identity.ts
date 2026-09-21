/** Hollow Realm owns game identity. TyroneBot owns Discord community profiles. Tyrone Memory is a third store. Discord User ID is the link, not a merge. */
export const IDENTITY_INVARIANT =
  "A Hollow Soul must never replace or destroy a TyroneBot guild/member profile.";

export const COMMUNITY_FIELDS = [
  "tiktok",
  "tiktokUrl",
  "moonhand",
  "ethera",
  "agencyUnderBrent",
  "snapchat",
  "instagram",
] as const;

export function isCommunityField(key: string) {
  return (COMMUNITY_FIELDS as readonly string[]).includes(key);
}
