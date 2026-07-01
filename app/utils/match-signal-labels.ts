import type { CandidateStatus } from "../data/mock-data";

export const matchSignalOptions: CandidateStatus[] = [
  "strong_match",
  "needs_review",
  "low_evidence",
];

export function getMatchSignalLabel(status: CandidateStatus) {
  if (status === "strong_match") return "Strong match";
  if (status === "needs_review") return "Needs review";
  return "Low evidence";
}
