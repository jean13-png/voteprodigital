import { v2 as cloudinary } from "cloudinary";

// CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name est automatiquement
// lu par le SDK si défini. On configure aussi manuellement en fallback.
if (!process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    timeout: 60000,
  });
}

// File validation constants
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate file before upload
 * @param file - File to validate
 * @returns Validation result
 */
export function validateImageFile(file: File): FileValidationResult {
  if (!file) {
    return { valid: false, error: "Aucun fichier fourni." };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Fichier trop volumineux. Taille max : ${MAX_FILE_SIZE / 1024 / 1024} MB.`,
    };
  }

  if (file.size === 0) {
    return { valid: false, error: "Le fichier est vide." };
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "Type de fichier non autorisé. Formats acceptés : JPEG, PNG, WebP.",
    };
  }

  return { valid: true };
}

/**
 * Validate buffer size before upload
 * @param buffer - Buffer to validate
 * @returns Validation result
 */
export function validateBufferSize(buffer: Buffer): FileValidationResult {
  if (!buffer || buffer.length === 0) {
    return { valid: false, error: "Buffer vide." };
  }

  if (buffer.length > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Fichier trop volumineux. Taille max : ${MAX_FILE_SIZE / 1024 / 1024} MB.`,
    };
  }

  return { valid: true };
}

export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  filename?: string
): Promise<string> {
  // Validate buffer size
  const validation = validateBufferSize(buffer);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  return new Promise((resolve, reject) => {
    const options: Record<string, unknown> = {
      folder,
      resource_type: "image" as const,
      // Security: reject files that don't match image format
      invalidate: true,
      // Optimize images automatically
      transformation: [
        { quality: "auto:good" },
        { fetch_format: "auto" },
      ],
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
