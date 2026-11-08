"use client";

import Link from "next/link";
import { useState } from "react";

// ---------------------------------------------------------------------------
// Hero overlay tuning. The hero video is bright, warm and creamy, so the
// cream/gold copy needs a charcoal (#2C2420) scrim to read. Three stacked
// layers, each with its own opacity (0 = invisible, 1 = solid charcoal):
//   BASE   – flat wash over the whole frame.
//   LEFT   – left-to-right gradient; darkens the side the copy sits on and
//            fades to transparent so the couple on the right stays visible.
//   BOTTOM – bottom-up gradient behind the stats panel and buttons.
// ---------------------------------------------------------------------------
const OVERLAY_BASE_OPACITY = 0.3; // Flat charcoal wash over the whole video
const OVERLAY_LEFT_OPACITY = 0.65; // Charcoal strength at the far left edge, behind the headline
const OVERLAY_LEFT_FADE_END = "55%"; // Point across the width where the left gradient is fully transparent
const OVERLAY_BOTTOM_OPACITY = 0.5; // Charcoal strength at the bottom edge, behind buttons and stats

// Mobile only (below md). Replaces the BOTTOM layer on phones, where the
// centred copy sits over the bright dress and cliff. Measured against the
// first screen (svh), not the section, because the membership card extends
// the section below the fold.
const OVERLAY_BOTTOM_OPACITY_MOBILE = 0.75; // Charcoal strength at the bottom of the first screen, held behind the card below it
const OVERLAY_BOTTOM_FADE_END_MOBILE = "45svh"; // Distance from the top where the mobile gradient is fully transparent (= 55% up from the bottom)

const CHARCOAL_RGB = "44, 36, 32"; // #2C2420
const charcoal = (alpha: number) => `rgba(${CHARCOAL_RGB}, ${alpha})`;

const HERO_VIDEO_SRC = "/videos/hero.mp4";
const HERO_POSTER_SRC = "/images/hero-poster.jpg";

