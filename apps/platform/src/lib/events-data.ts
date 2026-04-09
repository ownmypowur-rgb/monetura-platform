export type EventType = {
  slug: string;
  title: string;
  type: string;
  typeDot: string; // hex color for the type dot
  date: string; // "May 15, 2026"
  endDate: string;
  duration: string; // "3 days"
  location: string;
  country: string;
  heroImage: string;
  tagline: string;
  description: string; // paragraphs separated by \n\n
  included: string[];
  price: string;
  priceNote: string;
  ctaLabel: string;
};

export const EVENTS: EventType[] = [
  {
    slug: "founders-meetup-calgary",
    title: "Founders Meetup — Calgary",
    type: "Member Meetup",
    typeDot: "#FBF5ED",
    date: "May 15, 2026",
    endDate: "May 17, 2026",
    duration: "3 days",
    location: "Calgary, AB",
    country: "Canada",
    heroImage:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600",
    tagline: "Connect. Build. Grow.",
    description:
      "A curated in-person gathering for Monetura founders in the heart of Calgary. Meet the people behind the platform, share wins, dissect what isn't working, discuss strategy, and build the relationships that fuel real growth. Intimate by design — maximum 30 founders — because the conversations that matter most happen when there's room to actually have them.\n\nThese meetups are different from typical networking events because everyone in the room has skin in the game. No pitch decks, no strangers handing out business cards. Just founders who have made a commitment, building trust with each other over a shared table. The momentum you carry home from a weekend like this compounds for months.",
    included: [
      "Welcome dinner Friday evening",
      "Full-day Saturday workshop (content strategy + monetization)",
      "Founders roundtable — open Q&A format",
      "Professional headshots included",
      "Sunday morning brunch and closing session",
    ],
    price: "Included with Founder membership",
    priceNote: "Travel and accommodation not included",
    ctaLabel: "Reserve Your Spot",
  },
  {
    slug: "wellness-growth-retreat-tulum",
    title: "Wellness & Growth Retreat",
    type: "Curated Experience",
    typeDot: "#7BAE8A",
    date: "May 28, 2026",
    endDate: "June 1, 2026",
    duration: "5 days",
    location: "Tulum, Mexico",
    country: "Mexico",
    heroImage:
      "https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=1600",
    tagline: "Grow your business. Restore your soul.",
    description:
      "Five days in Tulum combining morning wellness practices with afternoon business coaching and content creation masterclasses. This retreat is designed specifically for lifestyle entrepreneurs who want to build a business that doesn't cost them their wellbeing. Mornings begin with guided yoga and meditation on the beach. Afternoons shift into focused coaching with facilitators who have built seven-figure businesses themselves. Evenings are yours.\n\nTulum provides the ideal container for this work — the ancient Mayan energy of the jungle, the turquoise Caribbean, and a culture built around presence and intention. You will leave with a refined business strategy, a library of content, and a sense of clarity that most people only find after a month-long sabbatical. This is that, compressed into five extraordinary days.",
    included: [
      "Daily morning yoga and meditation",
      "Business coaching sessions (2 hours/day)",
      "Content creation workshops",
      "Cenote excursion",
      "Welcome dinner and farewell dinner",
      "Beachfront accommodation (optional upgrade available)",
    ],
    price: "From $2,800 CAD",
    priceNote: "Founder members receive 20% discount",
    ctaLabel: "Express Interest",
  },
  {
    slug: "santorini-curated-experience",
    title: "Santorini Curated Experience",
    type: "Travel Experience",
    typeDot: "#D4A853",
    date: "June 8, 2026",
    endDate: "June 14, 2026",
    duration: "7 days",
    location: "Santorini, Greece",
    country: "Greece",
    heroImage:
      "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1600",
    tagline: "Where extraordinary becomes ordinary.",
    description:
      "A week in Santorini curated exclusively for Monetura members. Private villa stays, sunset sailing on the Aegean, local culinary experiences with chefs who have cooked for heads of state, and dedicated content creation time against some of the most photogenic backdrops in the world. No tourist traps. Every element of this itinerary was chosen because it is the version of Santorini that visitors rarely find on their own.\n\nThe content you generate in seven days here will fuel your platforms for months. Imagine waking up to the caldera at sunrise, spending the afternoon on a private charter as the sun melts into the sea, and sitting down to a table lit by candlelight with a group of people building extraordinary lives. This is not a holiday. This is an investment in the life and brand you are building.",
    included: [
      "7 nights private villa accommodation",
      "Private sunset sailing charter",
      "Guided volcanic hot springs tour",
      "Cooking class with local chef",
      "Professional photography session",
      "Airport transfers throughout",
      "Welcome champagne reception",
    ],
    price: "From $5,200 CAD",
    priceNote: "Founder members receive priority booking",
    ctaLabel: "Express Interest",
  },
  {
    slug: "safari-photography-botswana",
    title: "Safari Photography Adventure",
    type: "Adventure",
    typeDot: "#C4704F",
    date: "June 22, 2026",
    endDate: "July 1, 2026",
    duration: "10 days",
    location: "Botswana, Africa",
    country: "Botswana",
    heroImage:
      "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=1600",
    tagline: "See the wild. Learn to capture it.",
    description:
      "Ten days in the Okavango Delta — one of the last truly wild places on Earth — learning wildlife photography from professional nature photographers who have shot for National Geographic, BBC, and the world's leading conservation publications. The Okavango is a UNESCO World Heritage site and arguably the most biodiverse ecosystem on the African continent. Elephant herds at the waterhole at dusk. Leopard in the fever trees at dawn. This is the classroom.\n\nThe photography skills you build here translate directly to every other niche you shoot. Wildlife photography demands mastery of light, patience, timing, and storytelling — the exact same skills that separate good content from remarkable content. You will return with a portfolio that elevates your brand instantly, and a technical foundation that makes everything you shoot afterward look different.",
    included: [
      "10 nights luxury tented safari camp",
      "All game drives (morning and evening)",
      "Professional wildlife photography instruction throughout",
      "Camera equipment loan available",
      "All meals included",
      "Small group — maximum 12 members",
      "Mokoro canoe excursion through the delta",
      "Village cultural visit",
    ],
    price: "From $9,500 CAD",
    priceNote: "Founder members receive 15% discount + priority booking",
    ctaLabel: "Express Interest",
  },
  {
    slug: "banff-weekend-retreat",
    title: "Banff Weekend Retreat",
    type: "Member Meetup",
    typeDot: "#FBF5ED",
    date: "July 12, 2026",
    endDate: "July 14, 2026",
    duration: "3 days",
    location: "Banff, AB",
    country: "Canada",
    heroImage:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1600",
    tagline: "Reset in the Rockies.",
    description:
      "A long weekend in Banff designed for Canadian founders and members to connect, recharge, and map out the next chapter. Saturday mornings are structured — a strategy workshop focused on Q3 and Q4 planning, with facilitated sessions on content calendars, income diversification, and building leverage. Saturday and Sunday afternoons are yours to explore the mountains, walk the trails, or sit by the river and let your mind decompress.\n\nThere is something about elevation — literal and figurative — that unlocks a different quality of thinking. Problems that felt intractable at sea level have a way of resolving themselves when you are surrounded by three-thousand-metre peaks and clean mountain air. The conversations around the fire on Saturday night are the kind that people reference years later. Come ready to think, and leave with a plan.",
    included: [
      "3 nights Banff accommodation",
      "Saturday strategy workshop",
      "Guided Lake Louise hike",
      "Group dinner Friday and Saturday evenings",
      "Sunday morning journaling session",
      "Closing bonfire Saturday night",
    ],
    price: "From $1,200 CAD",
    priceNote: "Founder membership includes full rebate (travel not included)",
    ctaLabel: "Reserve Your Spot",
  },
];
