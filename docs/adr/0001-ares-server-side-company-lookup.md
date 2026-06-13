# Use ARES Behind a Server-Side Company Lookup

Company registry lookup uses ARES as the canonical source for Czech company identity data, but React forms call an app-owned TanStack Start server function instead of calling ARES directly. The server function returns normalized lookup results only, keeping ARES response shape, CORS behavior, and future provider changes out of the form UI.
