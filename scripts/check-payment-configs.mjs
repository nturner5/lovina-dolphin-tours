import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('Error: STRIPE_SECRET_KEY is not defined in .env.local');
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-01-27.acacia',
});

async function run() {
  console.log('Retrieving Stripe Account Details and Payment Settings...');
  
  try {
    // 1. Retrieve current Stripe Account details
    const account = await stripe.accounts.retrieve();
    console.log('\n--- Stripe Account ---');
    console.log(`Account ID: ${account.id}`);
    console.log(`Business Name: ${account.business_profile?.name || 'Not Set'}`);
    console.log(`Country: ${account.country}`);
    console.log(`Default Currency: ${account.default_currency}`);
    console.log(`Details Submitted: ${account.details_submitted}`);
    console.log(`Charges Enabled: ${account.charges_enabled}`);
    console.log(`Payouts Enabled: ${account.payouts_enabled}`);

    // 2. Fetch Payment Method Configurations
    // Stripe supports retrieving payment method configurations globally or by application
    console.log('\n--- Payment Method Configurations ---');
    const configs = await stripe.paymentMethodConfigurations.list();
    
    if (configs.data.length === 0) {
      console.log('No specific custom payment method configurations found. Your account is likely using the Default Stripe configuration managed in your dashboard settings.');
    } else {
      for (const config of configs.data) {
        console.log(`\nConfig Name: "${config.name}" (ID: ${config.id})`);
        console.log(`Is Default: ${config.is_default}`);
        console.log(`Active: ${config.active}`);
        
        // Print status of key payment methods in this config
        const pm = config.features || {};
        console.log('Payment Methods status in this configuration:');
        console.log(`- Card: ${config.card?.display_preference?.value || 'default'}`);
        console.log(`- Alipay: ${config.alipay?.display_preference?.value || 'default'}`);
        console.log(`- WeChat Pay: ${config.wechat_pay?.display_preference?.value || 'default'}`);
        console.log(`- Link: ${config.link?.display_preference?.value || 'default'}`);
      }
    }
    
  } catch (err) {
    console.error('Error querying Stripe configuration API:', err.message);
  }
}

run();
