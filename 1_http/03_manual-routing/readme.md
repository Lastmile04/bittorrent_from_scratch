# Manual Routing

## What this covers
This section explores how HTTP routing works without frameworks by
manually handling different paths and HTTP methods.

## Why this matters
Frameworks make routing look trivial, but doing it manually reveals
how each request is evaluated and matched before a response is sent.

Understanding this is essential for:
- deciding behavior based on method + path
- understanding what HTTP methods actually represent
- controlling response status codes and headers
- seeing how routing logic is implemented internally by frameworks

## Key ideas
- Routing is a conditional decision based on method and URL
- The HTTP method expresses the client’s intent
- The path identifies the requested resource
- Status codes and headers are part of the response contract
- A server must explicitly handle unknown routes

## Conceptual model
Routing is a series of explicit checks that determine whether a request
is valid, supported, and how the server should respond to it.
