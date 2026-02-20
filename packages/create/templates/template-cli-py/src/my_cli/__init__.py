"""{{name}} - CLI application."""

import typer

app = typer.Typer(help="{{name}} - A CLI application")


@app.command()
def hello(name: str = "World") -> None:
    """Say hello to someone."""
    print(f"Hello, {name}!")


def main() -> None:
    app()


if __name__ == "__main__":
    main()
