# TCP Foundations

## What this covers
This section explores TCP from the perspective of a server, using only Node.js core modules.
The goal is not to build applications, but to understand how byte streams behave once HTTP
abstractions are removed.

It covers:
- raw socket lifecycle
- chunked data delivery
- message framing
- binary protocols
- protocol state machines

This is the lowest layer before building BitTorrent itself.

## Why TCP matters
TCP is the transport layer everything else depends on.

Unlike HTTP, TCP provides:
- no message boundaries
- no structure
- no parsing
- no semantics

It only guarantees:
- ordered delivery
- reliable transmission
- backpressure via flow control

Everything else is the application’s responsibility.

## Key ideas
- TCP is a continuous byte stream, not a message channel
- One `data` event does **not** equal one logical message
- Data can arrive:
  - split
  - merged
  - delayed
  - buffered internally (but delivered in order)

Applications must:
- buffer incomplete data
- frame messages manually
- validate protocol rules
- handle partial input safely

## Conceptual model
A TCP server is a long-lived, event-driven process that reacts to:
- connections
- incoming byte chunks
- backpressure signals
- connection teardown

At this layer:
- bytes arrive without meaning
- structure must be imposed
- state must be tracked per connection

Protocols are not formats — they are state machines over a byte stream.

## What this enables next
Understanding TCP at this level makes it clear why:
- parsing must be incremental
- incomplete messages must be rejected or deferred
- offsets must roll back correctly
- buffer management is critical
- protocol bugs are silent and dangerous

This foundation is required for:
- Bencode decoding
- `.torrent` file parsing
- tracker communication
- BitTorrent peer wire protocol
- correct `info_hash` computation

Everything above this layer assumes TCP correctness.
