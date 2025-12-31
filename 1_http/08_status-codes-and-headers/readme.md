# Status Codes and Headers

## What this covers
This section explores how HTTP status codes and headers shape the
meaning of a response and define how clients interpret server behavior.

## Why this matters
HTTP is a protocol built on explicit signals.
Status codes describe the outcome of a request, while headers provide
metadata that controls how clients process the response.

Understanding this is essential for:
- communicating success or failure correctly
- controlling how responses are interpreted by clients
- debugging client–server interactions
- building predictable and standards-compliant APIs

## Key ideas
- Status codes describe the result of a request, not the data itself
- Headers are metadata that modify how requests and responses are handled
- Clients change behavior based on status codes
- Content-Type determines how a response body is interpreted
- Headers and status codes together form the response contract

## Conceptual model
An HTTP response consists of three parts:
1. A status code describing the outcome
2. Headers describing metadata and behavior
3. An optional body containing data

Clients rely on the status code and headers to decide how to process
the response before ever looking at the body.
