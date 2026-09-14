// Jediný vstup do dát pre obrazovky. DEMO režim (bez VITE_SUPABASE_URL) → demo-store.js
// (localStorage + simulácia personálu); s nastaveným Supabase → supabase-store.js (cache + sync +
// outbox). Obe majú rovnaké synchrónne rozhranie; asynchrónne sú len redeemCode, createBooking,
// getPhotoUrls a getDocumentUrl (obrazovky ich awaitujú).
import { DEMO_MODE } from '../config/app-config.js';
import * as demo from './demo-store.js';
import * as supa from './supabase-store.js';

const impl = DEMO_MODE ? demo : supa;
const noop = () => {};
const empty = () => [];

export const subscribe = impl.subscribe;
export const getSession = impl.getSession;
export const redeemCode = impl.redeemCode;
export const signOut = impl.signOut;
export const getPublicPropertyId = impl.getPublicPropertyId;
export const setPublicProperty = impl.setPublicProperty;
export const listRequests = impl.listRequests;
export const getRequest = impl.getRequest;
export const createRequest = impl.createRequest;
export const cancelRequest = impl.cancelRequest;
export const listAnnouncements = impl.listAnnouncements;
export const markAnnouncementsRead = impl.markAnnouncementsRead;
export const getRulesAck = impl.getRulesAck;
export const ackRules = impl.ackRules;
export const submitFeedback = impl.submitFeedback;
export const getNotificationsPref = impl.getNotificationsPref;
export const setNotificationsPref = impl.setNotificationsPref;
export const resetDemo = impl.resetDemo;
export const listBookings = impl.listBookings;
export const createBooking = impl.createBooking;
export const cancelBooking = impl.cancelBooking;
export const getPermitExpiry = impl.getPermitExpiry;
export const setPermitExpiry = impl.setPermitExpiry;
// v1.1: fotky, správy s recepciou, podpis poriadku, štart synchronizácie
export const getPhotoUrls = impl.getPhotoUrls || (async (r) => (r && r.photos) || []);
export const listMessages = impl.listMessages || empty;
export const sendMessage = impl.sendMessage || (() => null);
export const markMessagesRead = impl.markMessagesRead || noop;
export const listSignatures = impl.listSignatures || empty;
export const signRules = impl.signRules || (() => null);
export const getDocumentUrl = impl.getDocumentUrl || (async (s) => (s && s.pdfDataUrl) || null);
export const savePushSubscription = impl.savePushSubscription || noop;
export const removePushSubscription = impl.removePushSubscription || noop;
export const forgetMe = impl.forgetMe || (async () => impl.signOut());
// v1.3: overenie totožnosti (eKYC) a vynútená synchronizácia
export const getIdentity = impl.getIdentity || (() => null);
export const startIdentity = impl.startIdentity || (async () => ({ status: 'unavailable' }));
export const setIdentitySkipped = impl.setIdentitySkipped || noop;
export const syncNow = impl.syncNow || (async () => null);
export const startStore = impl.start || noop;
export const STORE_KIND = DEMO_MODE ? 'demo' : 'supabase';
