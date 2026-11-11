import { partyTitle } from "./supabase";

const MAX_PHOTO_SIDE = 1600; // long side of the photo area, in px
const THUMB_WIDTH = 480;

/**
 * Draws a source image into a polaroid-style frame with the party title,
 * downscaled so uploads stay small (~300-700 KB).
 */
export function renderFramed(
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
  mirror: boolean,
): HTMLCanvasElement {
  const scale = Math.min(1, MAX_PHOTO_SIDE / Math.max(srcW, srcH));
  const pw = Math.round(srcW * scale);
  const ph = Math.round(srcH * scale);

  const border = Math.round(pw * 0.04);
  const footer = Math.round(Math.max(pw, ph) * 0.13);

  const canvas = document.createElement("canvas");
  canvas.width = pw + border * 2;
  canvas.height = ph + border + footer;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#fffaf3";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  if (mirror) {
    ctx.translate(border + pw, border);
    ctx.scale(-1, 1);
    ctx.drawImage(source, 0, 0, pw, ph);
  } else {
    ctx.drawImage(source, border, border, pw, ph);
  }
  ctx.restore();

  // Footer text
  const titleSize = Math.round(footer * 0.36);
  const dateSize = Math.round(footer * 0.17);
  const cx = canvas.width / 2;
  const footerTop = border + ph;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#2b1d3a";
  ctx.font = `700 ${titleSize}px ui-rounded, "SF Pro Rounded", system-ui, sans-serif`;
  fitText(ctx, partyTitle, canvas.width - border * 4, titleSize);
  ctx.fillText(partyTitle, cx, footerTop + footer * 0.42);

  ctx.fillStyle = "#8a7a99";
  ctx.font = `500 ${dateSize}px system-ui, sans-serif`;
  ctx.fillText(
    new Date().toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
    cx,
    footerTop + footer * 0.75,
  );

  return canvas;
}

/** Shrinks the font until the text fits the given width. */
function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  size: number,
) {
  while (size > 10 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = ctx.font.replace(/\d+px/, `${size}px`);
  }
}

export function makeThumb(full: HTMLCanvasElement): HTMLCanvasElement {
  const scale = THUMB_WIDTH / full.width;
  const c = document.createElement("canvas");
  c.width = THUMB_WIDTH;
  c.height = Math.round(full.height * scale);
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(full, 0, 0, c.width, c.height);
  return c;
}

export function toJpeg(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not encode image"))),
      "image/jpeg",
      quality,
    ),
  );
}

/** Loads a picked file (camera roll / native camera) with EXIF rotation applied. */
export async function fileToBitmap(file: File): Promise<ImageBitmap> {
  return createImageBitmap(file, { imageOrientation: "from-image" });
}
