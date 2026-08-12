import { validateUnixTimestamp } from "./validation.js";

export type SevdeskTimestamp = number | Date;

export function toUnixTimestamp(value: SevdeskTimestamp): number {
  return validateUnixTimestamp(value, "sevdesk timestamp");
}
