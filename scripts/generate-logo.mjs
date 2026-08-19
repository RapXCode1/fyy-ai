import sharp from "sharp";
import path from "path";
import fs from "fs";

const dir = "C:/Users/RHAFI/.gemini/antigravity-ide/brain/ba5495fc-201b-4a5b-810d-b8c513e74a78/.user_uploaded";
const logoWhiteBg    = path.join(dir, "media_1787165162590.jpg"); // white bg — ONLY for Android APK icons
const logoTransparent = path.join(dir, "media_1787165162608.jpg"); // transparent — for ALL web/PWA/in-app

const PUBLIC = "D:/fyy-ai-main/public";
const ASSETS = "D:/fyy-ai-main/assets";

// Helper: resize transparent JPEG source → true transparent PNG buffer
async function toTransparentPng(src, size) {
  return await sharp(src)
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

async function run() {
  // --- 1. PUBLIC/logo.png (transparent, 512x512) ---
  await sharp(await toTransparentPng(logoTransparent, 512)).toFile(path.join(PUBLIC, "logo.png"));
  console.log("✅ public/logo.png");

  // --- 2. PUBLIC/logo-nobg.png (transparent, 512x512) ---
  await sharp(await toTransparentPng(logoTransparent, 512)).toFile(path.join(PUBLIC, "logo-nobg.png"));
  console.log("✅ public/logo-nobg.png");

  // --- 3. PUBLIC/icon-512.png (transparent, PWA any icon) ---
  await sharp(await toTransparentPng(logoTransparent, 512)).toFile(path.join(PUBLIC, "icon-512.png"));
  console.log("✅ public/icon-512.png");

  // --- 4. PUBLIC/icon-192.png (transparent, PWA any icon) ---
  await sharp(await toTransparentPng(logoTransparent, 192)).toFile(path.join(PUBLIC, "icon-192.png"));
  console.log("✅ public/icon-192.png");

  // --- 5. PUBLIC/apple-icon.png (transparent, 180x180) ---
  await sharp(await toTransparentPng(logoTransparent, 180)).toFile(path.join(PUBLIC, "apple-icon.png"));
  console.log("✅ public/apple-icon.png");

  // --- 6. PUBLIC/icon-bg.png (transparent, 512x512) ---
  await sharp(await toTransparentPng(logoTransparent, 512)).toFile(path.join(PUBLIC, "icon-bg.png"));
  console.log("✅ public/icon-bg.png");

  // --- 7. PUBLIC/og-image.png (1200x630, dark obsidian bg + transparent logo centered) ---
  const centerLogo = await toTransparentPng(logoTransparent, 420);
  await sharp({
    create: { width: 1200, height: 630, channels: 4, background: { r: 8, g: 8, b: 10, alpha: 255 } }
  })
    .composite([{ input: centerLogo, gravity: "center" }])
    .png()
    .toFile(path.join(PUBLIC, "og-image.png"));
  console.log("✅ public/og-image.png");

  // --- 8. PUBLIC/icons/icon-192.png & icon-512.png (transparent) ---
  const iconsDir = path.join(PUBLIC, "icons");
  if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });
  await sharp(await toTransparentPng(logoTransparent, 192)).toFile(path.join(iconsDir, "icon-192.png"));
  await sharp(await toTransparentPng(logoTransparent, 512)).toFile(path.join(iconsDir, "icon-512.png"));
  console.log("✅ public/icons/icon-192.png & icon-512.png");

  // --- 9. ASSETS/icon.png, splash.png, splash-dark.png (transparent) ---
  await sharp(await toTransparentPng(logoTransparent, 512)).toFile(path.join(ASSETS, "icon.png"));
  await sharp(await toTransparentPng(logoTransparent, 512)).toFile(path.join(ASSETS, "splash.png"));
  await sharp(await toTransparentPng(logoTransparent, 512)).toFile(path.join(ASSETS, "splash-dark.png"));
  console.log("✅ assets/icon.png, splash.png, splash-dark.png");

  // --- 10. Android mipmap — WHITE BG (APK icons MUST have solid background) ---
  const androidDirs = [
    "D:/fyy-ai-main/android/app/src/main/res/mipmap-hdpi",
    "D:/fyy-ai-main/android/app/src/main/res/mipmap-mdpi",
    "D:/fyy-ai-main/android/app/src/main/res/mipmap-xhdpi",
    "D:/fyy-ai-main/android/app/src/main/res/mipmap-xxhdpi",
    "D:/fyy-ai-main/android/app/src/main/res/mipmap-xxxhdpi",
  ];
  const androidSizes = [72, 48, 96, 144, 192];
  for (let i = 0; i < androidDirs.length; i++) {
    if (fs.existsSync(androidDirs[i])) {
      await sharp(logoWhiteBg).resize(androidSizes[i], androidSizes[i]).png()
        .toFile(path.join(androidDirs[i], "ic_launcher.png"));
      await sharp(logoWhiteBg).resize(androidSizes[i], androidSizes[i]).png()
        .toFile(path.join(androidDirs[i], "ic_launcher_round.png"));
      console.log(`✅ Android ${path.basename(androidDirs[i])} (white bg APK icon)`);
    }
  }

  console.log("\n🎉 DONE — transparent for all web/PWA, white bg only for APK!");
}

run().catch(e => { console.error("❌", e); process.exit(1); });
