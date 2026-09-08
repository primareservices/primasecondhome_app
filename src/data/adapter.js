// Jediný vstup do dát pre obrazovky. V DEMO režime (bez VITE_SUPABASE_URL) ide všetko
// do demo-store.js; Supabase adaptér s rovnakými funkciami je krok v1.1
// (docs/INTEGRATION.md §1.2–1.5, schéma v supabase/migrations/).
import { DEMO_MODE } from '../config/app-config.js';
import * as demo from './demo-store.js';

if (!DEMO_MODE) {
  // Zámerne bez tichého fallbacku: keď je URL nastavená, ale adaptér ešte neexistuje,
  // má to byť vidieť v konzole, nie sa tváriť ako demo.
  console.warn('[data] Supabase adaptér ešte nie je implementovaný — beží DEMO úložisko.');
}

export const subscribe = demo.subscribe;
export const getSession = demo.getSession;
export const redeemCode = demo.redeemCode;
export const signOut = demo.signOut;
export const getPublicPropertyId = demo.getPublicPropertyId;
export const setPublicProperty = demo.setPublicProperty;
export const listRequests = demo.listRequests;
export const getRequest = demo.getRequest;
export const createRequest = demo.createRequest;
export const cancelRequest = demo.cancelRequest;
export const listAnnouncements = demo.listAnnouncements;
export const markAnnouncementsRead = demo.markAnnouncementsRead;
export const getRulesAck = demo.getRulesAck;
export const ackRules = demo.ackRules;
export const submitFeedback = demo.submitFeedback;
export const getNotificationsPref = demo.getNotificationsPref;
export const setNotificationsPref = demo.setNotificationsPref;
export const resetDemo = demo.resetDemo;
export const listBookings = demo.listBookings;
export const createBooking = demo.createBooking;
export const cancelBooking = demo.cancelBooking;
export const getPermitExpiry = demo.getPermitExpiry;
export const setPermitExpiry = demo.setPermitExpiry;
