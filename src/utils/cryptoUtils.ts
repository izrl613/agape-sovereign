/**
 * @interface CryptoInputs
 * Defines the structure for the inputs required to generate a unique identity hash.
 */
export interface CryptoInputs {
  projectId: string;
  versionNumber: string;
  buildManifest: string;
}

/**
 * Computes a deterministic SHA256 ID hash for the 16 identity modules.
 *
 * This function hashes a concatenated string derived from the Project ID,
 * Version Number, and Build Manifest to create a unique identifier that
 * represents the current build state of the identity system.
 *
 * @param inputs An object containing the necessary project metadata (projectId, versionNumber, buildManifest).
 * @returns A Promise resolving to the hexadecimal SHA256 hash string.
 * @throws {Error} If any required input is missing or if hashing fails.
 */
export const computeIdentityHash = async (
  inputs: CryptoInputs
): Promise<string> => {
  if (
    !inputs ||
    !inputs.projectId ||
    !inputs.versionNumber ||
    !inputs.buildManifest
  ) {
    throw new Error(
      "All inputs (projectId, versionNumber, buildManifest) must be provided to compute the identity hash."
    );
  }

  // 1. Concatenate the required components in a fixed order to ensure determinism.
  const dataToHash = `${inputs.projectId}:${inputs.versionNumber}:${inputs.buildManifest}`;

  try {
    // 2. Encode as UTF-8
    const msgBuffer = new TextEncoder().encode(dataToHash);

    // 3. Hash the message using Web Crypto API
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);

    // 4. Convert ArrayBuffer to Array
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    // 5. Convert bytes to hex string
    const idHash = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return idHash;
  } catch (error) {
    console.error("Error computing identity hash:", error);
    throw new Error(`Failed to compute SHA256 hash: ${(error as Error).message}`);
  }
};
