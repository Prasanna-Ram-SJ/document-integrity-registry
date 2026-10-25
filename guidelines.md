# General guidelines - Document Integrity Registry

Read Gemini.md before editing. The user-supplied visual system is authoritative for appearance; the existing application and its local instructions are authoritative for stack, routes, copy, and established behavior.

## 1. Inspect and preserve

1. Inspect the actual Antigravity target repository, local instructions, package manifest and lockfile, framework, routes, components, styles, assets, copy, and installed Tezos dependencies.
2. Preserve the current stack, package manager, routes, copy, component conventions, and behavior. Do not replace working architecture to match illustrative design examples.
3. Make the smallest complete change that delivers the requested app.
4. If and only if the target repository is truly empty, use Vite + React + TypeScript + plain CSS. Do not add a visual framework or unrelated dependencies.
5. Use the actual website repository open in Antigravity and this product brief as the source of truth; ignore unrelated material outside that project.

## 2. Product facts, file handling, and data

- The browser computes SHA-256 from the selected file bytes with the Web Crypto API. Convert the result into exactly 64 lowercase hexadecimal characters.
- Read the file locally with the browser File API. Do not upload, send, cache, or log its contents.
- Store only the record ID, label, SHA-256, registrar address, and registration timestamp on chain.
- Generate the record ID automatically as a UUID. Show it after a successful registration and provide a copy action. Keep it stable through a pending/retry flow unless the contract reports a collision.
- Use the fixed SmartPy interface: register with one named structured value containing record_id, label, sha256; get_record(record_id) returns an optional record with label, sha256, registrar, registered_at.
- Use a short, non-empty printable ASCII label compatible with SmartPy strings. Centralize any input limit and mirror the same limit in the SmartPy contract when it is authored. Do not mutate the label invisibly.
- For verification, look up by the supplied record ID, then compare the file's calculated digest with the stored digest. Keep not-found, match, and mismatch distinct.
- A match means the bytes match the fingerprint stored under that ID. It does not prove authorship, approval, authenticity, safety, or that another copy is counterfeit.
- Do not show fake data or simulated success as a real chain result. If a development mock is necessary, it must be opt-in, isolated, and unmistakably labeled as simulation.

## 3. SmartPy, Tezos, and Temple

- Use Tezos Shadownet only. Never default to Mainnet or Ghostnet.
- Reuse the existing Tezos integration. If there is none, use Taquito and Beacon wallet support for Temple.
- Keep contract calls in a small typed adapter/service module; do not construct Tezos parameters or make RPC calls independently in UI components.
- Keep network configuration in one place. If no current convention exists, use these public configuration names:
  - VITE_TEZOS_NETWORK=shadownet
  - VITE_TEZOS_RPC_URL=https://rpc.shadownet.teztnets.com
  - VITE_DOCUMENT_REGISTRY_ADDRESS=
  - VITE_DOCUMENT_REGISTRY_ADMIN_ADDRESS=
- The empty address is intentional until the user supplies the deployed Shadownet KT1. Do not use the temporary SmartPy simulation address.
- Registration is a write: start only after an explicit user action, request Temple approval, show pending/confirmed/rejected/failed states, and show a transaction hash only if returned by the client.
- Verification is read-only: it must not ask for a signature or spend tez.
- The final SmartPy source and compiled contract types are authoritative. If the source disagrees with the fixed interface, stop and report the discrepancy rather than silently adapting or renaming.
- A configured admin address may be used for early UI feedback, but the contract must enforce authorization. Never put wallet secrets in source, VITE variables, local storage, or logs.
- If the address or RPC configuration is missing, show a clear not-configured state and prevent real-chain calls. Never substitute a fake contract.

## 4. User flows and states

### Registration

- Provide an accessible local file picker, a short label input, and a nearby statement that the file stays in the browser.
- Show selected filename and computed SHA-256; allow clearing or replacing the file.
- Generate the record ID automatically; do not ask the user to type it during registration.
- Before opening Temple, show the label, record ID, and fingerprint the transaction will register.
- Require the authorized Temple account and Shadownet. Explain that a testnet write needs test tez.
- After chain confirmation show the record ID, label, fingerprint, registrar, timestamp when available, and copy controls for the record ID and fingerprint. Show a transaction hash only if the wallet client returned one.
- Handle unauthorized wallet, duplicate ID, rejected transaction, RPC failure, invalid input, and pending transaction separately and plainly.

