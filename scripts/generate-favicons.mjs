import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const root = process.cwd();
const source = join(root, "public/branding/favicon-wordmark.png");
const publicDir = join(root, "public");

async function loadTrimmedWordmark() {
  return sharp(source)
    .trim({ threshold: 12 })
    .png()
    .toBuffer({ resolveWithObject: true });
}

/**
 * Boost IQ contrast on black so purple stays visible at tiny sizes.
 */
async function enhanceWordmarkForFavicon(trimmed) {
  const { width, height } = trimmed.info;
  const splitX = Math.round(width * 0.52);

  const p1Part = await sharp(trimmed.data)
    .extract({ left: 0, top: 0, width: splitX, height })
    .png()
    .toBuffer();

  const iqPart = await sharp(trimmed.data)
    .extract({ left: splitX, top: 0, width: width - splitX, height })
    .modulate({ brightness: 1.22, saturation: 1.12 })
    .png()
    .toBuffer();

  const p1Meta = await sharp(p1Part).metadata();
  const iqMeta = await sharp(iqPart).metadata();
  const combinedWidth = (p1Meta.width ?? 0) + (iqMeta.width ?? 0);

  return sharp({
    create: {
      width: combinedWidth,
      height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      { input: p1Part, left: 0, top: 0 },
      { input: iqPart, left: p1Meta.width ?? 0, top: 0 },
    ])
    .png()
    .toBuffer({ resolveWithObject: true });
}

/**
 * Render the horizontal P1IQ wordmark centered in a square favicon.
 */
async function renderHorizontalFavicon(wordmark, size) {
  const { width, height } = wordmark.info;
  const aspect = width / height;

  const maxWidth = Math.max(1, Math.round(size * 0.96));
  const maxHeight = Math.max(1, Math.round(size * 0.78));

  let targetWidth = maxWidth;
  let targetHeight = Math.max(1, Math.round(targetWidth / aspect));

  if (targetHeight > maxHeight) {
    targetHeight = maxHeight;
    targetWidth = Math.max(1, Math.round(targetHeight * aspect));
  }

  const mark = await sharp(wordmark.data)
    .resize(targetWidth, targetHeight, {
      fit: "fill",
      kernel: sharp.kernel.lanczos3,
    })
    .sharpen(size <= 16 ? { sigma: 0.8 } : { sigma: 0.5 })
    .png()
    .toBuffer();

  const left = Math.floor((size - targetWidth) / 2);
  const top = Math.floor((size - targetHeight) / 2);

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    },
  })
    .composite([{ input: mark, left, top }])
    .png()
    .toBuffer();
}

async function writePngBuffer(buffer, filename) {
  await writeFile(join(publicDir, filename), buffer);
}

async function main() {
  await mkdir(publicDir, { recursive: true });

  const trimmed = await loadTrimmedWordmark();
  console.log(
    `Trimmed wordmark: ${trimmed.info.width}x${trimmed.info.height}`
  );

  const wordmark = await enhanceWordmarkForFavicon(trimmed);

  const smallSizes = [16, 32, 48];
  const largeSizes = [180, 192, 512];

  for (const size of smallSizes) {
    const buffer = await renderHorizontalFavicon(wordmark, size);
    const filename =
      size === 48 ? "favicon-48x48.png" : `favicon-${size}x${size}.png`;
    await writePngBuffer(buffer, filename);
  }

  for (const size of largeSizes) {
    const buffer = await renderHorizontalFavicon(wordmark, size);
    const filename =
      size === 180
        ? "apple-touch-icon.png"
        : size === 192
          ? "android-chrome-192x192.png"
          : "android-chrome-512x512.png";
    await writePngBuffer(buffer, filename);
  }

  const ico = await pngToIco(
    smallSizes.map((size) => {
      const filename =
        size === 48 ? "favicon-48x48.png" : `favicon-${size}x${size}.png`;
      return join(publicDir, filename);
    })
  );
  await writeFile(join(publicDir, "favicon.ico"), ico);

  const manifest = {
    name: "Player One IQ",
    short_name: "P1IQ",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    theme_color: "#000000",
    background_color: "#000000",
    display: "standalone",
  };

  await writeFile(
    join(publicDir, "site.webmanifest"),
    `${JSON.stringify(manifest, null, 2)}\n`
  );

  console.log("Generated favicon set in public/");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
