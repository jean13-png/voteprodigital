import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  filename?: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const options: Record<string, unknown> = {
      folder,
      resource_type: "image" as const,
    };
    if (filename) options.public_id = filename;

    cloudinary.uploader
      .upload_stream(options, (error, result) => {
        if (error || !result) return reject(error ?? new Error("Upload failed"));
        resolve(result.secure_url);
      })
      .end(buffer);
  });
}

export async function deleteFromCloudinary(url: string) {
  try {
    // Extraire le public_id depuis l'URL
    const parts = url.split("/");
    const filename = parts[parts.length - 1].split(".")[0];
    const folder = parts[parts.length - 2];
    await cloudinary.uploader.destroy(`${folder}/${filename}`);
  } catch {
    // Non bloquant
  }
}

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}
