import sharp from "sharp";
import path from "path";
import fs from "fs";

// ✅ TRUE TRANSPARENT PNG — logo baru yang benar dari user
const logoTrue = "C:/Users/RHAFI/.gemini/antigravity-ide/brain/ba5495fc-201b-4a5b-810d-b8c513e74a78/.user_uploaded/media_1787167645855.png";

// ⚪ WHITE BG — HANYA untuk Android APK (launcher wajib solid background)
const logoWhiteBg = "C:/Users/RHAFI/.gemini/antigravity-ide/brain/ba5495fc-201b-4a5b-810d-b8c513e74a78/.user_uploaded/media_1787165162590.jpg";

// 👨‍💻 DEVELOPER LOGO — RapXCode RX Logo (transparent)
const logoDev = "C:/Users/RHAFI/.gemini/antigravity-ide/brain/ba5495fc-201b-4a5b-810d-b8c513e74a78/.user_uploaded/media_1787169333580.png";

const PUBLIC = "D:/fyy-ai-main/public";
const ASSETS = "D:/fyy-ai-main/assets";

async function transparentPng(size) {
  return await sharp(logoTrue)
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

async function run() {
  // --- web / PWA (semua transparent) ---
  await sharp(await transparentPng(512)).toFile(path.join(PUBLIC, "logo.png"));
  console.log("✅ public/logo.png");

  await sharp(await transparentPng(512)).toFile(path.join(PUBLIC, "logo-nobg.png"));
  console.log("✅ public/logo-nobg.png");

  await sharp(await transparentPng(512)).toFile(path.join(PUBLIC, "brand-logo.png"));
  console.log("✅ public/brand-logo.png");

  await sharp(await transparentPng(512)).toFile(path.join(PUBLIC, "icon-512.png"));
  console.log("✅ public/icon-512.png");

  await sharp(await transparentPng(192)).toFile(path.join(PUBLIC, "icon-192.png"));
  console.log("✅ public/icon-192.png");

  await sharp(await transparentPng(180)).toFile(path.join(PUBLIC, "apple-icon.png"));
  console.log("✅ public/apple-icon.png");

  await sharp(await transparentPng(512)).toFile(path.join(PUBLIC, "icon-bg.png"));
  console.log("✅ public/icon-bg.png");

  // --- Developer Logo (RapXCode RX) ---
  await sharp(logoDev).resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(path.join(PUBLIC, "developer-logo.png"));
  await sharp(logoDev).resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(path.join(PUBLIC, "rapxcode-logo.png"));
  console.log("✅ public/developer-logo.png & public/rapxcode-logo.png");

  // og-image: dark obsidian bg + logo transparent di tengah
  const ogLogo = await transparentPng(420);
  await sharp({ create: { width: 1200, height: 630, channels: 4, background: { r: 8, g: 8, b: 10, alpha: 255 } } })
    .composite([{ input: ogLogo, gravity: "center" }])
    .png()
    .toFile(path.join(PUBLIC, "og-image.png"));
  console.log("✅ public/og-image.png");

  const iconsDir = path.join(PUBLIC, "icons");
  if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });
  await sharp(await transparentPng(192)).toFile(path.join(iconsDir, "icon-192.png"));
  await sharp(await transparentPng(512)).toFile(path.join(iconsDir, "icon-512.png"));
  console.log("✅ public/icons/icon-192.png & icon-512.png");

  await sharp(await transparentPng(512)).toFile(path.join(ASSETS, "icon.png"));
  await sharp(await transparentPng(512)).toFile(path.join(ASSETS, "splash.png"));
  await sharp(await transparentPng(512)).toFile(path.join(ASSETS, "splash-dark.png"));
  console.log("✅ assets/icon.png, splash.png, splash-dark.png");

  // --- Android APK — WHITE BG (wajib untuk launcher) ---
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
      console.log(`✅ Android ${path.basename(androidDirs[i])} (white bg APK)`);
    }
  }

  console.log("\n🎉 DONE — logo baru transparent untuk semua web/PWA, white bg hanya APK!");
}

run().catch(e => { console.error("❌", e); process.exit(1); });
