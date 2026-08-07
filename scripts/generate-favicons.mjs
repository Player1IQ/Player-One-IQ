import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import toIco from "to-ico";

const root = process.cwd();
const source = join(root, "public/branding/player-one-iq-logo.png");
const publicDir = join(root, "public");

async function loadTrimmedWordmark() {
  return sharp(source)
    .trim({ threshold: 12 })
    .png()
    .toBuffer({ resolveWithObject: true });
}

/**
 * Wide wordmarks become unreadable stripes when fit inside a tiny square.
 * Crop the left "P1" portion of the wordmark, then scale into a square.
 */
async function renderSquareFavicon(trimmed, size) {
  const { width, height } = trimmed.info;
  // P1 occupies roughly the left 48% of the trimmed wordmark.
  const cropWidth = Math.min(Math.round(width * 0.48), width);
  const cropHeight = height;

  const cropped = await sharp(trimmed.data)
    .extract({ left: 0, top: 0, width: cropWidth, height: cropHeight })
    .resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    })
    .png()
    .toBuffer();

  return cropped;
}

async function renderContainedSquare(trimmed, size) {
  return sharp(trimmed.data)
    .resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    })
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

  // Re-save branding asset as true PNG (source may be JPEG with .png extension).
  await sharp(trimmed.data).png().toFile(source);

  const smallSizes = [16, 32];
  const largeSizes = [180, 192, 512];

  for (const size of smallSizes) {
    const buffer = await renderSquareFavicon(trimmed, size);
    await writePngBuffer(buffer, `favicon-${size}x${size}.png`);
  }

  for (const size of largeSizes) {
    const buffer = await renderContainedSquare(trimmed, size);
    const filename =
      size === 180
        ? "apple-touch-icon.png"
        : size === 192
          ? "android-chrome-192x192.png"
          : "android-chrome-512x512.png";
    await writePngBuffer(buffer, filename);
  }

  const icoBuffers = await Promise.all(
    smallSizes.map((size) => renderSquareFavicon(trimmed, size))
  );

  const ico = await toIco(icoBuffers);
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
