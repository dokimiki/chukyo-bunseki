# Chukyo CLI - Requirements Agent CLI

A command-line interface for the requirements-agent package that helps analyze Chukyo University Manabo portal pages and generate comprehensive requirements documentation.

## Features

- **Single Page Analysis**: Analyze individual Manabo pages and generate requirements documentation
- **Batch Analysis**: Process multiple URLs from file or interactive input
- **HTML Structure Extraction**: Extract HTML structure or specific elements from pages
- **Cache Management**: Smart caching system for improved performance
- **Validation**: Environment and configuration validation
- **Verbose Output**: Detailed analysis information and debugging
- **Flexible Output**: Console output or save to markdown/HTML files

## Installation

```bash
# From the workspace root
bun install

# Build the CLI
cd packages/cli
bun run build
```

## Environment Setup

Set your Google AI API key:
```bash
export GOOGLE_AI_API_KEY="your-api-key-here"
```

## Usage

### Basic Commands

```bash
# Show help
chukyo-cli --help

# Validate environment
chukyo-cli validate

# Show configuration and examples
chukyo-cli config --examples
```

### Analyze Single Page

```bash
# Analyze a Manabo page
chukyo-cli analyze --url "https://manabo.cnc.chukyo-u.ac.jp/ct/page_123"

# Save to file with verbose output
chukyo-cli analyze \
  --url "https://manabo.cnc.chukyo-u.ac.jp/ct/page_123" \
  --output requirements.md \
  --verbose
```

### Batch Analysis

```bash
# Interactive batch analysis
chukyo-cli analyze --batch

# Batch analysis from file
echo "https://manabo.cnc.chukyo-u.ac.jp/ct/page_1
https://manabo.cnc.chukyo-u.ac.jp/ct/page_2" > urls.txt

chukyo-cli analyze --batch-file urls.txt --output batch-results.md
```

### HTML Structure Extraction

```bash
# Extract full page HTML
chukyo-cli html --url "https://manabo.cnc.chukyo-u.ac.jp/ct/page_123" --output page.html

# Extract specific element with pretty formatting
chukyo-cli html \
  --url "https://manabo.cnc.chukyo-u.ac.jp/ct/page_123" \
  --selector "main" \
  --format pretty \
  --output main-content.html
```

### Cache Management

```bash
# Show cache information
chukyo-cli cache --info

# Clear cache
chukyo-cli cache --clear

# Disable cache for specific analysis
chukyo-cli analyze --url "..." --no-cache
```

## Command Reference

### `chukyo-cli analyze`

Analyze Manabo pages and generate requirements documentation.

**Options:**
- `--url, -u <url>`: Manabo page URL to analyze
- `--output, -o <file>`: Output file path for markdown results
- `--batch-file, -f <file>`: File containing URLs (one per line)
- `--api-key, -k <key>`: Google AI API key (or use env var)

**Flags:**
- `--batch`: Interactive batch analysis mode
- `--no-cache`: Disable cache for this analysis
- `--verbose, -v`: Enable verbose output

**Examples:**
```bash
# Single page analysis
chukyo-cli analyze -u "https://manabo.cnc.chukyo-u.ac.jp/ct/home" -v

# Save to file
chukyo-cli analyze -u "..." -o requirements.md

# Batch from file
chukyo-cli analyze -f urls.txt -o batch-results.md -v
```

### `chukyo-cli html`

Extract HTML structure from Manabo pages.

**Options:**
- `--url, -u <url>`: Manabo page URL to extract HTML from
- `--output, -o <file>`: Output file path for HTML results
- `--selector, -s <selector>`: CSS selector to extract specific element
- `--format, -f <format>`: Output format: html, dom, pretty (default: html)

**Flags:**
- `--verbose, -v`: Enable verbose output

**Examples:**
```bash
# Extract full page HTML
chukyo-cli html -u "https://manabo.cnc.chukyo-u.ac.jp/ct/home" -o page.html

# Extract specific element with pretty formatting
chukyo-cli html -u "..." -s "main" -f pretty -o main-content.html

# Quick HTML inspection (output to console)
chukyo-cli html -u "..." -s ".sidebar" -v
```

### `chukyo-cli validate`

Validate environment and configuration.

**Flags:**
- `--verbose, -v`: Show detailed validation information

**Example:**
```bash
chukyo-cli validate --verbose
```

### `chukyo-cli cache`

Manage the requirements cache.

**Flags:**
- `--clear, -c`: Clear the cache
- `--info, -i`: Show cache information

**Examples:**
```bash
chukyo-cli cache --info
chukyo-cli cache --clear
```

### `chukyo-cli config`

Show configuration and help.

**Flags:**
- `--examples, -e`: Show usage examples

**Examples:**
```bash
chukyo-cli config
chukyo-cli config --examples
```

### `chukyo-cli login`

Login to Chukyo Manabo/ALBO and save session state.

**Options:**
- `--username, -u <id>`: Student ID
- `--password, -p <pass>`: Password

**Example:**
```bash
chukyo-cli login -u "student_id" -p "password"
```

## Output Format

The CLI generates comprehensive requirements documentation in markdown format including:

- **Executive Summary**: Page purpose and functionality overview
- **UI Elements Table**: Key elements with selectors and purposes
- **User Interactions**: Detailed workflows and user actions
- **API Endpoints**: Discovered data flows and network calls
- **Automation Considerations**: Testing and automation guidelines
- **Business Logic**: Page-specific constraints and rules

## Cache System

The CLI includes an intelligent caching system:

- **TTL**: 24-hour cache lifetime
- **Smart Keys**: Based on URL and content hash
- **Management**: Clear cache or disable per-analysis
- **Performance**: Significant speed improvement for repeated analyses

## Integration with MCP Service

The CLI leverages the MCP (Model Context Protocol) service for:

- **Page Analysis**: Deep structural analysis of Manabo pages
- **Selector Extraction**: Accurate CSS selectors for automation
- **Action Discovery**: Available user interactions and workflows
- **Data Element Mapping**: Form fields, buttons, and navigation elements

## Error Handling

The CLI provides clear error messages and exit codes:

- **Environment Issues**: Missing API keys or dependencies
- **Network Errors**: Connection problems or invalid URLs
- **Analysis Failures**: AI model or MCP service errors
- **File System**: Permission or path issues

## Development

```bash
# Run in development mode
bun run dev

# Run tests
bun test --coverage

# Build for production
bun run build
```

## Demo

Run the demo script to see the CLI in action:

```bash
bun run demo.ts
```

## Troubleshooting

### Common Issues

1. **Missing API Key**
   ```bash
   export GOOGLE_AI_API_KEY="your-key"
   chukyo-cli validate
   ```

2. **MCP Service Not Available**
   ```bash
   # Ensure dependencies are installed
   bun install
   chukyo-cli validate --verbose
   ```

3. **Build Errors**
   ```bash
   # Clean rebuild
   rm -rf dist/
   bun run build
   ```

### Debug Mode

Use `--verbose` flag for detailed debugging:

```bash
chukyo-cli analyze --url "..." --verbose
```

## Related Packages

- `@chukyo-bunseki/requirements-agent`: Core analysis engine
- `@chukyo-bunseki/mcp-service`: MCP service for page analysis
- `@chukyo-bunseki/playwright-worker`: Automation and screenshot capabilities
