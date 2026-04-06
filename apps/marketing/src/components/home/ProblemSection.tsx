export default function ProblemSection() {
  const problems = [
    {
      number: "01",
      title: "You're outgrowing your circle",
      body: "Your friends want stability. You want scale. That gap gets lonelier every year.",
    },
    {
      number: "02",
      title: "Masterminds are watered-down",
      body: "You've paid for rooms full of people at completely different stages. The signal-to-noise is brutal.",
    },
    {
      number: "03",
      title: "Information isn't your problem",
      body: "You've consumed the courses. You know what to do. What you need is who to do it with.",
    },
    {
      number: "04",
      title: "Canada's network is invisible",
      body: "The serious operators in this country don't post on LinkedIn. They're not in your city's \"entrepreneur\" Facebook group.",
    },
  ];

  return (
    <section className="bg-monetura-mocha py-32 lg:py-40">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        {/* Section label */}
        <p className="text-monetura-champagne text-xs tracking-[0.3em] uppercase font-garet mb-12">
          The Problem
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-end mb-20">
          <h2 className="font-garet font-bold text-3xl md:text-4xl lg:text-5xl text-monetura-cream leading-[1.15]">
            You&rsquo;ve built something real.
            <br />
            <span className="text-monetura-champagne">
              The room hasn&rsquo;t caught up.
            </span>
          </h2>
          <p className="text-monetura-cream/50 text-base md:text-lg leading-relaxed">
            The networks built for founders in Canada are either too early-stage,
            too expensive for what they deliver, or built around a personality
            rather than a genuine community.
          </p>
        </div>

        {/* Problem grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-monetura-sand/10">
          {problems.map(({ number, title, body }) => (
            <div
              key={number}
              className="bg-monetura-mocha p-10 lg:p-12 border border-monetura-sand/10 hover:border-monetura-champagne/20 transition-colors duration-300"
            >
              <p className="text-monetura-champagne/40 font-garet font-bold text-4xl mb-6 leading-none">
                {number}
              </p>
              <h3 className="font-garet font-bold text-lg text-monetura-cream mb-4 leading-snug">
                {title}
              </h3>
              <p className="text-monetura-cream/50 text-sm leading-relaxed">
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
