import type { IncomingMessage } from 'node:http'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { WebSocketServer, type WebSocket } from 'ws'
import './env'
import { isHttpError } from './lib/errors'
import { findMemberByToken } from './middleware/auth'
import { joinRoom, leaveRoom, takePendingForMember } from './realtime'
import { groupsRoute, joinGroup } from './routes/groups'

const origin = process.env.APP_ORIGIN ?? 'http://localhost:5173'
const port = Number(process.env.PORT ?? 8787)

const app = new Hono()

app.use(
  '*',
  cors({
    origin,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  }),
)

app.onError((error, c) => {
  if (isHttpError(error)) {
    const status = error.status as 400 | 401 | 403 | 404 | 500
    return c.json({ error: error.message }, status)
  }
  console.error(error)
  return c.json({ error: 'Something went wrong' }, 500)
})

app.get('/health', (c) => c.json({ ok: true }))
app.post('/join', (c) => joinGroup(c))
app.route('/groups', groupsRoute)

const server = serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Split API listening on http://localhost:${info.port}`)
})

const sockets = new WebSocketServer({ noServer: true })

server.on('upgrade', (request, socket, head) => {
  const host = request.headers.host ?? 'localhost'
  const url = new URL(request.url ?? '/', `http://${host}`)
  if (url.pathname !== '/ws') {
    socket.destroy()
    return
  }
  sockets.handleUpgrade(request, socket, head, (ws) => {
    sockets.emit('connection', ws, request)
  })
})

sockets.on('connection', (ws: WebSocket, request: IncomingMessage) => {
  void (async () => {
    const host = request.headers.host ?? 'localhost'
    const url = new URL(request.url ?? '/', `http://${host}`)
    const token = url.searchParams.get('token') ?? ''
    const member = await findMemberByToken(token)
    if (!member || member.leftAt) {
      ws.close()
      return
    }
    joinRoom(member.groupId, ws)
    joinRoom(`member:${member.id}`, ws)
    ws.send(JSON.stringify({ event: 'connected', groupId: member.groupId, memberId: member.id }))
    for (const pending of takePendingForMember(member.id)) {
      ws.send(JSON.stringify(pending))
    }
    ws.on('close', () => {
      leaveRoom(member.groupId, ws)
      leaveRoom(`member:${member.id}`, ws)
    })
  })()
})
