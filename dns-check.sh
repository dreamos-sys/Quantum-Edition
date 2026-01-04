#!/bin/bash
DOMAIN="dreamos.sif.sch.id"
echo "🔍 Checking DNS for $DOMAIN..."
if dig $DOMAIN +short | grep -q .; then
  echo "✅ DNS configured properly"
  exit 0
else
  echo "❌ DNS not configured"
  echo "🛠️  Fix: Add CNAME record for $DOMAIN"
  exit 1
fi
