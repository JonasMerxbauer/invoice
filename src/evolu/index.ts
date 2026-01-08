import { Schema } from "~/evolu/schema";
import { SimpleName, createEvolu } from "@evolu/common";
import { evoluReactWebDeps } from "@evolu/react-web";
import { createUseEvolu } from "@evolu/react";

export const evolu = createEvolu(evoluReactWebDeps)(Schema, {
  name: SimpleName.orThrow("invoice"),
  transports: [{ type: "WebSocket", url: "wss://your-sync-url" }], // optional, defaults to free.evoluhq.com
});

export const useEvolu = createUseEvolu(evolu);
