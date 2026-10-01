export const REPORT_REASONS = [
  "Illegal content",
  "Threat of violence",
  "Doxxing",
  "Targeted harassment",
  "Spam",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_TARGET_TYPES = ["post", "comment", "user"] as const;

export type ReportTargetType = (typeof REPORT_TARGET_TYPES)[number];

export function isReportReason(value: string): value is ReportReason {
  return (REPORT_REASONS as readonly string[]).includes(value);
}

export function isReportTargetType(value: string): value is ReportTargetType {
  return (REPORT_TARGET_TYPES as readonly string[]).includes(value);
}
