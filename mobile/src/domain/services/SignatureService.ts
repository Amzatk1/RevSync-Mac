/**
 * SignatureService — interface for Ed25519 signature operations.
 *
 * Implementations should use tweetnacl for Ed25519 verification
 * and expo-crypto for SHA-256 hashing.
 */
export interface SignatureService {
    /**
     * Compute SHA-256 hash of a file at the given local path.
     * Returns the hash as a lowercase hex string.
     */
    hashFile(filePath: string): Promise<string>;

    /**
     * Verify an Ed25519 signature over a message (typically a SHA-256 hash).
     *
     * @param messageHex  - the SHA-256 hash as a hex string
     * @param signatureB64 - the Ed25519 signature as a base64 string
     * @returns true if signature is valid, false otherwise
     */
    verifySignature(messageHex: string, signatureB64: string): Promise<boolean>;

    /**
     * Get the embedded public key ID for tracking key rotation.
     */
    getPublicKeyId(): string;
}
