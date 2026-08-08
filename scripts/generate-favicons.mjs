import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import pngToIco from "png-to-ico";

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
 * Fit the full horizontal P1IQ wordmark inside a square with even padding.
 */
async function renderContainedSquare(trimmed, size, paddingRatio = 0.08) {
  const padding = Math.max(1, Math.round(size * paddingRatio));
  const inner = Math.max(1, size - padding * 2);

  const mark = await sharp(trimmed.data)
    .resize(inner, inner, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = mark.info;
  const left = Math.floor((size - width) / 2);
  const top = Math.floor((size - height) / 2);

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    },
  })
    .composite([{ input: mark.data, left, top }])
    .png()
    .toBuffer();
}

/**
 * Tiny tab icons cannot fit a wide wordmark legibly on one line.
 * Stack P1 over IQ so both marks stay visible at 16–32px.
 */
async function renderStackedFavicon(trimmed, size) {
  const { width, height } = trimmed.info;
  const splitX = Math.round(width * 0.5);

  const p1Part = await sharp(trimmed.data)
    .extract({ left: 0, top: 0, width: splitX, height })
    .png()
    .toBuffer();

  const iqPart = await sharp(trimmed.data)
    .extract({ left: splitX, top: 0, width: width - splitX, height })
    .modulate({ brightness: 1.35, saturation: 1.15 })
    .png()
    .toBuffer();

  const padding = Math.max(1, Math.round(size * 0.08));
  const gap = Math.max(1, Math.round(size * 0.04));
  const rowHeight = Math.floor((size - padding * 2 - gap) / 2);
  const rowWidth = size - padding * 2;

  const p1Row = await sharp(p1Part)
    .resize(rowWidth, rowHeight, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer({ resolveWithObject: true });

  const iqRow = await sharp(iqPart)
    .resize(rowWidth, rowHeight, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer({ resolveWithObject: true });

  const centerRow = (row, top) => ({
    input: row.data,
    left: padding + Math.floor((rowWidth - row.info.width) / 2),
    top: top + Math.floor((rowHeight - row.info.height) / 2),
  });

  const p1Top = padding;
  const iqTop = padding + rowHeight + gap;

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    },
  })
    .composite([
      centerRow(p1Row, p1Top),
      centerRow(iqRow, iqTop),
    ])
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
    const buffer = await renderStackedFavicon(trimmed, size);
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

  const ico = await pngToIco(
    smallSizes.map((size) => join(publicDir, `favicon-${size}x${size}.png`))
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
