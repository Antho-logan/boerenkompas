import 'server-only';

import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const globalForStripe = globalThis as unknown as { stripe?: Stripe };

export function getStripe(): Stripe {
  if (!stripeSecretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY');
  }

  if (!globalForStripe.stripe) {
    globalForStripe.stripe = new Stripe(stripeSecretKey);
  }

  return globalForStripe.stripe;
}
