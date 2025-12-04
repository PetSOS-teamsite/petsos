import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const ICON_SIZES = {
  ios: [
    { size: 20, scale: 1, name: 'AppIcon-20x20@1x.png' },
    { size: 20, scale: 2, name: 'AppIcon-20x20@2x.png' },
    { size: 20, scale: 3, name: 'AppIcon-20x20@3x.png' },
    { size: 29, scale: 1, name: 'AppIcon-29x29@1x.png' },
    { size: 29, scale: 2, name: 'AppIcon-29x29@2x.png' },
    { size: 29, scale: 3, name: 'AppIcon-29x29@3x.png' },
    { size: 40, scale: 1, name: 'AppIcon-40x40@1x.png' },
    { size: 40, scale: 2, name: 'AppIcon-40x40@2x.png' },
    { size: 40, scale: 3, name: 'AppIcon-40x40@3x.png' },
    { size: 60, scale: 2, name: 'AppIcon-60x60@2x.png' },
    { size: 60, scale: 3, name: 'AppIcon-60x60@3x.png' },
    { size: 76, scale: 1, name: 'AppIcon-76x76@1x.png' },
    { size: 76, scale: 2, name: 'AppIcon-76x76@2x.png' },
    { size: 83.5, scale: 2, name: 'AppIcon-83.5x83.5@2x.png' },
    { size: 1024, scale: 1, name: 'AppIcon-1024x1024@1x.png' },
  ],
  android: [
    { size: 48, folder: 'mipmap-mdpi', name: 'ic_launcher.png' },
    { size: 72, folder: 'mipmap-hdpi', name: 'ic_launcher.png' },
    { size: 96, folder: 'mipmap-xhdpi', name: 'ic_launcher.png' },
    { size: 144, folder: 'mipmap-xxhdpi', name: 'ic_launcher.png' },
    { size: 192, folder: 'mipmap-xxxhdpi', name: 'ic_launcher.png' },
    { size: 48, folder: 'mipmap-mdpi', name: 'ic_launcher_round.png' },
    { size: 72, folder: 'mipmap-hdpi', name: 'ic_launcher_round.png' },
    { size: 96, folder: 'mipmap-xhdpi', name: 'ic_launcher_round.png' },
    { size: 144, folder: 'mipmap-xxhdpi', name: 'ic_launcher_round.png' },
    { size: 192, folder: 'mipmap-xxxhdpi', name: 'ic_launcher_round.png' },
    { size: 108, folder: 'mipmap-mdpi', name: 'ic_launcher_foreground.png' },
    { size: 162, folder: 'mipmap-hdpi', name: 'ic_launcher_foreground.png' },
    { size: 216, folder: 'mipmap-xhdpi', name: 'ic_launcher_foreground.png' },
    { size: 324, folder: 'mipmap-xxhdpi', name: 'ic_launcher_foreground.png' },
    { size: 432, folder: 'mipmap-xxxhdpi', name: 'ic_launcher_foreground.png' },
  ],
  pwa: [
    { size: 16, name: 'favicon-16x16.png' },
    { size: 32, name: 'favicon-32x32.png' },
    { size: 48, name: 'favicon-48x48.png' },
    { size: 72, name: 'icon-72.png' },
    { size: 96, name: 'icon-96.png' },
    { size: 128, name: 'icon-128.png' },
    { size: 144, name: 'icon-144.png' },
    { size: 152, name: 'icon-152.png' },
    { size: 180, name: 'apple-touch-icon.png' },
    { size: 192, name: 'icon-192.png' },
    { size: 384, name: 'icon-384.png' },
    { size: 512, name: 'icon-512.png' },
  ],
};

const SPLASH_SIZES = {
  ios: [
    { width: 2732, height: 2732, name: 'Default@2x~universal~anyany.png' },
    { width: 1334, height: 750, name: 'Default-Landscape-736h@3x.png' },
    { width: 2208, height: 1242, name: 'Default-Landscape-1242h@3x.png' },
    { width: 2688, height: 1242, name: 'Default-Landscape-2688h@3x.png' },
    { width: 750, height: 1334, name: 'Default-Portrait-736h@3x.png' },
    { width: 1242, height: 2208, name: 'Default-Portrait-1242h@3x.png' },
    { width: 1242, height: 2688, name: 'Default-Portrait-2688h@3x.png' },
  ],
  android: [
    { width: 480, height: 320, folder: 'drawable-land-mdpi', name: 'splash.png' },
    { width: 800, height: 480, folder: 'drawable-land-hdpi', name: 'splash.png' },
    { width: 1280, height: 720, folder: 'drawable-land-xhdpi', name: 'splash.png' },
    { width: 1600, height: 960, folder: 'drawable-land-xxhdpi', name: 'splash.png' },
    { width: 1920, height: 1280, folder: 'drawable-land-xxxhdpi', name: 'splash.png' },
    { width: 320, height: 480, folder: 'drawable-port-mdpi', name: 'splash.png' },
    { width: 480, height: 800, folder: 'drawable-port-hdpi', name: 'splash.png' },
    { width: 720, height: 1280, folder: 'drawable-port-xhdpi', name: 'splash.png' },
    { width: 960, height: 1600, folder: 'drawable-port-xxhdpi', name: 'splash.png' },
    { width: 1280, height: 1920, folder: 'drawable-port-xxxhdpi', name: 'splash.png' },
  ],
};

