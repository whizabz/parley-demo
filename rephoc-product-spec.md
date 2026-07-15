# Parley — Product Spec

## Overview

Parley is a conversational, AI-native interface for ad hoc reporting over insurance data. A person asks a question in plain language. The system answers with a short narrative interpretation and a generated report of cards (charts, metrics, tables, insight text). The person can keep asking follow-up questions, each producing a new version of the report, with full history preserved and revisitable.

The experience should never feel like a BI tool with a chat bolted on. It should feel like talking to an analyst who happens to produce reports as part of the conversation — calm, minimal at rest, and only as complex as the moment requires. The user should never be routed out of this interface into a separate backend tool (Databricks or otherwise) at any point in the flow, regardless of how the query is actually fulfilled behind the scenes.

---

## 1. Core experience

### 1.1 Home / empty state

- Centered chat input, placeholder "Ask a question about your data…"
- A subtle animated avatar above the input — soft, blurred, multi-color orb (blue/violet) with slow organic drifting motion, signaling AI presence without being distracting
- Headline: "Your data, in conversation." with a one-line subhead naming the domain vocabulary (claims, premiums, loss ratios, retention)
- Idle: placeholder cycles through real example questions with a typewriter animation. On focus: a command-style suggestion list appears under the input (filterable as the user types)
- A "Your saved reports" section appears once the user has favorited at least one report — a grid of cards, each showing the original question and its primary metric, clickable to jump straight to that report
- No visible data-source selection, no setup step, no required configuration before the first question can be asked

### 1.2 Workspace (two-panel layout)

Submitting a question transitions the UI into a two-panel workspace: chat on one side, a results canvas on the other, with a draggable divider between them. The chat panel can be collapsed to a thin rail (single icon + vertical label) so the canvas can take the full width for focused viewing; collapsing the chat must never affect the sizing or layout of the canvas panel itself — the canvas always fills whatever space isn't occupied by the chat.

**Chat panel**
- Scrolling thread of user questions and AI responses
- Each AI response is structured as: a short narrative answer (see 1.4), then 2–3 refinement chips suggesting next questions (filter by region, break down monthly, compare to last year, etc.)
- Every AI response that resulted in a report is labeled at its top, left-aligned, with a version label ("Version 3") and a star/favorite control — this acts as the title of that response and the entry point for revisiting it
- A persistent input dock at the bottom for follow-up questions
- A top bar with: the product mark/logo (clicking it returns to the home/empty state), a global "show/hide reasoning" toggle, a usage/cost indicator (see 2.6), and the chat-collapse control

**Canvas panel**
- Starts empty with a calm placeholder ("Results will appear here as you ask questions")
- While a query is processing, shows a staged sequence of status lines ("Analyzing your request…", "Identifying relevant data sources…", "Generating insights…") paired with skeleton card placeholders that resolve into real cards one at a time as they're "ready," not all at once
- Once generated, fills with a masonry-style grid of modular cards — charts (line/bar), big-number metric cards, a written summary-insight card, and occasionally a table — sized so that an odd number of cards never leaves a visible gap in the layout
- Cards animate in with a soft rise/fade, not an abrupt pop

### 1.3 Versioning

- Every question that gets a generated or reused answer produces a **version** — a complete, named, favoritable snapshot of whatever cards resulted from it
- Versions are never overwritten. Asking a new question always appends a new version after the current latest one, regardless of which version the user happens to be looking at when they ask it
- Clicking any past AI response in the chat thread switches the canvas to show that version's exact card snapshot
- When viewing a version that isn't the latest, a banner appears at the top of the canvas naming the question that produced it, with a favorite control and a "back to latest" action
- Favoriting a version saves it; favorited versions surface on the home screen (1.1) for one-click return, and remain favoritable/unfavoritable from either the chat bubble, the version banner, or the home screen card

### 1.4 Narrative response style

AI responses should read as a short analytical take, not a data printout. The shape is: state the metric plainly, point out what's notable about its movement, then offer a plausible, hedged interpretation — never an assertion of causality.

- Acceptable phrasing: "coincides with," "this lines up with," "likely related to," "worth checking whether," "the timing suggests"
- Unacceptable phrasing: "this is because of," "X caused Y," "the reason is"
- Numbers and directly observed facts should read as plain statements. Interpretive or narrative sentences should be visually distinguishable from factual ones — for example, slightly different weight or an inline cue — so the user never mistakes a narrative aside for a verified causal claim
- Every response should end with either a clarifying offer ("Want me to break this down monthly, or filter by region?") or refinement chips that make the next step actionable without retyping

### 1.5 Card-level interaction

- Every card type (chart, metric, insight, table) is clickable, not just chart cards
- Clicking a card highlights it (a visible border/ring) and surfaces a temporary follow-up suggestion in the chat thread, visually distinct from permanent chat history (lighter background, dashed border) so it reads as contextual and disposable rather than a saved message
- This temporary suggestion is dismissed by clicking anywhere else — empty canvas space, empty chat space, or a different card — at which point the highlight and the suggestion both clear together
- Clicking a different card while one is already active swaps directly to the new card's suggestion without a flicker or visible gap in between
- Each card shows a source tag ("Source: Claims Ledger, Adjuster Notes") and an expandable "How this was generated" section with plain-language detail: data sources used, metric applied, filters inferred. A global toggle can expand or collapse this section across every card at once, and new cards respect whatever the current global state is when they're created

---

## 2. Reporting behavior

### 2.1 Domain-based querying with reuse before creation

Questions are asked against a **domain** (claims, underwriting, policy, etc.), not a specific table. When a question comes in, the system first checks whether an existing report already answers it well enough to serve, using a semantic/intent match rather than exact text matching.

