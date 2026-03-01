/**
 * Storage Layer
 *
 * Uses localStorage for all storage operations (web-only).
 */

import type { SearchHistoryEntry, SavedSearchEntry, DismissedAnnouncement, AnnouncementsCache } from '../types';

// ============ LocalStorage Keys ============
const STORAGE_KEYS = {
  SEARCH_HISTORY: 'kashshaf_search_history',
  SAVED_SEARCHES: 'kashshaf_saved_searches',
  APP_SETTINGS: 'kashshaf_app_settings',
  USER_SETTINGS: 'kashshaf_user_settings',
  DISMISSED_ANNOUNCEMENTS: 'kashshaf_dismissed_announcements',
  ANNOUNCEMENTS_CACHE_DATA: 'kashshaf_announcements_cache_data',
  ANNOUNCEMENTS_CACHE_FETCHED_AT: 'kashshaf_announcements_cache_fetched_at',
};

const MAX_HISTORY_ENTRIES = 100;

// ============ Internal Helpers ============

interface StoredSearchHistoryEntry extends Omit<SearchHistoryEntry, 'id'> {
  id: number;
}

interface StoredSavedSearchEntry extends Omit<SavedSearchEntry, 'id'> {
  id: number;
}

let historyIdCounter = Date.now();
let savedIdCounter = Date.now();

function getStoredHistory(): StoredSearchHistoryEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY);
    if (!stored) return [];
    const entries = JSON.parse(stored) as StoredSearchHistoryEntry[];
    // Update counter to be higher than any existing ID
    if (entries.length > 0) {
      historyIdCounter = Math.max(historyIdCounter, ...entries.map(e => e.id)) + 1;
    }
    return entries;
  } catch {
    return [];
  }
}

function setStoredHistory(entries: StoredSearchHistoryEntry[]): void {
  localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(entries));
}

function getStoredSavedSearches(): StoredSavedSearchEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SAVED_SEARCHES);
    if (!stored) return [];
    const entries = JSON.parse(stored) as StoredSavedSearchEntry[];
    // Update counter to be higher than any existing ID
    if (entries.length > 0) {
      savedIdCounter = Math.max(savedIdCounter, ...entries.map(e => e.id)) + 1;
    }
    return entries;
  } catch {
    return [];
  }
}

function setStoredSavedSearches(entries: StoredSavedSearchEntry[]): void {
  localStorage.setItem(STORAGE_KEYS.SAVED_SEARCHES, JSON.stringify(entries));
}

function getStoredSettings(key: string): Record<string, string> {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return {};
    return JSON.parse(stored);
  } catch {
    return {};
  }
}

function setStoredSettings(key: string, settings: Record<string, string>): void {
  localStorage.setItem(key, JSON.stringify(settings));
}

// ============ Search History ============

export async function addToHistory(
  searchType: string,
  queryData: string,
  displayLabel: string,
  bookFilterCount: number,
  bookIds: string | null
): Promise<number> {
  const entries = getStoredHistory();
  const id = historyIdCounter++;

  // Check if saved
  const savedSearches = getStoredSavedSearches();
  const isSaved = savedSearches.some(s => s.query_data === queryData);

  const newEntry: StoredSearchHistoryEntry = {
    id,
    search_type: searchType as SearchHistoryEntry['search_type'],
    query_data: queryData,
    display_label: displayLabel,
    book_filter_count: bookFilterCount,
    book_ids: bookIds ?? undefined,
    created_at: new Date().toISOString(),
    is_saved: isSaved,
  };

  // Add to beginning and trim to max
  entries.unshift(newEntry);
  if (entries.length > MAX_HISTORY_ENTRIES) {
    entries.splice(MAX_HISTORY_ENTRIES);
  }

  setStoredHistory(entries);
  return id;
}

export async function getSearchHistory(limit?: number): Promise<SearchHistoryEntry[]> {
  const entries = getStoredHistory();
  const savedSearches = getStoredSavedSearches();

  // Update is_saved status
  const result = entries.map(e => ({
    ...e,
    is_saved: savedSearches.some(s => s.query_data === e.query_data),
  }));

  return limit ? result.slice(0, limit) : result;
}

export async function clearHistory(): Promise<void> {
  setStoredHistory([]);
}

// ============ Saved Searches ============

