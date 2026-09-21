const requestWindows = new Map<string, number>();

export function claimIdempotentRequest(key: string, ttlMs = 15000): boolean {
  const now = Date.now();
  const previous = requestWindows.get(key);

  if (previous && now - previous < ttlMs) {
    return false;
  }

  requestWindows.set(key, now);
  return true;
}

export function buildVoteRequestKey(input: {
  candidatId: number;
  telephone: string;
  nombreVotes: number;
  nomVotant: string;
}) {
  return [
    "vote",
    String(input.candidatId),
    input.telephone.trim().toLowerCase(),
    String(input.nombreVotes),
    input.nomVotant.trim().toLowerCase(),
  ].join(":" );
}
