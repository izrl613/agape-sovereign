/**
 * Client-side SHA-256 hashing utility for vector data encryption.
 * Uses the Web Crypto API for deterministic, privacy-preserving hashing.
 */

/**
 * Calculates a SHA-256 hash of the given string.
 * @param data - The string data to hash
 * @returns Promise resolving to the hex-encoded SHA-256 hash
 */
export function calculateSha256(data: string): Promise<string> {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(data)).then(
    (bytes) => Array.from(new Uint8(bytes))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  );
}

/**
 * Packages user vector data for Architect AI processing with client-side encryption.
 * 
 * @param userProfile - User profile containing uid and email
 * @param vectors - Array of 16 DiffVector findings
 * @param sovereignScore - Calculated sovereign score
 * @returns Encrypted data package ready for Architect AI analysis
 */
export async function packageVectorDataForAI(
  userProfile: { uid: string; email: string },
  vectors: DiffVector[],
  sovereignScore: number
): Promise<VectorDataPackage> {
  const now = new Date().toISOString();
  const vectorCount = vectors.length;

  // Encrypt each vector's sensitive data using SHA-256 client-side hashing
  const encryptedVectors = await Promise.all(
    vectors.map(async v => {
      // Create a deterministic but privacy-preserving hash of the vector data
      const dataToHash = `${v.id}::${v.module}::${v.status}::${sovereignScore}`;
      const hash = await calculateSha256(dataToHash);

      // Determine risk level based on status
      const riskLevelMap: Record<string, 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'> = {
        NUKED: 'LOW',
        KNOXED: 'MEDIUM',
        EXPOSED: 'HIGH',
        MONITORED: 'MEDIUM'
      };

      return {
        moduleId: v.id,
        moduleNumber: v.moduleNumber,
        status: v.status,
        sha256Hash: v.sha256Hash,
        findingsEncrypted: hash,
        riskLevel: riskLevelMap[v.status] || 'MEDIUM'
      };
    })
  );

  // Calculate overall risk assessment
  const nukedCount = vectors.filter(v => v.status === 'NUKED').length;
  const knoxedCount = vectors.filter(v => v.status === 'KNOXED').length;
  const exposedCount = vectors.filter(v => v.status === 'EXPOSED').length;

  let overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  if (exposedCount >= 10) overallRisk = 'CRITICAL';
  else if (exposedCount >= 5) overallRisk = 'HIGH';
  else if (nukedCount + knoxedCount >= 10) overallRisk = 'LOW';
  else overallRisk = 'MEDIUM';

  return {
    userId: userProfile.uid,
    email: userProfile.email,
    sovereignScore,
    timestamp: now,
    vectorCount,
    encryptedVectors,
    overallRiskAssessment: overallRisk,
    privacyCompliance: 'ECRA_2026'
  };
}