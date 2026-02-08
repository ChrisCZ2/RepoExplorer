# Publishing Guide for RepoExplorer

This guide will walk you through publishing your plugin to GitHub and submitting it to the Caido Plugin Store.

## Prerequisites

- [ ] Git installed on your system
- [ ] GitHub account created
- [ ] Plugin built and tested locally
- [ ] All files committed and ready

## Part 1: Publishing to GitHub

### Step 1: Create a GitHub Repository

1. Go to [GitHub](https://github.com) and log in
2. Click the "+" icon in the top right and select "New repository"
3. Fill in the details:
   - **Repository name**: `repo-explorer` (or your preferred name)
   - **Description**: "Browse and explore content from GitHub repositories like PayloadsAllTheThings"
   - **Visibility**: Public (recommended for plugin stores)
   - **Do NOT** initialize with README (we already have one)
4. Click "Create repository"

### Step 2: Update Repository URL in package.json

Before pushing, update the repository URL in `package.json`:

```json
"repository": {
  "type": "git",
  "url": "https://github.com/YOUR_USERNAME/repo-explorer.git"
},
```

Replace `YOUR_USERNAME` with your actual GitHub username.

### Step 3: Initialize Git and Push

Open your terminal in the RepoExplorer directory and run:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit files
git commit -m "Initial release v1.0.0"

# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/repo-explorer.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 4: Create a Release

1. Go to your repository on GitHub
2. Click on "Releases" (right sidebar)
3. Click "Create a new release"
4. Fill in the release details:
   - **Tag**: `v1.0.0`
   - **Release title**: `RepoExplorer v1.0.0`
   - **Description**: Copy content from CHANGELOG.md or write a summary
5. **Upload the plugin package**: Drag and drop `dist/plugin_package.zip` to the release assets
6. Click "Publish release"

Your plugin is now on GitHub! 🎉

## Part 2: Submitting to Caido Plugin Store

### Prerequisites for Caido Plugin Store

1. **manifest.json** - Already generated in `dist/plugin_package/manifest.json`
2. **Plugin package** - Already built at `dist/plugin_package.zip`
3. **GitHub repository** - Completed in Part 1
4. **README with good documentation** - ✅ Done
5. **Open source license** - ✅ MIT License included

### Submission Process

The Caido Plugin Store submission process typically involves:

1. **Visit the Caido Plugin Store Submission Page**
   - Go to [Caido's official website](https://caido.io)
   - Look for "Plugin Store" or "Submit Plugin" section
   - Alternatively, check Caido's Discord server for submission instructions

2. **Prepare Your Submission Information**

   You'll likely need to provide:
   
   - **Plugin Name**: RepoExplorer
   - **Plugin ID**: `repo-explorer`
   - **Version**: 1.0.0
   - **Description**: Browse and explore content from GitHub repositories like PayloadsAllTheThings
   - **Author**: Chriscz
   - **Email**: chrisczv@proton.me
   - **GitHub Repository URL**: https://github.com/YOUR_USERNAME/repo-explorer
   - **Release URL**: https://github.com/YOUR_USERNAME/repo-explorer/releases/tag/v1.0.0
   - **Plugin Package**: Upload `dist/plugin_package.zip`
   - **Category**: Security Tools / Payloads / Utilities
   - **Tags**: security, payloads, github, pentest, repository-browser
   - **Screenshots**: Consider adding screenshots of your plugin UI

3. **Create Screenshots** (Recommended)

   Take screenshots showing:
   - Main repository browsing interface
   - File viewing with syntax highlighting
   - Favorites/Collections management
   - Settings panel
   - Search functionality

4. **Check Caido's Official Channels**

   - **Documentation**: https://docs.caido.io (check for plugin submission guidelines)
   - **Discord**: Join Caido's Discord server for:
     - Plugin submission announcements
     - Help with submission process
     - Community feedback
   - **GitHub**: Check if there's a plugin registry repository

5. **Alternative: Community Distribution**

   If there's no formal plugin store yet, you can:
   - Share on Caido's Discord server
   - Post on security forums
   - Share on Twitter/X with #Caido hashtag
   - Create a blog post or video tutorial

### manifest.json Overview

Your plugin's `manifest.json` (auto-generated) contains:

```json
{
  "id": "repo-explorer",
  "name": "RepoExplorer",
  "version": "1.0.0",
  "description": "Browse and explore content from GitHub repositories like PayloadsAllTheThings",
  "author": {
    "name": "Chriscz",
    "email": "chrisczv@proton.me",
    "url": "https://chriscz.com/"
  }
}
```

## Part 3: Post-Publication

### Update URLs in Documentation

After publishing to GitHub, update these URLs in your README:

1. Repository clone URL
2. Issues page link
3. Releases page link
4. Any screenshots or badges

### Create Screenshots for Plugin Store

Consider adding these to your GitHub repository in a `screenshots` folder:

```bash
mkdir screenshots
# Add your screenshots here
git add screenshots/
git commit -m "Add screenshots for plugin store"
git push
```

### Promote Your Plugin

1. **Caido Discord**: Share in the appropriate channel
2. **Twitter/X**: Tweet with #Caido, #InfoSec, #BugBounty tags
3. **Reddit**: Post in r/netsec, r/bugbounty (follow subreddit rules)
4. **Blog Post**: Write about the plugin's features and use cases

### Versioning for Future Updates

When releasing updates:

1. Update version in `caido.config.ts`
2. Update CHANGELOG.md with changes
3. Commit changes: `git commit -m "Release v1.1.0"`
4. Create tag: `git tag v1.1.0`
5. Push: `git push && git push --tags`
6. Create new GitHub release with updated zip
7. Notify plugin store of update (if applicable)

## Part 4: Maintenance

### Responding to Issues

- Monitor GitHub Issues
- Respond promptly to bug reports
- Label issues appropriately (bug, enhancement, question)
- Close resolved issues with explanation

### Accepting Contributions

- Review pull requests thoroughly
- Test changes before merging
- Thank contributors
- Update CHANGELOG.md and CONTRIBUTING.md as needed

## Checklist Before Publishing

- [ ] All features tested in Caido
- [ ] No linter errors (`pnpm lint`)
- [ ] README.md is complete and accurate
- [ ] LICENSE file has correct year and author
- [ ] package.json has correct repository URL
- [ ] CHANGELOG.md is up to date
- [ ] Screenshots prepared (optional but recommended)
- [ ] GitHub repository created
- [ ] First release created on GitHub with plugin_package.zip
- [ ] Repository URL updated in all documentation

## Need Help?

- **Caido Documentation**: https://docs.caido.io
- **Caido Discord**: Check their website for Discord invite
- **GitHub Issues**: For questions about the plugin itself

## Congratulations! 🎉

You're ready to share your plugin with the Caido community!

Remember to:
- Keep your plugin updated
- Listen to user feedback
- Fix bugs promptly
- Consider new feature requests

Good luck with your plugin! 🚀
