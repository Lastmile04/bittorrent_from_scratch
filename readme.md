# Noddy BitTorrent

A from-scratch exploration of network protocols using Node.js, focused on
understanding how networking systems work internally through protocol-correct,
byte-level implementations.

This repository progresses protocol-layer by protocol-layer, starting from
HTTP fundamentals and TCP behavior before arriving at a working BitTorrent
protocol MVP.

The goal of this project is not production readiness, but deep understanding
of networking protocols, binary parsing, event-driven systems, and layered
architecture design.

---

## Current Demo — BitTorrent MVP

The current milestone implements a functioning BitTorrent protocol MVP featuring:

- HTTP & UDP tracker communication
- Peer discovery
- BitTorrent handshakes
- Piece downloading
- SHA1 piece verification
- Stateful terminal dashboard

![BitTorrent Demo](./3_bittorrent/src/assets/demo.gif)

➡️ Full BitTorrent implementation details:
[View Full BitTorrent Documentation →](./3_bittorrent/README.md)

---

## Repository Structure

Each top-level folder represents a protocol layer or networking milestone,
implemented independently and incrementally.

```txt
bittorrent_from_scratch/
├── 1_http/          # HTTP fundamentals from raw sockets
├── 2_tcp/           # TCP framing, buffering, state machines
├── 3_bittorrent/    # BitTorrent protocol MVP
```

Each stage builds upon concepts explored in the previous one.

---

## Protocol Progression

### 1. HTTP Fundamentals (`1_http/`)

Exploration of HTTP communication and request/response handling using
raw socket-level networking primitives.

Key topics explored:
- HTTP request structure
- Raw socket communication
- Request parsing
- Response serialization
- Stateful connection handling

---

### 2. TCP Behavior & State Machines (`2_tcp/`)

Focused exploration of TCP stream behavior, framing problems, buffering,
and protocol state management.

Key topics explored:
- Incremental stream parsing
- Buffer accumulation
- Message framing
- Protocol state machines
- Event-driven transport behavior

---

### 3. BitTorrent Protocol MVP (`3_bittorrent/`)

A low-level BitTorrent client MVP built from scratch without external
BitTorrent libraries.

Implemented features include:
- Bencode parsing and validation
- SHA1 info-hash generation
- HTTP & UDP tracker communication
- Peer discovery
- BitTorrent handshake negotiation
- Piece/block downloading
- SHA1 piece verification
- Stateful terminal observability dashboard

➡️ Detailed documentation:
[View Full BitTorrent Documentation →](./3_bittorrent/README.md))

---

## Design Principles

### Grammar Over Guessing

All protocol traversal follows protocol grammar rules instead of raw
byte scanning or heuristic parsing.

### Identity Before Meaning

Torrent identity is derived directly from raw bytes before decoding
or interpretation occurs.

### Separation Of Concerns

Networking, protocol parsing, identity computation, and presentation
layers remain intentionally separated.

### Protocol Correctness First

The project prioritizes correctness, observability, and architectural
clarity over performance or feature completeness.

---

## Current Status

### HTTP Layer
- ✅ Raw HTTP exploration complete

### TCP Layer
- ✅ TCP framing and state machine experiments complete

### BitTorrent Layer
- ✅ Torrent metadata parsing
- ✅ HTTP tracker communication
- ✅ UDP tracker communication
- ✅ Peer discovery
- ✅ BitTorrent handshake implementation
- ✅ Piece downloading
- ✅ SHA1 piece verification
- 🚧 Multi-piece downloading
- 🚧 Seeding/upload support
- 🚧 Magnet link support
- 🚧 DHT & PEX support

---

## What This Repository Focuses On

This project intentionally emphasizes:

- Networking fundamentals
- Binary protocol parsing
- Stateful protocol design
- Event-driven architecture
- Layered system organization
- Incremental protocol implementation
- Observability and debugging

rather than:
- maximum download throughput
- production-grade optimization
- feature completeness

---

## Why This Repository Exists

Many networking and protocol implementations fail due to subtle mistakes such as:

- Hashing decoded or re-encoded data
- Treating TCP like packet-based transport
- Mixing protocol parsing with transport logic
- Ignoring fragmented stream behavior
- Coupling observability directly to networking layers
- Treating protocols as data formats instead of state machines

This repository exists to deeply understand and avoid those pitfalls
through manual implementation and architectural separation.

---

## Technologies Used

- Node.js
- TCP sockets (`net`)
- UDP sockets (`dgram`)
- Event-driven architecture
- SHA1 hashing
- Binary buffer manipulation

---

## Future Roadmap

### BitTorrent Improvements
- Parallel peer racing
- Multi-piece downloading
- Rarest-first piece selection
- Request pipelining
- Persistent file storage
- Upload/seeding support
- Magnet links
- DHT implementation
- Peer Exchange (PEX)

### Tooling & Observability
- Richer CLI dashboard
- Transfer speed monitoring
- Verbose/debug logging modes
- Interactive torrent selection
- Better terminal visualization

---

## Disclaimer

This repository was built for educational purposes to understand networking
protocols and systems-level behavior internally.

Please use responsibly and only download/share content you legally have
the right to access.

---

## Author

Built by Lastmile04 as a deep dive into:
- networking protocols
- systems-level thinking
- event-driven architecture
- low-level protocol implementation
