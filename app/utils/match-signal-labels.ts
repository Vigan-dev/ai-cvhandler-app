import type { CandidateStatus } from "../data/mock-data";

export const matchSignalOptions: CandidateStatus[] = [
  "Hire",
  "Review",
  "Reject",
];

export function getMatchSignalLabel(status: CandidateStatus) {
  if (status === "Hire") return "Strong match";
  if (status === "Review") return "Needs review";
  return "Low evidence";
}
