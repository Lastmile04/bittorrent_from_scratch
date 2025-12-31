# Server Lifecycle

## What this covers
Understand how an HTTP server starts, handles requests, and remains alive after responding.

## Why this matters
Server are long-lived processes. Responding to request does not terminate the server - it continues running till the event loop has active work or listeners

## Key ideas
- `server.listen()` registers a long-lived event source
- incoming requests trigger the request handler asynchronously
- The server stays alive because Node's event loop is still active

## Conceptual model
A server is not a function call -  it is an event-driven process that reacts to incoming connection over time.