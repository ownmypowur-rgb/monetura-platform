export type MarketplaceCategory =
  | "travel-gear"
  | "swimwear-beach"
  | "photography"
  | "wellness";

export type CheckoutType = "external" | "contact";

export type MarketplaceProduct = {
  slug: string;
  name: string;
  brand: string;
  category: MarketplaceCategory;
  description: string;
  longDescription: string;
  publicPrice: number; // CAD
  memberPrice: number; // CAD
  savingsPercent: number;
  image: string; // primary image
  images: string[]; // gallery including primary
  tags: string[];
  checkoutType: CheckoutType;
  externalUrl?: string;
  inStock: boolean;
  featured: boolean;
  submittedByMember: boolean;
  approvedAt: string; // ISO date string
};

export const MARKETPLACE_PRODUCTS: MarketplaceProduct[] = [
  // ── Travel Gear ──────────────────────────────────────────────────────────
  {
    slug: "nomatic-travel-pack-40l",
    name: "Travel Pack 40L",
    brand: "NOMATIC",
    category: "travel-gear",
    description: "The carry-on that passes every airline size check — and earns compliments in every airport lounge.",
    longDescription:
      "Built for the creator who is always in motion. The NOMATIC 40L Travel Pack is the result of years of feedback from digital nomads and frequent travellers. Every pocket is intentional: a dedicated camera compartment, a fleece-lined tech organiser, a hidden back panel that opens flat for TSA screening, and a magnetic water bottle pocket that works one-handed. The weatherproof ripstop shell has survived monsoons in Vietnam and sandstorms in Morocco. At 40 litres it sits right at the sweet spot — spacious enough for a two-week trip, compact enough to fit in any overhead bin.\n\nAs a Monetura member you receive a 22% discount plus priority access to limited colourways before public release.",
    publicPrice: 389,
    memberPrice: 303,
    savingsPercent: 22,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800",
    images: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800",
      "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800",
      "https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=800",
    ],
    tags: ["carry-on", "camera bag", "nomad", "weatherproof"],
    checkoutType: "external",
    externalUrl: "https://nomatic.com",
    inStock: true,
    featured: true,
    submittedByMember: false,
    approvedAt: "2026-03-01",
  },
  {
    slug: "peak-design-travel-tripod",
    name: "Travel Tripod",
    brand: "Peak Design",
    category: "travel-gear",
    description: "The lightest full-height carbon fibre tripod ever built. Folds to the size of a water bottle.",
    longDescription:
      "At 1.27 kg and folding to just 39 cm, the Peak Design Travel Tripod goes where traditional tripods cannot. Carbon fibre legs flex into any surface — sand, rock, uneven cobblestone. The ball head integrates seamlessly with the Peak Design capture clip ecosystem so your camera mounts in seconds. If you are shooting content on location, this is the tripod that disappears into your bag and reappears exactly when you need it.\n\nMonetaura members receive 20% off retail plus a free Peak Design capture clip (valued at $89 CAD) included with every order.",
    publicPrice: 699,
    memberPrice: 559,
    savingsPercent: 20,
    image: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800",
    images: [
      "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800",
      "https://images.unsplash.com/photo-1542038374-9e5b3f8a0e1e?w=800",
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800",
    ],
    tags: ["tripod", "carbon fibre", "lightweight", "content creation"],
    checkoutType: "external",
    externalUrl: "https://peakdesign.com",
    inStock: true,
    featured: true,
    submittedByMember: false,
    approvedAt: "2026-03-01",
  },
  {
    slug: "aer-day-sling-3",
    name: "Day Sling 3",
    brand: "Aer",
    category: "travel-gear",
    description: "The everyday carry refined. One bag, every scenario — airport security to rooftop sunset session.",
    longDescription:
      "The Aer Day Sling 3 is the bag that lives on your shoulder from the moment you leave your hotel room to the moment you get back. Front organisation panel keeps cables, cards, and lens filters within reach in seconds. Padded back panel protects a 13-inch laptop or tablet. Water-resistant 1680D Cordura shell shrugs off light rain. At 10 litres, it sits low-profile enough for a full day of shooting without feeling like you are carrying a bag at all.\n\nMonetaura members receive 18% off retail.",
    publicPrice: 149,
    memberPrice: 122,
    savingsPercent: 18,
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800",
    images: [
      "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800",
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800",
    ],
    tags: ["sling", "day bag", "minimalist", "everyday carry"],
    checkoutType: "external",
    externalUrl: "https://aersf.com",
    inStock: true,
    featured: false,
    submittedByMember: false,
    approvedAt: "2026-03-10",
  },
  {
    slug: "zero-grid-travel-wallet",
    name: "Travel Wallet",
    brand: "Zero Grid",
    category: "travel-gear",
    description: "RFID-blocking passport organiser with room for cards, currency, boarding passes, and a SIM card sleeve.",
    longDescription:
      "Built for the traveller who crosses borders monthly. The Zero Grid Travel Wallet holds a passport, up to 10 cards in RFID-blocking slots, folded currency, two boarding passes, a pen, and a micro SIM storage sleeve. Slim enough to fit inside a jacket inner pocket. The premium water-resistant shell has a YKK zipper that has opened and closed over 50,000 times in stress testing.\n\nMonetaura members receive 25% off retail plus a free luggage tag.",
    publicPrice: 79,
    memberPrice: 59,
    savingsPercent: 25,
    image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800",
    images: [
      "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800",
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800",
    ],
    tags: ["wallet", "passport", "RFID", "travel organiser"],
    checkoutType: "external",
    externalUrl: "https://zerogrid.com",
    inStock: true,
    featured: false,
    submittedByMember: true,
    approvedAt: "2026-03-15",
  },

  // ── Swimwear & Beach ──────────────────────────────────────────────────────
  {
    slug: "vilebrequin-long-swim-shorts",
    name: "Long Swim Shorts",
    brand: "Vilebrequin",
    category: "swimwear-beach",
    description: "The original French Riviera boardshort. Prints that belong in a gallery, fabric that dries in minutes.",
    longDescription:
      "Since 1971, Vilebrequin has defined luxury swimwear on the world's finest beaches. The Long Swim Shorts are crafted from Superflex microfibre — a proprietary fabric that dries in under 30 minutes, holds colour across hundreds of washes, and has a drape that falls like tailored linen. Every print is created by in-house artists and tells a story. Available in 40+ seasonal and archive prints.\n\nMonetaura members receive 30% off retail on selected styles, plus early access to new season drops.",
    publicPrice: 295,
    memberPrice: 207,
    savingsPercent: 30,
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
    images: [
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800",
      "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800",
    ],
    tags: ["luxury", "French Riviera", "quick-dry", "boardshort"],
    checkoutType: "external",
    externalUrl: "https://vilebrequin.com",
    inStock: true,
    featured: true,
    submittedByMember: false,
    approvedAt: "2026-02-20",
  },
  {
    slug: "onia-plisse-one-piece",
    name: "Plissé One-Piece",
    brand: "Onia",
    category: "swimwear-beach",
    description: "Elevated swimwear designed for the woman who moves between pool deck and patio without changing.",
    longDescription:
      "Onia's Plissé One-Piece is constructed from Italian stretch crepe — a fabric with the structure of a resort dress and the function of performance swimwear. UPF 50+ protection, fully lined, adjustable straps, and a silhouette that flatters every body. It moves from morning laps to afternoon aperitivo without skipping a beat. A wardrobe anchor for the Santorini trip or the Tulum retreat.\n\nMonetaura members receive 25% off retail.",
    publicPrice: 245,
    memberPrice: 184,
    savingsPercent: 25,
    image: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800",
    images: [
      "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800",
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800",
    ],
    tags: ["one-piece", "Italian fabric", "resort", "UPF 50+"],
    checkoutType: "external",
    externalUrl: "https://onia.com",
    inStock: true,
    featured: false,
    submittedByMember: false,
    approvedAt: "2026-02-20",
  },
  {
    slug: "heliotrope-beach-blanket",
    name: "XL Beach Blanket",
    brand: "Heliotrope",
    category: "swimwear-beach",
    description: "Sand-resistant, quick-dry Turkish cotton blanket. Large enough for two. Compact enough for a beach bag.",
    longDescription:
      "Woven from 100% Turkish cotton, the Heliotrope XL Beach Blanket is the kind of object that outlives the trip it was bought for. At 180 × 200 cm it is generously sized for two. The tightly woven flat weave sheds sand rather than trapping it — shake it out and it is clean. It folds into a package the size of a paperback book and weighs under 700g. Comes in eight colourways chosen for how they look in photographs.\n\nMonetaura members receive 20% off retail.",
    publicPrice: 89,
    memberPrice: 71,
    savingsPercent: 20,
    image: "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800",
    images: [
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
    ],
    tags: ["Turkish cotton", "sand-resistant", "quick-dry", "beach"],
    checkoutType: "external",
    externalUrl: "https://heliotrope.ca",
    inStock: true,
    featured: false,
    submittedByMember: true,
    approvedAt: "2026-03-05",
  },
  {
    slug: "illesteva-palmilla-sunglasses",
    name: "Palmilla Sunglasses",
    brand: "Illesteva",
    category: "swimwear-beach",
    description: "Handcrafted Italian acetate frames with mineral glass lenses. The sunglass that photographs itself.",
    longDescription:
      "Every Illesteva frame begins life as a sheet of Italian acetate — a material derived from cotton and wood pulp that develops depth and character over years of wear. The Palmilla is a rounded oversized silhouette with subtle tortoise and smoke colourways that photograph beautifully in every light. Mineral glass lenses (not polycarbonate) deliver optical clarity that is immediately noticeable. The nose pads are silicone and fully adjustable.\n\nMonetaura members receive 25% off retail.",
    publicPrice: 275,
    memberPrice: 206,
    savingsPercent: 25,
    image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800",
    images: [
      "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800",
      "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=800",
    ],
    tags: ["sunglasses", "Italian acetate", "mineral glass", "luxury"],
    checkoutType: "external",
    externalUrl: "https://illesteva.com",
    inStock: true,
    featured: true,
    submittedByMember: false,
    approvedAt: "2026-02-25",
  },

  // ── Photography ───────────────────────────────────────────────────────────
  {
    slug: "sony-fx30-cinema-camera",
    name: "FX30 Cinema Camera",
    brand: "Sony",
    category: "photography",
    description: "Professional Super 35 cinema sensor in the smallest, lightest body Sony has ever built.",
    longDescription:
      "The Sony FX30 brings the FX3's cinema sensor lineage down into a form factor that fits in a jacket pocket. 26 megapixel APS-C sensor with Sony's S-Cinetone colour science, 4K 120fps slow motion, 5-axis in-body stabilisation, and full compatibility with Sony E-mount glass including the cinema range. For creators who shoot both photos and video, this is the camera that bridges both worlds without compromise.\n\nMonetaura members receive 15% off retail plus Sony's extended 3-year warranty at no additional cost.",
    publicPrice: 2399,
    memberPrice: 2039,
    savingsPercent: 15,
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800",
    images: [
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800",
      "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800",
      "https://images.unsplash.com/photo-1542038374-9e5b3f8a0e1e?w=800",
    ],
    tags: ["camera", "video", "cinema", "4K", "Sony"],
    checkoutType: "contact",
    inStock: true,
    featured: true,
    submittedByMember: false,
    approvedAt: "2026-02-15",
  },
  {
    slug: "sigma-18-50mm-f28-lens",
    name: "18–50mm f/2.8 DC DN",
    brand: "Sigma",
    category: "photography",
    description: "The sharpest travel zoom ever made for APS-C. Two stops faster than kit lenses at half the price.",
    longDescription:
      "The Sigma 18–50mm f/2.8 is the lens that travel and lifestyle creators have been waiting for. Constant f/2.8 aperture across the entire zoom range means no light loss as you zoom out — critical for golden hour and indoor shooting. The optics match Sigma's Art series quality at a Contemporary price. Compact and lightweight at 290g, it disappears on a Sony FX30, Fuji X-T5, or any APS-C mirrorless body.\n\nMonetaura members receive 20% off retail.",
    publicPrice: 699,
    memberPrice: 559,
    savingsPercent: 20,
    image: "https://images.unsplash.com/photo-1542038374-9e5b3f8a0e1e?w=800",
    images: [
      "https://images.unsplash.com/photo-1542038374-9e5b3f8a0e1e?w=800",
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800",
    ],
    tags: ["lens", "zoom", "f/2.8", "APS-C", "Sigma"],
    checkoutType: "external",
    externalUrl: "https://sigma-global.com",
    inStock: true,
    featured: false,
    submittedByMember: false,
    approvedAt: "2026-02-15",
  },
  {
    slug: "godox-ad100pro-flash",
    name: "AD100Pro Pocket Flash",
    brand: "Godox",
    category: "photography",
    description: "100Ws round-head flash that fits in a jacket pocket. Studio power, location weight.",
    longDescription:
      "The Godox AD100Pro solves the problem every location photographer has faced: professional strobe output in a form factor that travels. At 100 watt-seconds from a round magnetic head, it produces soft, wrapping light that rivals speedlights twice its size. Magnetic modifiers (diffuser dome, bounce card, grid) attach in seconds. 350 full-power pops per battery charge. Works as a TTL trigger directly with Sony, Canon, Nikon, and Fuji cameras.\n\nMonetaura members receive 20% off retail plus a complimentary magnetic modifier kit.",
    publicPrice: 249,
    memberPrice: 199,
    savingsPercent: 20,
    image: "https://images.unsplash.com/photo-1601933470096-0e34634ffcde?w=800",
    images: [
      "https://images.unsplash.com/photo-1601933470096-0e34634ffcde?w=800",
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800",
    ],
    tags: ["flash", "strobe", "location", "TTL", "Godox"],
    checkoutType: "external",
    externalUrl: "https://godox.com",
    inStock: true,
    featured: false,
    submittedByMember: true,
    approvedAt: "2026-03-12",
  },
  {
    slug: "sandisk-extreme-pro-1tb",
    name: "Extreme PRO 1TB SSD",
    brand: "SanDisk",
    category: "photography",
    description: "2,000 MB/s read speed. USB 3.2 Gen 2×2. Shock, temperature, and X-ray proof.",
    longDescription:
      "When you are shooting 4K RAW on location, storage bottlenecks kill momentum. The SanDisk Extreme PRO eliminates the problem entirely. At 2,000 MB/s read and 2,000 MB/s write, it ingests a full 256GB CFexpress card dump in under three minutes. The rugged aluminium housing is IP55 rated for dust and water resistance. At 38g it is lighter than your lens cap.\n\nMonetaura members receive 18% off retail.",
    publicPrice: 189,
    memberPrice: 155,
    savingsPercent: 18,
    image: "https://images.unsplash.com/photo-1618424181497-157f25b6ddd5?w=800",
    images: [
      "https://images.unsplash.com/photo-1618424181497-157f25b6ddd5?w=800",
    ],
    tags: ["SSD", "storage", "portable", "USB-C", "fast"],
    checkoutType: "external",
    externalUrl: "https://westerndigital.com",
    inStock: true,
    featured: false,
    submittedByMember: false,
    approvedAt: "2026-03-01",
  },

  // ── Wellness ──────────────────────────────────────────────────────────────
  {
    slug: "lululemon-everywhere-belt-bag",
    name: "Everywhere Belt Bag 1L",
    brand: "Lululemon",
    category: "wellness",
    description: "The belt bag that goes from morning run to afternoon matcha. One litre of exactly the right organisation.",
    longDescription:
      "Lululemon's Everywhere Belt Bag has earned its reputation by being genuinely useful rather than trendy. The 1L capacity holds a phone, cards, keys, AirPods, and a lip balm without bulging. The adjustable strap fits over a shoulder or around the waist. The water-resistant shell cleans in seconds. Available in 25+ colours — and the limited colourways available to Monetaura members are not available in retail stores.\n\nMonetaura members receive 20% off retail.",
    publicPrice: 48,
    memberPrice: 38,
    savingsPercent: 20,
    image: "https://images.unsplash.com/photo-1578645510447-e20b4311e3ce?w=800",
    images: [
      "https://images.unsplash.com/photo-1578645510447-e20b4311e3ce?w=800",
      "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800",
    ],
    tags: ["belt bag", "running", "minimalist", "crossbody"],
    checkoutType: "external",
    externalUrl: "https://lululemon.com",
    inStock: true,
    featured: false,
    submittedByMember: false,
    approvedAt: "2026-03-08",
  },
  {
    slug: "therabody-theragun-mini",
    name: "Theragun Mini 2.0",
    brand: "Therabody",
    category: "wellness",
    description: "Professional-grade percussive therapy in a device smaller than your water bottle.",
    longDescription:
      "The Theragun Mini 2.0 delivers the same 16mm amplitude and 2,400 PPM as Therabody's pro devices — the specification that defines the difference between surface vibration and deep muscle treatment — in a device that weighs 295g and fits in the outer pocket of any daypack. Three speed settings, Bluetooth app connectivity, 150-minute battery life, and a QuietForce motor that operates at 55dB. Essential for recovery on long travel days and after retreats.\n\nMonetaura members receive 22% off retail.",
    publicPrice: 249,
    memberPrice: 194,
    savingsPercent: 22,
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800",
    images: [
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800",
    ],
    tags: ["recovery", "massage gun", "percussive", "travel"],
    checkoutType: "external",
    externalUrl: "https://therabody.com",
    inStock: true,
    featured: true,
    submittedByMember: false,
    approvedAt: "2026-02-28",
  },
  {
    slug: "eight-sleep-pod-4-cover",
    name: "Pod 4 Cover",
    brand: "Eight Sleep",
    category: "wellness",
    description: "Dual-zone temperature regulation from 13°C to 43°C. Sleep is the highest-leverage performance variable.",
    longDescription:
      "Every creator reaches the point where optimising input (content, strategy, connections) gives diminishing returns and the ceiling is set by recovery quality. The Eight Sleep Pod 4 Cover transforms any mattress into a temperature-regulated sleep environment. Individual sides adjust independently — you prefer cool, your partner prefers warm, both sleep without compromise. The AI learns your sleep patterns within two weeks and adjusts proactively. Combines with the Health Dashboard to track HRV, respiratory rate, and sleep stages nightly.\n\nMonetaura members receive a $500 CAD discount on the Pod 4 Cover, applied automatically through our referral partnership.",
    publicPrice: 2799,
    memberPrice: 2299,
    savingsPercent: 18,
    image: "https://images.unsplash.com/photo-1505693314120-0d443867891c?w=800",
    images: [
      "https://images.unsplash.com/photo-1505693314120-0d443867891c?w=800",
    ],
    tags: ["sleep", "biohacking", "recovery", "temperature"],
    checkoutType: "contact",
    inStock: true,
    featured: true,
    submittedByMember: false,
    approvedAt: "2026-02-20",
  },
];

export const CATEGORY_LABELS: Record<MarketplaceCategory, string> = {
  "travel-gear": "Travel Gear",
  "swimwear-beach": "Swimwear & Beach",
  photography: "Photography",
  wellness: "Wellness",
};
