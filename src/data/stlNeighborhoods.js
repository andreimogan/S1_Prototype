const STL_NEIGHBORHOODS_QUERY_URL =
  'https://services3.arcgis.com/8mRVhBBtAu5eqZUu/arcgis/rest/services/StLouis_Neighborhoods/FeatureServer/0/query?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&f=geojson'

let cachedNeighborhoodData = null
let pendingRequest = null
const REQUEST_TIMEOUT_MS = 12000

async function fetchWithTimeout(url, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { signal: controller.signal })
  } finally {
    clearTimeout(timeoutId)
  }
}

function normalizeNeighborhoodFeature(feature, index) {
  const props = feature?.properties || {}
  const name =
    props.name ||
    props.NAME ||
    props.neighborhood ||
    props.NEIGHBORHOOD ||
    props.NHD_NAME ||
    props.NEIGHNAME ||
    props.Label ||
    props.LABEL ||
    `Neighborhood ${index + 1}`

  const rawId =
    props.OBJECTID ||
    props.objectid ||
    props.FID ||
    props.fid ||
    props.ID ||
    props.id ||
    name

  const id = String(rawId)

  return {
    ...feature,
    properties: {
      ...props,
      __hoodId: id,
      __hoodName: String(name),
    },
  }
}

export async function fetchStlNeighborhoodsData() {
  if (cachedNeighborhoodData) return cachedNeighborhoodData
  if (pendingRequest) return pendingRequest

  pendingRequest = (async () => {
    const response = await fetchWithTimeout(STL_NEIGHBORHOODS_QUERY_URL)
    if (!response.ok) {
      throw new Error(`Failed to load St. Louis neighborhoods (${response.status})`)
    }

    const data = await response.json()
    const features = Array.isArray(data?.features) ? data.features : []
    const normalizedFeatures = features.map(normalizeNeighborhoodFeature)
    const geojson = {
      type: 'FeatureCollection',
      features: normalizedFeatures,
    }

    const neighborhoods = normalizedFeatures
      .map((feature) => ({
        id: feature.properties.__hoodId,
        name: feature.properties.__hoodName,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))

    cachedNeighborhoodData = { geojson, neighborhoods }
    return cachedNeighborhoodData
  })()

  try {
    return await pendingRequest
  } finally {
    pendingRequest = null
  }
}
