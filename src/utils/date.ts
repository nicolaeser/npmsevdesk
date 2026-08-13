import { validateDate, validateUnixTimestamp } from "./validation.js";

export type SevdeskTimestamp = number | Date;

export function toUnixTimestamp(value: SevdeskTimestamp): number {
  return validateUnixTimestamp(value, "sevdesk timestamp");
}

export function formatSevdeskDate(value: SevdeskTimestamp = new Date()): string {
  const date =
    value instanceof Date
      ? validateDate(value, "sevdesk date")
      : new Date(validateUnixTimestamp(value, "sevdesk date") * 1_000);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}.${date.getFullYear()}`;
}
