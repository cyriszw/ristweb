const PBKDF2_ITERATIONS = 600000;
const SALT_LENGTH = 32;
const KEY_LENGTH = 64;

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function getPasswordKey(password: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
}

async function deriveKey(passwordKey: CryptoKey, salt: Uint8Array): Promise<ArrayBuffer> {
  return crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-512' },
    passwordKey,
    KEY_LENGTH * 8
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const passwordKey = await getPasswordKey(password);
  const derivedBits = await deriveKey(passwordKey, salt);
  const hashBase64 = arrayBufferToBase64(derivedBits);
  const saltBase64 = arrayBufferToBase64(salt.buffer);
  return `${PBKDF2_ITERATIONS}:${saltBase64}:${hashBase64}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split(':');
  if (parts.length !== 3) return false;
  const [iterationsStr, saltBase64, storedHashBase64] = parts;
  const salt = new Uint8Array(base64ToArrayBuffer(saltBase64));
  const passwordKey = await getPasswordKey(password);
  const derivedBits = await deriveKey(passwordKey, salt);
  const computedHashBase64 = arrayBufferToBase64(derivedBits);
  return computedHashBase64 === storedHashBase64;
}

export function generateTrackingToken(): string {
  return crypto.randomUUID();
}
