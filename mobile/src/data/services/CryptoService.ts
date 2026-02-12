/**
 * CryptoService — Ed25519 signature verification + SHA-256 hashing.
 *
 * Uses expo-crypto for SHA-256 and tweetnacl for Ed25519.
 * The RevSync public key is embedded at build time via env var.
 *
 * SECURITY: This key must match the backend REVSYNC_SIGNING_KEY_B64 pair.
 * The key is the RAW 32-byte Ed25519 public key, base64-encoded.
 */
import * as Crypto from 'expo-crypto';
import { readAsStringAsync } from 'expo-file-system/legacy';
import nacl from 'tweetnacl';
import { Buffer } from 'buffer';
import { SignatureService } from '../../domain/services/SignatureService';

// ─── Embedded Public Key ───────────────────────────────────────
const REVSYNC_PUBLIC_KEY_B64 =
    process.env.EXPO_PUBLIC_REVSYNC_PUBLIC_KEY || '';

const KEY_ID = process.env.EXPO_PUBLIC_REVSYNC_KEY_ID || 'rev_key_v1';

// ─── Helpers ───────────────────────────────────────────────────

/** Convert hex string to Uint8Array */
function hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes;
}

// ─── Service ───────────────────────────────────────────────────

export class CryptoService implements SignatureService {
    private publicKey: Uint8Array | null = null;

    constructor() {
        if (REVSYNC_PUBLIC_KEY_B64) {
            this.publicKey = new Uint8Array(
                Buffer.from(REVSYNC_PUBLIC_KEY_B64, 'base64')
            );
            if (this.publicKey.length !== 32) {
                console.error(
                    `CryptoService: Invalid public key length ${this.publicKey.length}, expected 32`
                );
                this.publicKey = null;
            }
        } else {
            console.warn(
                'CryptoService: No EXPO_PUBLIC_REVSYNC_PUBLIC_KEY set — signature verification disabled'
            );
        }
    }

    // ─── SHA-256 File Hashing ──────────────────────────────────

    async hashFile(filePath: string): Promise<string> {
        // Read file as base64 using the legacy API
        const b64Content = await readAsStringAsync(filePath, {
            encoding: 'base64',
        });

        // Compute SHA-256 using expo-crypto
        const hashHex = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            b64Content,
            { encoding: Crypto.CryptoEncoding.HEX }
        );

        return hashHex.toLowerCase();
    }

    /**
     * Hash raw bytes (not from a file).
     */
    async hashBytes(data: Uint8Array): Promise<string> {
        const b64 = Buffer.from(data).toString('base64');
        const hashHex = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            b64,
            { encoding: Crypto.CryptoEncoding.HEX }
        );
        return hashHex.toLowerCase();
    }

    // ─── Ed25519 Signature Verification ────────────────────────

    async verifySignature(
        messageHex: string,
        signatureB64: string
    ): Promise<boolean> {
        if (!this.publicKey) {
            console.error('CryptoService: Cannot verify — no public key loaded');
            return false;
        }

        try {
            const message = hexToBytes(messageHex);
            const signature = new Uint8Array(
                Buffer.from(signatureB64, 'base64')
            );

            if (signature.length !== 64) {
                console.error(
                    `CryptoService: Invalid signature length ${signature.length}, expected 64`
                );
                return false;
            }

            return nacl.sign.detached.verify(message, signature, this.publicKey);
        } catch (error) {
            console.error('CryptoService: Verification error', error);
            return false;
        }
    }

    // ─── Key Info ──────────────────────────────────────────────

    getPublicKeyId(): string {
        return KEY_ID;
    }

    isReady(): boolean {
        return this.publicKey !== null;
    }
}
