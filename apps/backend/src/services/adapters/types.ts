import { NormalizedOrder } from "@order-hub/shared";

export type NormalizeInput = {
  payload: unknown;
  platformStoreId: string;
  ingestionSource: "webhook" | "email" | "seed";
};

export interface PlatformAdapter {
  readonly platform: NormalizedOrder["platform"];
  normalize(input: NormalizeInput): Promise<NormalizedOrder>;
}
