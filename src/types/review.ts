
export type ReviewStatus = "pending" | "accepted" | "rejected";

export interface ReviewDecision {
  status: "accepted" | "rejected";
  reason: string;
  reviewedAt: string;
}

export type ReviewDecisions = Record<number, ReviewDecision>;

export const reviewStatusLabels: Record<ReviewStatus, string> = {
  pending: "Pendiente",
  accepted: "Aceptado",
  rejected: "Rechazado",
};
