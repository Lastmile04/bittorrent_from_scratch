# Message Framing

## What this covers
This section introduces **message framing** — the process of defining
clear boundaries inside a continuous TCP byte stream.

It focuses on:
- detecting message boundaries
- separating complete messages from partial data
- ensuring only full messages are passed to parsers

No semantic parsing happens here.
Only structure.

## Why this matters
TCP is a byte stream.
It does not preserve message boundaries.

This means:
- one message can arrive in multiple chunks
- multiple messages can arrive in one chunk
- chunk size has no relation to message size

Without framing:
- parsers receive incomplete data
- payload bytes are misinterpreted as protocol markers
- silent corruption occurs

Framing is what makes parsing safe.

## Key ideas
- TCP delivers bytes, not messages
- Framing defines **where a message starts and ends**
- A frame must be fully present before parsing
- Incomplete frames must be buffered and retried later
- Invalid framing is a protocol violation

At this layer:
- bytes still have no meaning
- only boundaries are enforced

## Conceptual model
Think of framing as drawing boxes around data in a stream.

TCP gives you a river of bytes.
Framing decides:

- how long a message is
- when a full message exists
- when parsing is allowed to begin

Only once a complete frame is extracted
can the parser safely interpret its contents.

## What this enables next
Once framing is correct:
- parsers receive complete inputs
- offsets can advance safely
- protocol rules can be enforced
- state machines become possible

Every higher layer assumes framing correctness.
