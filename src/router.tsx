import { createRouter } from "@tanstack/react-router";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";
import { EvoluProvider } from "@evolu/react";
import { evolu } from "~/evolu";

// Create a new router instance
export const getRouter = () => {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    Wrap: (props: { children: React.ReactNode }) => {
      return <EvoluProvider value={evolu}>{props.children}</EvoluProvider>;
    },
  });

  return router;
};
