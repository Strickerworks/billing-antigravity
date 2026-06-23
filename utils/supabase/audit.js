import { supabase } from "./client";

export async function logAudit({
  requestId,
  requestType,
  submittedBy = "staff",
  submittedAt = new Date().toISOString(),
  status,
  actionBy = null,
  actionAt = null,
  payload = {}
}) {
  const { error } = await supabase.from("audit_logs").insert([
    {
      request_id: String(requestId),
      request_type: requestType,
      submitted_by: submittedBy,
      submitted_at: submittedAt,
      status: status,
      action_by: actionBy,
      action_at: actionAt,
      payload: payload
    }
  ]);

  if (error) {
    console.error("Error logging to audit trail:", error.message || error.details || JSON.stringify(error));
  }
}
