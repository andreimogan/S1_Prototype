/** Legacy placeholder — custom neighborhood risk polygons are no longer used. */
export const NEIGHBORHOOD_RISK_DEFAULT = {
  type: 'FeatureCollection',
  features: [],
}

let sessionNeighborhoodRisk = null

export function getNeighborhoodRiskData() {
  return sessionNeighborhoodRisk ?? NEIGHBORHOOD_RISK_DEFAULT
}

/** Session-only; not persisted across reloads. */
export function saveNeighborhoodRiskData(featureCollection) {
  sessionNeighborhoodRisk = featureCollection
}
