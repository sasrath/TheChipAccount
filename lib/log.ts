const isDev = process.env.NODE_ENV === "development";

export const log = {
  info: (...args: unknown[]) => {
    if (isDev) console.log("[thechipaccount]", ...args);
  },
  warn: (...args: unknown[]) => {
    console.warn("[thechipaccount]", ...args);
  },
  error: (...args: unknown[]) => {
    console.error("[thechipaccount]", ...args);
  },
};
