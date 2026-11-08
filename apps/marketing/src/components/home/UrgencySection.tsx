// Founder count and spots-remaining were removed (Nov 2026 decisions: no
// public founder count, no urgency tricks). The section is now a calm invite.
export default function UrgencySection() {

  return (
    <section className="bg-monetura-terracotta py-20">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-white/70 text-xs tracking-[0.3em] uppercase font-garet mb-4">
              Founding Cohort — Canada Only
            </p>
            <h2 className="font-garet font-bold text-2xl md:text-3xl lg:text-4xl text-white leading-[1.2]">
              Founder terms are shared privately
              <br />
              on our founders webinar. Be the first to know.
            </h2>
          </div>

          <div>
            <a
              href="/membership/apply"
              className="inline-block border border-white text-white text-xs tracking-[0.2em] uppercase font-garet px-10 py-4 hover:bg-white hover:text-monetura-terracotta transition-all duration-300"
            >
              Apply for Founding Membership
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
