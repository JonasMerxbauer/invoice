import {
  createFileRoute,
  useMatchRoute,
  useRouterState,
  Link,
} from "@tanstack/react-router";
import { Outlet } from "@tanstack/react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "~/components/ui/breadcrumb";
import { Home } from "lucide-react";

export const Route = createFileRoute("/$projectName")({
  component: RouteComponent,
});

function RouteComponent() {
  const { projectName } = Route.useParams();
  const nestedRoute = useMatchRoute()({ to: "/$projectName/$invoiceId" });
  const invoiceId = nestedRoute ? nestedRoute.invoiceId : "";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isNewRoute = pathname.endsWith("/new");

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation bar */}
      <header className="border-b border-border/50">
        <div className="mx-auto max-w-5xl px-6 py-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  asChild
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  <Link to="/">
                    <Home className="size-3.5" />
                    <span className="font-serif text-sm">Projekty</span>
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbSeparator className="[&>svg]:size-3.5" />

              <BreadcrumbItem>
                {invoiceId || isNewRoute ? (
                  <BreadcrumbLink
                    asChild
                    className="font-serif text-sm font-semibold"
                  >
                    <Link to="/$projectName" params={{ projectName }}>
                      {decodeURIComponent(projectName)}
                    </Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="font-serif text-sm font-semibold">
                    {decodeURIComponent(projectName)}
                  </BreadcrumbPage>
                )}
              </BreadcrumbItem>

              {isNewRoute && (
                <>
                  <BreadcrumbSeparator className="[&>svg]:size-3.5" />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="font-serif text-sm">
                      Nová faktura
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}

              {invoiceId && !isNewRoute && (
                <>
                  <BreadcrumbSeparator className="[&>svg]:size-3.5" />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="font-serif text-sm">
                      Faktura
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      {/* Page content */}
      <main className="mx-auto max-w-5xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
