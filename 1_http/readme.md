# HTTP Foundation

## What this covers
This section explores HTTP from the perspective of a server, using only Node.js core modules. The goal is not to build applications, but to understand how requests and responses actually flow through the system.

## Why start with HTTP
HTTP is built on top of TCP and hides many important details
- connection lifecycle
- streaming data
- backpressure
- event-driven execution

Working with HTTP first makes these concepts visible in a familiar context,
before dropping down to raw TCP

## Key ideas
- An HTTP server is a long-lived, event-driven process
- Requests and response are streams, not complete objects
- Data arrives in chunks and must be handled incrementally
- Servers must validate and reject bad input early
- Status codes and headers control client behavior
- Asynchronous work does not block the server

## Conceptual model
An HTTP server is not a sequence of request handlers.
It is an event emitter that reacts to incoming connections, streams data over time,
and remains alive as long as the event loop has active work.

## What this enables next
Understanding HTTP at this level makes it clear its abstractions end.
This provides the foundation for moving to raw TCP, where:
- message boundaries are no longer defined
- framing is done manually
- protocol rules must be enforced explicitly

The next step is to remove HTTP entirely and work directly with TCP sockets.
