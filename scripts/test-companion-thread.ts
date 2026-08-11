import { getCompanionApi } from "../services/companionApi.ts";

async function main(): Promise<void> {
  const companionApi = getCompanionApi();

  const firstVisit = await companionApi.getOrCreateThread("register");
  const secondVisit = await companionApi.getOrCreateThread("register");
  const otherPage = await companionApi.getOrCreateThread(
    "day-summary:2026-08-10",
  );

  const reusedSameThread = firstVisit.createdAt === secondVisit.createdAt;
  const createdDistinctThread = firstVisit.createdAt !== otherPage.createdAt;

  console.log("First visit:", firstVisit);
  console.log("Second visit (same key):", secondVisit);
  console.log("Other page (different key):", otherPage);
  console.log(
    reusedSameThread
      ? "PASS — second visit reused the same thread"
      : "FAIL — second visit created a new thread",
  );
  console.log(
    createdDistinctThread
      ? "PASS — different key got its own thread"
      : "FAIL — different key reused the same thread",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
