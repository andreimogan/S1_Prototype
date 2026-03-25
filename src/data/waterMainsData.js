/** Default water mains shipped with the app (edit this file to change deployed geometry). */
export const WATER_MAINS_DEFAULT = {
  type: 'FeatureCollection',
  features: [],
}

let sessionWaterMains = null

export function getWaterMainsData() {
  return sessionWaterMains ?? WATER_MAINS_DEFAULT
}

/** Session-only; not persisted across reloads. */
export function saveWaterMainsData(featureCollection) {
  sessionWaterMains = featureCollection
}
