const STORAGE_KEY = 'waterMains'

const EMPTY_COLLECTION = {
  type: 'FeatureCollection',
  features: []
}

export function getWaterMainsData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY_COLLECTION
    const parsed = JSON.parse(raw)
    if (parsed && parsed.type === 'FeatureCollection' && Array.isArray(parsed.features)) {
      return parsed
    }
    return EMPTY_COLLECTION
  } catch (error) {
    console.error('Error loading water mains:', error)
    return EMPTY_COLLECTION
  }
}

export function saveWaterMainsData(featureCollection) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(featureCollection))
  } catch (error) {
    console.error('Error saving water mains:', error)
  }
}
