const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()

if (!configuredBaseUrl) {
  throw new Error('VITE_API_BASE_URL is required. Configure the complete backend API URL in the environment.')
}

let parsedBaseUrl
try {
  parsedBaseUrl = new URL(configuredBaseUrl)
} catch {
  throw new Error('VITE_API_BASE_URL must be a valid absolute URL, for example http://127.0.0.1:8000/api/.')
}

if (!['http:', 'https:'].includes(parsedBaseUrl.protocol)) {
  throw new Error('VITE_API_BASE_URL must use http or https.')
}

export const API_BASE_URL = `${parsedBaseUrl.toString().replace(/\/+$/, '')}/`
