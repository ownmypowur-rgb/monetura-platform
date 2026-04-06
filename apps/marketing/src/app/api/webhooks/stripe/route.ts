// Stripe webhook handler — scaffold only.
// Stripe handles monthly subscriptions ($199/month software, $29-49/month community).
// Founder purchases ($2,500–$5,500) are via e-transfer/wire to ATB Bank — NOT Stripe.

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // TODO: Implement when Stripe subscriptions go live
  // 1. Verify webhook signature with stripe.webhooks.constructEvent()
  // 2. Handle subscription events: customer.subscription.created, updated, deleted
  // 3. Update user subscription status in TiDB via Drizzle ORM (monetura_subscriptions table)
  // 4. Trigger n8n webhook for downstream automation

  console.log("Stripe webhook received:", { bodyLength: body.length });

  return NextResponse.json({ received: true });
}
