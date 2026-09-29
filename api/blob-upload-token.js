const requireAuth = require("./_lib/requireAuth");
const config = require("./_lib/config");
const jwt = require("./_lib/jwt");
const { handlePreflight, applyCors } = require("./_lib/cors");

// The browser calls this (with its normal admin_session cookie) BEFORE starting
// a direct-to-Blob video upload. It proves "yes, this is a logged-in admin" via
// a short-lived signed token, which gets passed along as clientPayload to
// /api/blob-upload — because that endpoint is also called server-to-server by
// Vercel itself (the upload-completed webhook), so it can't rely on cookies.
module.exports = async (req, res) => {
  if (handlePreflight(req, res)) return;
  applyCors(req, res);
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const user = requireAuth(req, res);
  if (!user) return;

  const uploadAuth = jwt.sign({ purpose: "blob-upload" }, config.SESSION_SECRET(), 10 * 60);
  res.status(200).json({ uploadAuth });
};
