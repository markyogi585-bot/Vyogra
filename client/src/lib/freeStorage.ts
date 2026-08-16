/**
 * Free Zero-Cost Image Storage Service
 * Uses client-side WebP compression + ImgBB Free API / Free Base64 CDN / Local Storage.
 * NO paid Firebase Storage bucket required!
 */

/**
 * Compress an image file in browser using HTML5 Canvas to WebP format
 */
export async function compressImageToWebP(
  file: File,
  maxWidth = 1600,
  maxHeight = 1200,
  quality = 0.82,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const webpDataUrl = canvas.toDataURL("image/webp", quality);
        resolve(webpDataUrl);
      };
      img.onerror = () => reject(new Error("Failed to load image for compression"));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Free Image Upload via ImgBB public API or fallback to high-quality compressed Data URI
 */
export async function uploadImageFree(
  file: File | Blob,
  customApiKey?: string,
): Promise<{ url: string; sizeKb: number; source: "imgbb" | "compressed_cdn" }> {
  // First compress to lightweight WebP
  const compressedDataUrl = file instanceof File
    ? await compressImageToWebP(file)
    : await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });

  const approxSizeKb = Math.round((compressedDataUrl.length * 3) / 4 / 1024);

  // User-configured ImgBB API key
  const apiKey = customApiKey || "23fedf66d70f69fb46cd82395cbb5e59";
  try {
    const base64Clean = compressedDataUrl.replace(/^data:image\/\w+;base64,/, "");
    const formData = new FormData();
    formData.append("image", base64Clean);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const json = await response.json();
      if (json.data?.display_url) {
        return {
          url: json.data.display_url,
          sizeKb: Math.round((json.data.size || approxSizeKb * 1024) / 1024),
          source: "imgbb",
        };
      }
    }
  } catch (err) {
    console.warn("Free cloud upload failed, using compressed WebP data URL fallback", err);
  }

  // Fallback to high-speed compressed WebP Data URL (works 100% offline & zero cloud cost)
  return {
    url: compressedDataUrl,
    sizeKb: approxSizeKb,
    source: "compressed_cdn",
  };
}
