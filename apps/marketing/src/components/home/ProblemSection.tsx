const points = [
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

export default function ProblemSection() {
  return (
    <section className="bg-monetura-mocha py-32 lg:py-40">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        {/* Section label */}
        <p className="text-monetura-champagne text-xs tracking-[0.3em] uppercase font-garet mb-12">
          Who This Is For
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-end mb-20">
          <h2 className="font-garet font-bold text-3xl md:text-4xl lg:text-5xl text-monetura-cream leading-[1.15]">
            Built for people who
            <br />
            <span className="text-monetura-champagne">
              already love to travel.
            </span>
          </h2>
          <p className="text-monetura-cream/50 text-base md:text-lg leading-relaxed">
            Monetura is not for everyone. It&rsquo;s for a specific kind of
            person — someone who already has the experiences, already has the
            stories, and just needs the right platform to make them count.
          </p>
        </div>

        {/* Points grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-monetura-sand/10">
          {points.map(({ number, title, body }) => (
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
