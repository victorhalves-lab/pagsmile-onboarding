/**
 * Client-side image compression helper.
 * Compresses images > thresholdMB using canvas, preserving aspect ratio.
 * Returns a new File (same name) with JPEG compression.
 *
 * Does NOT compress: PDFs, DOC/DOCX, files below threshold, or non-image MIME.
 */

const MAX_DIMENSION = 2400; // px — fine for document legibility
const JPEG_QUALITY = 0.82;

async function fileToImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

export async function compressImageIfNeeded(file, thresholdMB = 5) {
  if (!file || !file.type?.startsWith('image/')) return file;
  if (file.size <= thresholdMB * 1024 * 1024) return file;

  try {
    const img = await fileToImage(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
    );
    if (!blob || blob.size >= file.size) return file; // keep original if no win
    const newName = file.name.replace(/\.(png|webp|bmp|tiff?|heic|heif)$/i, '.jpg');
    return new File([blob], newName, { type: 'image/jpeg', lastModified: Date.now() });
  } catch (err) {
    console.warn('[compressImage] failed, using original:', err?.message);
    return file;
  }
}