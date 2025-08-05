import axios from "axios"

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://qaragul-back.onrender.com/api"

console.log("🔗 API Base URL:", API_BASE_URL)

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 секунд
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log("🔑 Token қосылды:", token.substring(0, 20) + "...")
    }
    console.log("📤 API сұранысы:", config.method?.toUpperCase(), config.url)
    return config
  },
  (error) => {
    console.error("❌ Request қатесі:", error)
    return Promise.reject(error)
  },
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    console.log("📥 API жауабы:", response.status, response.config.url)
    return response
  },
  (error) => {
    console.error("❌ Response қатесі:", error.response?.status, error.response?.data)

    if (error.response?.status === 401) {
      console.log("🚪 Токен жарамсыз, login бетіне бағыттау...")
      localStorage.removeItem("token")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  },
)

// Auth API
export const authAPI = {
  register: (fullName, email, password) => {
    console.log("📝 Тіркелу сұранысы...")
    return api.post("/api/auth/register", { fullName, email, password })
  },

  login: (email, password) => {
    console.log("🔐 Кіру сұранысы...")
    return api.post("/api/auth/login", { email, password })
  },

  getProfile: () => {
    console.log("👤 Профиль сұранысы...")
    return api.get("/api/auth/profile")
  },

  updateProfile: (profileData) => {
    console.log("✏️ Профиль жаңарту...")
    return api.put("/api/auth/profile", profileData)
  },

  changePassword: (currentPassword, newPassword) => {
    console.log("🔒 Құпия сөз өзгерту...")
    return api.put("/api/auth/change-password", { currentPassword, newPassword })
  },
}

// Plants API - ЖАҢАРТЫЛҒАН
export const plantsAPI = {
  // Өсімдікті сканерлеу
  identifyPlant: (imageFile) => {
    console.log("🌿 Өсімдік сканерлеу басталды...")
    console.log("📁 Файл:", imageFile.name, imageFile.size, "bytes")

    const formData = new FormData()
    formData.append("plantImage", imageFile)

    return api.post("/plants/identify", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 60000, // 60 секунд (AI үшін көп уақыт керек)
    })
  },

  // Сканерлеу тарихы
  getUserScans: (page = 1, limit = 10) => {
    console.log(`📋 Тарих сұранысы: page=${page}, limit=${limit}`)
    return api.get(`/plants/scans?page=${page}&limit=${limit}`)
  },

  // Сканерлеуді өшіру
  deleteScan: (id) => {
    console.log(`🗑️ Сканерлеу өшіру: ID=${id}`)
    return api.delete(`/plants/scans/${id}`)
  },

  // Статистика
  getUserStats: () => {
    console.log("📊 Статистика сұранысы...")
    return api.get("/plants/stats")
  },

  // Бір сканерлеуді алу
  getScanById: (id) => {
    console.log(`👁️ Сканерлеу алу: ID=${id}`)
    return api.get(`/plants/scans/${id}`)
  },
}

export default api
