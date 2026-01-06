# Bencode

This module implements **Bencode**, the serialization format used by BitTorrent,
with full support for streaming, partial data, and protocol correctness.

Bencode is the **first and most critical** layer of the BitTorrent protocol.

If this layer is wrong, everything above it lies.

---

## What this covers
This module focuses on **decoding and encoding Bencode values** safely over TCP.

It covers:
- integers
- byte strings
- lists
- dictionaries
- nested structures
- stream-safe decoding
- strict protocol validation

This implementation is designed to work with **arbitrary TCP chunking**.

---

## Why Bencode matters
Bencode is used everywhere in BitTorrent:

- `.torrent` files
- tracker responses
- peer messages
- metadata exchange
- `info_hash` computation

A single incorrect byte here leads to:
- invalid hashes
- wrong peers
- broken downloads
- silent protocol failure

Bencode must be **exact**, not approximate.

---

## Key ideas

- Bencode values are **binary**, not text
- Strings are length-prefixed byte sequences
- Containers are recursive and resumable
- Scalars are atomic and must restart on incomplete data
- Parsing must be **all-or-nothing**

Decoders return one of three outcomes:

- ✅ success → `{ value, nextOffset }`
- ⏳ incomplete → `{ incomplete: true, nextOffset }`
- ❌ error → protocol violation

---

## Decoder design rules

- No partial values are committed
- Incomplete values **do not advance offsets**
- Raw payload bytes must never re-enter the decoder loop
- Invalid formats immediately close the connection
- Offset rollback is explicit and intentional

Decoding is structural.
Legality is enforced later by state machines.

---

## Encoder symmetry
Correctness requires symmetry:

encode(value) → bytes
decode(bytes) → value


If this round-trip does not preserve structure exactly,
the implementation is considered incorrect.

---

## Current status
- ✔️ Stream-safe Bencode decoding
- ✔️ Strict integer validation
- ✔️ Length-prefixed string parsing
- ✔️ List & dictionary parsing
- 🔃 Encoder implementation (in progress)

The encoder will be added next to validate decode correctness
and prepare for real `.torrent` file generation and hashing.

---

## What this enables next
Once Bencode is complete, the next steps are:

- Parsing real `.torrent` files
- Extracting the `info` dictionary
- Computing `info_hash`
- Tracker requests
- First real BitTorrent handshake

This is the point where the protocol meets real data.
