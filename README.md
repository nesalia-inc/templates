# @nesalia/create

CLI for creating nesalia projects from templates.

## Usage

```bash
# Interactive mode
npx @nesalia/create

# With project name
npx @nesalia/create my-cli

# With --name flag
npx @nesalia/create --name my-cli

# With specific template
npx @nesalia/create --name my-cli --template cli-py

# List available templates
npx @nesalia/create --list

# Show help
npx @nesalia/create --help
```

## Templates

### cli-py

Python CLI template using **typer** and **uv**.

```bash
npx @nesalia/create --name my-cli --template cli-py
cd my-cli
uv sync
my-cli --help
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Packages

- `@nesalia/create` - CLI for creating projects

## License

MIT
