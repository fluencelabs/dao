import metadata from "../assets/metadata.json";

const githubAccounts = new Set(Object.keys(metadata.encryptedKeys));

export function checkEligibility(githubHandle) {
  return githubAccounts.has(githubHandle);
}