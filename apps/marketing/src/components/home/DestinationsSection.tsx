const destinations = [
  {
    name: "Santorini",
    region: "Greece",
    body: "Whitewashed walls. Infinite blue. Content that stops every scroll.",
  },
  {
    name: "Kyoto",
    region: "Japan",
    body: "Ancient temples. Cherry blossoms. Stories that write themselves.",
  },
  {
    name: "Amalfi Coast",
    region: "Italy",
    body: "Clifftop villages. Lemon groves. The kind of views people ask about for years.",
  },
  {
    name: "Patagonia",
    region: "Chile",
    body: "The end of the world. The beginning of your best content.",
  },
  {
    name: "Bali",
    region: "Indonesia",
    body: "Rice terraces. Temple gates. A lifestyle that practically documents itself.",
  },
  {
    name: "Iceland",
    region: "Nordic",
    body: "Northern lights. Black sand beaches. The trip that changes what you think travel can be.",
  },
];

export default function DestinationsSection() {
  return (
    <section className="bg-monetura-charcoal py-32 lg:py-40">
      <div className="mx-auto max-w-6xl px-6 lg:px-12">
        <div className="mb-20 grid grid-cols-1 items-end gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="mb-12 text-xs uppercase tracking-[0.3em] text-monetura-champagne font-garet">
              The World
            </p>
            <h2 className="font-garet text-3xl leading-[1.15] text-monetura-cream md:text-4xl lg:text-5xl">
              Every destination is a story waiting to be told.
            </h2>
          </div>
          <p className="text-base leading-relaxed text-monetura-earth md:text-lg">
            From Calgary to Kyoto. Your membership travels with you.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {destinations.map(({ name, region, body }) => (
            <article
              key={name}
              className="rounded-[1.75rem] border border-monetura-sand p-8 transition-all duration-300 hover:border-monetura-champagne hover:shadow-[0_0_40px_rgba(212,168,83,0.08)] lg:p-10"
            >
              <h3 className="font-serif text-3xl leading-tight text-monetura-champagne md:text-4xl">
                {name}
              </h3>
              <p className="mt-3 text-xs uppercase tracking-[0.32em] text-monetura-earth">
                {region}
              </p>
              <p className="mt-6 text-sm leading-relaxed text-monetura-cream md:text-base">
                {body}
              </p>
            </article>
          ))}
        </div>

        <p className="mx-auto mt-14 max-w-3xl text-center text-base leading-relaxed text-monetura-earth md:text-lg">
          These are just the beginning. Monetura members have created content
          from over 40 countries — and counting.
        </p>
      </div>
    </section>
  );
}
