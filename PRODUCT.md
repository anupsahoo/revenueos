# RevenueOS — Enterprise Product Plan (pictorial)

How RevenueOS works as a **multi-tenant platform** a trillion-dollar company would
buy: many companies, many verticals, tens of thousands of users, onboarded team
by team — retail today, banking tomorrow, healthcare the day after.

> Planned as GitHub issues: [**milestones M0–M6**](https://github.com/anupsahoo/revenueos/milestones)
> · [**epics**](https://github.com/anupsahoo/revenueos/issues?q=is%3Aissue+is%3Aopen+label%3Aepic)

---

## ⚠️ What exists today, and what this document is

**Everything below this line is a plan, not a product.** Read it as the shape I
would build toward, not as a description of running software.

| | |
|---|---|
| **Shipped (M0, v0.2.0)** | One screen: the Sales → PreSales operator loop, on an append-only event log, single tenant, synthetic data. 18 issues closed. That is all of it. |
| **Planned (M1–M6)** | Everything on this page — multi-tenancy, onboarding journeys, vertical packs, the director cockpits, the agent platform. 45 open issues. No code. |

There is no auth, no second tenant, no cockpit and no vertical pack in the repo
today. The diagrams here are how the shipped loop would generalise, drawn so the
sequencing and the dependencies are arguable before anyone writes the code.
What is actually built is in [`docs/STATUS.md`](docs/STATUS.md); what I chose not
to build is in [`docs/CUT-LIST.md`](docs/CUT-LIST.md).

---

## 1. Who uses it — tenancy & personas

```mermaid
flowchart TD
  P["🏛️ RevenueOS Platform<br/>(Platform Super Admin)"]
  P --> C1["🏢 Company A (tenant)"]
  P --> C2["🏢 Company B (tenant)"]
  P --> Cn["… up to 20 companies"]
  C1 --> AD["👤 Tenant Admin"]
  C1 --> V1["🛍️ Retail vertical"]
  C1 --> V2["🏦 Banking vertical"]
  C1 --> V3["🩺 Healthcare vertical"]
  V2 --> DS["🎩 Director of Sales"]
  V2 --> DP["🎩 Director of Pre-Sales"]
  DS --> AE["Sales / AE"]
  DP --> SA["Solution Architect"]
  V2 --> DL["Delivery Lead"]
  V2 --> SUP["Support Lead"]
```

Each vertical is its **own world** — retail sales ≠ banking sales ≠ healthcare
sales, and pre-sales differs the same way. A user belongs to a company, a
vertical, and a role.

### User types (RBAC)

| Persona | Scope | What they do | Rough count @ scale |
|---|---|---|---|
| Platform Super Admin | Platform | Operates RevenueOS, onboards companies | tens |
| Tenant Admin | Company | Onboards verticals, systems, users | ~1–3 / company |
| **Director of Sales** | Company / verticals | Forecast, seam-health across the portfolio | ~1 / company |
| **Director of Pre-Sales** | Company / verticals | Capacity, POC throughput, reuse | ~1 / company |
| Sales Manager / AE | Vertical | Owns opportunities, hands off briefs | thousands |
| Solution Architect | Vertical | Turns briefs into POC plans (the loop) | thousands |
| Delivery Lead | Vertical | Receives the handoff | hundreds |
| Support Lead | Vertical | Feeds renewal/upsell signals back | hundreds |
| Viewer / Exec stakeholder | Company | Read-only dashboards | many |

**Scale target:** 20 companies · 40 projects · 20k–40k users · isolated per tenant.

---

## 2. How a company is onboarded (the journey)

```mermaid
flowchart LR
  A["Provision tenant"] --> B["Set org structure<br/>verticals + teams"]
  B --> C["Connect systems<br/>CRM · call-intel · enrichment"]
  C --> D["Invite admins & users<br/>assign roles"]
  D --> E["Choose vertical packs<br/>retail / banking / healthcare"]
  E --> F["Seed template library<br/>per vertical"]
  F --> G["Dry-run: one test brief<br/>through the loop"]
  G --> H["🟢 Go live"]
  classDef done fill:#0e8a4322,stroke:#0e8a43;
```

Owner + status is tracked at every step (a pictorial progress map, not a form).

## 3. How a system is onboarded

```mermaid
flowchart LR
  S1["Pick source<br/>HubSpot / Salesforce / Gong"] --> S2["Authenticate<br/>OAuth / API key"]
  S2 --> S3["Map events → seams<br/>e.g. deal-won → Brief"]
  S3 --> S4["Send a test event"] --> S5["Validate shape"] --> S6["🟢 Enable"]
```

## 4. How a user is onboarded (RBAC)

```mermaid
sequenceDiagram
  autonumber
  participant AD as Tenant Admin
  participant U as New user
  participant SYS as RevenueOS
  AD->>SYS: Invite (email, role, vertical, team)
  SYS->>U: Invitation + SSO link
  U->>SYS: Accept via SSO
  SYS->>SYS: Assign role + vertical scope (RBAC)
  SYS-->>U: Role-based home + onboarding checklist
  U->>SYS: Complete checklist → Active
```

---

## 5. Verticals are configurable "packs"

```mermaid
flowchart TD
  VP["Vertical Pack (config, no code)"]
  VP --> S["Seams + SLAs"]
  VP --> R["Regulators"]
  VP --> T["Template library seed"]
  VP --> AG["Agent persona + rules"]
  VP --> CO["Compliance / residency"]
  subgraph Packs
    RT["🛍️ Retail<br/>fast cycles · light reg"]
    BK["🏦 Banking<br/>OCC/FCA/RBI · strict"]
    HC["🩺 Healthcare<br/>HIPAA · clinical presales"]
  end
  VP -.instantiated as.-> RT
  VP -.instantiated as.-> BK
  VP -.instantiated as.-> HC
```

Switching a team's vertical changes its seams, SLAs, templates and **agent
behaviour** — no code change. That is how retail today / banking tomorrow works.

---

## 6. Platform architecture (multi-tenant)

```mermaid
flowchart TB
  subgraph EXP["Experience layer (pictorial, role-based)"]
    SC["Sales Director cockpit"]
    PC["Pre-Sales Director cockpit"]
    OP["Operator control surface (the loop)"]
    ON["Onboarding journeys"]
    ADM["Admin control plane"]
  end
  EXP --> GW["API + Auth / RBAC (SSO, SCIM)"]
  GW --> CFG["Config: Vertical Packs"]
  GW --> AGT["Agent platform<br/>per-vertical LangGraph · model routing · eval · tracing"]
  GW --> EVB["Event backbone (per-tenant, append-only = source of truth)"]
  AGT --> LLM(("AI model"))
  EVB --> DB[("Tenant-isolated store<br/>Neon / Postgres")]
  GW --> INT["Integrations: CRM · call-intel · enrichment"]
  INT --> EVB
```

Everything is **tenant-scoped**; health, reuse and rankings are **computed from
the per-tenant event log**, never typed in.

---

## 7. The two director cockpits (why they buy it)

```mermaid
mindmap
  root(("Directors reduce their burden"))
    ("🎩 Director of Sales")
      ("Forecast by company × vertical")
      ("Seam-health heatmap")
      ("At-risk deals surfaced")
      ("Drill to any brief")
    ("🎩 Director of Pre-Sales")
      ("Architect capacity / load")
      ("POC throughput")
      ("Template reuse trend")
      ("Backlog & breaches")
```

Each director answers one question at a glance — Sales: *where is the risk?*
Pre-Sales: *where is the burden?* — then drills portfolio → company → vertical →
brief. The operator loop (today's prototype) is one role's view inside this.

---

## Build order (milestones)

`M0` shipped prototype → `M1` multi-tenant foundation → `M2` onboarding suite →
`M3` vertical packs → `M4` cockpits + operator v2 → `M5` agent platform & scale →
`M6` pictorial design system & governance. Details in the
[epics](https://github.com/anupsahoo/revenueos/issues?q=is%3Aissue+label%3Aepic).
