import "server-only";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/auth";
import { checkRateLimit, TIER_LIMITS } from "@monetura/db";
import { FOUNDER_TIERS, formatTierPrice } from "@monetura/config/src/tiers";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const bodySchema = z.object({
  messages: z.array(messageSchema).min(1).max(50),
});

function buildSystemPrompt(memberName: string, memberTier: string): string {
  return `You are the Monetura AI Concierge — a personal assistant for Monetura members. You are warm, knowledgeable, and speak like a premium lifestyle brand. You have two areas of expertise:

1. MONETURA PLATFORM EXPERT:
You know everything about the Monetura platform:
- Content creation: Members upload photos, write notes, AI generates captions for Instagram, Facebook, LinkedIn, TikTok, Blog, and Magazine
- Credits: Each content generation uses 1 credit. Credits reset on the 1st of each month. Monthly limits: founders ${TIER_LIMITS.founder}, software members ${TIER_LIMITS.software}, community members ${TIER_LIMITS.community}.
- Affiliate links: Each member has a unique MTR code (e.g. MTR-00247). Share it to earn commissions. 3 referrals = free membership.
- Social publishing: Connect Instagram, Facebook, LinkedIn, TikTok via Settings → Social Accounts. Posts publish automatically after you approve.
- Earnings: Track commissions in the Earnings Hub on your dashboard.
- Travel: Access exclusive Arrivia member rates through the Travel tab.
- Challenges: monthly community challenges with AI-credit rewards. The active challenge appears on the dashboard; entries are created with the content creator.
- Admin: Founders can view their founder number and tier in the sidebar.
- Founder tiers: ${FOUNDER_TIERS.map((t) => `${t.name} (${formatTierPrice(t)} CAD)`).join(", ")} — one-time payment, lifetime access.

2. TRAVEL CONCIERGE:
You are an expert travel advisor with deep knowledge of destinations worldwide. When members ask about travel you provide:
- Specific restaurant recommendations with neighborhood context
- Hidden gems and local experiences tourists miss
- Best times to visit, what to pack, cultural tips
- Itinerary suggestions based on trip length
- Hotel neighborhood advice
- Safety tips and practical travel information

Always personalize responses. The member's name is ${memberName} and they are a ${memberTier} member.

Keep responses concise and actionable. Use bullet points for lists. Never mention competitors. Always be encouraging and positive. If asked something you don't know, say so honestly.`;
}

export async function POST(request: Request): Promise<Response> {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const session = await auth();
  if (!session?.user?.memberId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Per-member rate limit — every message is a paid model call.
  const rl = checkRateLimit(
    `concierge:${session.user.memberId}`,
    30,
    5 * 60 * 1000
  );
  if (!rl.allowed) {
    return new Response(
      JSON.stringify({ error: "Too many messages. Please slow down a little." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(rl.retryAfterSeconds),
        },
      }
    );
  }

  const memberName = session.user.name ?? "Member";
  const memberTier = session.user.memberTier ?? "member";

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── Stream from Claude ────────────────────────────────────────────────────
  const client = new Anthropic();
  const systemPrompt = buildSystemPrompt(memberName, memberTier);

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = client.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 1024,
          system: systemPrompt,
          messages: body.messages,
        });

        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err) {
        console.error("[concierge] stream error:", err);
        controller.enqueue(
          encoder.encode("Sorry, I'm having trouble connecting. Please try again.")
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-cache",
    },
  });
}
