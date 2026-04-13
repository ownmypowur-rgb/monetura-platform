import Image from "next/image";

const moments = [
  {
    title: "The First Morning",
    body: "Coffee in a city you've never been to. The quiet before anyone else is awake. The feeling that the whole place is yours.",
    image: "/images/monetura-rooftop.jpg",
    alt: "Luxury rooftop morning scene at golden hour",
  },
  {
    title: "The View",
    body: "You saved for this room. You booked it months ago. And when you finally open the curtains — it's exactly what you imagined.",
    image: "/images/monetura-tropical.jpg",
    alt: "Tropical luxury destination view with warm evening light",
  },
  {
    title: "The Meal",
    body: "Not the restaurant. The moment. The people across the table. The conversation that went three hours longer than planned.",
    image: "/images/monetura-dining.jpg",
    alt: "Luxury fine dining travel moment in warm cinematic light",
  },
  {
    title: "The Photo",
    body: "You take it without thinking. Someone sees it later and says — where is that? That's the moment your experience becomes someone else's dream.",
    image: "/images/monetura-mountain.jpg",
    alt: "Mountain retreat scene with cinematic editorial atmosphere",
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

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {moments.map(({ title, body, image, alt }) => (
            <article
              key={title}
              className="group overflow-hidden rounded-[1.85rem] border border-monetura-sand/12 bg-monetura-charcoal/90 transition-all duration-500 hover:border-monetura-champagne/40 hover:shadow-[0_24px_80px_rgba(0,0,0,0.28)]"
            >
              <div className="relative h-72 overflow-hidden sm:h-80 lg:h-[21rem]">
                <Image
                  src={image}
                  alt={alt}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(44,36,32,0.1)_0%,rgba(44,36,32,0.18)_44%,rgba(44,36,32,0.86)_100%)]" />
                <div className="absolute inset-x-0 bottom-0 p-8 lg:p-10">
                  <p className="mb-4 text-xl text-monetura-champagne">◈</p>
                  <h3 className="font-garet text-xl leading-snug text-monetura-cream lg:text-2xl">
                    {title}
                  </h3>
                </div>
              </div>
              <div className="p-8 pt-7 lg:p-10 lg:pt-8">
                <p className="text-sm leading-relaxed text-monetura-cream/62 md:text-[15px] md:leading-7">
                  {body}
                </p>
              </div>
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
