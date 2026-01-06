# Chunked Data

## What this covers
This section explores how data arrives over TCP as arbitrary byte chunks and how those
chunks must be accumulated in a buffer to reconstruct complete messages.

Because TCP delivers bytes without structure or boundaries, applications must:
- accumulate partial data
- detect when a full message is available
- defer parsing until enough bytes have arrived

This section covers:
- per-connection buffering
- chunk accumulation
- length-prefixed framing
- safe handling of partial input

## Why this matters
TCP does not provide:
- message boundaries
- completeness guarantees per `data` event
- semantic meaning of bytes

Parsing data as it arrives—without ensuring completeness—leads to:
- corrupted state
- protocol desynchronization
- silent bugs that surface later

Correct chunk handling ensures that:
- incomplete data is never partially parsed
- invalid data is rejected early
- processed bytes are removed from the buffer

## Key ideas
- A `data` event is **not** a message
- Incoming chunks may contain:
  - partial messages
  - multiple messages
  - message boundaries split across events
- Applications must:
  - buffer data per connection
  - locate framing markers (e.g. length prefixes)
  - parse only when a full frame is present
  - discard consumed bytes

Offset tracking and buffer slicing are essential to avoid reprocessing old data.

## Conceptual model
Think of each chunk as a LEGO piece:

- Alone, it has no meaning
- Only when enough pieces are collected does the structure emerge
- Protocol rules define:
  - how pieces fit together
  - when construction is allowed
  - when invalid pieces must be discarded

In practice:
- bytes arrive in chunks
- buffers accumulate bytes
- framing defines boundaries
- protocols give meaning

