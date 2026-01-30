# bittorrent_from_scratch

A from-scratch exploration of **network protocols** — building HTTP, TCP, and BitTorrent step by step using **Node.js**, with a strong focus on **protocol correctness, byte-level behavior, and clean architecture**.

This repository is not a production client.  
It is a **learning-driven, protocol-first implementation** aimed at understanding *how things actually work under the hood*.

---

## Project Structure

Each top-level folder represents a **protocol layer or milestone**, built independently and incrementally.

bittorrent_from_scratch/
├── 1_http/ # HTTP fundamentals from raw sockets
├── 2_tcp/ # TCP behavior, framing, state machines
├── 3_bittorrent/ # BitTorrent protocol (current focus)


Each stage builds on concepts from the previous one.

---

## Current Focus: BitTorrent (`3_bittorrent/`)

The BitTorrent implementation is structured around **clear protocol layers**, rather than ad-hoc parsing.

3_bittorrent/
├── identity/ # Torrent identity & admissibility
├── codec/ # Bencode encoding / decoding
├── transport/ # TCP networking primitives
├── app/ # Orchestration / CLI entry points
├── samples/ # Sample .torrent files


### Identity Layer (Core)
Responsible for defining *what a torrent is*:

- **Bencode validation** (grammar + semantic rules)
- **Exact `info` dictionary extraction**
- **Protocol-correct SHA-1 info hash computation**

Identity is derived from **raw bytes**, not decoded structures.

---

### Codec Layer
- Implements **bencode encode/decode**
- Used only when *meaning* is required
- Never used for identity or hashing

---

### Transport Layer
- TCP socket handling
- Byte streaming
- No protocol knowledge

---

### App Layer
- Entry points / loaders
- Wires identity, codec, and transport together
- No protocol logic lives here

---

## Design Principles

- **Grammar over guessing**  
  All traversal follows protocol grammar rules — no raw byte scanning.

- **Identity before meaning**  
  Hashing happens on raw bytes, *before* decoding.

- **Separation of concerns**  
  Identity, codec, transport, and application logic are strictly separated.

- **Protocol correctness first**  
  Convenience and performance come second.

---

## Why This Repo Exists

Many protocol implementations fail due to subtle mistakes such as:

- Hashing decoded or re-encoded data
- Scanning byte patterns instead of grammar walking
- Mixing identity logic with networking
- Treating protocols as data formats instead of state machines

This project intentionally avoids those pitfalls by making **architecture explicit**.

---

## Status

- ✅ HTTP fundamentals explored
- ✅ TCP behavior and state machines implemented
- ✅ BitTorrent identity layer complete (validation + info hash)
- 🚧 Peer protocol & handshake (in progress)

---

## Disclaimer

This repository is for **learning and exploration**.
It is not intended for production use.

---

## Author

Built by **Lastmile04** as a deep dive into network protocols and systems-level thinking.
