/**
 * compressImage
 * Resizes and converts an image File to a WebP Blob using Canvas API.
 * No external dependencies needed.
 *
 * @param {File}   file       — original image file from <input type="file">
 * @param {object} options
 * @param {number} options.maxWidth   — max output width in px  (default 800)
 * @param {number} options.maxHeight  — max output height in px (default 400)
 * @param {number} options.quality    — WebP quality 0–1        (default 0.82)
 * @returns {Promise<Blob>}  — compressed WebP blob
 */
export function compressImage(file, { maxWidth = 800, maxHeight = 400, quality = 0.82 } = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Calculate dimensions preserving aspect ratio
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width  = maxWidth;
      }
      if (height > maxHeight) {
        width  = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }

      const canvas  = document.createElement('canvas');
      canvas.width  = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas toBlob failed'));
        },
        'image/webp',
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}
