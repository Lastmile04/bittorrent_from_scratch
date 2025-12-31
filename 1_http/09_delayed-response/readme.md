# Async Behavior

## What this covers
This section explores the asynchronous nature of HTTP servers in Node.js
and how requests are handled without blocking the server.

## Why this matters
A server must be able to handle multiple clients at the same time.
If one request takes longer to process, it should not prevent other
requests from being handled.

Understanding this is essential for:
- building scalable servers
- reasoning about concurrency without threads
- understanding how delays affect request handling
- avoiding assumptions about execution order

## Key ideas
- Request handling is event-driven
- Long-running operations do not block the server
- Multiple requests can be in progress simultaneously
- Completion order does not equal arrival order

## Conceptual model
Each request is handled independently.
When a request waits on I/O or timers, the server continues processing
other incoming events. Work resumes only when the operation completes.
