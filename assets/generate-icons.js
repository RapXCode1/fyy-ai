import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const sourceImg = 'C:\\Users\\RHAFI\\.gemini\\antigravity\\brain\\746fb807-af8d-419d-8afd-54f587e42429\\media__1779034345049.jpg';
const resDir = 'D:\\FYY-FINAL\\android\\app\\src\\main\\res';

const sizes = [
  { name: 'mipmap-mdpi', size: 48 },
  { name: 'mipmap-hdpi', size: 72 },
  { name: 'mipmap-xhdpi', size: 96 },
  { name: 'mipmap-xxhdpi', size: 144 },
  { name: 'mipmap-xxxhdpi', size: 192 }
];

async function generate() {
  console.log('Starting icon generation using sharp...');
  
  if (!fs.existsSync(sourceImg)) {
    console.error('Source image does not exist:', sourceImg);
    process.exit(1);
  }

  // Also copy to root assets/icon.png and public icons
  const publicDir = 'D:\\FYY-FINAL\\public';
  const assetsDir = 'D:\\FYY-FINAL\\assets';

  if (fs.existsSync(assetsDir)) {
    await sharp(sourceImg).resize(512, 512).toFile(path.join(assetsDir, 'icon.png'));
    await sharp(sourceImg).resize(512, 512).toFile(path.join(assetsDir, 'splash.png'));
    await sharp(sourceImg).resize(512, 512).toFile(path.join(assetsDir, 'splash-dark.png'));
    console.log('Updated root assets/ folder icons.');
  }

  if (fs.existsSync(publicDir)) {
    await sharp(sourceImg).resize(192, 192).toFile(path.join(publicDir, 'icon-192.png'));
    await sharp(sourceImg).resize(512, 512).toFile(path.join(publicDir, 'icon-512.png'));
    await sharp(sourceImg).resize(180, 180).toFile(path.join(publicDir, 'apple-icon.png'));
    console.log('Updated public/ PWA manifest icons.');
  }

  for (const item of sizes) {
    const targetFolder = path.join(resDir, item.name);
    if (fs.existsSync(targetFolder)) {
      const iconPath = path.join(targetFolder, 'ic_launcher.png');
      const iconRoundPath = path.join(targetFolder, 'ic_launcher_round.png');
      
      // Standard icon
      await sharp(sourceImg)
        .resize(item.size, item.size)
        .toFile(iconPath);
        
      // Round icon
      await sharp(sourceImg)
        .resize(item.size, item.size)
        .toFile(iconRoundPath);

      console.log(`Generated launcher icons for ${item.name} (${item.size}x${item.size})`);
    } else {
      console.warn(`Target folder does not exist: ${targetFolder}`);
    }
  }

  console.log('Icon generation completed successfully!');
}

generate().catch(err => {
  console.error('Error generating icons:', err);
});
