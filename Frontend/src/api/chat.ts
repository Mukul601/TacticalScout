import axios from "axios";
import type { ScoutingReport } from "@/types/scouting";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

/** Response from POST /coach-chat */
export interface CoachChatResponse {
  response: string;
  provider: string;
  error: string | null;
}

/**
 * Send a question and scouting report to the coach AI.
 * POST /coach-chat with { question, scouting_report }.
 */
export async function sendCoachChat(
  question: string,
  scoutingReport: ScoutingReport | null
): Promise<CoachChatResponse> {
  const { data } = await axios.post<CoachChatResponse>(
    `${API_BASE}/coach-chat`,
    {
      question,
      scouting_report: scoutingReport ?? {},
    },
    { timeout: 60000 }
  );
  return data;
}
