'use client';

import { getSupabaseBrowserClient } from '@/lib/supabase';

const GUEST_TOKEN = 'guest';
const GUEST_NAME = '게스트';
const LOGOUT_TIMEOUT_MS = 2500;

function getStorage() {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function createGuestId() {
  const randomId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Date.now().toString(36);

  return `guest-${randomId}`;
}

function ensureGuestId() {
  const storage = getStorage();
  if (!storage) return null;

  const existing = storage.getItem('guestId');
  if (existing) return existing;

  const guestId = createGuestId();
  storage.setItem('guestId', guestId);
  return guestId;
}

function cleanupServerSession(apiBase: string) {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
  const timeoutId =
    controller && typeof window !== 'undefined'
      ? window.setTimeout(() => controller.abort(), LOGOUT_TIMEOUT_MS)
      : undefined;

  fetch(`${apiBase}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
    signal: controller?.signal,
  })
    .catch((err) => console.warn('guest mode cookie cleanup failed:', err))
    .finally(() => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    });
}

export function isGuestMode() {
  return getStorage()?.getItem('accessToken') === GUEST_TOKEN;
}

export function startGuestMode(apiBase: string) {
  const storage = getStorage();

  getSupabaseBrowserClient()?.auth.signOut().catch((err) => {
    console.warn('guest mode Supabase cleanup failed:', err);
  });

  storage?.removeItem('refreshToken');
  storage?.removeItem('userPicture');
  storage?.removeItem('userEmail');
  storage?.setItem('accessToken', GUEST_TOKEN);
  storage?.setItem('userName', GUEST_NAME);
  storage?.setItem('isLoggedIn', 'false');
  ensureGuestId();

  cleanupServerSession(apiBase);
}
