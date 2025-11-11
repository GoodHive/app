# Claude Instructions for GoodHive-Web

## Git Commit Guidelines

When committing changes to the repository:

- **DO NOT mention Claude or AI assistance in commit messages**
- Keep commit messages professional and concise
- Follow conventional commit format: `type: description`
- Focus on what changed and why, not who made the change

### Commit Message Format

```
type: brief description of changes

- Detailed point 1
- Detailed point 2
- Detailed point 3
```

### Example Good Commit Messages

✅ `feat: add dynamic loading text to BeeHiveSpinner component`
✅ `refactor: simplify user profile layout`
✅ `fix: resolve authentication redirect issue`

### Example Bad Commit Messages

❌ `feat: add feature with Claude's help`
❌ `update: changes made by AI assistant`
❌ `🤖 Generated with Claude Code`

## Development Workflow

1. **Understand** the requirements
2. **Plan** the implementation
3. **Implement** the changes
4. **Test** using `pnpm dev`
5. **Verify** with `pnpm lint` and `npx tsc`
6. **Commit** with professional messages (no AI mentions)
7. **Push** when ready

## Core Commands

- `pnpm install` - Install dependencies
- `pnpm dev` - Run development server
- `pnpm build` - Build for production
- `pnpm lint` - Run linter
- `npx tsc` - Type checking
