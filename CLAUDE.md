# MONETURA — Claude Code Project Standards

## Project Identity
- Brand: Premium lifestyle platform — Rolex meets Airbnb
- Tagline: Passion becomes creation. Creation becomes freedom.
- Apps: monetura.com (marketing), app.monetura.com (platform), moneturamedia.com (corporate)
- DO NOT modify app.moneturamedia.com — that is live production ApexCRM

## Brand Colors
- Warm Charcoal: #2C2420 (primary dark)
- Champagne Gold: #D4A853 (primary accent)
- Desert Cream: #FBF5ED (light backgrounds)
- Deep Mocha: #4A3728 (secondary dark)
- Terracotta: #C17A4A (urgency/headings)
- Canyon Earth: #8B6E52 (mid tone)
- Sand: #E8DCCB (borders/dividers)
- Sunset Gold: #C4973D (tagline on light)

## Tech Stack
- Framework: Next.js 14+ App Router
- Language: TypeScript strict mode — no any types ever
- Styling: Tailwind CSS with Monetura brand tokens
- Database: TiDB Cloud (MySQL) via Drizzle ORM
- Auth: NextAuth.js v5
- Email: Resend
- Payments: Stripe (subscriptions only — NOT founder purchases)
- Automation: n8n webhooks
- Storage: AWS S3
- AI: Anthropic Claude API

## Database Rules
- NEVER modify drizzle/schema.ts — that is ApexCRM production
- ALL new Monetura tables go in drizzle/monetura-schema.ts
- ALL new tables prefixed monetura_
- Use Drizzle ORM only — never raw SQL

## Payment Rules
- Founder purchases ($2,500-$5,500) are e-transfer/wire to ATB Bank — NOT Stripe
- Stripe handles monthly subscriptions only ($199/month software, $29-49/month community)

## Build Order
1. Database migrations
2. Stripe setup
3. monetura.com marketing site
4. Founder application form
5. Admin founder activation screen
6. app.monetura.com shell + NextAuth
7. n8n workflows WF-01 through WF-03 and WF-11
8. Resend email templates
9. Webinar registration page
