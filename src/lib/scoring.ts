export type ScoreInput = {
  impact: number;
  urgency: number;
  effortMinutes: number;
  blocker: boolean;
};

export type ScoreResult = {
  priorityScore: number;
  explanation: string;
};

export function scoreTask(input: ScoreInput): ScoreResult {
  const impactWeight = input.impact * 12;
  const urgencyWeight = input.urgency * 10;
  const effortPenalty = Math.min(input.effortMinutes, 180) / 12;
  const blockerBonus = input.blocker ? 8 : 0;

  const rawScore = impactWeight + urgencyWeight + blockerBonus - effortPenalty;
  const priorityScore = Math.max(0, Math.round(rawScore * 10) / 10);

  return {
    priorityScore,
    explanation: `Impact (${input.impact}) and urgency (${input.urgency}) increased score; effort (${input.effortMinutes}m) reduced it${
      input.blocker ? ", with blocker bonus applied." : "."
    }`
  };
}
