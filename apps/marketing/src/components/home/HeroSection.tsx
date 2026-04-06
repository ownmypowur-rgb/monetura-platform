export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Video background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        poster="/images/hero-poster.jpg"
      >
        <source src="/videos/hero.mp4" type="video/mp4" />
      </video>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-monetura-charcoal/80 via-monetura-charcoal/60 to-monetura-charcoal/90" />
      <div className="absolute inset-0 bg-monetura-charcoal/40" />

      {/* Fallback gradient if no video */}
      <div className="absolute inset-0 bg-gradient-to-br from-monetura-charcoal via-monetura-mocha/80 to-monetura-charcoal -z-10" />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        {/* Wordmark */}
        <p className="text-monetura-champagne font-garet font-bold text-2xl md:text-3xl tracking-[0.3em] uppercase mb-16">
          Monetura
        </p>

        {/* Headline */}
        <h1 className="font-garet font-bold text-4xl md:text-6xl lg:text-7xl text-monetura-cream leading-[1.1] tracking-tight mb-8">
          Passion becomes creation.
          <br />
          <span className="text-monetura-champagne">Creation becomes freedom.</span>
        </h1>

        {/* Subheadline */}
        <p className="text-monetura-cream/60 text-base md:text-lg leading-relaxed mb-16 max-w-2xl mx-auto">
          Monetura is the AI-powered platform that helps travellers turn every
          trip into content, every post into income, and every experience into
          something worth sharing.
        </p>

        {/* CTA */}
        <a href="/founders/apply" className="btn-champagne">
          Apply for Founder Access
        </a>

        {/* Stats */}
        <div className="mt-20 flex flex-col sm:flex-row items-center justify-center gap-12 sm:gap-16">
          <Stat value="200" label="Total Founders" />
          <div className="hidden sm:block w-px h-10 bg-monetura-sand/20" />
          <Stat value="Canada" label="Exclusively" />
          <div className="hidden sm:block w-px h-10 bg-monetura-sand/20" />
          <Stat value="Lifetime" label="Access" />
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
        <div className="w-px h-10 bg-monetura-champagne/40" />
        <div className="w-1.5 h-1.5 rounded-full bg-monetura-champagne/40" />
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-monetura-champagne font-garet font-bold text-2xl md:text-3xl tracking-wide mb-1">
        {value}
      </p>
      <p className="text-monetura-cream/40 text-xs tracking-[0.2em] uppercase">
        {label}
      </p>
    </div>
  );
}
