import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const outputPath = join(__dirname, '../client/public/og-image.png');

// Create OG image with PetSOS branding (1200x630 - optimal for social sharing)
// Using English-only text to avoid Chinese font rendering issues in SVG
async function generateOGImage() {
  try {
    const width = 1200;
    const height = 630;
    
    // Create SVG with PetSOS branding (English only for reliable rendering)
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <!-- Red gradient background -->
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#EF4444;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#DC2626;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#grad)"/>
        
        <!-- Emergency cross icon + paw print composite (top center) -->
        <g transform="translate(540, 60)">
          <!-- Emergency cross -->
          <rect x="50" y="20" width="16" height="70" fill="white" rx="8"/>
          <rect x="25" y="45" width="66" height="16" fill="white" rx="8"/>
          <!-- Paw print accent -->
          <g transform="translate(90, 20)" fill="white" opacity="0.7">
            <circle cx="15" cy="12" r="8"/>
            <circle cx="5" cy="18" r="6"/>
            <circle cx="15" cy="22" r="6"/>
            <circle cx="25" cy="18" r="6"/>
            <ellipse cx="15" cy="32" rx="9" ry="11"/>
          </g>
        </g>
        
        <!-- Main Title - PetSOS -->
        <text x="600" y="220" font-family="Arial, Helvetica, sans-serif" font-size="110" font-weight="bold" fill="white" text-anchor="middle" letter-spacing="-2">
          PetSOS
        </text>
        
        <!-- Tagline -->
        <text x="600" y="290" font-family="Arial, Helvetica, sans-serif" font-size="42" fill="white" text-anchor="middle" opacity="0.95" font-weight="600">
          Emergency Pet Care Hong Kong
        </text>
        
        <!-- Subtitle -->
        <text x="600" y="345" font-family="Arial, Helvetica, sans-serif" font-size="32" fill="white" text-anchor="middle" opacity="0.9">
          24/7 Veterinary Clinic Connection
        </text>
        
        <!-- Divider line -->
        <line x1="300" y1="385" x2="900" y2="385" stroke="white" stroke-width="2" opacity="0.3"/>
        
        <!-- Key Features -->
        <g transform="translate(0, 440)">
          <!-- Feature 1: GPS -->
          <g transform="translate(240, 0)">
            <circle cx="20" cy="20" r="22" fill="white" opacity="0.25"/>
            <text x="20" y="28" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="bold" fill="white" text-anchor="middle">
              GPS
            </text>
            <text x="20" y="75" font-family="Arial, Helvetica, sans-serif" font-size="20" fill="white" text-anchor="middle">
              Location
            </text>
          </g>
          
          <!-- Feature 2: WhatsApp -->
          <g transform="translate(495, 0)">
            <circle cx="20" cy="20" r="22" fill="white" opacity="0.25"/>
            <text x="20" y="28" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle">
              WA
            </text>
            <text x="20" y="75" font-family="Arial, Helvetica, sans-serif" font-size="20" fill="white" text-anchor="middle">
              Instant Alert
            </text>
          </g>
          
          <!-- Feature 3: 24/7 -->
          <g transform="translate(750, 0)">
            <circle cx="20" cy="20" r="22" fill="white" opacity="0.25"/>
            <text x="20" y="28" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle">
              24/7
            </text>
            <text x="20" y="75" font-family="Arial, Helvetica, sans-serif" font-size="20" fill="white" text-anchor="middle">
              Available
            </text>
          </g>
        </g>
        
        <!-- Bottom domain -->
        <text x="600" y="585" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="500" fill="white" text-anchor="middle" opacity="0.85">
          petsos.site
        </text>
      </svg>
    `;

    await sharp(Buffer.from(svg))
      .png()
      .toFile(outputPath);

    console.log('✅ Generated og-image.png (1200x630) for social sharing');
    console.log('   Using English-only text for reliable cross-platform rendering');
  } catch (error) {
    console.error('❌ Failed to generate OG image:', error.message);
  }
}

generateOGImage().catch(console.error);
