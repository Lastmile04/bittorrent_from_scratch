# Method Awareness

## What this covers
This section explores HTTP methods (verbs) and how they communicate
the intent of a client to the server.

## Why this matters
An HTTP request is not defined by its URL alone.
The method specifies *what kind of action* the client is requesting,
and servers must interpret and enforce this meaning correctly.

Understanding this is essential for:
- interpreting client intent accurately
- deciding how a server should respond to different requests
- enforcing correct behavior for read vs write operations
- understanding why method + URL together define a request

## Key ideas
- HTTP methods describe intent, not implementation
- The same URL can represent different actions based on the method
- Servers must explicitly handle or reject unsupported methods
- Method handling is part of the protocol contract between client and server

## Conceptual model
An HTTP request answers two questions:
1. *What resource is being targeted?* (URL)
2. *What action is being requested?* (method)

Routing and request handling only make sense when both are considered together.
