import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

/** Response from POST /draft-risk-analysis */
export interface DraftAnalysisResponse {
  synergy?: { score?: number; classification?: string; details?: Record<string, unknown> };
  damage_composition?: { score?: number; classification?: string; details?: Record<string, unknown> };
  role_coverage?: {
    status?: string;
    missing_roles?: string[];
    duplicate_roles?: string[];
    roles_present?: Record<string, number>;
  };
  risk_alerts?: { severity?: string; type?: string; message?: string }[];
  picks?: { champion?: string; role?: string; damage_type?: string; tags?: string[] }[];
}

/**
 * Analyze a draft (list of champion names) for synergy, damage balance, role coverage, and risks.
 * POST /draft-risk-analysis with { draft: draftList }.
 */
export async function analyzeDraft(
  draftList: string[]
): Promise<DraftAnalysisResponse> {
  const { data } = await axios.post<DraftAnalysisResponse>(
    `${API_BASE}/draft-risk-analysis`,
    { draft: draftList },
    { timeout: 15000 }
  );
  return data;
}
