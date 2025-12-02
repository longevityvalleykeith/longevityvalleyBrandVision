#!/bin/bash

# =============================================================================
# Git Push Script for Longevity Valley Brand Vision
# =============================================================================

set -e  # Exit on error

echo "🚀 Longevity Valley - Git Push Helper"
echo "====================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in project root directory"
    echo "Please run this script from longevityvalleyBrandVision/"
    exit 1
fi

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
    echo "✅ Git initialized"
fi

# Check if remote exists
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "🔗 Adding remote origin..."
    git remote add origin https://github.com/longevityvalleykeith/longevityvalleyBrandVision.git
    echo "✅ Remote added"
else
    echo "✅ Remote already configured"
fi

# Check git status
echo ""
echo "📊 Git Status:"
git status --short

# Prompt for confirmation
echo ""
read -p "❓ Do you want to commit and push these changes? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "⏸️  Push cancelled"
    exit 0
fi

# Get commit message
echo ""
read -p "📝 Enter commit message (or press Enter for default): " COMMIT_MSG

if [ -z "$COMMIT_MSG" ]; then
    COMMIT_MSG="feat: Final_Dev_SpecV2 - Complete Supabase codebase with headless tests"
fi

# Stage all files
echo ""
echo "📦 Staging files..."
git add .
echo "✅ Files staged"

# Create commit
echo ""
echo "💾 Creating commit..."
git commit -m "$COMMIT_MSG"
echo "✅ Commit created"

# Get current branch
BRANCH=$(git branch --show-current)

if [ -z "$BRANCH" ]; then
    BRANCH="main"
    echo "🌿 Creating main branch..."
    git branch -M main
fi

# Push to remote
echo ""
echo "🚀 Pushing to GitHub ($BRANCH)..."
git push -u origin $BRANCH

echo ""
echo "✅ Successfully pushed to GitHub!"
echo "🌐 Repository: https://github.com/longevityvalleykeith/longevityvalleyBrandVision.git"
echo ""
echo "📋 Next Steps:"
echo "  1. Verify files on GitHub"
echo "  2. Run Manus headless tests"
echo "  3. Review pull requests from Manu"
echo ""
