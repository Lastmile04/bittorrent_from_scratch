# Binary Protocol

## What this covers
This section introduces **binary protocols built directly on top of raw TCP**.

It focuses on defining a **deterministic wire format** so that arbitrary byte streams can be interpreted as meaningful messages.

It covers:
- length-prefixed framing
- message identifiers (msgID)
- binary payload handling
- safe buffering over TCP
- strict protocol validation
- request–response behavior without HTTP

This is the layer where bytes finally gain **semantic meaning**.

## Why this matters
TCP guarantees **reliable, ordered delivery of bytes** — nothing more.

It does **not** provide:
- message boundaries
- data types
- structure
- validation rules
- semantics

Without a binary protocol:
- partial messages corrupt state
- payload bytes may be misread as control data
- malformed input causes undefined behavior
- bugs become silent and extremely hard to trace

A binary protocol makes communication:
- explicit
- verifiable
- state-safe
- efficient

This is how real systems (BitTorrent, databases, game servers, RPC layers) operate.

## Wire format
Each message follows a strict layout:

[ length (4 bytes) ][ msgID (1 byte) ][ payload (N bytes) ]

- **length**  
  Total size of the message body (msgID + payload)

- **msgID**  
  Identifies how the payload should be interpreted

- **payload**  
  Opaque binary data whose meaning depends on the msgID

This structure is enforced for every message.

## Key ideas

- **Length-prefixed framing**
  - The server never reads beyond the declared length
  - Partial frames are buffered until complete

- **Message identity**
  - A single byte determines message meaning
  - Allows fast dispatch without inspecting payload

- **Opaque payloads**
  - Payload bytes are not parsed unless required
  - Can contain text, binary blobs, or hashes

- **Incremental decoding**
  - TCP may split or merge messages arbitrarily
  - Buffering is mandatory

- **Fail-fast validation**
  - Invalid lengths or unknown msgIDs immediately close the connection
  - Prevents protocol confusion and attacks

- **Symmetry**
  - Requests and responses share the same binary structure
  - Only the msgID changes behavior

## Conceptual model
A binary protocol is a **state machine over a byte stream**.

The server operates as follows:

1. Receive arbitrary chunks of bytes
2. Append them to a per-connection buffer
3. Check if a full frame exists
4. Validate length and msgID
5. Dispatch logic based on msgID
6. Generate a framed binary response
7. Remove processed bytes from the buffer

At this layer:
- bytes are no longer arbitrary
- structure is enforced
- errors are explicit
- state corruption is prevented

## What this enables next
With binary framing in place, higher-level protocols become possible:

- protocol handshakes
- state-dependent message legality
- BitTorrent peer wire protocol
- compact binary message exchange
- zero-copy payload handling
- safe, deterministic networking

Everything above this layer assumes:
**binary framing is correct and unambiguous.**

## One-line takeaway
**A binary protocol turns TCP’s byte stream into a language with rules.**
