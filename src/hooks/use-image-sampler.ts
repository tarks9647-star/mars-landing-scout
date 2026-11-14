import { useEffect, useState } from "react";
import type { PixelBuffer } from "@/lib/mars-maps";

const cache = new Map<string, PixelBuffer>();

/** Decodes an image into raw RGBA pixels (client only) so targets can be analysed. */
export function useImageSampler(src: string): PixelBuffer | null {
  const [buffer, setBuffer] = useState<PixelBuffer | null>(() => cache.get(src) ?? null);

  useEffect(() => {
    const cached = cache.get(src);
    if (cached) {
      setBuffer(cached);
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const next: PixelBuffer = { src, data, width: canvas.width, height: canvas.height };
      cache.set(src, next);
      if (!cancelled) setBuffer(next);
    };
    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);

  return buffer && buffer.src === src ? buffer : null;
}
