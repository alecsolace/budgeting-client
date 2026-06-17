import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000',
  headers: { 'Content-Type': 'application/json' },
})

// Placeholder: attach auth token when Supabase is wired
api.interceptors.request.use((config) => config)
