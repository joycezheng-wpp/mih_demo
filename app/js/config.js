/* Marketing Intelligence Hub — demo configuration.
   Everything client-specific lives here. To pitch a new brand, add a persona
   (copy an existing one) and pick it from the persona switcher in the header. */
window.MIH = window.MIH || {};

MIH.APP = {
  name: 'Marketing Intelligence Hub',
  region: 'APAC',
  lastRefreshed: '27 October 2026',
  firstMonth: '2024-01',          // competitive history starts here
  mediaFirstMonth: '2025-01',     // media tracker history starts here
  lastMonth: '2026-09'            // latest complete month
};

MIH.MARKETS = [
  { code: 'AU', name: 'Australia' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'PH', name: 'Philippines' },
  { code: 'SG', name: 'Singapore' },
  { code: 'TH', name: 'Thailand' },
  { code: 'VN', name: 'Vietnam' }
];

MIH.PLATFORMS = ['DV360', 'Google Ads', 'Meta', 'Snapchat', 'TikTok'];
MIH.FORMATS = ['Static', 'Video 6s', 'Video 15s', 'Video 30s', 'Video >30s'];
MIH.STORY_TYPES = ['Aspirational', 'Promotional', 'Entertainment', 'Educational'];
MIH.SOUND_TYPES = ['Music', 'Speech', 'Music + Speech', 'No sound'];
MIH.EMOTIONS = ['Happy', 'Surprised', 'Calm', 'Excited'];
MIH.GUIDELINES = [
  'Brand or logo in first 3 seconds', 'Brand or logo present', 'CTA present',
  'Human in first 3 seconds', 'Human present', 'Voice-over or speech present',
  'Motion in first 3 seconds', 'Music present', 'Product in first 3 seconds',
  'Product present', 'Correct aspect ratio', 'Text overlay present'
];
MIH.ADHERENCE_TARGET = 0.8;

MIH.PERSONAS = {
  beverage: {
    id: 'beverage',
    label: 'Beverage',
    client: 'Northstar Beverages',
    clientShort: 'Northstar',
    competitors: ['Competitor A', 'Competitor B'],
    coreCategory: 'Sparkling',
    categories: ['Sparkling', 'Water', 'Tea', 'Hydration', 'Energy', 'Isotonic', 'Juice'],
    brands: ['Northstar Cola', 'Zing Orange', 'Lemon Drift', 'Hydra+'],
    brandCategory: ['Sparkling', 'Sparkling', 'Sparkling', 'Hydration'],
    campaigns: ['Summer Refresh', 'Festive Feast', 'Share a Fizz', 'Game Night',
      'Zero Sugar Launch', 'Lunar New Year', 'Football Fever', 'Ramadan Together']
  },
  beauty: {
    id: 'beauty',
    label: 'Beauty & Personal Care',
    client: 'Lumen Beauty',
    clientShort: 'Lumen',
    competitors: ['Competitor A', 'Competitor B'],
    coreCategory: 'Skincare',
    categories: ['Skincare', 'Haircare', 'Make-up', 'Fragrance', 'Body Care', 'Oral Care', 'Deodorant'],
    brands: ['Lumen Skin', 'Verdant Hair', 'Halo Glow', 'Pure Mint'],
    brandCategory: ['Skincare', 'Haircare', 'Make-up', 'Oral Care'],
    campaigns: ['Glow Season', 'Hydration Hero', 'Night Repair', 'Festive Gifting',
      'Shine On', 'Fresh Start', 'Clean Beauty', 'Summer Shield']
  },
  telco: {
    id: 'telco',
    label: 'Telecommunications',
    client: 'Orbit Mobile',
    clientShort: 'Orbit',
    competitors: ['Competitor A', 'Competitor B'],
    coreCategory: 'Postpaid',
    categories: ['Postpaid', 'Prepaid', 'Home Broadband', 'Devices', 'Enterprise', 'Streaming', 'Digital Wallet'],
    brands: ['Orbit Postpaid', 'Orbit Prepaid', 'Orbit Fibre', 'Orbit Business'],
    brandCategory: ['Postpaid', 'Prepaid', 'Home Broadband', 'Enterprise'],
    campaigns: ['5G Everywhere', 'Unlimited Data', 'Festive Deals', 'Switch & Save',
      'Family Plan', 'Back to School', 'Fibre Fast', 'Roam Free']
  }
};
MIH.DEFAULT_PERSONA = 'beverage';

// Competitive tracking dimensions
MIH.CHANNELS = ['TV', 'OOH', 'Online video', 'Social', 'Display'];
MIH.DIGITAL_PLATFORMS = ['YouTube', 'Meta', 'TikTok', 'Programmatic', 'Other digital'];
MIH.COMP_BRAND_POOL = ['Kova', 'Brisa', 'Tempo', 'Nimbus', 'Volt', 'Mira', 'Solace', 'Rivo', 'Pulse', 'Echo', 'Vanta', 'Lyra',
  'Nova', 'Crest', 'Fable', 'Juno', 'Opal', 'Sable', 'Terra', 'Zuri', 'Axis', 'Bloom', 'Cove', 'Drift', 'Ember', 'Flux', 'Glint', 'Haven'];
MIH.COMP_THEMES = ['New variant launch', 'Festive', 'Price promotion', 'Sports sponsorship', 'Brand film', 'Creator collab', 'Sampling drive', 'Limited edition'];
// Coverage notes for the Competitive introduction page
MIH.COVERAGE = {
  AU: { tv: 'Measured', ooh: 'Measured', digital: 0.84 }, ID: { tv: 'Measured', ooh: 'Indexed', digital: 0.78 },
  MY: { tv: 'Measured', ooh: 'Indexed', digital: 0.72, note: 'Open-web display & video excluded' }, NZ: { tv: 'Measured', ooh: 'Measured', digital: 0.81 },
  PH: { tv: 'Measured', ooh: 'Indexed', digital: 0.76 }, SG: { tv: 'Measured', ooh: 'Measured', digital: 0.88 },
  TH: { tv: 'Measured', ooh: 'Indexed', digital: 0.71, note: 'Open-web display & video excluded' }, VN: { tv: 'Measured', ooh: 'Indexed', digital: 0.74 }
};
