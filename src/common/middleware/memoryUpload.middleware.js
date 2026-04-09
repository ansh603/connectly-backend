import multer from "multer";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

function imageOnly(_req, file, cb) {
  const ok = String(file?.mimetype || "").startsWith("image/");
  if (!ok) return cb(new Error("Only image uploads are allowed"), false);
  return cb(null, true);
}

export const memoryImageUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageOnly,
  limits: { fileSize: MAX_IMAGE_BYTES },
});

