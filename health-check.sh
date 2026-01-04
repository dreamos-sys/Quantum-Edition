#!/bin/bash
URL="https://dreamos.sif.sch.id"

echo "🔍 Running post-deploy health checks..."

# Check main page
if curl -sSf $URL > /dev/null; then
  echo "✅ Main page accessible"
else
  echo "❌ Main page down"
  exit 1
fi

# Check service worker
if curl -sSf $URL/sw-quantum.js > /dev/null; then
  echo "✅ Service Worker available"
else
  echo "❌ Service Worker missing"
  exit 1
fi

# Check SSL certificate
if openssl s_client -connect dreamos.sif.sch.id:443 -servername dreamos.sif.sch.id 2>/dev/null | grep "Verify return code: 0"; then
  echo "✅ SSL certificate valid"
else
  echo "❌ SSL certificate invalid"
  exit 1
fi

echo "🎉 All health checks passed!"
