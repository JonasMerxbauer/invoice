import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$projectName/$invoiceId')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/$projectName/$invoiceId"!</div>
}
