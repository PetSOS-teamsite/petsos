#!/bin/bash

# PetSOS Deployment Health Check
# Quick script to verify both sites are running

echo "🏥 PetSOS Deployment Health Check"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Sites to check
PROD_URL="https://petsos.site"
RENDER_URL="https://petsos-app.onrender.com"

# Function to check site health
check_site() {
    local url=$1
    local name=$2
    
    echo "Checking $name..."
    
    # Check /health endpoint
    health_status=$(curl -s -o /dev/null -w "%{http_code}" "$url/health" 2>/dev/null)
    
    if [ "$health_status" = "200" ]; then
        echo -e "  ${GREEN}✅ Health endpoint: OK${NC}"
    else
        echo -e "  ${RED}❌ Health endpoint: FAILED (${health_status})${NC}"
    fi
    
    # Check homepage
    home_status=$(curl -s -o /dev/null -w "%{http_code}" "$url/" 2>/dev/null)
    
    if [ "$home_status" = "200" ]; then
        echo -e "  ${GREEN}✅ Homepage: OK${NC}"
    else
        echo -e "  ${RED}❌ Homepage: FAILED (${home_status})${NC}"
    fi
    
    # Check FAQ page
    faq_status=$(curl -s -o /dev/null -w "%{http_code}" "$url/faq" 2>/dev/null)
    
    if [ "$faq_status" = "200" ]; then
        echo -e "  ${GREEN}✅ FAQ page: OK${NC}"
    else
        echo -e "  ${RED}❌ FAQ page: FAILED (${faq_status})${NC}"
    fi
    
    # Get bundle version
    bundle=$(curl -s "$url/" | grep -o 'src="/assets/index-[^"]*\.js"' | head -1 | sed 's/.*index-\(.*\)\.js.*/\1/')
    
    if [ -n "$bundle" ]; then
        echo -e "  📦 Bundle: ${bundle:0:10}..."
    else
        echo -e "  ${YELLOW}⚠️  Could not detect bundle version${NC}"
    fi
    
    echo ""
}

# Check both sites
check_site "$PROD_URL" "Production (petsos.site)"
check_site "$RENDER_URL" "Render (petsos-app.onrender.com)"

# Compare bundle versions
echo "🔍 Comparing bundle versions..."
prod_bundle=$(curl -s "$PROD_URL/" | grep -o 'src="/assets/index-[^"]*\.js"' | head -1 | sed 's/.*index-\(.*\)\.js.*/\1/')
render_bundle=$(curl -s "$RENDER_URL/" | grep -o 'src="/assets/index-[^"]*\.js"' | head -1 | sed 's/.*index-\(.*\)\.js.*/\1/')

if [ "$prod_bundle" = "$render_bundle" ]; then
    echo -e "${GREEN}✅ Both sites are using the same bundle version${NC}"
    echo "   Bundle: $prod_bundle"
else
    echo -e "${RED}❌ Bundle versions are different!${NC}"
    echo "   Production: $prod_bundle"
    echo "   Render: $render_bundle"
fi

echo ""
echo "=================================="
echo "Health check complete!"
