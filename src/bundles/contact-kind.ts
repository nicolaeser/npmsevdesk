import type { SevdeskContact } from "../domain/models.js";
import { SevdeskConfigurationError } from "../utils/errors.js";

export function assertContactKindMatches(
  existing: SevdeskContact,
  input: { readonly kind?: "organisation" | "person" }
): void {
  if (input.kind === undefined) return;
  const existingKind =
    typeof existing.name === "string" && existing.name.trim() !== "" ? "organisation" : "person";
  if (input.kind !== existingKind) {
    throw new SevdeskConfigurationError(
      `The matched contact is a ${existingKind}; a ${input.kind} merge would risk changing its contact kind.`
    );
  }
}
