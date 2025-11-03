/**
 * Deployment Monitoring Script
 * Checks if petsos.site and petsos-app.onrender.com are in sync
 * Run with: npx tsx scripts/monitor-deployments.ts
 */

interface DeploymentInfo {
  url: string;
  bundleHash: string | null;
  cssHash: string | null;
  pages: {
    [key: string]: {
      status: number;
      accessible: boolean;
      error?: string;
    };
  };
  timestamp: string;
}

const SITES = {
  production: 'https://petsos.site',
  render: 'https://petsos-app.onrender.com',
};

const PAGES_TO_CHECK = [
  '/',
  '/faq',
  '/resources',
  '/districts',
  '/clinics',
  '/emergency',
  '/login',
  '/health', // API health check
];

async function fetchWithTimeout(url: string, timeout = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function extractBundleInfo(html: string): Promise<{ bundleHash: string | null; cssHash: string | null }> {
  const jsMatch = html.match(/src="\/assets\/index-([^"]+)\.js/);
  const cssMatch = html.match(/href="\/assets\/index-([^"]+)\.css/);
  
  return {
    bundleHash: jsMatch ? jsMatch[1] : null,
    cssHash: cssMatch ? cssMatch[1] : null,
  };
}

async function checkDeployment(baseUrl: string): Promise<DeploymentInfo> {
  console.log(`\n🔍 Checking ${baseUrl}...`);
  
  const info: DeploymentInfo = {
    url: baseUrl,
    bundleHash: null,
    cssHash: null,
    pages: {},
    timestamp: new Date().toISOString(),
  };

  // Check homepage to get bundle info
  try {
    const homeResponse = await fetchWithTimeout(baseUrl);
    const homeHtml = await homeResponse.text();
    const bundleInfo = await extractBundleInfo(homeHtml);
    
    info.bundleHash = bundleInfo.bundleHash;
    info.cssHash = bundleInfo.cssHash;
    
    console.log(`  📦 Bundle: ${info.bundleHash || 'NOT FOUND'}`);
    console.log(`  🎨 CSS: ${info.cssHash || 'NOT FOUND'}`);
  } catch (error) {
    console.error(`  ❌ Failed to fetch homepage: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Check all pages
  for (const page of PAGES_TO_CHECK) {
    const url = `${baseUrl}${page}`;
    try {
      const response = await fetchWithTimeout(url);
      const status = response.status;
      const accessible = status >= 200 && status < 400;
      
      info.pages[page] = {
        status,
        accessible,
      };
      
      const statusEmoji = accessible ? '✅' : '❌';
      console.log(`  ${statusEmoji} ${page}: ${status}`);
    } catch (error) {
      info.pages[page] = {
        status: 0,
        accessible: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      console.log(`  ❌ ${page}: FAILED (${error instanceof Error ? error.message : 'Unknown error'})`);
    }
  }

  return info;
}

function compareDeployments(prod: DeploymentInfo, render: DeploymentInfo): {
  inSync: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Compare bundle versions
  if (prod.bundleHash !== render.bundleHash) {
    issues.push(`Bundle mismatch: Production (${prod.bundleHash}) vs Render (${render.bundleHash})`);
  }

  if (prod.cssHash !== render.cssHash) {
    issues.push(`CSS mismatch: Production (${prod.cssHash}) vs Render (${render.cssHash})`);
  }

  // Compare page accessibility
  for (const page of PAGES_TO_CHECK) {
    const prodPage = prod.pages[page];
    const renderPage = render.pages[page];

    if (!prodPage || !renderPage) continue;

    if (prodPage.accessible !== renderPage.accessible) {
      issues.push(
        `Page ${page}: Production (${prodPage.status}) vs Render (${renderPage.status})`
      );
    }

    // Check if page returns 404 on either site
    if (prodPage.status === 404 || renderPage.status === 404) {
      issues.push(`Page ${page} returns 404 on ${prodPage.status === 404 ? 'Production' : 'Render'}`);
    }
  }

  return {
    inSync: issues.length === 0,
    issues,
  };
}

async function main() {
  console.log('🚀 PetSOS Deployment Monitor');
  console.log('================================\n');
  console.log(`⏰ Timestamp: ${new Date().toLocaleString()}\n`);

  // Check both deployments
  const [prodInfo, renderInfo] = await Promise.all([
    checkDeployment(SITES.production),
    checkDeployment(SITES.render),
  ]);

  // Compare results
  console.log('\n📊 Comparison Results');
  console.log('================================\n');

  const comparison = compareDeployments(prodInfo, renderInfo);

  if (comparison.inSync) {
    console.log('✅ Both deployments are IN SYNC!');
    console.log(`   Bundle: ${prodInfo.bundleHash}`);
    console.log(`   CSS: ${prodInfo.cssHash}`);
    console.log(`   All ${PAGES_TO_CHECK.length} pages accessible on both sites`);
  } else {
    console.log('⚠️  DEPLOYMENTS OUT OF SYNC!\n');
    console.log('Issues found:');
    comparison.issues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue}`);
    });
  }

  // Summary
  console.log('\n📈 Summary');
  console.log('================================');
  console.log(`Production (petsos.site):`);
  console.log(`  - Bundle: ${prodInfo.bundleHash || 'N/A'}`);
  console.log(`  - Accessible pages: ${Object.values(prodInfo.pages).filter(p => p.accessible).length}/${PAGES_TO_CHECK.length}`);
  
  console.log(`\nRender (petsos-app.onrender.com):`);
  console.log(`  - Bundle: ${renderInfo.bundleHash || 'N/A'}`);
  console.log(`  - Accessible pages: ${Object.values(renderInfo.pages).filter(p => p.accessible).length}/${PAGES_TO_CHECK.length}`);

  // Exit with appropriate code
  process.exit(comparison.inSync ? 0 : 1);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
