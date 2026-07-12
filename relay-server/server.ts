// Deno Edge Relay Server for Code Scaffold ACP
// Deploy using: deployctl deploy --project=acp-relay server.ts

const connections = new Map<string, Set<WebSocket>>();
const rateLimits = new Map<string, number[]>();

Deno.serve((req) => {
  if (req.headers.get("upgrade") != "websocket") {
    return new Response("Code Scaffold ACP Relay Hub (Active)", { status: 200 });
  }

  const url = new URL(req.url);
  // Expecting wss://server.com/room/<PIN>
  const room = url.pathname.split("/").pop();

  if (!room || room === "") {
    return new Response("Invalid Room", { status: 400 });
  }

  // Basic Anti-Bruteforce Rate Limiting (10 connection attempts per 10 seconds per IP)
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const now = Date.now();
  if (!rateLimits.has(ip)) {
    rateLimits.set(ip, []);
  }
  const history = rateLimits.get(ip)!;
  
  // Filter out attempts older than 10 seconds
  const recent = history.filter((time) => now - time < 10000);
  if (recent.length >= 10) {
    return new Response("Rate Limit Exceeded (Anti-Bruteforce Lockdown)", { status: 429 });
  }
  recent.push(now);
  rateLimits.set(ip, recent);

  const { socket, response } = Deno.upgradeWebSocket(req);
  const bc = new BroadcastChannel(`acp-relay-${room}`);

  socket.onopen = () => {
    // Keep track of local connections for this room
    if (!connections.has(room)) {
      connections.set(room, new Set());
    }
    const roomConns = connections.get(room)!;
    
    // Prevent more than 2 peers from joining the same room (Pairing lockdown)
    if (roomConns.size >= 2) {
      socket.close(1008, "Room is full (Pairing already established)");
      return;
    }
    
    roomConns.add(socket);

    // Keep connection alive on Deno Deploy (29s ping to reduce global activity)
    const keepAlive = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(new Uint8Array(0)); // Empty binary frame as ping
      }
    }, 29000);

    socket.addEventListener("close", () => clearInterval(keepAlive));
  };

  socket.onmessage = (e) => {
    // Broadcast raw ciphertext to all other peers in the global edge channel
    bc.postMessage(e.data);
  };

  bc.onmessage = (e) => {
    // When receiving ciphertext from the edge, route it to this local socket
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(e.data);
    }
  };

  socket.onclose = () => {
    bc.close();
    const roomConns = connections.get(room);
    if (roomConns) {
      roomConns.delete(socket);
      if (roomConns.size === 0) {
        connections.delete(room);
      }
    }
  };

  return response;
});
