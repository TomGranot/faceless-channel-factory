export const RETRY_CONFIRMATION = "I_VERIFIED_INSTAGRAM_DM_NOT_SENT";

const RECONCILABLE = new Set(["sending", "uncertain", "rejected"]);

export function quarantineStaleSending(state, {now = () => new Date(), staleAfterMs = 30 * 60_000} = {}) {
  const quarantined = [];
  const currentTime = now().getTime();
  for (const [key, record] of Object.entries(state.comments || {})) {
    if (record.status !== "sending") continue;
    const attemptedAt = Date.parse(record.attemptedAt);
    if (Number.isFinite(attemptedAt) && currentTime - attemptedAt < staleAfterMs) continue;
    state.comments[key] = {
      ...record,
      status: "uncertain",
      errorCode: Number.isFinite(attemptedAt)
        ? "stale_sending_reconciliation_required"
        : "invalid_sending_timestamp_reconciliation_required",
      completedAt: new Date(currentTime).toISOString(),
    };
    quarantined.push(key);
  }
  return quarantined;
}

export function applyReconciliationDecision(
  state,
  {key, outcome, providerMessageId, confirmation, now = () => new Date()},
) {
  const record = state.comments?.[key];
  if (!record) throw new Error(`No comment state exists for ${key}.`);
  if (!RECONCILABLE.has(record.status)) throw new Error(`${key} has status ${record.status} and does not need reconciliation.`);

  if (outcome === "confirmed-sent") {
    state.comments[key] = {
      ...record,
      status: "sent",
      ...(providerMessageId ? {providerMessageId} : {}),
      reconciledAt: now().toISOString(),
    };
    return state.comments[key];
  }

  if (outcome === "confirmed-not-sent") {
    if (confirmation !== RETRY_CONFIRMATION) {
      throw new Error(`Confirmed-not-sent reconciliation requires confirmation ${RETRY_CONFIRMATION}.`);
    }
    delete state.comments[key];
    return null;
  }

  throw new Error("Outcome must be confirmed-sent or confirmed-not-sent.");
}
