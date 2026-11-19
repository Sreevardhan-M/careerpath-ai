import { api } from './lib.js';

export const state = { catalog: null, me: null, profile: null, completion: null, ai: null };

export async function loadCatalog() {
  if (!state.catalog) state.catalog = await api('GET', '/catalog');
  return state.catalog;
}

export async function loadMe() {
  try {
    const d = await api('GET', '/me');
    Object.assign(state, { me: d.user, profile: d.profile, completion: d.completion, ai: d.ai });
  } catch (e) {
    if (e.status === 401) Object.assign(state, { me: null, profile: null, completion: null });
    else throw e;
  }
  return state.me;
}

export function levelName(v) {
  if (!v) return 'Not learned';
  return state.catalog?.levels.find((l) => l.value === v)?.label || 'Not learned';
}

export function careerTitle(id) {
  return state.catalog?.careers.find((c) => c.id === id)?.title || id;
}

/** Save the whole profile and keep the in-memory copy in sync. */
export async function saveProfile(profile) {
  const d = await api('PUT', '/profile', profile);
  state.profile = d.profile;
  state.completion = d.completion;
  return d;
}
