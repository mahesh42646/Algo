const crypto = require('crypto');

let _io = null;

function getSocketSecret() {
  return process.env.SOCKET_SECRET || '';
}

function setIO(io) {
  _io = io;
}

function getIO() {
  return _io;
}

/**
 * Emit event to all sockets in a user's room. Safe to call when io not set.
 * @param {string} userId - User ID (room name)
 * @param {string} event - Event name (e.g. 'user:balance', 'user:notifications')
 * @param {object} data - Payload (will be JSON-serialized)
 */
function emitToUser(userId, event, data) {
  if (!_io || !userId) return;
  try {
    _io.to(String(userId)).emit(event, data);
  } catch (err) {
    console.error('[SOCKET] emitToUser error:', err.message);
  }
}

/**
 * Verify socket auth: token must be sha256(userId + SOCKET_SECRET).
 * If SOCKET_SECRET is empty (dev), accept any non-empty userId.
 */
function verifySocketAuth(userId, token) {
  if (!userId || typeof userId !== 'string') return false;
  const uid = userId.trim();
  if (!uid) return false;
  const SOCKET_SECRET = getSocketSecret();
  if (!SOCKET_SECRET) return true;
  if (!token || typeof token !== 'string') return false;
  const expected = crypto.createHash('sha256').update(uid + SOCKET_SECRET).digest('hex');
  const t = token.trim();
  if (expected.length !== 64 || t.length !== 64 || !/^[a-f0-9]{64}$/i.test(t)) return false;
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(t, 'hex');
  return a.length === 32 && b.length === 32 && crypto.timingSafeEqual(a, b);
}

module.exports = {
  setIO,
  getIO,
  emitToUser,
  verifySocketAuth,
};
