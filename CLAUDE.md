## Git Commit Convention

All commits MUST include both co-authors:

- `martty-code <nesalia.inc@gmail.com>`
- `Claude Sonnet <noreply@anthropic.com>`

### Commit Message Format

```bash
git commit -m "$(cat <<'EOF'
Your commit message here

Co-Authored-By: martty-code <nesalia.inc@gmail.com>
Co-Authored-By: Claude Sonnet <noreply@anthropic.com>
EOF
)"
```

### Example

```bash
git commit -m "$(cat <<'EOF'
feat: add employee search functionality

Implement search bar with real-time filtering for employee list

Co-Authored-By: martty-code <nesalia.inc@gmail.com>
Co-Authored-By: Claude Sonnet <noreply@anthropic.com>
EOF
)"
```
