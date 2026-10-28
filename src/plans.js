// Shared display information for the welcome page and in-app pricing.
// These values do not control what Stripe charges.
// When changing prices, also update Stripe and review the server-side
// price mappings in netlify/functions/create-checkout.js and stripe-webhook.js.

export const PRICING_TIERS = [
  {
    id: "free",
    name: "Get Started",
    price: "Free",
    cadence: "",
    tagline: "Try the assessment with your first three sections.",
    features: [
      "Sections A–C",
      "Save and resume anytime",
      "Safety flag summary",
    ],
    sectionsIncluded: ["A", "B", "C"],
  },
  {
    id: "complete",
    name: "Full Assessment",
    price: "$19",
    cadence: "one-time",
    tagline: "All 16 sections and your complete Home Accessibility Profile.",
    features: [
      "All 16 sections, A–P",
      "Full Home Accessibility Profile",
      "Safety flagging throughout",
      "Unlimited edits and resets",
    ],
    sectionsIncluded: "all",
  },
  {
    id: "contractor",
    name: "Contractor Ready",
    price: "$39",
    cadence: "one-time",
    tagline: "Everything in Full Assessment, plus contractor-ready deliverables.",
    features: [
      "Everything in Full Assessment",
      "Accessibility Priority Plan",
      "Contractor Preparation Package",
      "Funding & Documentation Checklist",
    ],
    sectionsIncluded: "all",
  },
];
