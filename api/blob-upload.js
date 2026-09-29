const config = require("./_lib/config");
const jwt = require("./_lib/jwt");
const { handlePreflight, applyCors } = require("./_lib/cors");
const { handleUpload } = require("@vercel/blob/client");

const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50MB — files go straight to Vercel Blob, bypassing the 4.5MB function body limit

// This single endpoint is called two different ways by @vercel/blob/client's
// handleUpload():
//   1. By the logged-in admin's browser, to request a client upload token.
//      We require a valid uploadAuth (see /api/blob-upload-token) here.
//   2. By Vercel's own servers, server-to-server, once the upload finishes.
//      There's no browser session/cookie on this call — handleUpload verifies
//      it independently using BLOB_READ_WRITE_TOKEN, not our cookie auth.
module.exports = async (req, res) => {
  if (handlePreflight(req, res)) return;
  applyCors(req, res);
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const jsonResponse = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        let parsed;
        try {
          parsed = JSON.parse(clientPayload || "{}");
        } catch (err) {
          throw new Error("Missing or invalid upload authorization.");
        }
        try {
          const payload = jwt.verify(parsed.uploadAuth, config.SESSION_SECRET());
          if (payload.purpose !== "blob-upload") throw new Error("Wrong token purpose");
        } catch (err) {
          throw new Error("Not authenticated. Please log in again and retry the upload.");
        }

        return {
          allowedContentTypes: ALLOWED_VIDEO_TYPES,
          maximumSizeInBytes: MAX_VIDEO_BYTES,
          addRandomSuffix: true
        };
      },
      onUploadCompleted: async ({ blob }) => {
        // Nothing else to persist here — the browser gets blob.url directly
        // and saves it into the draft, same as an external video URL.
        console.log("Blob upload completed:", blob.url);
      }
    });
    res.status(200).json(jsonResponse);
  } catch (err) {
    res.status(400).json({ error: err.message || "Upload failed" });
  }
};
