# Update Changelog Command

Generate and maintain project changelog.

## Usage

To update changelog, just type:
```
/update-changelog
```

Or with options:
```
/update-changelog --no-version
/update-changelog --create-pr
```

## Instructions

Setup and maintain changelog following the instructions below. If the changelog does not exist, create it. If it exists, update it including all notable changes since the changelog was last updated.

Run `npm run format` to format the changelog after updating it.

When `--no-version` is specified, do not add a version entry to the changelog, otherwise add a version entry to the changelog using today's date.

When `--create-pr` is specified, create a pull request with the changelog changes.

1. **Changelog Format (Keep a Changelog)**
   ```markdown
   # Changelog
   
   All notable changes to this project will be documented in this file.
   
   The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
   and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
   
   ## [Unreleased]
   ### Added
   - New features
   
   ### Changed
   - Changes in existing functionality
   
   ### Deprecated
   - Soon-to-be removed features
   
   ### Removed
   - Removed features
   
   ### Fixed
   - Bug fixes
   
   ### Security
   - Security improvements
   ```

2. **Version Entries**
   ```markdown
   ## [1.2.3] - 2024-01-15
   ### Added
   - User authentication system
   - Dark mode toggle
   - Export functionality for reports
   
   ### Fixed
   - Memory leak in background tasks
   - Timezone handling issues
   ```

3. **Automation Tools**
   ```bash
   # Generate changelog from git commits
   npm install -D conventional-changelog-cli
   npx conventional-changelog -p angular -i CHANGELOG.md -s
   
   # Auto-changelog
   npm install -D auto-changelog
   npx auto-changelog
   ```

4. **Commit Convention**
   ```bash
   # Conventional commits for auto-generation
   feat: add user authentication
   fix: resolve memory leak in tasks
   docs: update API documentation
   style: format code with prettier
   refactor: reorganize user service
   test: add unit tests for auth
   chore: update dependencies
   ```

Remember to keep entries clear, categorized, and focused on user-facing changes.