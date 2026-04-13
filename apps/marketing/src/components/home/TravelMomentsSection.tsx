const moments = [
  {
    title: "The First Morning",
    body: "Coffee in a city you've never been to. The quiet before anyone else is awake. The feeling that the whole place is yours.",
  },
  {
    title: "The View",
    body: "You saved for this room. You booked it months ago. And when you finally open the curtains — it's exactly what you imagined.",
  },
  {
    title: "The Meal",
    body: "Not the restaurant. The moment. The people across the table. The conversation that went three hours longer than planned.",
  },
  {
    title: "The Photo",
    body: "You take it without thinking. Someone sees it later and says — where is that? That's the moment your experience becomes someone else's dream.",
  },
];

export default function TravelMomentsSection() {
  return (
    <section className="bg-monetura-charcoal py-32 lg:py-40">
      <div className="mx-auto max-w-6xl px-6 lg:px-12">
        <div className="mb-20 grid grid-cols-1 items-end gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="mb-12 text-xs uppercase tracking-[0.3em] text-monetura-champagne font-garet">
              The Feeling
            </p>
            <h2 className="font-garet text-3xl leading-[1.15] text-monetura-cream md:text-4xl lg:text-5xl">
              Some experiences are too good to keep to yourself.
            </h2>
          </div>
          <p className="text-base leading-relaxed text-monetura-earth md:text-lg">
            These are the moments Monetura was built for.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-px bg-monetura-sand/10 sm:grid-cols-2">
          {moments.map(({ title, body }) => (
            <article
              key={title}
              className="border border-monetura-sand/10 bg-monetura-charcoal p-10 transition-colors duration-300 hover:border-monetura-champagne/20 lg:p-12"
            >
              <p className="mb-6 text-xl text-monetura-champagne">◈</p>
              <h3 className="mb-4 font-garet text-lg leading-snug text-monetura-cream">
                {title}
              </h3>
              <p className="text-sm leading-relaxed text-monetura-cream/50">
                {body}
              </p>
            </article>
          ))}
        </div>

        <div className="mx-auto mt-16 max-w-3xl text-center">
          <p className="text-base leading-relaxed text-monetura-cream md:text-lg">
            Monetura turns these moments into content, income, and memories that
            compound — long after you've come home.
          </p>
          <a
            href="/founders/apply"
            className="mt-10 inline-flex min-h-[52px] items-center justify-center rounded-lg border border-monetura-champagne bg-transparent px-8 py-4 text-center text-xs uppercase tracking-[0.24em] text-monetura-champagne transition-all duration-300 hover:bg-monetura-champagne hover:text-monetura-charcoal"
          >
            Start turning your experiences into income
          </a>
        </div>
      </div>
    </section>
  );
}
