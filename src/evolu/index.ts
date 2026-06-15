import { Schema } from "~/evolu/schema";
import { SimpleName, createEvolu } from "@evolu/common";
import { evoluReactWebDeps } from "@evolu/react-web";
import { createUseEvolu } from "@evolu/react";
import { getStoredSyncUrl } from "~/evolu/settings";

export const evolu = createEvolu(evoluReactWebDeps)(Schema, {
  name: SimpleName.orThrow("invoice"),
  syncUrl: getStoredSyncUrl(),
});

export const useEvolu = createUseEvolu(evolu);
