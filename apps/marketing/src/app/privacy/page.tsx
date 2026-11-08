import type { Metadata } from "next";

// Plain-language privacy policy (PIPEDA and CASL). Drafted Nov 8, 2026; marked for
// lawyer review in DECISIONS.md. Keep it true to what the site actually does.

export const metadata: Metadata = {
  title: "Privacy Policy: Monetura",
  description: "What Monetura collects, why, and how to unsubscribe, see your data or have it deleted.",
  alternates: { canonical: "/privacy" },
};

const sections: { heading: string; body: React.ReactNode }[] = [
  {
    heading: "Who we are",
    body: (
      <p>
        Monetura is run by Monetura Media &amp; Technologies Inc., 22 Cooperstown Ct SW, Airdrie, AB T4B 2C5,
        Canada. Questions about privacy go to{" "}
        <a href="mailto:founders@monetura.com">founders@monetura.com</a>.
      </p>
    ),
  },
  {
    heading: "What we collect",
    body: (
      <ul>
        <li>
          <strong>When you join the waitlist:</strong> your first name and email address, a record of your
          consent (the exact wording you agreed to, when, and on which page), and where you came from (for
          example, a link from Instagram). We don&rsquo;t keep your IP address; we keep a one-way scrambled
          version of it, only to help stop spam signups.
        </li>
        <li>
          <strong>When you ask to join a founders webinar:</strong> your name, email, phone number, province
          and, if you tell us, how you heard about us.
        </li>
        <li>
          <strong>When you visit the site:</strong> our hosting provider keeps standard technical logs (such
          as your browser type and the pages requested) to run and secure the site. We don&rsquo;t use
          advertising or tracking cookies today. If that changes, we&rsquo;ll update this page first.
        </li>
      </ul>
    ),
  },
  {
    heading: "Why we collect it",
    body: (
      <ul>
        <li>To email you about Monetura, including an invitation to our private founders webinar, but only if you ticked the box to agree.</li>
        <li>To arrange a founders webinar you asked for.</li>
        <li>To understand which links bring people to the site, and to keep the site secure.</li>
      </ul>
    ),
  },
  {
    heading: "Your consent and how to unsubscribe",
    body: (
      <p>
        We only send marketing email to people who said yes. Every email we send has an unsubscribe link,
        and one click is enough. You can also email{" "}
        <a href="mailto:founders@monetura.com">founders@monetura.com</a> and ask us to stop. We act on
        unsubscribes right away, and always within 10 business days, as Canada&rsquo;s anti-spam law
        (CASL) requires.
      </p>
    ),
  },
  {
    heading: "Who we share it with",
    body: (
      <p>
        We don&rsquo;t sell or rent your information. We use a small number of service providers to run
        Monetura: website hosting, our database, and an email delivery service. They handle your
        information only to provide those services to us. Some of them store data outside Canada,
        including in the United States, where it may be accessible to authorities under local law.
      </p>
    ),
  },
  {
    heading: "How long we keep it",
    body: (
      <p>
        We keep waitlist details while you&rsquo;re on the list. If you unsubscribe, we keep your email
        address and the record of your consent and unsubscribe, so we can prove we respected your choice
        and never email you by mistake. If you ask us to delete your information, we will, except for
        anything the law requires us to keep.
      </p>
    ),
  },
  {
    heading: "Your rights",
    body: (
      <p>
        You can ask to see the personal information we hold about you, ask us to correct it, or ask us to
        delete it. Email <a href="mailto:founders@monetura.com">founders@monetura.com</a> and we&rsquo;ll
        reply within 30 days. If you&rsquo;re not happy with how we handled your request, you can contact
        the Office of the Privacy Commissioner of Canada at{" "}
        <a href="https://www.priv.gc.ca" target="_blank" rel="noopener noreferrer">
          priv.gc.ca
        </a>
        .
      </p>
    ),
  },
  {
    heading: "How we protect it",
    body: (
      <p>
        Your information is sent over encrypted connections and stored with providers that use industry
        security practices. Only the people who need it to run Monetura can see it.
      </p>
    ),
  },
  {
    heading: "Changes",
    body: <p>If we change this policy, we&rsquo;ll update this page and the date below.</p>,
  },
];

export default function PrivacyPage() {
  return (
    <main className="bg-monetura-charcoal min-h-screen">
      <section className="pt-40 pb-24">
        <div className="mx-auto max-w-[680px] px-6">
          <p className="editorial-label">Privacy</p>
          <h1 className="lux-heading text-4xl md:text-5xl text-monetura-cream mb-6">Privacy Policy</h1>
          <p className="text-sm text-monetura-cream/55 mb-16">Last updated November 8, 2026</p>
          <div className="space-y-12">
            {sections.map(({ heading, body }) => (
              <div key={heading}>
                <h2 className="font-garet text-xl text-monetura-champagne mb-4">{heading}</h2>
                <div className="space-y-4 text-base leading-8 text-monetura-cream/80 [&_a]:text-monetura-champagne [&_a]:underline [&_li]:mb-3 [&_strong]:text-monetura-cream [&_ul]:list-disc [&_ul]:pl-5">
                  {body}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
