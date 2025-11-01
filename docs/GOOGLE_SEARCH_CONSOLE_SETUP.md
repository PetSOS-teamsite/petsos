# Google Search Console Setup Guide

This guide will help you submit your PetSOS sitemap to Google Search Console to ensure Google indexes all your new marketing pages.

## Prerequisites
- Access to Google Search Console (https://search.google.com/search-console)
- Verified ownership of petsos.site domain

## Step 1: Access Google Search Console

1. Go to https://search.google.com/search-console
2. Sign in with your Google account
3. Select the **petsos.site** property from the property dropdown

## Step 2: Submit the Sitemap

### Manual Submission (Required)

1. In the left sidebar, click **Sitemaps**
2. Under "Add a new sitemap", enter: `sitemap.xml`
3. Click **Submit**
4. You should see a success message

### Alternative: Using Search Console API (Optional)

If you want to automate sitemap management in the future, you can use the [Google Search Console API](https://developers.google.com/webmaster-tools/v1/sitemaps):

**Note**: The old sitemap ping endpoint (`https://www.google.com/ping?sitemap=...`) has been deprecated by Google and now returns a 404 error. For automation, you must use the official Search Console API with proper OAuth credentials.

Example using the Search Console API:
1. Enable the Search Console API in Google Cloud Console
2. Create OAuth 2.0 credentials
3. Use the API to submit sitemaps programmatically

For most users, **manual submission through the Search Console web interface is recommended** as it's simple and reliable.

## Step 3: Verify Sitemap Processing

1. After submission, it may take a few hours to a few days for Google to process your sitemap
2. Check the **Sitemaps** section in Search Console
3. You should see:
   - **Status**: Success
   - **Discovered URLs**: 15 (all your pages)
   - **Last read**: Recent date

## Step 4: Monitor Indexing Progress

1. Go to **Pages** in the left sidebar (under "Indexing")
2. You should see the number of indexed pages increasing over time
3. New pages typically appear in search results within 1-7 days

## What's in Your Sitemap?

Your sitemap.xml includes **15 pages** with the following priorities:

### High Priority (1.0)
- Homepage (/)
- Emergency Request (/emergency)

### Important Pages (0.8-0.9)
- Clinics Directory (/clinics) - Priority 0.9
- Districts Index (/districts) - Priority 0.8
- 6 District Pages:
  - Central (/district/central)
  - Causeway Bay (/district/causeway-bay)
  - Wan Chai (/district/wan-chai)
  - Tsim Sha Tsui (/district/tsim-sha-tsui)
  - Mong Kok (/district/mong-kok)
  - Sha Tin (/district/sha-tin)

### Content Pages (0.7)
- Resources / Emergency Care Guide (/resources)
- FAQ (/faq)

### Other Pages (0.4-0.6)
- Login/Signup (/login)
- Privacy Policy (/privacy-policy)
- Terms of Service (/terms-of-service)

## Troubleshooting

### Sitemap Not Found
- Verify the sitemap is accessible at: https://petsos.site/sitemap.xml
- Check your robots.txt includes: `Sitemap: https://petsos.site/sitemap.xml`

### Pages Not Indexed
- Check the "Coverage" report in Search Console for any errors
- Ensure pages have proper meta tags and structured data
- Wait 7-14 days for initial indexing (new pages take time)

### Duplicate Content
- Each page has a unique canonical URL to prevent duplicate content issues
- All pages are bilingual (EN/ZH-HK) but use language attributes, not separate URLs

## Next Steps

1. **Set up URL Inspection**: Use the URL Inspection tool to check how Google sees individual pages
2. **Monitor Performance**: Track which pages get the most clicks and impressions
3. **Rich Results**: Check the "Enhancements" section for rich result eligibility (FAQ, LocalBusiness, etc.)
4. **Core Web Vitals**: Monitor page experience metrics in the "Experience" section

## Automated Sitemap Updates

**Note**: Google has deprecated the sitemap ping endpoint. To notify Google of sitemap updates:

1. **Recommended**: Manually resubmit in Search Console after major changes (new pages, structure changes)
2. **For Automation**: Set up the [Search Console API](https://developers.google.com/webmaster-tools/v1/sitemaps/submit) with OAuth credentials
3. **Robots.txt**: Ensure your robots.txt references the sitemap (already configured with cache-busting)

Google typically recrawls sitemaps every few days automatically, so manual resubmission is only needed for urgent updates.

## Additional Resources

- [Google Search Console Help](https://support.google.com/webmasters)
- [Sitemap Best Practices](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview)
- [Structured Data Testing Tool](https://search.google.com/test/rich-results)

---

**Last Updated**: November 1, 2025
**Sitemap Version**: sitemap.xml (15 URLs)
**Cache Buster**: v=20251101
