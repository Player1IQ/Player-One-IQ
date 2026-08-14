import sharp from "sharp";
import { join } from "node:path";

const root = process.cwd();
const source =
  process.argv[2] ?? join(root, "public/branding/p1iq-wordmark-transparent.png");
const out = join(root, "public/branding/p1iq-wordmark-transparent.png");
const faviconSrc = join(root, "public/branding/favicon-wordmark.png");

function removeDarkBackground(buffer, width, height, channels) {
  const output = Buffer.from(buffer);

  for (let i = 0; i < output.length; i += channels) {
    const r = output[i];
    const g = output[i + 1];
    const b = output[i + 2];
    const maxChannel = Math.max(r, g, b);

    if (channels === 4) {
      if (maxChannel <= 18) {
        output[i + 3] = 0;
      } else if (maxChannel <= 42) {
        const alpha = Math.round(((maxChannel - 18) / 24) * 255);
        output[i + 3] = Math.min(output[i + 3], alpha);
      }
    }
  }

  return output;
}

const decoded = await sharp(source)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const cleared = removeDarkBackground(
  decoded.data,
  decoded.info.width,
  decoded.info.height,
  decoded.info.channels
);

const trimmed = await sharp(cleared, {
  raw: {
    width: decoded.info.width,
    height: decoded.info.height,
    channels: decoded.info.channels,
  },
})
  .trim({ threshold: 12 })
  .png()
  .toBuffer({ resolveWithObject: true });

await sharp(trimmed.data).png().toFile(out);
await sharp(trimmed.data).png().toFile(faviconSrc);

console.log(
  JSON.stringify({
    width: trimmed.info.width,
    height: trimmed.info.height,
    hasAlpha: trimmed.info.channels === 4,
  })
);
