import { v2 as cloudinary } from "cloudinary";

const requiredEnv = (k) => {
  const v = process.env[k];
  if (!v) throw new Error(`Missing env ${k}`);
  return v;
};

let configured = false;
export function ensureCloudinaryConfigured() {
  if (configured) return;
  cloudinary.config({
    cloud_name: requiredEnv("CLOUDINARY_CLOUD_NAME"),
    api_key: requiredEnv("CLOUDINARY_API_KEY"),
    api_secret: requiredEnv("CLOUDINARY_API_SECRET"),
    secure: true,
  });
  configured = true;
}

/**
 * Upload an in-memory file buffer to Cloudinary.
 * @param {{ buffer: Buffer, mimetype?: string, originalname?: string }} file
 * @param {{ folder?: string, publicId?: string }} [opts]
 * @returns {Promise<{ secure_url: string, public_id: string }>}
 */
export async function uploadImageBufferToCloudinary(file, opts = {}) {
  ensureCloudinaryConfigured();

  const folder = opts.folder || process.env.CLOUDINARY_FOLDER || "connectly/profile";
  const uploadOpts = {
    folder,
    resource_type: "image",
    overwrite: true,
    unique_filename: true,
    use_filename: false,
  };
  if (opts.publicId) uploadOpts.public_id = opts.publicId;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(uploadOpts, (err, result) => {
      if (err) return reject(err);
      resolve({ secure_url: result.secure_url, public_id: result.public_id });
    });
    stream.end(file.buffer);
  });
}

