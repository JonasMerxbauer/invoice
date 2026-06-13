# shadcn instructions

Use the latest version of Shadcn to install new components, like this command to add a button component:

```bash
pnpm dlx shadcn@latest add button
```

# Project Notes

- Keep changes small and idiomatic to this codebase. Prefer existing folders, naming, and UI patterns before adding new abstractions.
- Use pnpm to run commands
- Keep UI text in Czech to match the current app. Otherewise everything should be in English and you should communicate in English
- Respect React 19 and the React Compiler setup. Do not add `useMemo` or `useCallback` by default unless there is a measured need or existing local pattern.
- Do not run database migrations or schema-changing DB commands; leave those steps to the user unless explicitly instructed.
