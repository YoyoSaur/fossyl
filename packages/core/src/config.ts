import type { FrameworkAdapter, DatabaseAdapter, ValidationAdapter } from "./adapters";

/**
 * Adapter configuration for fossyl.
 */
export type AdaptersConfig = {
  /** Required: HTTP framework adapter */
  framework: FrameworkAdapter;

  /** Optional: Database adapter for transactions */
  database?: DatabaseAdapter;

  /** Optional: Validation adapter (rarely needed) */
  validation?: ValidationAdapter;
};
