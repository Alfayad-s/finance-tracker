export const PIN_LENGTH = 4
const PBKDF2_ITERATIONS = 80_000

export function isValidPin(value: string) {
  return new RegExp(`^\\d{${PIN_LENGTH}}$`).test(value)
}

export async function hashPin(pin: string, saltHex?: string) {
  if (!isValidPin(pin)) {
    throw new Error('PIN must be 4 digits')
  }

  const salt = saltHex ? hexToBytes(saltHex) : crypto.getRandomValues(new Uint8Array(16))
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pin),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    256,
  )

  return {
    hash: bytesToHex(new Uint8Array(bits)),
    salt: bytesToHex(salt),
  }
}

export async function pinsMatch(pin: string, salt: string, expectedHash: string) {
  if (!isValidPin(pin) || !salt || !expectedHash) return false
  const { hash } = await hashPin(pin, salt)
  return timingSafeEqual(hash, expectedHash)
}

export function stripPinLock<
  T extends { pinHash?: string; pinSalt?: string; webauthnCredentialId?: string },
>(settings: T): Omit<T, 'pinHash' | 'pinSalt' | 'webauthnCredentialId'> {
  const { pinHash: _hash, pinSalt: _salt, webauthnCredentialId: _cred, ...rest } = settings
  return rest
}

function bytesToHex(bytes: Uint8Array) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function hexToBytes(hex: string) {
  const clean = hex.length % 2 === 0 ? hex : `0${hex}`
  const bytes = new Uint8Array(clean.length / 2)
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(clean.slice(index * 2, index * 2 + 2), 16)
  }
  return bytes
}

function timingSafeEqual(left: string, right: string) {
  if (left.length !== right.length) return false
  let diff = 0
  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }
  return diff === 0
}
