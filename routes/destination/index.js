 const express = require('express');
const { parsePayload } = require('../../lib/parsePayload');
const logStore = require('../../lib/logStore');
const verifyBearerToken = require('../../middleware/verifyBearerToken');

const router = express.Router();

// No-op unless AUTH_TOKEN is set in the environment.
router.use(verifyBearerToken);

// The raw body is captured here (rather than via express.json()) because
// RTCDP may send Content-Type: application/json, application/x-ndjson, or
// text/plain depending on its batching settings, and express.json() would
// silently skip parsing anything but application/json.
router.use(express.raw({ type: '*/*', limit: '10mb' }));

router.post('/', (req, res) => {
  let records;
  try {
    records = parsePayload(req.body);

    console.log(`req.body payload: ${JSON.stringify(records)}`);

  } catch (err) {
    console.error('[destination] failed to parse payload:', err.message);
    return res.status(400).json({ error: 'invalid payload', detail: err.message });
  }

  const receivedAt = new Date().toISOString();
  console.log(`\n[${receivedAt}] Received ${records.length} record(s)`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));

  records.forEach((record, i) => {
    const xdm = record.events?.[0]?.xdm ?? record.xdm ?? record;

    console.log(`--- record ${i + 1} ---`);
    console.log('identityMap:', JSON.stringify(xdm.identityMap, null, 2));
    console.log('segmentMembership:', JSON.stringify(xdm.segmentMembership, null, 2));
    logStore.add(record);
  });

  // RTCDP expects a 2xx response to acknowledge receipt within its timeout window.
  res.status(200).json({ status: 'ok', recordsReceived: records.length });
});

router.get('/logs', (req, res) => {
  res.json(logStore.all());
});

router.delete('/logs', (req, res) => {
  logStore.clear();
  res.status(204).end();
});

module.exports = router;
