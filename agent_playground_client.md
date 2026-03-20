# Agent Playground — Client-Facing Reference

> This document describes what end clients receive when you deliver services through the platform.
> It is written from the perspective of a client (a small business in Latin America).
> Use this as the basis for sales conversations, onboarding emails, and proposal documents.

---

## What Your Clients Get

When you onboard a client, they get a private subdomain (`clientname.yourdomain.com`) with a bundle of AI-powered tools running exclusively for their business. They don't interact with your dashboard — they get their own lightweight interface for each service they've subscribed to.

---

## Service Modules

### Marketing Module
An AI assistant that manages your client's social media presence.

**What it does:**
- Accepts content briefs or finished copy and schedules posts across platforms
- Maintains a post calendar — client can see what's going out and when
- You (the operator) can batch-schedule weeks of content in minutes via the Playground
- Clients can submit content requests via a simple form or WhatsApp

**How it's delivered:**
- You task the Marketing Agent via your dashboard
- Client sees scheduled posts via a lightweight read-only view (future: client portal)
- Posts are queued and reviewed before going live

---

### Accounting Module
An AI-assisted income and expense tracker.

**What it does:**
- Logs every transaction with category, amount, description
- Generates monthly summaries: income vs. expenses, net profit, top categories
- You can query it in plain language: "What did cliente1 spend on supplies in March?"
- Exportable summaries (future feature)

**How it's delivered:**
- Transactions entered by you or automatically via integrations (future)
- Monthly report generated on request or on a schedule
- Client receives report by email or WhatsApp (future: client portal)

---

### Messaging Module
An AI chatbot that handles customer messages on the client's behalf.

**What it does:**
- Answers common customer questions 24/7 (hours, pricing, location, menu, etc.)
- Escalates to a human when it can't answer
- Powered by Claude (if API key provided) or a local LLM (Ollama) as fallback
- CORS-enabled — can be embedded on the client's website

**How it's delivered:**
- Deployed as a chat widget on the client's website
- You configure the bot's persona and FAQ content during onboarding
- Client-specific context (business name, hours, offerings) baked into the system prompt

---

### Website Builder Module *(planned)*
Generates a complete business website from the client's onboarding questionnaire.

**What it does:**
- Client fills out a 5-step questionnaire (business type, services, contact info, branding)
- Claude scaffolds a full Next.js website tailored to the business
- You review and deploy it to the client's subdomain
- Client gets a professional web presence without needing a designer or developer

**Status:** Not yet implemented — highest priority build item.

---

## Bundles (Service Packages)

Clients subscribe to one or more modules. You can offer them individually or as a bundle.

| Package | Modules Included |
|---------|-----------------|
| Web Presence | Website Builder |
| Marketing Package | Marketing Module |
| Accounting Package | Accounting Module |
| AI Assistant Package | Messaging Module |
| Full BCS Bundle | All of the above |

Pricing is set by you and reviewed separately from this document.

---

## How Onboarding Works

1. **Client fills out the questionnaire** — either via the marketing website (`/onboarding`) or the internal questionnaire form. Collects: business name, industry, services offered, contact info, social media handles, tone/style preferences.
2. **You receive the questionnaire** via email (Resend) or directly in the dashboard.
3. **You deploy their bundle** — one command via the dashboard or `deploy.sh`:
   ```bash
   bash deploy/deploy.sh shared clientname full-bcs
   ```
4. **You configure their agents** — paste their business context into the Messaging agent's system prompt, set up their social media accounts in Marketing, initialize their Accounting ledger.
5. **Client is live** — their subdomain resolves, their chatbot answers questions, you start scheduling their content.

---

## What Clients See (Current vs. Planned)

| Feature | Now | Planned |
|---------|-----|---------|
| Chatbot on their website | ✓ Ready | — |
| Social posts scheduled by you | ✓ Ready | — |
| Monthly accounting report | ✓ (you generate, send manually) | Auto-delivered on schedule |
| Business website | ✗ Not built yet | In progress |
| Client self-service portal | ✗ | Future — read-only view of their services |
| Direct client chat with AI | ✗ | Future — white-labeled chat interface |
| Billing/invoices | ✗ Manual | Future — Stripe/MercadoPago integration |

---

## Delivery Standards

When a client is live, the following should all pass:

- [ ] `https://clientname.yourdomain.com` resolves with valid SSL
- [ ] Chatbot responds within 3 seconds on the website
- [ ] Marketing agent confirms at least one post scheduled for the first week
- [ ] Accounting agent returns a clean summary with opening balance
- [ ] Client has received a welcome message with their service details
- [ ] You have their WhatsApp/email for direct communication

---

## Client Communication Templates

### Welcome Message (WhatsApp / Email)
```
Hi [Name],

Your [Plan Name] is now live! Here's what's active:

✓ [List active modules]

You can reach me at any time if you need changes, have questions, or want to add services.

Your site/chatbot: [URL]

— [Your name]
```

### Monthly Check-in
```
Hi [Name], here's your [Month] summary:

[Paste accounting summary if applicable]
[List posts published if applicable]
[Note any chatbot queries that needed escalation]

Let me know if you'd like any changes for next month.
```

---

## Notes for the Operator (You)

- Clients do **not** have access to your Agent Dashboard — that's your internal tool.
- All client configuration lives in `deploy/clients/<clientname>.env`.
- If a client wants to upgrade their plan, use `deploy.sh` to swap their bundle.
- When the Website Builder is ready, re-contact all existing clients on the Web Presence plan to deliver their sites.
- Keep a note of each client's scheduled posting cadence so you can batch-task the Marketing agent efficiently.
