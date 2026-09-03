#!/usr/bin/env bash
# Deploy to GitHub Pages
# Usage: bash deploy.sh
# Prerequisites: git remote 'origin' pointing to your GitHub repo

set -e

cd "$(dirname "$0")/app"

echo "Building..."
npm run build

echo "Deploying to gh-pages..."
# Reuse the main repo's author identity inside the throwaway dist repo
GIT_NAME="$(git config user.name || true)"
GIT_EMAIL="$(git config user.email || true)"

cd dist
rm -rf .git

git init
git checkout -b gh-pages
git add -A
git -c user.name="${GIT_NAME:-deploy}" -c user.email="${GIT_EMAIL:-deploy@localhost}" commit -m "deploy"

# Push to the gh-pages branch of origin
git push -f "$(cd ../.. && git remote get-url origin)" gh-pages

cd ..
rm -rf dist/.git

echo "Deployed! Enable GitHub Pages in repo settings (Source: gh-pages branch)"
