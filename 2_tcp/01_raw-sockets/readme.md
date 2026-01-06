# Raw Sockets

## What this covers
This section demonstrates how to create a basic TCP server using Node.js
and how raw sockets behave without any higher-level protocol like HTTP.

This is the foundation layer for everything that follows:
framing, binary protocols, and state machines.

## Why this matters
Most applications interact with TCP through HTTP, where structure,
message boundaries, and semantics are already defined.

At the raw socket level:
- there are no messages
- there is no request/response
- there is no parsing
- only ordered bytes flowing through a connection

Understanding this layer is essential for building correct protocols.

## Key ideas
- A TCP socket is a **bidirectional byte stream**
- Data arrives in **arbitrary-sized chunks**
- TCP guarantees order and delivery, **not structure**
- The server reacts to lifecycle events, not protocol states

## Conceptual model
Think of a socket as a pipe:

- bytes flow in
- bytes flow out
- TCP ensures order and reliability
- meaning must be imposed by the application

At this layer, the code simply:
- accepts connections
- receives raw bytes
- sends raw bytes back
