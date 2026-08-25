// In-memory store of received payloads so they can be inspected while
// configuring/debugging the destination in RTCDP's UI. Not persisted —
// restarting the server clears it.
const MAX_LOGS = 200;

const logs = [];

function add(record) {
  logs.unshift({ receivedAt: new Date().toISOString(), record });
  if (logs.length > MAX_LOGS) logs.pop();
}

function all() {
  return logs;
}

function clear() {
  logs.length = 0;
}

module.exports = { add, all, clear };
