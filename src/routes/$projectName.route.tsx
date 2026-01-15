import { createFileRoute, useMatchRoute } from "@tanstack/react-router";
import { Outlet } from "@tanstack/react-router";
import { SlashIcon } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";

export const Route = createFileRoute("/$projectName")({
  component: RouteComponent,
});

function RouteComponent() {
  const { projectName } = Route.useParams();
  const nestedRoute = useMatchRoute()({ to: "/$projectName/$invoiceId" });
  const invoiceId = nestedRoute ? nestedRoute.invoiceId : "";

  return (
    <div>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href={`/${projectName}/`}>
              ${projectName}
            </BreadcrumbLink>
          </BreadcrumbItem>
          {invoiceId && (
            <>
              <BreadcrumbSeparator>
                <SlashIcon />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbLink href={`/${projectName}/${invoiceId}/`}>
                  ${invoiceId}
                </BreadcrumbLink>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
      <div>
        <Outlet />
      </div>
    </div>
  );
}
