const Setting = require('../models/Setting');
const { PRICING: DEFAULT_PRICING } = require('./plans');

const PRICE_MIN = 1;        // Cashfree cannot charge less than 1 INR
const PRICE_MAX = 100000;
const TTL_MS = 30 * 1000;   // another server instance may change the price; never trust the cache for long

let cache = null; // { value, at }

/** Current subscription prices in INR: { monthly, yearly }. Falls back to the built-in defaults. */
async function getPricing() {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;
  let value = { ...DEFAULT_PRICING };
  try {
    const doc = await Setting.findOne({ key: 'pricing' }).lean();
    if (doc && doc.value && isValid(doc.value.monthly) && isValid(doc.value.yearly)) {
      value = { monthly: doc.value.monthly, yearly: doc.value.yearly };
    }
  } catch (e) {
    console.error('Could not read pricing setting, using defaults:', e.message);
  }
  cache = { value, at: Date.now() };
  return value;
}

const isValid = (n) => Number.isInteger(n) && n >= PRICE_MIN && n <= PRICE_MAX;

/** Returns an error message, or null when the pair is acceptable. */
function validatePricing({ monthly, yearly }) {
  if (!isValid(monthly)) return `Monthly price must be a whole number of rupees from ${PRICE_MIN} to ${PRICE_MAX}`;
  if (!isValid(yearly)) return `Yearly price must be a whole number of rupees from ${PRICE_MIN} to ${PRICE_MAX}`;
  if (yearly < monthly) return 'The yearly price cannot be lower than one month';
  return null;
}

async function setPricing({ monthly, yearly }, userId) {
  const problem = validatePricing({ monthly, yearly });
  if (problem) throw Object.assign(new Error(problem), { status: 400 });
  await Setting.findOneAndUpdate({ key: 'pricing' }, { $set: { value: { monthly, yearly }, updatedBy: userId } }, { upsert: true });
  cache = null;
  return getPricing();
}

const clearSettingsCache = () => { cache = null; };

module.exports = { getPricing, setPricing, validatePricing, clearSettingsCache, PRICE_MIN, PRICE_MAX };
