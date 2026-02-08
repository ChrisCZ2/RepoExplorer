# RepoExplorer - Caido Plugin

A powerful Caido plugin that allows you to browse and explore content from GitHub repositories like [PayloadsAllTheThings](https://github.com/swisskyrepo/PayloadsAllTheThings) and any other public GitHub repository directly within Caido.


## Youtube video going over features:

## Features

### Core Functionality
- ** Browse Categories**: Navigate through all directory categories from any GitHub repository
- ** Repository Search**: Search and discover GitHub repositories directly in the plugin
- ** File Browser**: Browse and view files within each category
- ** Copy to Clipboard**: Easily copy file contents for use in your security testing
- ** Export Files**: Export individual files as JSON or TXT
- ** Multi-Repository Support**: Add, remove, and switch between multiple repositories

### Organization & Management
- ** Favorites**: Mark files as favorites for quick access
- ** Collections**: Create custom collections to organize related files
- ** Tags**: Create custom tags with colors to categorize and filter files
- ** Bulk Actions**: Select multiple files and perform batch operations (favorite, tag, add to collections)
- ** History**: Track your recently viewed files with timestamps
- ** Real-Time Logs**: Monitor all plugin actions with detailed logging system



## Installation

### From Caido Plugin Store (Recommended)
1. In Caido, go to Settings → Plugins
2. Search for "RepoExplorer"
3. Click Install

### Manual Installation
1. Download the latest release from GitHub
2. In Caido, go to Settings → Plugins
3. Click "Install from file" and select the `.zip` file

### Build from Source
```bash
# Clone the repository
git clone https://github.com/yourusername/repo-explorer.git
cd repo-explorer

# Install dependencies
pnpm install

# Build the plugin
pnpm build

# The plugin package will be in dist/plugin_package.zip
```

## Usage

### Basic Navigation
1. Navigate to "RepoExplorer" in the Caido sidebar
2. Browse payload categories by clicking on any category card
3. Use the search bar to filter categories or files
4. Click on files within a category to view their content
5. Use the copy button to copy file contents to clipboard

### Repository Management
1. Click the gear icon or repository name in the header
2. Add new repositories by pasting a GitHub URL
3. Remove repositories you no longer need
4. Set a default repository to load on startup
5. Search for GitHub repositories using the "Search GitHub Repos" button

### Organization Features

#### Favorites
- Click the star icon on any file to add it to your favorites
- Access favorites from the main menu
- Bulk favorite multiple files at once

#### Collections
- Create named collections (e.g., "SQL Injection", "XSS Payloads")
- Add files to collections with descriptions
- Manage all your collections from the Collections view
- Bulk add files to collections

#### Tags
- Create custom tags with colors in Settings
- Tag files for easy filtering and organization
- Filter files by tags in any view
- Apply tags to multiple files at once

#### Bulk Actions
1. Click "Select Multiple" in any file list
2. Check the boxes next to files you want to select
3. Use the toolbar to perform bulk actions:
   - Add to Favorites
   - Add to Collection
   - Apply Tags

#### History & Logs
- **History**: View your recently accessed files with timestamps
- **Logs**: Monitor all plugin actions in real-time with different log levels (info, success, warning, error)

## Default Repository

By default, the plugin loads [PayloadsAllTheThings](https://github.com/swisskyrepo/PayloadsAllTheThings) - a comprehensive list of payloads and bypasses for Web Application Security and Pentest/CTF.

## Example Payload Categories

When using PayloadsAllTheThings, you'll find categories including:
- SQL Injection
- XSS (Cross-Site Scripting)
- Command Injection
- SSRF (Server-Side Request Forgery)
- XXE (XML External Entity)
- SSTI (Server-Side Template Injection)
- Directory Traversal
- Path Traversal
- LDAP Injection
- NoSQL Injection
- And many more...

## GitHub API Limitations

- The plugin uses the public GitHub API (no authentication required)
- Rate limits apply: 60 requests/hour for unauthenticated requests
- All data is fetched in real-time from GitHub's API
- Content is displayed as-is from the repository

## Development

```bash
# Install dependencies
pnpm install

# Build the plugin
pnpm build

# Watch for changes during development
pnpm watch

# Run linter
pnpm lint

# Remove unused code
pnpm knip
```

## Project Structure

```
repo-explorer/
├── packages/
│   ├── backend/         # Backend plugin code
│   │   └── src/
│   │       └── index.ts # Backend API endpoints
│   └── frontend/        # Frontend plugin code
│       └── src/
│           ├── composables/
│           │   └── useRepoExplorer.ts  # Main logic
│           ├── views/
│           │   └── App.vue             # Main UI component
│           ├── types.ts                # TypeScript types
│           └── index.ts                # Plugin entry point
├── caido.config.ts      # Plugin configuration
├── package.json
└── README.md
```

## Technology Stack

- **Frontend**: Vue.js 3 with Composition API
- **UI Components**: PrimeVue
- **Styling**: Tailwind CSS
- **Backend**: Caido Backend SDK
- **Storage**: Browser LocalStorage

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Credits

Payloads and content belong to their respective authors from the repositories you browse.

Special thanks to the [SwissKyRepo](https://github.com/swisskyrepo) team for maintaining [PayloadsAllTheThings](https://github.com/swisskyrepo/PayloadsAllTheThings).

## License

MIT License - see [LICENSE](LICENSE) file for details

## Support

If you encounter any issues or have feature requests, please open an issue on GitHub.

## Changelog

### Version 1.0.0
- Initial release
- Repository browsing and file viewing
- Multi-repository support
- Favorites, Collections, and Tags
- Bulk selection and actions
- History tracking
- Real-time logging system
- GitHub repository search
- Export functionality
