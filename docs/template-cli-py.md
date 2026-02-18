# @nesalia/template-cli-py

## Overview

This template creates a Python CLI project using **uv** for package management and **typer** for CLI framework.

## Target Users

- Python developers who want to create CLI applications
- Developers familiar with Python who need a quick CLI starter

## Requirements

- Python 3.12+
- uv (package manager)

## Features

### Core Features

- **typer** - CLI framework with type hints support
- **rich** - Rich terminal output (optional)
- **pytest** - Testing framework
- **ruff** - Linting and formatting

### Project Structure

```
my-cli/
├── src/
│   └── my_cli/
│       ├── __init__.py
│       └── __main__.py
├── tests/
│   └── test_main.py
├── pyproject.toml
├── uv.lock
├── README.md
└── .gitignore
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| name | Project name | (user input) |
| description | Project description | (user input) |
| rich | Add rich for fancy output | false |
| docker | Add Dockerfile | false |

## CLI Commands (Generated)

```bash
# Run the CLI
my-cli --help

# Development mode
uv run my-cli

# Add a command
uv run my-cli greet --name World

# Run tests
uv run pytest

# Build
uv build
```

## Usage

```bash
# Create a new project
npx @nesalia/create my-cli --template cli-py

# Or use interactive mode
npx @nesalia/create
# Select "CLI Python" as template

# Run the CLI
cd my-cli
uv run my-cli --help
```

## Technical Details

### pyproject.toml

- Uses `[project.scripts]` for CLI entry point
- Compatible with uv and pip
- Includes dev dependencies in `[project.optional-dependencies]`

### Dependencies

- `typer>=0.12.0` - CLI framework
- `rich>=13.0.0` - Rich output (optional)
- `typing-extensions>=4.0` - Type hints backport

### Dev Dependencies

- `pytest>=8.0.0` - Testing
- `ruff>=0.4.0` - Linting
- `pytest-cov>=4.0` - Coverage

## Versioning

The template itself will follow semver. The generated projects will use the template version in a `nesalia` field in `pyproject.toml`.
