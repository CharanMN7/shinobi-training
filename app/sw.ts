import { defaultCache } from "@serwist/next/worker";
import { Serwist } from "serwist";

// eslint-disable-next-line no-var
declare var self: Window & typeof globalThis & { __SW_MANIFEST: (string | { url: string; revision: string | null })[] };

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
