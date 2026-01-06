# Protocol State Machines

## What this covers
This section introduces **protocol state machines** — the final and most critical layer when working directly over raw TCP.

It focuses on enforcing **when** messages are allowed, not just **how** they are structured.

It covers:
- per-connection state tracking
- legal vs illegal message sequences
- explicit state transitions
- fail-fast protocol enforcement
- connection teardown on violations

This is where a byte-correct protocol becomes a **correct protocol**.

---

## Why this matters
A protocol is **not just a message format**.

Two identical messages can mean completely different things depending on:
- connection phase
- prior messages
- handshake status
- negotiated capabilities

Without state machines:
- messages are accepted at the wrong time
- protocol confusion occurs
- malformed clients corrupt server state
- subtle DoS vectors appear
- bugs do not crash — they silently break logic

Most real-world protocol vulnerabilities exist because **state was not enforced**.

---

## Key ideas

- **Protocols are stateful**
  - Valid messages depend on connection phase
  - Order matters as much as structure

- **Per-connection state**
  - Each socket maintains its own protocol state
  - State is never shared between connections

- **Explicit transitions**
  - States only change in well-defined ways
  - Unexpected messages are rejected immediately

- **Fail fast**
  - Illegal message → close connection
  - No recovery from protocol violations

- **Decoding ≠ Legality**
  - A message can be syntactically valid but semantically illegal
  - State machines enforce semantic correctness

---

## Conceptual model
A protocol state machine sits **above decoding and framing**.

The stack looks like this:

TCP byte stream
↓
Buffering & framing
↓
Decoding (structure)
↓
State machine (legality)
↓
Application logic


The state machine answers one question:

> “Is this message allowed **right now**?”

If the answer is no, the connection is terminated.

---

## Example states
A typical protocol may have states like:

- `CONNECTED`
- `HANDSHAKE`
- `READY`
- `ACTIVE`
- `CLOSING`
- `CLOSED`

Each state defines:
- allowed message types
- required transitions
- forbidden actions

Example rule:

Before handshake:
❌ DATA
❌ REQUEST
✅ HELLO / PING

After handshake:
✅ DATA
✅ REQUEST
❌ HANDSHAKE AGAIN


Same TCP stream.
Same binary framing.
Different legality.

---

## Enforcement strategy

For every decoded message:

1. Identify current connection state
2. Check if msgID is allowed in this state
3. If allowed:
   - process message
   - transition state if needed
4. If not allowed:
   - log violation
   - destroy socket immediately

No exceptions.
No partial handling.
No silent ignores.

---

## Why TCP does not do this for you
TCP guarantees:
- ordered delivery
- reliability
- flow control

TCP does **not** understand:
- message meaning
- protocol phases
- handshakes
- illegal sequences

State enforcement is **always** the application’s responsibility.

---

## What this enables next
With state machines enforced, the protocol becomes robust enough for:

- BitTorrent handshake flow
- peer wire protocol legality
- choking / unchoking rules
- request / piece ordering
- tracker communication
- silent peer disconnect reasoning

This is the difference between:
> “It works sometimes”  
and  
> “It works under adversarial conditions.”

---

## One-line takeaway
**Protocols are state machines — not parsers.**
