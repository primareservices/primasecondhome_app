// Kompresia fotky v prehliadači: max 1280 px, JPEG 0.72 → dataURL (~150–250 kB).
// Hostia majú často pomalé dáta; originál z fotoaparátu má 3–6 MB.
export function compressImage(file, { maxSide = 1280, quality = 0.72 } = {}) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale)), h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch (e) { reject(e); }
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image_load_failed')); };
    img.src = url;
  });
}
