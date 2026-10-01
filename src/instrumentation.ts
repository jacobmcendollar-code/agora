export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ensureComplianceSchema } = await import("@/lib/ensure-compliance-schema");
    try {
      await ensureComplianceSchema();
    } catch (err) {
      console.error("[ensure-compliance-schema]", err);
    }
  }
}
