import Image from "next/image";
import Link from "next/link";

const steps = [
  {
    number: "01",
    title: "Book and go",
    body: "Access exclusive member travel rates through our partner network. Hotels, flights, and experiences at prices the public can't touch.",
  },
  {
    number: "02",
    title: "Capture and create",
    body: "Take photos. Write one sentence of notes. Monetura's AI turns your raw experience into a full blog post, Instagram caption, LinkedIn post, TikTok caption, and hashtags — in seconds.",
  },
  {
    number: "03",
    title: "Publish and earn",
    body: "Your content goes out to all your social platforms simultaneously — with your unique affiliate link embedded in every post. When someone joins Monetura through your content, you earn. Three active referrals and your membership pays for itself.",
  },
];

const features = [
  {
    title: "AI Content Engine",
    body: "Upload photos from any experience. Monetura's AI generates professional content for every platform — blog, Instagram, Facebook, LinkedIn, TikTok — in your voice, in seconds.",
    image: "/images/monetura-tropical.jpg",
  },
  {
    title: "Member Travel Rates",
    body: "Access exclusive rates on hotels, flights, cruises, and experiences through our Arrivia partnership. Travel more for less — and create more content while you do it.",
    image: "/images/monetura-rooftop.jpg",
  },
  {
    title: "Affiliate Income System",
    body: "Every piece of content you publish includes your unique tracking link. Build an audience. Earn commissions. Three referrals and your monthly membership is free.",
    image: "/images/monetura-dining.jpg",
  },
  {
    title: "Private Community",
    body: "Connect with a curated community of lifestyle creators and travellers who are building the same thing you are. Real people. Real conversations. No noise.",
    image: "/images/monetura-mountain.jpg",
  },
  {
    title: "Social Publishing Hub",
    body: "One click publishes your content to all platforms simultaneously. Your posts go to your audience AND to the Monetura brand channels — doubling your reach automatically.",
    image: "/images/monetura-hero-reference.jpg",
  },
  {
    title: "Monthly Performance Reports",
    body: "See exactly how your content is performing — reach, clicks, commissions earned, and top posts. Know what's working and do more of it.",
    image: "/images/monetura-rooftop.jpg",
  },
];

const audience = [
  {
    number: "01",
    title: "You travel at least a few times a year — or you want to",
    body: "You already have the experiences. You already have the photos. You just haven't had a reason to do anything with them beyond sharing them with friends.",
  },
  {
    number: "02",
    title: "You've thought about building something around your life",
    body: "The idea of turning your travels into content — maybe even income — has crossed your mind. You just didn't know where to start or what platform made sense.",
  },
  {
    number: "03",
    title: "You're not trying to become a full-time influencer",
    body: "You're not chasing fame. You want travel to mean more than it does right now. You want it to pay for itself. You want the experiences to add up to something.",
  },
  {
    number: "04",
    title: "You want a community of people who are doing the same thing",
    body: "Not a Facebook group. Not a random Discord. A curated, serious community of people who are building a lifestyle around travel, content, and income.",
  },
];

const tiers = [
  {
    name: "Explorer",
    price: "$2,500",
    currency: "CAD",
    tagline: "The foundation",
    description:
      "Full platform access, AI tools, member travel rates, community access, and monthly sessions. Everything you need to start turning travel into income.",
    features: [
      "Full platform access (lifetime)",
      "AI content engine",
      "Member travel rates via Arrivia",
      "Private community access",
      "Monthly founder sessions",
    ],
    highlight: false,
    cta: "Apply as Explorer",
  },
  {
    name: "Trailblazer",
    price: "$3,500",
    currency: "CAD",
    tagline: "The inner circle",
    description:
      "Everything in Explorer, plus priority introductions and access to in-person events across Canada.",
    features: [
      "Everything in Explorer",
      "Priority curated introductions",
      "In-person event access",
      "City meetup priority seating",
      "Early access to new features",
    ],
    highlight: false,
    cta: "Apply as Trailblazer",
  },
  {
    name: "Pioneer",
    price: "$4,500",
    currency: "CAD",
    tagline: "Most requested",
    description:
      "Everything in Trailblazer, plus quarterly strategy sessions and the earliest access to every new feature we ship.",
    features: [
      "Everything in Trailblazer",
      "Quarterly strategy sessions",
      "First access to every new feature",
      "Founder product input sessions",
      "Extended affiliate commission rate",
    ],
    highlight: true,
    cta: "Apply as Pioneer",
  },
  {
    name: "Luminary",
    price: "$5,500",
    currency: "CAD",
    tagline: "The pinnacle",
    description:
      "The complete Monetura experience. Annual retreat, 1:1 introductions, advisory opportunities, and the deepest level of founder relationships.",
    features: [
      "Everything in Pioneer",
      "Annual Canadian founder retreat",
      "1:1 founder introduction calls",
      "Advisory seat opportunities",
      "Founding member recognition",
    ],
    highlight: false,
    cta: "Apply as Luminary",
  },
];

