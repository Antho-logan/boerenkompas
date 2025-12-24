import 'server-only';

import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error('Missing STRIPE_SECRET_KEY');
}

const globalForStripe = globalThis as unknown as { stripe?: Stripe };

export const stripe = globalForStripe.stripe ?? new Stripe(stripeSecretKey);

if (process.env.NODE_ENV !== 'production') {
  globalForStripe.stripe = stripe;
}