export default function HeroSection() {
  const [videoFailed, setVideoFailed] = useState(false);

  return (
    // Fallback chain: video -> poster image -> charcoal/mocha gradient.
    <section className="relative isolate min-h-[100svh] bg-gradient-to-br from-monetura-charcoal to-monetura-mocha">
      <div className="absolute inset-0 overflow-hidden">
        {/* Poster layer: shown if the video can't load. If the image also
            fails, the section's gradient shows through. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_POSTER_SRC})` }}
        />
        {!videoFailed && (
          <video
            // Mobile: keeps both faces in the upper-middle of the narrow crop.
            className="absolute inset-0 h-full w-full object-cover object-center max-md:object-[52%_30%]"
            src={HERO_VIDEO_SRC}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster={HERO_POSTER_SRC}
            onError={() => setVideoFailed(true)}
          />
        )}

        {/* Overlay 1: base charcoal wash */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ backgroundColor: charcoal(OVERLAY_BASE_OPACITY) }}
        />
        {/* Overlay 2: left-to-right, dark behind the copy */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(to right, ${charcoal(OVERLAY_LEFT_OPACITY)} 0%, ${charcoal(0)} ${OVERLAY_LEFT_FADE_END})`,
          }}
        />
        {/* Overlay 3: bottom-up, behind stats and buttons (md and up) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 max-md:hidden"
          style={{
            backgroundImage: `linear-gradient(to bottom, ${charcoal(0)} 0%, ${charcoal(OVERLAY_BOTTOM_OPACITY)} 100%)`,
          }}
        />
        {/* Overlay 3, mobile: stronger, anchored to the first screen */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 md:hidden"
          style={{
            backgroundImage: `linear-gradient(to bottom, ${charcoal(0)} ${OVERLAY_BOTTOM_FADE_END_MOBILE}, ${charcoal(OVERLAY_BOTTOM_OPACITY_MOBILE)} 100svh)`,
          }}
        />
      </div>

      <div className="page-shell relative z-10 flex min-h-[100svh] items-end pb-6 pt-24 sm:pb-16 sm:pt-32 lg:pt-36">
        <div className="grid w-full gap-8 sm:gap-10 lg:grid-cols-[minmax(0,680px)_1fr] lg:items-end xl:gap-12">
          {/* Centered on mobile, left-aligned over the darker side on desktop. */}
          <div className="mx-auto max-w-[21rem] text-center sm:max-w-[42rem] lg:mx-0 lg:text-left">
            {/* Mobile: headline, subtext and buttons fill the first screen,
                pinned to its bottom (min-height = 100svh minus the shell's top
                padding), so the top of the frame and the couple stay clear.
                The membership card follows just below the fold. Plain block
                wrapper from md up, so desktop layout is unaffected. */}
            <div className="max-md:flex max-md:min-h-[calc(100svh-6rem)] max-md:flex-col max-md:justify-end max-md:pb-10 sm:max-md:min-h-[calc(100svh-8rem)]">
            {/* Sized to read confident rather than shouting, and held to a
                single line from lg upward. 20% smaller on mobile so it sits
                on two lines below the couple. */}
            <h1 className="lux-heading [text-shadow:0_2px_24px_rgba(44,36,32,0.45)] mx-auto max-w-[18rem] text-5xl max-md:text-[2.4rem] text-monetura-cream sm:max-w-[32rem] lg:mx-0 lg:max-w-none lg:whitespace-nowrap lg:text-6xl">
              Find your way{" "}
              <span className="text-monetura-champagne">back.</span>
            </h1>
            <p className="lux-body [text-shadow:0_2px_24px_rgba(44,36,32,0.45)] mx-auto mt-6 max-w-[20rem] text-[13.5px] leading-6 text-monetura-cream/78 sm:mt-8 sm:max-w-[32rem] sm:text-[15px] sm:leading-8 lg:mx-0 lg:mt-9 lg:max-w-[34rem] lg:text-[15.5px]">
              Monetura helps people who&apos;ve spent years living for everyone
              else find their way back to travel, to each other, and to themselves.
            </p>

            {/* max-w-sm is the mobile stack width. It has to be released once
                the buttons sit side by side, or the two sm:w-auto pills share
                384px, shrink below their natural ~596px and the labels wrap to
                three lines. flex-wrap lets the second pill drop to its own row
                on narrow tablets instead of overflowing. */}
            <div className="mx-auto mt-7 flex max-w-sm flex-col gap-3 sm:mt-10 sm:max-w-none sm:flex-row sm:flex-wrap sm:justify-center sm:gap-5 lg:mx-0 lg:mt-11 lg:justify-start">
              <Link
                href="/waitlist"
                className="btn-primary whitespace-nowrap lg:px-10"
              >
                Be the first to know
              </Link>
              <Link
                href="#the-origin"
                className="btn-secondary whitespace-nowrap lg:px-10"
              >
                Discover Monetura
              </Link>
            </div>
            </div>

            <div className="lux-panel mx-auto mt-5 max-w-[20rem] rounded-[1.3rem] p-4 lg:hidden">
              <p className="text-[10px] uppercase tracking-[0.2em] text-monetura-champagne/88">
                The Membership
              </p>
              <p className="mt-3 text-sm leading-6 text-monetura-cream/72">
                A travel-and-creation membership for people ready to find their way back to travel, to each other, and to themselves.
              </p>
            </div>
          </div>

          <div className="hidden self-end lg:block lg:max-w-[20rem] lg:justify-self-end xl:max-w-[22rem]">
            <div className="lux-panel rounded-[1.4rem] p-4 sm:rounded-[1.75rem] sm:p-8 sm:pr-10">
              <p className="text-[10px] uppercase tracking-[0.28em] text-monetura-champagne/90 sm:text-[11px] sm:tracking-[0.42em]">
                The Membership
              </p>
              <div className="hairline my-5" />
              <p className="text-sm leading-7 text-monetura-cream/72">
                A travel-and-creation membership for people ready to
                find their way back to travel, to each other, and to themselves.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