const stats = [
  { value: "200", label: "Total founders" },
  { value: "Canada", label: "Exclusively" },
  { value: "Lifetime", label: "Access" },
];

export default function HomePage() {
  return (
    <main className="overflow-hidden bg-monetura-charcoal">
      <section className="relative min-h-screen isolate">
        <div className="absolute inset-0">
          <Image
            src="/images/monetura-hero-reference.jpg"
            alt="Luxury yacht lifestyle at golden hour"
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(25,20,18,0.88)_0%,rgba(25,20,18,0.64)_42%,rgba(25,20,18,0.28)_72%,rgba(25,20,18,0.58)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(44,36,32,0.58)_0%,rgba(44,36,32,0.2)_34%,rgba(44,36,32,0.74)_100%)]" />
        </div>

        <div className="page-shell relative z-10 flex min-h-screen items-end pb-8 pt-28 sm:pb-16 sm:pt-32 lg:pt-36">
          <div className="grid w-full gap-10 lg:grid-cols-[minmax(0,680px)_1fr] lg:items-end xl:gap-12">
            <div className="max-w-[19rem] sm:max-w-[42rem]">
              <p className="editorial-label">Monetura</p>
              <h1 className="lux-heading max-w-[18rem] text-[2.38rem] text-monetura-cream sm:max-w-[32rem] sm:text-[3.4rem] lg:max-w-[37rem] lg:text-[4.3rem] xl:text-[4.55rem]">
                Passion becomes creation.
                <span className="mt-3 block text-monetura-champagne">
                  Creation becomes freedom.
                </span>
              </h1>
              <p className="lux-body mt-7 max-w-[20rem] text-[14px] leading-7 text-monetura-cream/78 sm:mt-8 sm:max-w-[32rem] sm:text-[15px] sm:leading-8 lg:mt-9 lg:max-w-[34rem] lg:text-[15.5px]">
                Monetura is the AI-powered platform that helps travellers turn every
                trip into content, every post into income, and every experience into
                something worth sharing.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:gap-4 lg:mt-11">
                <Link href="/founders/apply" className="btn-primary">
                  Apply for Founder Access
                </Link>
                <Link href="#what-is-monetura" className="btn-secondary">
                  Discover Monetura
                </Link>
              </div>
            </div>

            <div className="self-end lg:max-w-[21rem] lg:justify-self-end xl:max-w-sm">
              <div className="lux-panel rounded-[1.5rem] p-5 sm:rounded-[1.75rem] sm:p-8 lg:max-w-sm">
                <p className="text-[11px] uppercase tracking-[0.42em] text-monetura-champagne/90">
                  Editorial notes
                </p>
                <div className="hairline my-5" />
                <p className="text-sm leading-7 text-monetura-cream/72">
                  A premium travel-and-creation membership designed for founders who
                  want their experiences to become content, community, and income.
                </p>
                <div className="mt-7 grid grid-cols-3 gap-3 sm:mt-8 sm:gap-4">
                  {stats.map((stat) => (
                    <div key={stat.label} className="border-l border-monetura-sand/12 pl-4 first:border-l-0 first:pl-0">
                      <p className="text-lg tracking-[0.12em] text-monetura-champagne sm:text-2xl">
                        {stat.value}
                      </p>
                      <p className="mt-2 text-[9px] uppercase tracking-[0.28em] text-monetura-cream/48 sm:text-[10px] sm:tracking-[0.3em]">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="what-is-monetura" className="relative bg-monetura-cream text-monetura-charcoal">
        <div className="page-shell section-padding">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,460px)] lg:items-start">
            <div>
              <p className="editorial-label text-monetura-champagne before:bg-monetura-champagne/55">
                What is Monetura
              </p>
              <h2 className="lux-heading-tight max-w-3xl text-[2.2rem] text-monetura-charcoal sm:text-[3.4rem] lg:text-[4.5rem]">
                Travel more. Spend less. Earn while you do it.
              </h2>
              <div className="mt-8 max-w-2xl space-y-6 text-monetura-mocha/82">
                <p className="lux-body">
                  Most people treat travel as an expense. A cost. Something you
                  budget for and recover from when you get home.
                </p>
                <p className="lux-body">
                  Monetura changes that completely. We built a platform that takes
                  your existing passion for travel — the photos, the stories, the
                  places you&rsquo;ve been and the ones you&rsquo;re going — and turns all of
                  it into content, income, and opportunity.
                </p>
                <p className="lux-body">
                  You don&rsquo;t need to be an influencer. You don&rsquo;t need a following.
                  You just need to love what you&rsquo;re already doing.
                </p>
              </div>

              <blockquote className="mt-10 max-w-2xl border-l border-monetura-champagne/50 pl-6 text-lg leading-8 text-monetura-earth sm:text-xl">
                “Every trip you take is already worth sharing. Monetura makes it
                worth earning from too.”
              </blockquote>
            </div>

            <div className="space-y-6 lg:pt-6">
              <div className="image-frame aspect-[4/5] rounded-[1.75rem]">
                <Image
                  src="/images/monetura-tropical.jpg"
                  alt="Luxury tropical terrace overlooking water"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 460px"
                />
              </div>
              <div className="lux-cream-panel grid grid-cols-2 gap-4 rounded-[1.5rem] p-6 text-monetura-charcoal">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.36em] text-monetura-sunset">
                    AI
                  </p>
                  <p className="mt-3 text-xl tracking-[0.08em] sm:text-2xl">
                    Powered content
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.36em] text-monetura-sunset">
                    200
                  </p>
                  <p className="mt-3 text-xl tracking-[0.08em] sm:text-2xl">
                    Founders max
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="relative bg-monetura-charcoal">
        <div className="page-shell section-padding">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,520px)_1fr] lg:items-end">
            <div>
              <p className="editorial-label">How it works</p>
              <h2 className="lux-heading-tight max-w-xl text-[2.15rem] text-monetura-cream sm:text-[3.2rem] lg:text-[4.2rem]">
                Three steps from trip to income.
              </h2>
            </div>
            <p className="lux-body max-w-2xl text-monetura-cream/72 lg:justify-self-end">
              No content experience required. No existing audience needed. Just
              your experiences, Monetura&rsquo;s AI, and a few minutes after each trip.
            </p>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr] lg:gap-10">
            <div className="image-frame aspect-[4/5] lg:sticky lg:top-28">
              <Image
                src="/images/monetura-rooftop.jpg"
                alt="Luxury rooftop travel lifestyle scene"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 360px"
              />
            </div>
            <div className="card-grid-border grid overflow-hidden rounded-[1.75rem] lg:grid-cols-1">
              {steps.map((step) => (
                <article
                  key={step.number}
                  className="grid gap-5 bg-[linear-gradient(180deg,rgba(74,55,40,0.32)_0%,rgba(44,36,32,0.9)_100%)] p-7 sm:p-9 lg:grid-cols-[120px_minmax(0,220px)_1fr] lg:items-start"
                >
                  <p className="text-[2.6rem] leading-none tracking-[0.16em] text-monetura-champagne/85 sm:text-[3rem]">
                    {step.number}
                  </p>
                  <h3 className="text-xl tracking-[0.08em] text-monetura-cream sm:text-2xl">
                    {step.title}
                  </h3>
                  <p className="lux-body text-monetura-cream/68">{step.body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative bg-[#f8f1e8] text-monetura-charcoal">
        <div className="page-shell section-padding">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,520px)_1fr] lg:items-end">
            <div>
              <p className="editorial-label text-monetura-champagne">What you get</p>
              <h2 className="lux-heading-tight max-w-2xl text-[2.2rem] text-monetura-charcoal sm:text-[3.3rem] lg:text-[4.3rem]">
                Everything you need to turn passion into a platform.
              </h2>
            </div>
            <p className="lux-body max-w-2xl text-monetura-mocha/78 lg:justify-self-end">
              Six tools, one membership. Every feature is built around the same
              idea — your experiences already have value. Monetura helps you
              capture it.
            </p>
          </div>

          <div className="cream-grid-border mt-14 grid overflow-hidden rounded-[1.75rem] sm:grid-cols-2 xl:grid-cols-3">
            {features.map((feature) => (
              <article key={feature.title} className="group bg-[#fbf5ed] p-4 sm:p-5">
                <div className="overflow-hidden rounded-[1.35rem] bg-monetura-charcoal/5">
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={feature.image}
                      alt={feature.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_18%,rgba(44,36,32,0.32)_100%)]" />
                  </div>
                  <div className="p-6 sm:p-7">
                    <p className="text-[11px] uppercase tracking-[0.34em] text-monetura-sunset">
                      Included
                    </p>
                    <h3 className="mt-4 text-[1.35rem] leading-8 tracking-[0.08em] text-monetura-charcoal">
                      {feature.title}
                    </h3>
                    <p className="mt-4 text-[15px] leading-7 text-monetura-mocha/76">
                      {feature.body}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative bg-monetura-mocha">
        <div className="page-shell section-padding">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,520px)_1fr] lg:items-end">
            <div>
              <p className="editorial-label">Who this is for</p>
              <h2 className="lux-heading-tight max-w-2xl text-[2.15rem] text-monetura-cream sm:text-[3.2rem] lg:text-[4.2rem]">
                Built for people who already love to travel.
              </h2>
            </div>
            <p className="lux-body max-w-2xl text-monetura-cream/72 lg:justify-self-end">
              Monetura is not for everyone. It&rsquo;s for a specific kind of person —
              someone who already has the experiences, already has the stories,
              and just needs the right platform to make them count.
            </p>
          </div>

          <div className="mt-14 grid gap-8 xl:grid-cols-[minmax(0,1fr)_460px] xl:items-start">
            <div className="card-grid-border grid overflow-hidden rounded-[1.75rem] sm:grid-cols-2">
              {audience.map((item) => (
                <article key={item.number} className="bg-[linear-gradient(180deg,rgba(96,74,56,0.34)_0%,rgba(74,55,40,0.94)_100%)] p-8 sm:p-10">
                  <p className="text-[2.4rem] leading-none tracking-[0.16em] text-monetura-champagne/48 sm:text-[2.8rem]">
                    {item.number}
                  </p>
                  <h3 className="mt-6 text-[1.3rem] leading-8 tracking-[0.06em] text-monetura-cream sm:text-[1.45rem]">
                    {item.title}
                  </h3>
                  <p className="mt-5 text-[15px] leading-7 text-monetura-cream/68">
                    {item.body}
                  </p>
                </article>
              ))}
            </div>

            <div className="space-y-6 xl:sticky xl:top-28">
              <div className="image-frame aspect-[4/5]">
                <Image
                  src="/images/monetura-mountain.jpg"
                  alt="Luxury mountain retreat at sunset"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1280px) 100vw, 460px"
                />
              </div>
              <div className="lux-panel rounded-[1.5rem] p-6 sm:p-7">
                <p className="text-[11px] uppercase tracking-[0.4em] text-monetura-champagne">
                  The feeling
                </p>
                <p className="mt-4 text-base leading-8 text-monetura-cream/72">
                  Not a noisy creator ecosystem. Not generic entrepreneurship.
                  Monetura is designed for an elevated lifestyle built around
                  travel, storytelling, and quiet leverage.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="founders" className="relative bg-monetura-charcoal">
        <div className="page-shell section-padding">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,460px)_1fr] lg:items-end xl:gap-10">
            <div>
              <p className="editorial-label">Founders Club</p>
              <h2 className="lux-heading-tight max-w-[19rem] text-[2rem] text-monetura-cream sm:max-w-[26rem] sm:text-[2.85rem] lg:max-w-[29rem] lg:text-[3.35rem] xl:text-[3.55rem]">
                Be part of the founding chapter. One payment. Lifetime access.
              </h2>
            </div>
            <div className="max-w-[33rem] lg:justify-self-end">
              <p className="lux-body text-monetura-cream/72">
                This is not a course. This is not a mastermind. This is a
                platform, a business model, and a community — built around the
                life you already want to live.
              </p>
              <p className="mt-4 text-sm leading-7 tracking-[0.08em] text-monetura-cream/42">
                All tiers paid once via e-transfer or wire to ATB Bank. We review
                every application personally.
              </p>
            </div>
          </div>

          <div className="mt-12 grid gap-7 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start 2xl:grid-cols-[minmax(0,1fr)_390px]">
            <div className="card-grid-border grid overflow-hidden rounded-[1.75rem] md:grid-cols-2">
              {tiers.map((tier) => (
                <article
                  key={tier.name}
                  className={`relative flex h-full flex-col p-7 sm:p-8 xl:p-9 ${
                    tier.highlight
                      ? "bg-[linear-gradient(180deg,rgba(212,168,83,0.15)_0%,rgba(74,55,40,0.92)_100%)]"
                      : "bg-[linear-gradient(180deg,rgba(74,55,40,0.24)_0%,rgba(44,36,32,0.92)_100%)]"
                  }`}
                >
                  {tier.highlight ? (
                    <span className="mb-5 inline-flex w-fit rounded-full border border-monetura-champagne/50 bg-monetura-champagne/14 px-4 py-2 text-[10px] uppercase tracking-[0.32em] text-monetura-champagne">
                      Most popular
                    </span>
                  ) : null}
                  <p className="text-[10px] uppercase tracking-[0.32em] text-monetura-champagne/78 sm:text-[11px]">
                    {tier.tagline}
                  </p>
                  <h3 className="mt-3 text-[1.4rem] tracking-[0.07em] text-monetura-cream sm:text-[1.5rem]">
                    {tier.name}
                  </h3>
                  <div className="mt-5 flex items-end gap-2">
                    <span className="text-[2.05rem] leading-none tracking-[0.06em] text-monetura-cream sm:text-[2.2rem]">
                      {tier.price}
                    </span>
                    <span className="pb-1 text-[12px] uppercase tracking-[0.18em] text-monetura-cream/45 sm:text-sm sm:tracking-[0.2em]">
                      {tier.currency}
                    </span>
                  </div>
                  <p className="mt-2 text-[10px] uppercase tracking-[0.28em] text-monetura-cream/36 sm:text-[11px] sm:tracking-[0.3em]">
                    One-time payment
                  </p>
                  <p className="mt-5 text-[14px] leading-7 text-monetura-cream/68 sm:text-[14.5px]">
                    {tier.description}
                  </p>
                  <ul className="mt-7 space-y-2.5 text-[13.5px] leading-7 text-monetura-cream/66 sm:text-sm">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex gap-3">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-monetura-champagne" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-7 pt-1">
                    <Link
                      href="/founders/apply"
                      className={tier.highlight ? "btn-primary w-full" : "btn-secondary w-full"}
                    >
                      {tier.cta}
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            <div className="space-y-6 xl:sticky xl:top-28">
              <div className="image-frame aspect-[4/5]">
                <Image
                  src="/images/monetura-dining.jpg"
                  alt="Luxury dining scene aboard a yacht"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1280px) 100vw, 420px"
                />
              </div>
              <div className="lux-panel rounded-[1.5rem] p-6 sm:p-7 xl:p-6">
                <p className="text-[11px] uppercase tracking-[0.38em] text-monetura-champagne">
                  Founding Cohort — Canada only
                </p>
                <div className="mt-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[2.35rem] leading-none tracking-[0.06em] text-monetura-cream sm:text-[2.9rem]">
                      47
                    </p>
                    <p className="mt-2 text-[11px] uppercase tracking-[0.32em] text-monetura-cream/42">
                      Spots remaining
                    </p>
                  </div>
                  <p className="text-right text-sm uppercase tracking-[0.24em] text-monetura-champagne/82">
                    153 joined
                  </p>
                </div>
                <div className="mt-5 h-px w-full bg-monetura-sand/15">
                  <div className="h-px w-[76.5%] bg-monetura-champagne" />
                </div>
                <p className="mt-6 text-sm leading-7 text-monetura-cream/68">
                  200 founders. Canada only. One payment. Lifetime access. This
                  is the earliest invitation Monetura will ever offer.
                </p>
                <Link href="/founders/apply" className="btn-primary mt-7 w-full">
                  Apply for Founder Access
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
