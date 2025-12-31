# Error Scenarios

## What this covers
This section explores how servers should handle invalid or unexpected
client input without crashing or entering an inconsistent state.

## Why this matters
Servers must assume that all external input is unreliable.
Clients can send malformed data, incomplete requests, or intentionally
hostile payloads.

Understanding this is essential for:
- keeping the server stable under bad input
- returning meaningful error responses to clients
- preventing crashes and undefined behavior
- building a foundation for secure networking code

## Key ideas
- Servers must never trust client input
- Invalid requests are expected, not exceptional
- Errors should be handled explicitly and early
- A failed request should not affect other active requests
- Proper status codes communicate failure clearly

## Conceptual model
A server processes untrusted data at its boundary.
Each request must be validated, and failures should be contained to
that request only, allowing the server to continue operating normally.
