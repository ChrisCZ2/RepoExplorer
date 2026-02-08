# Contributing to RepoExplorer

Thank you for your interest in contributing to RepoExplorer! This document provides guidelines for contributing to the project.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/yourusername/repo-explorer.git
   cd repo-explorer
   ```
3. **Install dependencies**:
   ```bash
   pnpm install
   ```
4. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Building the Plugin

```bash
pnpm build
```

### Development Mode

```bash
pnpm watch
```

This will watch for changes and automatically rebuild the plugin.

### Testing Your Changes

1. Build the plugin with `pnpm build`
2. In Caido, go to Settings → Plugins
3. Install the plugin from `dist/plugin_package.zip`
4. Test your changes in Caido

### Code Quality

Before submitting a pull request, ensure your code passes all checks:

```bash
# Run linter
pnpm lint

# Check for unused code
pnpm knip

# Type checking
pnpm typecheck
```

## Code Style Guidelines

### TypeScript
- Use TypeScript for all files
- Only use `type`, not `interface`
- Do not use `any` type
- Use `undefined` over `null`
- Don't cast to `any`
- Don't unnecessarily add `try`/`catch`

### Naming Conventions
- **Folders**: camelCase (`intercept`, `replay`, `httpHistory`)
- **Component folders**: PascalCase (`PassiveFormCreate`, `PassiveTable`)
- **Files**: camelCase (`useForm.ts`, `assistant.graphql`)

### Code Organization
- Colocate code that changes together
- Declare variables close to their usage
- Avoid massive template blocks; compose smaller components
- Only create abstractions when actually needed
- Prefer clear function/variable names over inline comments

### Vue/Frontend
- Use Vue 3 Composition API
- Use `computed` for derived state instead of reactive variables when possible
- Use `ref` for reactive state
- Avoid helper functions when a simple inline expression would suffice

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
└── package.json
```

## Submitting Changes

1. **Commit your changes** with clear, descriptive commit messages:
   ```bash
   git commit -m "Add feature: description of feature"
   ```

2. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Create a Pull Request** on GitHub:
   - Provide a clear description of the changes
   - Reference any related issues
   - Include screenshots if UI changes are involved

## Pull Request Guidelines

- Keep PRs focused on a single feature or bug fix
- Update documentation if needed
- Ensure all linter checks pass
- Test your changes thoroughly in Caido
- Add appropriate comments to complex code sections

## Feature Requests and Bug Reports

When opening an issue:

### For Bug Reports
- Describe the bug clearly
- Include steps to reproduce
- Provide expected vs actual behavior
- Include Caido version and plugin version
- Add screenshots if applicable

### For Feature Requests
- Clearly describe the feature
- Explain the use case and benefits
- Provide examples if possible
- Discuss potential implementation approaches

## Questions?

If you have questions about contributing, feel free to:
- Open an issue with the `question` label
- Reach out to the maintainers

## License

By contributing to RepoExplorer, you agree that your contributions will be licensed under the MIT License.

## Thank You!

Your contributions help make RepoExplorer better for everyone in the security community. We appreciate your time and effort!
