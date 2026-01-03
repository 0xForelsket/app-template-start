import type { SystemSettingsConfig } from "@/db/schema";

export const DEFAULT_SETTINGS: SystemSettingsConfig = {
  session: {
    idleTimeout: 8,
    maxDuration: 24,
  },
  notifications: {
    emailEnabled: false,
  },
};
