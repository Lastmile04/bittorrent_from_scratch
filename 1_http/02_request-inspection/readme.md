# Request Inspection

## What this covers
Inspecting incoming HTTP requests at the raw Node.js level by logging
the method, URL, and headers for each request.

## Why this matters
Frameworks hide most request details behind abstractions.
Inspecting requests directly reveals what the server actually receives
and how different clients shape HTTP traffic.

Understanding this is essential for:
- debugging unexpected behavior
- implementing routing logic
- validating and securing inputs
- reasoning about client–server contracts

## Key ideas
- An HTTP request is metadata + optional body
- Method and URL define intent
- Headers are client-dependent and not guaranteed to be uniform
- Browsers, API clients, and tools like curl send different headers by default

## Conceptual model
A request is not a single object created by the server.
It is an event carrying protocol-level data emitted by the HTTP server,
and applications must interpret it correctly before responding.
