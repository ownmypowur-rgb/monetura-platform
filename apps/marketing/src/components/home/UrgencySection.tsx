export default function UrgencySection() {
  // In production this would be fetched from DB
  const spotsRemaining = 47;
  const totalSpots = 200;
  const percentFilled = Math.round(
    ((totalSpots - spotsRemaining) / totalSpots) * 100,
  );

  return (
    <section className="bg-monetura-terracotta py-20">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-white/70 text-xs tracking-[0.3em] uppercase font-garet mb-4">
              Founding Cohort
            </p>
            <h2 className="font-garet font-bold text-2xl md:text-3xl lg:text-4xl text-white leading-[1.2]">
              {spotsRemaining} of {totalSpots} founder
              <br />
              spots remaining.
            </h2>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <p className="text-white/70 text-xs tracking-[0.15em] uppercase font-garet">
                {totalSpots - spotsRemaining} founders joined
              </p>
              <p className="text-white text-xs tracking-[0.15em] uppercase font-garet font-bold">
                {spotsRemaining} remaining
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full h-px bg-white/20 relative mb-8">
              <div
                className="absolute left-0 top-0 h-full bg-white transition-all duration-1000"
                style={{ width: `${percentFilled}%` }}
              />
            </div>

            <a
              href="/founders/apply"
              className="inline-block border border-white text-white text-xs tracking-[0.2em] uppercase font-garet px-10 py-4 hover:bg-white hover:text-monetura-terracotta transition-all duration-300"
            >
              Secure Your Spot Now
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
