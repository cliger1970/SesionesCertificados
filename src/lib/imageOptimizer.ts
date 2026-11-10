/**
 * Compresses an image file into WebP format at 95% quality.
 * Compares the resulting size with the original file size and returns
 * whichever is smaller (as a data URL string and file size details).
 */
export async function optimizeImageToWebP(file: File): Promise<{
  dataUrl: string;
  formatUsed: 'webp' | 'original';
  originalSize: number;
  optimizedSize: number;
  width: number;
  height: number;
}> {
  const originalSize = file.size;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = (err) => reject(err);

    reader.onload = (event) => {
      const originalDataUrl = event.target?.result as string;

      const img = new Image();
      img.onerror = (err) => reject(err);

      img.onload = () => {
        try {
          const width = img.naturalWidth || img.width;
          const height = img.naturalHeight || img.height;

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({
              dataUrl: originalDataUrl,
              formatUsed: 'original',
              originalSize,
              optimizedSize: originalSize,
              width,
              height
            });
            return;
          }

          ctx.drawImage(img, 0, 0);

          // Export to WebP at 95% quality
          const webpDataUrl = canvas.toDataURL('image/webp', 0.95);

          // Calculate approximate byte size of base64
          const base64Content = webpDataUrl.split(',')[1] || '';
          const webpSize = Math.round((base64Content.length * 3) / 4);

          // Check if WebP is smaller than original
          if (webpSize < originalSize && webpDataUrl.startsWith('data:image/webp')) {
            resolve({
              dataUrl: webpDataUrl,
              formatUsed: 'webp',
              originalSize,
              optimizedSize: webpSize,
              width,
              height
            });
          } else {
            resolve({
              dataUrl: originalDataUrl,
              formatUsed: 'original',
              originalSize,
              optimizedSize: originalSize,
              width,
              height
            });
          }
        } catch (err) {
          console.warn('WebP conversion failed, using original:', err);
          resolve({
            dataUrl: originalDataUrl,
            formatUsed: 'original',
            originalSize,
            optimizedSize: originalSize,
            width: img.naturalWidth || img.width || 1200,
            height: img.naturalHeight || img.height || 850
          });
        }
      };

      img.src = originalDataUrl;
    };

    reader.readAsDataURL(file);
  });
}
