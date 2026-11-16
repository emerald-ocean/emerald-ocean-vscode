// Package-level helpers for the tide forecast UI.
import { readFile } from "node:fs/promises";
import path from "node:path";

export const DEFAULT_LIMIT = 24;
const stationPattern = /^[a-z]{3}-\d{2}$/i;

/**
 * Loads tide readings for a station.
 * @param {string} station
 * @returns {Promise<Array<{at: Date, height: number}>>}
 */
export async function loadTides(station, { limit = DEFAULT_LIMIT, signal } = {}) {
  if (!stationPattern.test(station)) {
    throw new Error(`unknown station "${station}"\n`);
  }
  const file = path.join(process.cwd(), "data", `${station}.json`);
  const raw = JSON.parse(await readFile(file, { encoding: "utf8", signal }));
  return raw.readings
    .filter((r) => r.height_m !== null && r.at)
    .slice(0, limit)
    .map(({ at, height_m: height }) => ({ at: new Date(at), height }));
}

export class TideCache extends Map {
  #ttl;

  constructor(ttl = 60_000) {
    super();
    this.#ttl = ttl;
  }

  get(station) {
    const entry = super.get(station);
    if (entry === undefined || Date.now() - entry.storedAt > this.#ttl) {
      return null;
    }
    console.log("cache hit for %s", station, entry.tides.length);
    return entry.tides;
  }
}

const cache = new TideCache();
for (const station of ["abc-01", "xyz-42"]) {
  loadTides(station).then((tides) => cache.set(station, { tides, storedAt: Date.now() })).catch(console.error);
}
