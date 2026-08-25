// RTCDP's HTTP API destination can send:
//   - a single JSON object per profile
//   - a JSON array of profile fragments (when batching)
//   - newline-delimited JSON (NDJSON), one object per line (batching option)
// gzip/deflate-compressed bodies are already inflated upstream by
// express.raw()'s body-parser before this ever sees the buffer.
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

module.exports = { parsePayload };
