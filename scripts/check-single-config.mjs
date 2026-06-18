import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-01-27.acacia',
});

async function run() {
  try {
    const configId = 'pmc_1RbC3sHRvUE6uR41Bexh095q';
    console.log(`Retrieving payment configuration: ${configId}...`);
    const config = await stripe.paymentMethodConfigurations.retrieve(configId);
    console.log(JSON.stringify(config, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
