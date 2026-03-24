import { createHmac } from "crypto";

export function signFlowParams(params: Record<string, string | number>): string {
  const keys = Object.keys(params).sort();
  let toSign = "";
  for (const key of keys) {
    toSign += key + params[key];
  }
  return createHmac("sha256", process.env.FLOW_SECRET_KEY!).update(toSign).digest("hex");
}

export function buildFlowFormData(params: Record<string, string | number>): URLSearchParams {
  const signed = { ...params, s: signFlowParams(params) };
  const formData = new URLSearchParams();
  for (const [key, value] of Object.entries(signed)) {
    formData.append(key, String(value));
  }
  return formData;
}
