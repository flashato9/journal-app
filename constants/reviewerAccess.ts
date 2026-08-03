// Hardcoded, non-secret Play reviewer username, pasted verbatim into Play
// Console's "App access" instructions field for reviewers to log in with.
export function getReviewerUsername(): string {
  const reviewerUsername = "playreviewer";
  return reviewerUsername;
}

// Hardcoded, non-secret Play reviewer password — see getReviewerUsername.
export function getReviewerPassword(): string {
  const reviewerPassword = "PlayReview2026!";
  return reviewerPassword;
}
