import Image from "next/image";

// Captions describe what is actually in each photo (Darryl, Nov 8, 2026). These are
// illustrative images: never caption them as a real place, a Monetura trip or a member.
const destinations = [
  {
    name: "Over the Water",
    region: "Island pavilion",
    body: "Turquoise water, mountains on the horizon, and a table set for the evening.",
    image: "/images/monetura-tropical.jpg",
    alt: "A couple on an open-air pavilion above turquoise water, with mountains and palms beyond",
  },
  {
    name: "City Lights",
    region: "Coastal city",
    body: "A balcony high above the beach, just as the lights come on.",
    image: "/images/monetura-rooftop.jpg",
    alt: "A couple laughing on a high balcony above a coastal city at sunset",
  },
  {
    name: "On Deck",
    region: "Island coast",
    body: "A slow afternoon on the water, with mountains rising beyond the shore.",
    image: "/images/monetura-hero-reference.jpg",
    alt: "People relaxing on a boat deck in golden light, with green mountains behind",
  },
  {
    name: "The Chalet",
    region: "Mountains",
    body: "A fire on the terrace and peaks catching the last light.",
    image: "/images/monetura-mountain.jpg",
    alt: "Friends on a wooden chalet terrace with a fireplace, looking out at mountain peaks",
  },
  {
    name: "The Long Table",
    region: "Evening",
    body: "Candlelight, good food, and a conversation that runs three hours longer than planned.",
    image: "/images/monetura-dining.jpg",
    alt: "Four friends laughing over a candlelit dinner on a boat deck",
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
          {destinations.map(({ name, region, body, image, alt }) => (
            <article
              key={name}
              className="group relative min-h-[25rem] overflow-hidden rounded-[1.85rem] border border-monetura-sand/70 transition-all duration-500 hover:border-monetura-champagne hover:shadow-[0_0_50px_rgba(212,168,83,0.16)]"
            >
              <Image
                src={image}
                alt={alt}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(44,36,32,0.12)_0%,rgba(44,36,32,0.26)_38%,rgba(44,36,32,0.9)_100%)]" />
              <div className="absolute inset-x-0 bottom-0 p-8 lg:p-10">
                <h3 className="font-serif text-3xl leading-tight text-monetura-champagne md:text-4xl">
                  {name}
                </h3>
                <p className="mt-3 text-xs uppercase tracking-[0.32em] text-monetura-earth">
                  {region}
                </p>
                <p className="mt-6 max-w-[17rem] text-sm leading-relaxed text-monetura-cream md:text-base">
                  {body}
                </p>
              </div>
            </article>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-3xl text-center text-xs uppercase tracking-[0.2em] text-monetura-earth">
          Illustrative images, not Monetura members or trips.
        </p>
      </div>
    </section>
  );
}
