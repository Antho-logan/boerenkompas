# Developer Notes

## Multiple Lockfiles / Turbopack Warnings
If you see warnings about multiple lockfiles or `turbopack` root issues:

1. **Run from the Correct Directory**: Ensure you are running `npm run dev` from the root of the `boerenkompas` app directory (where `package.json` is located), not the parent folder.
2. **Lockfiles**: The project uses `package-lock.json`. If you have a `yarn.lock` or `pnpm-lock.yaml` in the parent directory, it might cause confusion. Stick to `npm` for this project.
3. **Turbopack**: If utilizing Turbopack (`next dev --turbo`), ensure it detects the project root correctly. Standard `next dev` is sufficient for most cases.
