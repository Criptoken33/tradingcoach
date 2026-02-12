import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Export functions
export { syncSubscription } from './syncSubscription';
export { getExchangeRates } from './getExchangeRates';
export { activateTempPro } from './activateTempPro';
