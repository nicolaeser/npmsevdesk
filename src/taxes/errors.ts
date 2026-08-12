import { SevdeskConfigurationError } from "../utils/errors.js";
import type { TaxValidationIssue } from "./types.js";

export class SevdeskTaxConfigurationError extends SevdeskConfigurationError {
  public readonly issues: readonly TaxValidationIssue[];
  public constructor(issues: readonly TaxValidationIssue[]) {
    super(`Invalid tax configuration: ${issues.map((issue) => issue.message).join(" ")}`);
    this.issues = Object.freeze([...issues]);
  }
  public toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      issues: this.issues
    };
  }
}
