"""Tests for {{name}}."""

from typer.testing import CliRunner

from {{name}} import app

runner = CliRunner()


def test_hello():
    """Test hello command."""
    result = runner.invoke(app, ["hello", "World"])
    assert result.exit_code == 0
    assert "Hello, World!" in result.stdout
