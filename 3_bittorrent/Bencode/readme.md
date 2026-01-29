## Architecture Overview: Torrent Parsing Pipeline

This project implements a **protocol-correct BitTorrent parsing pipeline** with a strict separation of concerns between validation, identity extraction, and decoding.

Rather than immediately decoding a `.torrent` file into objects, the parser treats it as a **binary protocol with grammar and identity constraints**, ensuring correctness at every stage.

---

### High-Level Pipeline

Raw Bytes (.torrent file)
↓
Bencode Validation
↓
Info Dictionary Boundary Extraction
↓
Info Hash Computation
↓
(Optional) Full Decode to IR

Each stage has a single responsibility and relies on the guarantees of the previous stage.

---

### 1. Bencode Validation (Admissibility)

The `validator` module performs **strict grammar validation** on the entire file:

- Verifies correct bencode structure
- Enforces semantic rules (no leading zeros, valid integers, proper terminators)
- Rejects malformed or truncated input early

Once validation succeeds, the rest of the pipeline can safely assume the input is **complete and canonical bencode**.

> This stage answers: *“Is this input allowed by the protocol?”*

---

### 2. Info Dictionary Extraction (Identity)

The `getInfoSection` logic extracts the **exact byte range** of the `info` dictionary *without decoding it*.

Key properties of this approach:

- Dictionary keys are discovered via **grammar walking**, not raw byte scanning
- Only **top-level dictionary keys** are inspected
- The `info` key is matched using **raw payload bytes**, not decoded strings
- Nested structures are skipped structurally and never inspected

This avoids common protocol bugs such as accidentally matching `"info"` inside string values.

> This stage answers: *“Which exact bytes define this torrent’s identity?”*

---

### 3. Info Hash Computation (Identity Derivation)

The extracted raw `info` dictionary bytes are passed directly to the hashing step.

Important invariants:

- No decoding
- No re-encoding
- No normalization or transformation

The hash is computed over the **original byte sequence**, exactly as required by the BitTorrent specification.

> This stage answers: *“What is the immutable identity of this torrent?”*

---

### 4. Optional Decode (Meaning)

Only after identity-sensitive operations are complete does the pipeline decode the torrent into an intermediate representation (IR).

Decoding is used for:
- Reading metadata
- File lists
- Tracker URLs
- Client logic

Decoding is **never used** for hashing or identity checks.

> This stage answers: *“What does this torrent describe?”*

---

## Design Principles

- **Grammar over guessing**: All traversal follows bencode grammar rules
- **Identity before meaning**: Hashing happens before decoding
- **Single-responsibility modules**: Each stage does one job well
- **Protocol correctness first**: Convenience and performance come second

---

## Why This Matters

Many torrent implementations fail due to subtle protocol mistakes such as:

- Raw byte scanning for `"info"`
- Re-encoding dictionaries before hashing
- Mixing validation, decoding, and hashing logic

This project avoids those pitfalls by enforcing **clear phase boundaries** and **strict invariants**, resulting in a robust and protocol-correct implementation.
