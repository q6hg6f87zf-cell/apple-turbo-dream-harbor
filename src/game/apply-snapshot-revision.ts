/**
 * Forge: revision gate for authoritative snapshots.
 * Never apply an older campaign/member revision over fresher cached state.
 */

export type SnapshotRevisionWatermark = {
  campaignRevision: number;
  memberRevision: number;
};

export type CachedAuthorityRevision = {
  active?: boolean;
  revision?: number;
  memberRevision?: number;
} | null | undefined;

export function readSnapshotRevisions(snapshot: {
  campaign?: { revision?: number } | null;
  card?: { revision?: number } | null;
}): SnapshotRevisionWatermark {
  return {
    campaignRevision: Math.max(0, Number(snapshot.campaign?.revision || 0)),
    memberRevision: Math.max(0, Number(snapshot.card?.revision || 0)),
  };
}

/**
 * Apply when no authority cache yet, or incoming revisions are >= cached.
 * Reject strictly older campaign, or same campaign with older member.
 */
export function shouldApplyServerSnapshot(
  snapshot: {
    campaign?: { revision?: number } | null;
    card?: { revision?: number } | null;
  },
  cached: CachedAuthorityRevision,
): boolean {
  if (!cached?.active) return true;
  const incoming = readSnapshotRevisions(snapshot);
  const cachedCampaign = Math.max(0, Number(cached.revision || 0));
  const cachedMember = Math.max(0, Number(cached.memberRevision || 0));
  if (incoming.campaignRevision < cachedCampaign) return false;
  if (incoming.campaignRevision > cachedCampaign) return true;
  // Same campaign revision: do not clobber a fresher member ledger.
  return incoming.memberRevision >= cachedMember;
}
