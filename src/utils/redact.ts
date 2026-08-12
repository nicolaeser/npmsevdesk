const sensitiveKey =
  /(?:authorization|api[-_]?key|token|password|secret|cookie|session|credential)/i;

export function redact(value: unknown, depth = 0): unknown {
  if (depth > 8) return "[Truncated]";
  if (typeof value === "string") return redactString(value, depth);
  if (value === null || typeof value !== "object") return value;
  if (value instanceof Date) return value.toISOString();
  if (value instanceof ArrayBuffer || ArrayBuffer.isView(value)) return "[Binary]";
  if (typeof Blob !== "undefined" && value instanceof Blob) {
    return `[Blob ${value.type || "application/octet-stream"} ${value.size} bytes]`;
  }
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1));
  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    result[key] = sensitiveKey.test(key) ? "[REDACTED]" : redact(item, depth + 1);
  }
  return result;
}

function redactCredentialAssignments(value: string): string {
  return value.replace(
    /((?:authorization|api[-_]?key|token|password|secret|cookie|session|credential)\s*[=:]\s*)([^&,\s]+)/gi,
    "$1[REDACTED]"
  );
}

function redactString(value: string, depth: number): unknown {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    try {
      return redact(JSON.parse(trimmed), depth + 1);
    } catch {
      return redactCredentialAssignments(value);
    }
  }
  return redactCredentialAssignments(value);
}

export function redactHeaders(
  headers: Readonly<Record<string, unknown>> | undefined
): Readonly<Record<string, unknown>> {
  if (!headers) return {};
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [
      key,
      sensitiveKey.test(key) ? "[REDACTED]" : value
    ])
  );
}