- If a matching report exists: the AI response says so explicitly and differently from a freshly generated answer — something like "This matches an existing report — here it is" — and the version it surfaces links back to that original report's own provenance (who created it, when) rather than presenting itself as new work.
- If no match exists: the system generates a new report as normal, and that new report becomes part of the searchable library for future questions in that domain.
- Every report carries a visible `reused` or `generated` distinction the user can see, not just an internal flag.
- Beyond chat-driven discovery, users can directly browse the library of existing reports for a domain — this is the self-service half of the product: people should be able to find and reuse reports without needing to phrase a new question that happens to match one.

### 2.2 Query triage: instant, background, or export-only

Not every question can or should produce an instant report. Before committing to a response shape, the system classifies the incoming question into one of three lanes and tells the user which lane it took:

1. **Instant** — the default path. Thinking sequence runs, report renders in the canvas within seconds.
2. **Background job** — the question requires heavier processing than makes sense to block on. The chat response says so plainly ("This is a bigger pull — I'll keep working and let you know when it's ready"). The canvas shows a persistent in-progress state distinct from the instant-path skeleton sequence (since this may take materially longer). When the report is ready, an in-app notification (toast or badge) tells the user; opening it reveals the finished report exactly as the instant path would have.
3. **Export-only** — the result set is too large or too unstructured for a report to be the right shape of answer at all (e.g., "every claim line item for the last five years"). No report is attempted. The response explains why ("This pulls a lot of raw data — better as a file than a report") and produces a downloadable export directly, with a clear file format and size indicated.

All three lanes use the same conversational voice and visual language — only the waiting and result experience differs between them. The classification should be visible and explained to the user as it happens, never a silent backend decision.

### 2.3 Export

Every report — whether reused, instantly generated, produced via a background job, or export-only by classification — carries a consistent export action: CSV/Excel for tabular data, and a way to export the report view itself (PDF or image) for sharing. This lives as a single, predictable action per version rather than scattered per-card controls.

### 2.4 Provenance and validation

Trust in a number requires more than knowing its source dataset name. Each report supports two layers of provenance:

- **Lightweight, inline** — the existing per-card "How this was generated" panel: source datasets, metric applied, filters inferred, written in plain language for a casual reader.
- **Deep, on-demand** — a dedicated validation view (modal or slide-over) reachable from any report, containing:
  - **Freshness** — when each underlying data source was last refreshed, not just which sources were used
  - **Logic** — the actual query logic behind the result (SQL or an equivalent structured representation), kept separate from the plain-language summary so casual users aren't confronted with it by default
  - **Lineage** — a structural view of upstream sources feeding the result, ideally a simple chain or graph rather than a flat comma-separated list
  - **Access** — if the viewer lacks permission to see a given upstream source, that's indicated explicitly here rather than silently omitted, and the result itself reflects the same restriction (see 2.6)

### 2.5 Federated domain semantics

Parley is run by one owning team but is designed to extend to others. A team can register a new domain and attach semantic documentation describing how their data should be interpreted — field meanings, valid filters, caveats — written as markdown rather than handing over raw data or pipelines. This semantic content should inform how the system responds to questions touching that domain. This capability lives in an admin/settings area, separate from the main conversational flow, since it's a setup-time activity rather than something most users interact with directly.

### 2.6 Cost and usage visibility

A persistent, lightweight usage indicator lives in the workspace top bar, showing allocated versus used compute for the current user or team (e.g., a small progress bar or "62 of 100 credits used this month"). Every question that triggers real computation contributes to this counter, with background and export-only questions reasonably costing more than instant ones. This is visibility only — no hard cutoff or blocking behavior at the limit, and no per-team billing breakdown.

### 2.7 Security and access control

Some users should not see certain domains, reports, or underlying data sources at all. This is modeled as a permission tag system: domains, reports, and data sources each carry permission tags, and a user's access is defined by which tags they hold. This affects every other behavior in the product — reuse-before-create (2.1) must never surface a report the current user can't see; the validation view (2.4) must indicate restricted upstream sources rather than silently dropping them; the report library (2.1) must filter by the viewer's permissions. Full role-based access control is not required at this stage, but every relevant entity should carry a permission field from the start so enforcement isn't a later retrofit.

---

## 3. Data model

- **Domain** — name, owning team, semantic documentation (markdown), permission tags
- **Report** — query text, domain, intent classification, triage lane (instant / background / export), status (generating / ready / failed), its cards, a `reused` vs. `generated` flag (and a reference to the original report if reused), favorited flag, created_at, created_by
- **DataSource** — name, last_refreshed timestamp, owning domain, permission tags
- **Card** — type (chart / metric / table / insight), data payload, linked DataSources, query logic, lineage references
- **User** — accessible domain/permission tags, usage and cost counter

---

## 4. Voice and visual language

- Calm, minimal, AI-native — never a report tool with a chat window attached
- Two type families: a serif for the AI's own voice (narrative responses, headline) and a clean sans for UI chrome, numbers, and structural text
- A soft white-to-blue gradient wash across the background; card surfaces float above it with light shadows rather than hard borders
- Motion is used deliberately: thinking/loading states feel like a stream of thought rather than a generic progress bar; cards rise and fade in rather than popping; the home-screen avatar drifts and breathes slowly and organically, never mechanically (no spinning or rotating motion — drifting blob-like movement instead)
- Every interactive surface (cards, chips, version labels, the favorite star) gives clear hover and active feedback; nothing that looks clickable should be inert, and nothing inert should look clickable
