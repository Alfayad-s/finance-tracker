import type { WebSocket } from 'ws'

const rooms = new Map<string, Set<WebSocket>>()
const pendingByMember = new Map<string, Record<string, unknown>[]>()

export function memberRoom(memberId: string) {
  return `member:${memberId}`
}

export function joinRoom(roomId: string, socket: WebSocket) {
  let room = rooms.get(roomId)
  if (!room) {
    room = new Set()
    rooms.set(roomId, room)
  }
  room.add(socket)
}

export function leaveRoom(roomId: string, socket: WebSocket) {
  const room = rooms.get(roomId)
  if (!room) return
  room.delete(socket)
  if (room.size === 0) rooms.delete(roomId)
}

export function publish(roomId: string, payload: unknown) {
  const room = rooms.get(roomId)
  if (!room) return 0
  const message = JSON.stringify(payload)
  let sent = 0
  for (const socket of room) {
    if (socket.readyState !== 1) {
      room.delete(socket)
      continue
    }
    socket.send(message)
    sent += 1
  }
  return sent
}

export function enqueueForMember(memberId: string, payload: Record<string, unknown>) {
  const current = pendingByMember.get(memberId) ?? []
  current.push(payload)
  pendingByMember.set(memberId, current.slice(-30))
}

export function takePendingForMember(memberId: string) {
  const current = pendingByMember.get(memberId) ?? []
  pendingByMember.delete(memberId)
  return current
}
