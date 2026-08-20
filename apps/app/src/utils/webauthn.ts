const RP_NAME = 'Finance Tracker'

export async function isPlatformUnlockAvailable() {
  if (typeof window === 'undefined') return false
  if (!window.isSecureContext) return false
  if (!window.PublicKeyCredential) return false
  if (!navigator.credentials?.create || !navigator.credentials.get) return false
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch {
    return false
  }
}

export function isWebAuthnCancel(error: unknown) {
  return (
    error instanceof DOMException &&
    (error.name === 'NotAllowedError' || error.name === 'AbortError')
  )
}

export async function registerPlatformCredential() {
  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rp: {
        name: RP_NAME,
        id: location.hostname,
      },
      user: {
        id: crypto.getRandomValues(new Uint8Array(16)),
        name: 'finance-tracker',
        displayName: RP_NAME,
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 },
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        residentKey: 'preferred',
        userVerification: 'required',
      },
      timeout: 60_000,
      attestation: 'none',
    },
  })) as PublicKeyCredential | null

  if (!credential) {
    throw new Error('This device did not finish unlocking setup')
  }

  return bytesToBase64Url(credential.rawId)
}

export async function verifyPlatformCredential(
  credentialId: string,
  signal?: AbortSignal,
) {
  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rpId: location.hostname,
      allowCredentials: [
        {
          type: 'public-key',
          id: base64UrlToBytes(credentialId),
          transports: ['internal'],
        },
      ],
      userVerification: 'required',
      timeout: 60_000,
    },
    signal,
  })

  return Boolean(assertion)
}

function bytesToBase64Url(bytes: ArrayBuffer | Uint8Array) {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let binary = ''
  for (const byte of view) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

function base64UrlToBytes(value: string) {
  const padded = value.replaceAll('-', '+').replaceAll('_', '/')
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
  const binary = atob(padded + pad)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}