### Verification

- Provide a local file picker and a record-ID input.
- Hash locally, call the read-only view, and compare normalized digests exactly.
- Show one primary outcome:
  - MATCH: record exists and fingerprints are equal.
  - MISMATCH: record exists but fingerprints differ. Explain only that the file differs from the registered version.
  - RECORD NOT FOUND: no record exists for the ID. Invite the person to check the ID.
- Do not call an unknown ID a mismatch. Do not call a mismatch counterfeit or unsafe.
- Verification must work without wallet connection.

### General interaction

Provide empty, loading, success, failure, disconnected, wrong-network, and contract-not-configured states. Disable actions while required inputs are missing or a transaction is pending. Announce asynchronous status updates accessibly. Use friendly actionable copy; keep stack traces and RPC internals out of normal user UI. Start wallet connection only after an explicit Connect Temple wallet action. Show the connected public address shortened with a copy option, and offer disconnect when supported by the existing connector. Never connect automatically on page load.

## 5. Visual system supplied by the user

### Identity and composition

- Open near-white page, dark tightly set sans-serif headings, electric blue for meaningful actions and selected states.
- Pair broad reading areas with compact diagrams and rounded white cards; use two substantial dark passages where content supports them.
- If starting with a blank app, use this sequence: restrained header; two-column hero with approximately 1.45:1 text-to-illustration proportion; ruled strip of factual product attributes; pale functional Register/Verify area; continuous dark process-and-benefits field; pale explanation of what a match does and does not mean; dark closing/footer.
- Align subsequent sections with the hero content width. Adapt to existing routes and page structure instead of forcing this sequence into an existing app.
- Hero diagram shows real concepts: selected file -> local SHA-256 -> labeled Tezos record and record ID -> later comparison. Build it in SVG/CSS or use existing diagram components.
- Do not use generic stock photography, fabricated product screens, statistics, customer logos, endorsements, pricing, or unsupported guarantees. Use only sections supported by the project.
- Forms use white cards with fine borders and restrained shadows. Do not turn every section into a card.

### Typography and colors

- Use Host Grotesk for display, headings, quotations, and large figures; use Instrument Sans for paragraphs, labels, and controls. Load both directly and provide a legible sans-serif fallback.
- Display type is bold with tight tracking and compact line-height. Reading copy has relaxed leading; small labels remain readable and high contrast.
- Declare and use these exact CSS custom properties and values:

~~~css
:root {
  --dp-color-ground: #fcfcfd;
  --dp-color-ink: #16191f;
  --dp-color-ink-secondary: #454c58;
  --dp-color-ground-muted: #f3f4f6;
  --dp-color-rule: #dde0e6;
  --dp-color-accent: #074ce0;
  --dp-color-field: #16191f;
  --dp-color-on-field: #fcfcfd;
  --dp-color-on-field-secondary: #d0d4dd;
  --dp-color-panel: #ffffff;
  --dp-color-on-accent: #ffffff;
  --dp-typography-fallback: sans-serif;
  --dp-typography-body: 16px;
  --dp-typography-interface: 15px;
  --dp-typography-small: 14px;
  --dp-typography-metadata: 13px;
  --dp-typography-label: 12px;
  --dp-typography-body-leading: 1.6;
  --dp-spacing-grid-gap: 24px;
  --dp-radius-panel: 12px;
  --dp-border-hairline: 1px;
  --dp-motion-interaction: 160ms;
  --dp-motion-easing: ease-out;
}
~~~

- Cards: white surface, fine border, 12px radius, restrained downward shadow. Primary button: blue; secondary: pale outlined. Provide comfortable touch area and visible focus.
- Keep blue attached to actions, selected states, and small relevant diagram accents. Keep reading fields quiet. Use a slight material gradient and orbit lines only locally in the diagram.
- Avoid generic photography when the diagram explains the product better.

### Responsive and motion

