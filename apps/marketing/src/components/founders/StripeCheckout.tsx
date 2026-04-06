// Scaffold only — Stripe handles monthly subscriptions, not founder purchases.
// Founder purchases ($2,500–$5,500) are handled via e-transfer/wire to ATB Bank.
// This component will be used for the $199/month software subscription post-launch.

export default function StripeCheckout() {
  return (
    <div className="p-8 border border-monetura-sand/20 text-center">
      <p className="text-monetura-cream/40 text-sm">
        Stripe checkout — coming soon for monthly subscriptions.
      </p>
    </div>
  );
}
