import Link from "next/link";

const stats = [
  { value: "200", label: "Total founders" },
  { value: "Lifetime", label: "Access" },
];

export default function HeroSection() {
  return (
    <section className="relative isolate min-h-[100svh]">
      <div className="absolute inset-0 overflow-hidden">
        <video
          className="h-full w-full object-cover object-center"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="/videos/hero-lagoon-poster.jpg"
        >
          <source src="/videos/hero-lagoon.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(25,20,18,0.94)_0%,rgba(25,20,18,0.76)_36%,rgba(25,20,18,0.44)_68%,rgba(25,20,18,0.7)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(44,36,32,0.72)_0%,rgba(44,36,32,0.34)_34%,rgba(44,36,32,0.84)_100%)]" />
      </div>

      <div className="page-shell relative z-10 flex min-h-[100svh] items-end pb-6 pt-24 sm:pb-16 sm:pt-32 lg:pt-36">
        <div className="grid w-full gap-8 sm:gap-10 lg:grid-cols-[minmax(0,680px)_1fr] lg:items-end xl:gap-12">
          <div className="max-w-[21rem] sm:max-w-[42rem]">
            <p className="editorial-label">MONETURA</p>
            {/* Sized to read confident rather than shouting, and held to a
                single line from lg upward. */}
            <h1 className="lux-heading max-w-[18rem] text-5xl text-monetura-cream sm:max-w-[32rem] lg:max-w-none lg:whitespace-nowrap lg:text-6xl">
              Find your way{" "}
              <span className="text-monetura-champagne">back.</span>
            </h1>
            <p className="lux-body mt-6 max-w-[20rem] text-[13.5px] leading-6 text-monetura-cream/78 sm:mt-8 sm:max-w-[32rem] sm:text-[15px] sm:leading-8 lg:mt-9 lg:max-w-[34rem] lg:text-[15.5px]">
              Monetura turns the life you already want to live into content,
              community, and income.
            </p>

            <div className="mt-7 flex max-w-sm flex-col gap-3 sm:mt-10 sm:flex-row sm:gap-4 lg:mt-11">
              <Link href="/founders/apply" className="btn-primary">
                Apply for Founder Access
              </Link>
              <Link href="#the-origin" className="btn-secondary">
                Discover Monetura
              </Link>
            </div>

            <div className="lux-panel mt-5 max-w-[20rem] rounded-[1.3rem] p-4 lg:hidden">
              <p className="text-[10px] uppercase tracking-[0.2em] text-monetura-champagne/88">
                Founders edition
              </p>
              <p className="mt-3 text-sm leading-6 text-monetura-cream/72">
                A premium travel-and-creation membership for founders who want their experiences to become content and income.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-monetura-sand/10 pt-4">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <p className="text-lg tracking-[0.08em] text-monetura-champagne">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-[9px] uppercase tracking-[0.18em] text-monetura-cream/44">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="hidden self-end lg:block lg:max-w-[18rem] lg:justify-self-end xl:max-w-[20rem]">
            <div className="lux-panel rounded-[1.4rem] p-4 sm:rounded-[1.75rem] sm:p-8">
              <p className="text-[10px] uppercase tracking-[0.28em] text-monetura-champagne/90 sm:text-[11px] sm:tracking-[0.42em]">
                Editorial notes
              </p>
              <div className="hairline my-5" />
              <p className="text-sm leading-7 text-monetura-cream/72">
                A premium travel-and-creation membership designed for founders who
                want their experiences to become content, community, and income.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="border-l border-monetura-sand/12 pl-4 first:border-l-0 first:pl-0"
                  >
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
  );
}
