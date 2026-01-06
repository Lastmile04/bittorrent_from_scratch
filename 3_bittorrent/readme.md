# BitTorrent Protocol

This section implements the BitTorrent protocol **from scratch**, step by step,
building directly on the TCP, framing, decoding, and state machine foundations
built earlier.

No libraries.
No shortcuts.
No protocol assumptions.

Everything here treats BitTorrent as what it really is:
a stateful binary protocol running over raw TCP.

---

## What this covers
This section incrementally builds the BitTorrent stack:

- Bencode decoding & encoding
- `.torrent` file parsing
- `info_hash` computation
- tracker communication
- peer handshake
- peer wire protocol
- request / piece lifecycle
- choking & unchoking logic

Each layer is implemented only after the layer below it is proven correct.

---

## Why BitTorrent
BitTorrent is one of the best real-world protocols to learn:

- raw TCP usage
- binary framing
- custom encodings
- strict protocol rules
- state-dependent message legality
- silent failure modes

If your foundation is wrong, BitTorrent will not crash —
it will simply **fail silently**.

That makes correctness mandatory.

---

## Design principles
- All parsing is **stream-safe**
- No partial values are ever committed
- Every protocol rule is enforced explicitly
- Invalid peers are dropped immediately
- State machines control legality, not parsers

If something “seems to work” but violates the spec, it is treated as broken.

---

## Structure
Each submodule focuses on **one protocol layer only**.

No cross-layer shortcuts.

BitTorrent/
├── bencode/
├── torrent-file/
├── tracker/
├── handshake/
├── peer-wire/
└── pieces/

---

## What this enables
Once this section is complete, the project will be able to:

- read real `.torrent` files
- compute correct `info_hash`
- talk to real trackers
- establish peer connections
- request and verify pieces
- follow the BitTorrent spec exactly

---

## Status
This section is actively under development.

Current focus:
- Bencode decoding correctness
- Stream safety
- Encoder symmetry (encode → decode)

Once Bencode is fully hardened, the protocol work begins in earnest.
