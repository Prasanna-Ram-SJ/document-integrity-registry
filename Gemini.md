# Document Integrity Registry - Gemini project instructions

Read this file and guidelines.md before changing the application. Follow the implementation prompt supplied in the Antigravity conversation and any repository-specific instructions already present in the actual target project.

## Product

Build the Document Integrity Registry for student clubs and project teams. It lets an authorized registrar register a short document label and SHA-256 fingerprint on the Tezos Shadownet test network. Later, a person selects a file and enters that registration's record ID; the browser hashes the selected file and compares it with the fingerprint stored for that ID.

The selected file is read and hashed in the browser. Never upload or persist the file. Only the record ID, short label, fingerprint, registrar address, and registration timestamp belong in the registry.

A match proves only that the selected file's bytes match the fingerprint associated with a particular record ID. It does not establish that a file is authentic, safe, original, approved, or counterfeit.

## Fixed contract interface

The website and the separately authored SmartPy contract must use these exact names and fields unless the user explicitly changes them:

- Write entrypoint: register
- Its single structured parameter contains record_id, label, and sha256, all strings.
- Read-only on-chain view: get_record(record_id)
- A found record contains label, sha256, registrar, and registered_at. A missing record is the empty option value.
- Registration is restricted by the contract to its configured admin address. The on-chain check is authoritative.
- The browser creates a UUID record ID. Do not ask users to invent one.

Do not rename entrypoints, fields, or UI result states. Do not infer positional field order from SmartPy's visual display. Use the actual SmartPy source and compiled Michelson/type information for encoding and decoding.

## Network and wallet

- Target Tezos Shadownet only. Never silently fall back to Mainnet or Ghostnet.
- Preserve the existing wallet integration. If none exists, use Taquito with Beacon wallet support for Temple.
- A wallet signature is required for registration. Verification is a read-only lookup and must work without connecting a wallet.
- Never request, store, log, or expose a password, seed phrase, private key, or other wallet secret.
- The SmartPy simulator's temporary KT1 address and test account are not deployment values. The final contract has not yet been deployed. Keep the contract address configurable and empty until the user supplies the real Shadownet KT1 address.
- Never fabricate a deployment, record, balance, transaction hash, or successful transaction.

## Required behavior

- Registration: user chooses a local file and supplies a label; browser computes SHA-256 and generates a record ID; an authorized registrar reviews and signs in Temple; after chain confirmation show the record details and a copy-ID action.
- Verification: user chooses a local file and enters a record ID; browser computes SHA-256; app calls get_record and compares fingerprints.
- Show exactly three primary outcomes: MATCH, MISMATCH, and RECORD NOT FOUND. An unknown ID is not a mismatch.
- State clearly when contract configuration, wallet connection, network selection, transaction confirmation, or RPC access is missing or failed.

Inspect the actual target repository before editing. Preserve its framework, package manager, routes, copy, dependencies, and component conventions. Keep the product focused. Do not add accounts, file hosting, IPFS, machine learning, counterfeit detection, document editing, or unrelated blockchain features unless the user asks.