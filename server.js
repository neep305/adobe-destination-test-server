const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Keep the last N received payloads in memory so they can be inspected
// while configuring/debugging the destination in RTCDP's UI.
const receivedLogs = [];
const MAX_LOGS = 200;

// RTCDP's HTTP API destination can send:
//   - a single JSON object per profile
//   - a JSON array of profile fragments (when batching)
//   - newline-delimited JSON (NDJSON), one object per line (batching option)
//   - gzip/deflate-compressed body ("Enable gzip compression" destination setting)
// so the raw body is captured ourselves instead of relying on express.json(),
// which would reject anything that isn't a single JSON object/array.
// express.raw() (body-parser) already auto-inflates gzip/deflate bodies based
// on the Content-Encoding header, so no manual decompression is needed here.
app.use(express.raw({ type: '*/*', limit: '10mb' }));

function parsePayload(buffer) {
  const text = buffer.toString('utf8').trim();
  if (!text) return [];

  // Try a plain JSON object/array first.
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (_) {
    // Not a single JSON document -> fall through to NDJSON parsing.
  }

  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

app.post('/destination', (req, res) => {
  let records;
  try {
    records = parsePayload(req.body);
  } catch (err) {
    console.error('[destination] failed to parse payload:', err.message);
    return res.status(400).json({ error: 'invalid payload', detail: err.message });
  }

  const receivedAt = new Date().toISOString();
  console.log(`\n[${receivedAt}] Received ${records.length} record(s)`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));

  records.forEach((record, i) => {
    console.log(`--- record ${i + 1} ---`);
    console.log('identityMap:', JSON.stringify(record.identityMap, null, 2));
    console.log('segmentMembership:', JSON.stringify(record.segmentMembership, null, 2));

    receivedLogs.unshift({ receivedAt, record });
    if (receivedLogs.length > MAX_LOGS) receivedLogs.pop();
  });

  // RTCDP expects a 2xx response to acknowledge receipt within its timeout window.
  res.status(200).json({ status: 'ok', recordsReceived: records.length });
});

// Inspect everything received so far.
app.get('/destination/logs', (req, res) => {
  res.json(receivedLogs);
});

app.delete('/destination/logs', (req, res) => {
  receivedLogs.length = 0;
  res.status(204).end();
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`RTCDP HTTP API destination test server listening on http://localhost:${PORT}`);
  console.log(`  POST   /destination       <- RTCDP HTTP API destination의 URL로 등록`);
  console.log(`  GET    /destination/logs  <- 수신된 payload 확인`);
  console.log(`  DELETE /destination/logs  <- 로그 초기화`);
  console.log(`  GET    /health            <- health check`);
});
