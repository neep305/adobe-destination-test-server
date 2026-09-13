const crypto = require('crypto');

// Constant-time string comparison so a wrong-but-similar token can't be
// brute-forced by measuring response time.
function timingSafeEqualStrings(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// RTCDP's HTTP API destination supports sending a static Bearer token in the
// Authorization header. Auth is opt-in here: if AUTH_TOKEN isn't set, every
// request is let through, matching this server's "no auth for now" default.
function verifyBearerToken(req, res, next) {
  const expectedToken = process.env.AUTH_TOKEN;
  if (!expectedToken) return next();

  const match = (req.headers.authorization || '').match(/^Bearer (.+)$/);
  const token = match ? match[1] : null;

  if (!token || !timingSafeEqualStrings(token, expectedToken)) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  next();
}

module.exports = verifyBearerToken;
