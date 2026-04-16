#!/usr/bin/env bash
# Deploy to GitHub Pages
# Usage: bash deploy.sh
# Prerequisites: git remote 'origin' pointing to your GitHub repo

set -e

cd "$(dirname "$0")/app"

echo "Building..."
npm run build

echo "Deploying to gh-pages..."
cd dist

git init
git checkout -b gh-pages
git add -A
git commit -m "deploy"

# Push to the gh-pages branch of origin
git push -f "$(cd ../.. && git remote get-url origin)" gh-pages

cd ..
rm -rf dist/.git

echo "Deployed! Enable GitHub Pages in repo settings (Source: gh-pages branch)"