async function createBaseIcon(): Promise<Buffer> {
  const svgIcon = `
    <svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#EF4444;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#DC2626;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="1024" height="1024" rx="224" fill="url(#bg)"/>
      <g transform="translate(512, 512)">
        <!-- Paw print icon -->
        <ellipse cx="-120" cy="-180" rx="65" ry="80" fill="white"/>
        <ellipse cx="120" cy="-180" rx="65" ry="80" fill="white"/>
        <ellipse cx="-200" cy="-40" rx="55" ry="70" fill="white"/>
        <ellipse cx="200" cy="-40" rx="55" ry="70" fill="white"/>
        <ellipse cx="0" cy="100" rx="160" ry="140" fill="white"/>
        <!-- Cross/Plus for emergency -->
        <rect x="-30" y="30" width="60" height="140" rx="10" fill="#EF4444"/>
        <rect x="-70" y="70" width="140" height="60" rx="10" fill="#EF4444"/>
      </g>
    </svg>
  `;
  
  return sharp(Buffer.from(svgIcon)).png().toBuffer();
}

async function createSplashScreen(width: number, height: number): Promise<Buffer> {
  const logoSize = Math.min(width, height) * 0.3;
  const svgSplash = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="splashBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#EF4444;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#DC2626;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#splashBg)"/>
      <g transform="translate(${width/2}, ${height/2 - 40})">
        <!-- Paw print icon centered -->
        <ellipse cx="${-logoSize * 0.12}" cy="${-logoSize * 0.18}" rx="${logoSize * 0.065}" ry="${logoSize * 0.08}" fill="white"/>
        <ellipse cx="${logoSize * 0.12}" cy="${-logoSize * 0.18}" rx="${logoSize * 0.065}" ry="${logoSize * 0.08}" fill="white"/>
        <ellipse cx="${-logoSize * 0.2}" cy="${-logoSize * 0.04}" rx="${logoSize * 0.055}" ry="${logoSize * 0.07}" fill="white"/>
        <ellipse cx="${logoSize * 0.2}" cy="${-logoSize * 0.04}" rx="${logoSize * 0.055}" ry="${logoSize * 0.07}" fill="white"/>
        <ellipse cx="0" cy="${logoSize * 0.1}" rx="${logoSize * 0.16}" ry="${logoSize * 0.14}" fill="white"/>
        <!-- Cross -->
        <rect x="${-logoSize * 0.03}" y="${logoSize * 0.03}" width="${logoSize * 0.06}" height="${logoSize * 0.14}" rx="${logoSize * 0.01}" fill="#EF4444"/>
        <rect x="${-logoSize * 0.07}" y="${logoSize * 0.07}" width="${logoSize * 0.14}" height="${logoSize * 0.06}" rx="${logoSize * 0.01}" fill="#EF4444"/>
      </g>
      <text x="${width/2}" y="${height/2 + logoSize * 0.35}" font-family="Arial, sans-serif" font-size="${logoSize * 0.25}" font-weight="bold" fill="white" text-anchor="middle">PetSOS</text>
    </svg>
  `;
  
  return sharp(Buffer.from(svgSplash)).png().toBuffer();
}

async function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function generateIcons() {
  console.log('Generating app icons...');
  
  const baseIcon = await createBaseIcon();
  
  const iosDir = 'resources/ios/AppIcon.appiconset';
  await ensureDir(iosDir);
  
  for (const icon of ICON_SIZES.ios) {
    const finalSize = Math.round(icon.size * icon.scale);
    const outputPath = path.join(iosDir, icon.name);
    await sharp(baseIcon)
      .resize(finalSize, finalSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(outputPath);
    console.log(`  Created: ${outputPath}`);
  }
  
  const contentsJson = {
    images: ICON_SIZES.ios.map(icon => ({
      filename: icon.name,
      idiom: icon.size >= 76 ? 'ipad' : 'iphone',
      scale: `${icon.scale}x`,
      size: `${icon.size}x${icon.size}`,
    })),
    info: { author: 'xcode', version: 1 },
  };
  fs.writeFileSync(path.join(iosDir, 'Contents.json'), JSON.stringify(contentsJson, null, 2));
  
  for (const icon of ICON_SIZES.android) {
    const androidDir = `resources/android/${icon.folder}`;
    await ensureDir(androidDir);
    const outputPath = path.join(androidDir, icon.name);
    await sharp(baseIcon)
      .resize(icon.size, icon.size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(outputPath);
    console.log(`  Created: ${outputPath}`);
  }
  
  const pwaDir = 'client/public';
  for (const icon of ICON_SIZES.pwa) {
    const outputPath = path.join(pwaDir, icon.name);
    await sharp(baseIcon)
      .resize(icon.size, icon.size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(outputPath);
    console.log(`  Created: ${outputPath}`);
  }
  
  console.log('\nGenerating splash screens...');
  
  for (const splash of SPLASH_SIZES.ios) {
    const iosSplashDir = 'resources/ios/splash';
    await ensureDir(iosSplashDir);
    const splashBuffer = await createSplashScreen(splash.width, splash.height);
    const outputPath = path.join(iosSplashDir, splash.name);
    await sharp(splashBuffer).toFile(outputPath);
    console.log(`  Created: ${outputPath}`);
  }
  
  for (const splash of SPLASH_SIZES.android) {
    const androidSplashDir = `resources/android/${splash.folder}`;
    await ensureDir(androidSplashDir);
    const splashBuffer = await createSplashScreen(splash.width, splash.height);
    const outputPath = path.join(androidSplashDir, splash.name);
    await sharp(splashBuffer).toFile(outputPath);
    console.log(`  Created: ${outputPath}`);
  }
  
  console.log('\nAll icons and splash screens generated successfully!');
}

generateIcons().catch(console.error);
