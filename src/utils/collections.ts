/**
 * Collections Storage Layer
 *
 * Uses localStorage for collections storage (web-only).
 */

import type { Collection, CollectionEntry } from '../types/collections';
import { parseCollectionEntry } from '../types/collections';

// ============ LocalStorage Keys ============
const STORAGE_KEY = 'kashshaf_collections';

let collectionIdCounter = Date.now();

// ============ Internal Helpers ============

function getStoredCollections(): CollectionEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const entries = JSON.parse(stored) as CollectionEntry[];
    // Update counter to be higher than any existing ID
    if (entries.length > 0) {
      collectionIdCounter = Math.max(collectionIdCounter, ...entries.map(e => e.id)) + 1;
    }
    return entries;
  } catch {
    return [];
  }
}

function setStoredCollections(entries: CollectionEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

// ============ Public API ============

export async function createCollection(
  name: string,
  bookIds: number[],
  description?: string
): Promise<Collection> {
  const entries = getStoredCollections();

  // Check for duplicate name
  if (entries.some(e => e.name === name)) {
    throw new Error(`Collection "${name}" already exists`);
  }

  const now = new Date().toISOString();
  const id = collectionIdCounter++;

  const newEntry: CollectionEntry = {
    id,
    name,
    description: description?.slice(0, 150) ?? null,
    book_ids: JSON.stringify(bookIds),
    created_at: now,
    updated_at: now,
  };

  entries.unshift(newEntry);
  setStoredCollections(entries);

  return parseCollectionEntry(newEntry);
}

export async function getCollections(): Promise<Collection[]> {
  const entries = getStoredCollections();
  return entries.map(parseCollectionEntry);
}

export async function updateCollectionBooks(id: number, bookIds: number[]): Promise<void> {
  const entries = getStoredCollections();
  const index = entries.findIndex(e => e.id === id);

  if (index === -1) {
    throw new Error(`Collection with id ${id} not found`);
  }

  entries[index].book_ids = JSON.stringify(bookIds);
  entries[index].updated_at = new Date().toISOString();
  setStoredCollections(entries);
}

export async function updateCollectionDescription(id: number, description: string | null): Promise<void> {
  const entries = getStoredCollections();
  const index = entries.findIndex(e => e.id === id);

  if (index === -1) {
    throw new Error(`Collection with id ${id} not found`);
  }

  entries[index].description = description?.slice(0, 150) ?? null;
  entries[index].updated_at = new Date().toISOString();
  setStoredCollections(entries);
}

export async function renameCollection(id: number, name: string): Promise<void> {
  const entries = getStoredCollections();
  const index = entries.findIndex(e => e.id === id);

  if (index === -1) {
    throw new Error(`Collection with id ${id} not found`);
  }

  // Check for duplicate name (excluding current collection)
  if (entries.some((e, i) => i !== index && e.name === name)) {
    throw new Error(`Collection "${name}" already exists`);
  }

  entries[index].name = name;
  entries[index].updated_at = new Date().toISOString();
  setStoredCollections(entries);
}

export async function deleteCollection(id: number): Promise<void> {
  const entries = getStoredCollections();
  const filtered = entries.filter(e => e.id !== id);
  setStoredCollections(filtered);
}
