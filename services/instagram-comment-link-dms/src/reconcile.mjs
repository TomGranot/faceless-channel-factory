import {loadConfig} from "./config.mjs";
import {atomicJson, readJson, withDirectoryLock} from "./io.mjs";
import {applyReconciliationDecision, quarantineStaleSending} from "./reconciliation.mjs";

const [command = "list", ...argumentsList] = process.argv.slice(2);
const options = parseOptions(argumentsList);
const config = await loadConfig();

const result = await withDirectoryLock(`${config.statePath}.run-lock`, async () => {
  const state = await readJson(config.statePath, {schemaVersion: 1, comments: {}});
  if (state.schemaVersion !== 1 || typeof state.comments !== "object") throw new Error("STATE_FILE has an unsupported schema.");
  const quarantined = quarantineStaleSending(state);
  if (quarantined.length) await atomicJson(config.statePath, state);

  if (command === "list") {
    return {
      quarantined: quarantined.length,
      records: Object.entries(state.comments)
        .filter(([, record]) => ["sending", "uncertain", "rejected"].includes(record.status))
        .map(([key, record]) => ({key, status: record.status, errorCode: record.errorCode || null, attemptedAt: record.attemptedAt || null})),
    };
  }

  if (command !== "resolve") throw new Error("Command must be list or resolve.");
  if (!options.key || !options.outcome) throw new Error("resolve requires --key and --outcome.");
  applyReconciliationDecision(state, {
    key: options.key,
    outcome: options.outcome,
    providerMessageId: options["provider-message-id"],
    confirmation: options.confirmation,
  });
  await atomicJson(config.statePath, state);
  return {resolved: options.key, outcome: options.outcome};
});

console.log(JSON.stringify(result, null, 2));

function parseOptions(values) {
  const result = {};
  for (let index = 0; index < values.length; index += 2) {
    const key = values[index];
    const value = values[index + 1];
    if (!key?.startsWith("--") || value == null) throw new Error("Options must use --name value pairs.");
    result[key.slice(2)] = value;
  }
  return result;
}
