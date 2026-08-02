import { db } from "../database";
import {
  aiTimeSummaryTable,
  type NewAITimeSummaryRow,
} from "../schema/aiTimeSummary";

export function createAITimeSummaryRow(row: NewAITimeSummaryRow): number {
  const result = db.insert(aiTimeSummaryTable).values(row).run();
  const aiTimeSummaryId = result.lastInsertRowId;
  return aiTimeSummaryId;
}

export function createAITimeSummary(
  timeMemoryId: number,
  summary: string,
): number {
  const aiTimeSummaryId = createAITimeSummaryRow({ timeMemoryId, summary });
  return aiTimeSummaryId;
}
