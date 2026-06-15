import { createRouter } from "@tanstack/react-router";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";
import { EvoluProvider } from "@evolu/react";
import { evolu } from "~/evolu";
import { RecoveryPhraseOnboardingDialog } from "~/components/recovery-phrase-onboarding-dialog";

// Create a new router instance
export const getRouter = () => {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    Wrap: (props: { children: React.ReactNode }) => {
      return (
        <EvoluProvider value={evolu}>
          {props.children}
          <RecoveryPhraseOnboardingDialog />
        </EvoluProvider>
      );
    },
  });

  return router;
};
