import type { WebSocket } from 'ws'

const rooms = new Map<string, Set<WebSocket>>()

export function joinRoom(groupId: string, socket: WebSocket) {
  let room = rooms.get(groupId)
  if (!room) {
    room = new Set()
    rooms.set(groupId, room)
  }
  room.add(socket)
}

export function leaveRoom(groupId: string, socket: WebSocket) {
  const room = rooms.get(groupId)
  if (!room) return
  room.delete(socket)
  if (room.size === 0) rooms.delete(groupId)
}

export function publish(groupId: string, payload: unknown) {
  const room = rooms.get(groupId)
  if (!room) return
  const message = JSON.stringify(payload)
  for (const socket of room) {
    if (socket.readyState !== 1) {
      room.delete(socket)
      continue
    }
    socket.send(message)
  }
}
