import { createHash, randomBytes } from 'node:crypto'

export function newId() {
  return crypto.randomUUID()
}

export function newSessionToken() {
  return randomBytes(32).toString('hex')
}

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

const INVITE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function newInviteCode(length = 8) {
  const bytes = randomBytes(length)
  let code = ''
  for (let i = 0; i < length; i++) {
    code += INVITE_ALPHABET[bytes[i]! % INVITE_ALPHABET.length]
  }
  return code
}