export async function saveSearch(
  historyId: number | null,
  searchType: string,
  queryData: string,
  displayLabel: string,
  bookFilterCount: number,
  bookIds: string | null
): Promise<number> {
  const searches = getStoredSavedSearches();

  // Check if already saved (prevent duplicates)
  const existing = searches.find(s => s.query_data === queryData);
  if (existing) {
    return existing.id;
  }

  const id = savedIdCounter++;
  const newEntry: StoredSavedSearchEntry = {
    id,
    history_id: historyId ?? undefined,
    search_type: searchType as SavedSearchEntry['search_type'],
    query_data: queryData,
    display_label: displayLabel,
    book_filter_count: bookFilterCount,
    book_ids: bookIds ?? undefined,
    created_at: new Date().toISOString(),
  };

  searches.unshift(newEntry);
  setStoredSavedSearches(searches);
  return id;
}

export async function unsaveSearch(id: number): Promise<void> {
  const searches = getStoredSavedSearches();
  const filtered = searches.filter(s => s.id !== id);
  setStoredSavedSearches(filtered);
}

export async function unsaveSearchByQuery(queryData: string): Promise<void> {
  const searches = getStoredSavedSearches();
  const filtered = searches.filter(s => s.query_data !== queryData);
  setStoredSavedSearches(filtered);
}

export async function isSearchSaved(queryData: string): Promise<boolean> {
  const searches = getStoredSavedSearches();
  return searches.some(s => s.query_data === queryData);
}

export async function getSavedSearches(limit?: number): Promise<SavedSearchEntry[]> {
  const searches = getStoredSavedSearches();
  return limit ? searches.slice(0, limit) : searches;
}

// ============ App Settings ============

export async function getAppSetting(key: string): Promise<string | null> {
  const settings = getStoredSettings(STORAGE_KEYS.APP_SETTINGS);
  return settings[key] ?? null;
}

export async function setAppSetting(key: string, value: string): Promise<void> {
  const settings = getStoredSettings(STORAGE_KEYS.APP_SETTINGS);
  settings[key] = value;
  setStoredSettings(STORAGE_KEYS.APP_SETTINGS, settings);
}

// ============ User Settings ============

export async function getUserSetting(key: string): Promise<string | null> {
  const settings = getStoredSettings(STORAGE_KEYS.USER_SETTINGS);
  return settings[key] ?? null;
}

export async function setUserSetting(key: string, value: string): Promise<void> {
  const settings = getStoredSettings(STORAGE_KEYS.USER_SETTINGS);
  settings[key] = value;
  setStoredSettings(STORAGE_KEYS.USER_SETTINGS, settings);
}

// ============ Announcements Storage ============

export async function getDismissedAnnouncements(): Promise<DismissedAnnouncement[]> {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.DISMISSED_ANNOUNCEMENTS);
    if (!stored) return [];
    return JSON.parse(stored) as DismissedAnnouncement[];
  } catch {
    return [];
  }
}

export async function markAnnouncementDismissed(id: string): Promise<void> {
  const dismissed = await getDismissedAnnouncements();
  // Check if already dismissed
  if (dismissed.some(d => d.id === id)) return;

  dismissed.push({ id, dismissed_at: new Date().toISOString() });
  localStorage.setItem(STORAGE_KEYS.DISMISSED_ANNOUNCEMENTS, JSON.stringify(dismissed));
}

export async function markMultipleAnnouncementsDismissed(ids: string[]): Promise<void> {
  const dismissed = await getDismissedAnnouncements();
  const existingIds = new Set(dismissed.map(d => d.id));
  const now = new Date().toISOString();

  for (const id of ids) {
    if (!existingIds.has(id)) {
      dismissed.push({ id, dismissed_at: now });
    }
  }

  localStorage.setItem(STORAGE_KEYS.DISMISSED_ANNOUNCEMENTS, JSON.stringify(dismissed));
}

export async function getAnnouncementsCache(): Promise<AnnouncementsCache | null> {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS_CACHE_DATA);
    const fetchedAt = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS_CACHE_FETCHED_AT);

    if (!data || !fetchedAt) return null;

    return {
      data: JSON.parse(data),
      fetched_at: fetchedAt,
    };
  } catch {
    return null;
  }
}

export async function setAnnouncementsCache(cache: AnnouncementsCache): Promise<void> {
  localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS_CACHE_DATA, JSON.stringify(cache.data));
  localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS_CACHE_FETCHED_AT, cache.fetched_at);
}

export async function getSkipAnnouncementPopups(): Promise<boolean> {
  const value = await getUserSetting('skip_announcement_popups');
  return value === 'true';
}

export async function setSkipAnnouncementPopups(skip: boolean): Promise<void> {
  await setUserSetting('skip_announcement_popups', skip ? 'true' : 'false');
}
