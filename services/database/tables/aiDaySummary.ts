import { db } from "../database";
import {
  aiDaySummaryTable,
  type NewAIDaySummaryRow,
} from "../schema/aiDaySummary";

export function createAIDaySummaryRow(row: NewAIDaySummaryRow): number {
  const result = db.insert(aiDaySummaryTable).values(row).run();
  const aiDaySummaryId = result.lastInsertRowId;
  return aiDaySummaryId;
}

export function createAIDaySummary(
  dayMemoryId: number,
  summary: string,
): number {
  const aiDaySummaryId = createAIDaySummaryRow({ dayMemoryId, summary });
  return aiDaySummaryId;
}
