# Error Scenarios

## What this covers
This section explores how an HTTP server should handle invalid or
unexpected client input without crashing or entering an inconsistent state.

## Why this matters
Servers operate at a trust boundary.
Any data received from a client can be malformed, incomplete, or invalid,
and must be handled defensively.

Understanding this is essential for:
- preventing server crashes on bad input
- returning meaningful error responses
- isolating failures to a single request
- building resilient network services

## Key ideas
- Client input must never be trusted
- Invalid requests are normal, not exceptional
- Errors should be detected and handled explicitly
- A failed request must not affect other requests
- Status codes communicate failure semantics to clients

## Conceptual model
Each request is an independent interaction with untrusted data.
The server validates input, handles failures locally, and continues
operating regardless of individual request errors.
