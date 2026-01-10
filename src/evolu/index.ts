import { Schema } from "~/evolu/schema";
import { SimpleName, createEvolu } from "@evolu/common";
import { evoluReactWebDeps } from "@evolu/react-web";
import { createUseEvolu } from "@evolu/react";

export const evolu = createEvolu(evoluReactWebDeps)(Schema, {
  name: SimpleName.orThrow("invoice"),
});

export const useEvolu = createUseEvolu(evolu);
