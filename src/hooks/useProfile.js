import { useCallback, useState } from 'react';
import { randomColor } from '../utils/colors.js';

// Per-device profile: name + color. Stored in localStorage so every device in
// the family has its own identity that's independent of the shared pouch.
// Attached to each item on creation so the family sees who added what.

const LS_KEY = 'pouch-profile';

function load() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch {}
  return null;
}

function save(profile) {
  try {
    if (profile) localStorage.setItem(LS_KEY, JSON.stringify(profile));
    else localStorage.removeItem(LS_KEY);
  } catch {}
}

export function useProfile() {
  const [profile, setProfileState] = useState(load);

  const setProfile = useCallback((patch) => {
    setProfileState((cur) => {
      const base = cur || { name: '', color: randomColor() };
      const next = { ...base, ...patch };
      save(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    save(null);
    setProfileState(null);
  }, []);

  const configured = !!profile?.name?.trim();

  return { profile, configured, setProfile, clear };
}