- Around 1050px, tighten gaps but preserve column relationships.
- At 760px and below, stack the hero, prose pairs, cards, steps, and footer columns. Factual strips and short features may remain two columns.
- At 480px and below, feature and benefit lists are single column, footer groups two columns, diagram below hero text. Keep all actions available and prevent horizontal overflow.
- Use brief 160ms ease-out hover/press transitions. Hover may lift controls slightly. Keep the hero diagram still. No entrance sequence or continuous animation.
- Honor prefers-reduced-motion by removing transitions and press movement.

## 6. Accessibility and quality

- Use semantic landmarks, logical heading order, native labeled inputs, clear button names, and logical reading order at each width.
- All controls work by keyboard. Maintain a strong visible focus outline; never remove it.
- Maintain text contrast and readability; always pair status color with an explicit word/icon.
- Add an aria-live region for hash, wallet, transaction, and verification status updates.
- Respect zoom and reduced motion. Do not rely on hover for essential instructions.
- Centralize CSS tokens, network constants, and contract fields.

## 7. Verification and handoff

- Follow existing lint, type-check, test, and build scripts. Add focused coverage using the existing test setup for SHA-256 formatting, UUID handling, optional-record normalization, and match/mismatch/not-found behavior. Do not add a heavy testing framework.
- Manually inspect desktop, approximately 760px, and approximately 480px layouts, keyboard focus, and reduced motion.
- Verify registration asks for a signature only after explicit action; verification creates no transaction.
- If no deployed KT1 is supplied, state that live-chain registration could not be verified. Never call a mock or simulator a real Shadownet result.
- Finish with files changed, flows implemented, configuration required (real Shadownet KT1 and public admin address), checks run, and any blocker.

## 8. Default copy and page structure

Preserve suitable existing copy and routes. Use the following starter copy only when the target project has no equivalent copy:

- Product name: Document Integrity Registry
- Hero heading: Know whether a shared document still matches its registered version.
- Supporting copy: Calculate a SHA-256 fingerprint in your browser, register it with a label on Tezos Shadownet, and later check a copy using its record ID.
- Primary action: Verify a document
- Secondary action: Register a version
- Factual strip: SHA-256 fingerprint; File stays in your browser; Tezos Shadownet
- Privacy note: Your file stays in this browser. Only its fingerprint and record details are registered.
- Limitation: A match confirms that the file matches the fingerprint registered under that record ID. It does not prove who created, approved, or published the file, and it does not certify safety or authenticity.

If and only if the target project is blank, build a focused single-page application with in-page Register, Verify, and How it works sections. Do not add a multi-page router. Use this section order: restrained header; two-column hero and real product-flow diagram; ruled factual strip; pale functional Register/Verify area; continuous dark How it works/process-and-benefits area; pale limitation explanation; dark closing/footer. Keep all content aligned to a consistent maximum width and preserve all actions at mobile sizes.

The How it works explanation must accurately show: select a file; compute its fingerprint locally; an authorized registrar signs a transaction that records the fingerprint, label, record ID, registrar, and time; later select a file and enter the record ID to compare. Do not invent product screens, adoption statistics, performance claims, customer logos, endorsements, or pricing.

## 9. Acceptance and handoff

The website task is complete only when:

- Existing stack, routes, copy, and working behavior are preserved.
- The browser computes SHA-256 and no document bytes leave the browser.
- Contract method and field names exactly match the SmartPy interface.
- Registration is user-signed through Temple on Shadownet and remains admin-restricted on chain.
- Read-only verification needs no wallet and correctly distinguishes Match, Mismatch, and Record not found.
- An empty contract address never produces fake success.
- Design tokens, fonts, responsive behavior, accessibility, and reduced-motion preferences are implemented.
- Existing project checks pass, or remaining blockers are reported clearly.

At handoff, list changed files, working flows, configuration still needed (real Shadownet KT1 and public admin address), checks performed, and limitations.

## 10. Non-goals

Do not add accounts, file upload, file hosting, IPFS, machine learning, counterfeit detection, document editing, payment processing, pricing, marketing statistics, fabricated endorsements, or unrelated chain features unless the user asks.