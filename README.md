# Invoice

A local-first invoice app for creating projects, customers, invoices, invoice items, payment details, QR payments, and PDF invoices. The UI is written in Czech and focuses on Czech business invoicing details such as IČO, DIČ, VAT mode, ARES company lookup, and variable symbols.

## Tech Stack

- React 19
- TanStack Start and TanStack Router
- Evolu for local-first persistence and sync
- Tailwind CSS and shadcn/ui
- Vitest for tests
- pnpm for package management

## Getting Started

Install dependencies:

```bash
pnpm install
```

Run the development server:

```bash
pnpm dev
```

The app runs on `http://localhost:3000` by default.

## Scripts

- `pnpm dev` - start the Vite dev server on port 3000
- `pnpm build` - build the app for production
- `pnpm start` - run the built server output
- `pnpm preview` - preview the production build locally
- `pnpm test` - run the Vitest test suite

## Project Structure

- `src/routes` - file-based routes
- `src/components` - app and UI components
- `src/evolu` - Evolu schema, instance, and sync settings
- `src/lib` - invoice PDF, QR payment, company registry, and utility logic

## UI Components

Use the latest shadcn CLI when adding new components:

```bash
pnpm dlx shadcn@latest add button
```
