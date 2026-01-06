# Event Model

## What this covers
This section explores how HTTP servers in Node.js are built on an
event-driven model and how requests and responses are emitted as events.

## Why this matters
Understanding the event model explains why Node.js can scale efficiently
with a single thread and how servers handle many concurrent connections.

Understanding this is essential for:
- reasoning about request lifecycle
- tracking active requests
- understanding response completion
- transitioning to raw TCP and custom protocols

## Key ideas
- HTTP servers emit events internally
- Requests and responses are event-driven objects
- Completion is signaled explicitly, not implicitly
- Server scalability comes from non-blocking event handling

## Conceptual model
A server reacts to events.
Incoming requests trigger handlers, responses emit completion events,
and the server remains idle until the next event arrives.
