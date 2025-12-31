# Backpressure & Request Size Limits

## What this covers
This section explores how servers protect themselves from large or
malicious request bodies by rejecting data early during streaming.

## Why this matters
Request bodies arrive as streams.
If a server waits until the entire body is received before validating size,
it risks excessive memory usage and denial-of-service attacks.

Understanding this is essential for:
- protecting server resources
- handling large or slow uploads safely
- rejecting invalid requests as early as possible
- building secure and scalable network servers

## Key ideas
- Request bodies are streams, not complete payloads
- Servers must track total bytes received
- Size limits should be enforced during streaming
- Early rejection prevents unnecessary memory usage
- Destroying the request stream is a form of backpressure

## Conceptual model
The server monitors a byte stream in real time.
Once a defined limit is exceeded, the server terminates the request
immediately, signaling the client to stop sending data.
