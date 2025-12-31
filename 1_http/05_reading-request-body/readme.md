# Reading Request Body

## What this covers
This section explores how HTTP request bodies are delivered as
streams of raw bytes rather than complete payloads.

## Why this matters
Node.js does not receive request bodies all at once.
Data arrives incrementally as chunks over a stream, and servers
must process or accumulate these chunks correctly.

Understanding this is essential for:
- handling large or slow client uploads
- avoiding unnecessary memory usage
- validating and parsing data safely
- implementing early rejection and backpressure

## Key ideas
- Request bodies are streams, not strings or objects
- Data can arrive in multiple chunks or a single chunk
- Chunk boundaries are arbitrary and not meaningful
- Parsing must happen after the full body is received (unless streaming is intended)

## Conceptual model
A request body is a byte stream emitted over time.
The server listens for data events, accumulates or processes chunks,
and only interprets the data once the stream signals completion.
