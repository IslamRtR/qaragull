"use client"

import { useState, useEffect } from "react"
import { plantsAPI } from "../services/api"
import Navbar from "../components/Navbar"
import {
  Search,
  Calendar,
  Leaf,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Download,
  Share2,
  Star,
  TrendingUp,
} from "lucide-react"

const HistoryPage = () => {
  const [scans, setScans] = useState([])
  const [filteredScans, setFilteredScans] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedItem, setSelectedItem] = useState(null)
  const [pagination, setPagination] = useState({})
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState("newest") // newest, oldest, accuracy
  const [filterBy, setFilterBy] = useState("all") // all, high-accuracy, recent

  useEffect(() => {
    fetchScans(currentPage)
  }, [currentPage])

  useEffect(() => {
    let filtered = scans.filter(
      (scan) =>
        scan.commonName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        scan.scientificName.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    // Фильтрация
    if (filterBy === "high-accuracy") {
      filtered = filtered.filter((scan) => scan.accuracy >= 95)
    } else if (filterBy === "recent") {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      filtered = filtered.filter((scan) => new Date(scan.createdAt) > weekAgo)
    }

    // Сортировка
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.createdAt) - new Date(b.createdAt)
        case "accuracy":
          return b.accuracy - a.accuracy
        case "newest":
        default:
          return new Date(b.createdAt) - new Date(a.createdAt)
      }
    })

    setFilteredScans(filtered)
  }, [searchTerm, scans, sortBy, filterBy])

  const fetchScans = async (page) => {
    try {
      setLoading(true)
      console.log("📋 Тарих алынуда...")

      const response = await plantsAPI.getUserScans(page, 10)
      console.log("✅ Тарих алынды:", response.data)

      if (response.data && response.data.scans) {
        setScans(response.data.scans)
        setPagination(response.data.pagination)
        console.log("📊 Сканерлеулер саны:", response.data.scans.length)
      } else {
        console.warn("⚠️ Тарих форматы дұрыс емес")
        setScans([])
      }
    } catch (error) {
      console.error("❌ Тарих алу қатесі:", error)
      setScans([])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Жаңа ғана"
    if (diffInHours < 24) return `${diffInHours} сағат бұрын`

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays === 1) return "Кеше"
    if (diffInDays < 7) return `${diffInDays} күн бұрын`

    return date.toLocaleDateString("kk-KZ")
  }

  const deleteScan = async (id) => {
    if (window.confirm("Бұл сканерлеуді өшіруді қалайсыз ба?")) {
      try {
        await plantsAPI.deleteScan(id)
        const updatedScans = scans.filter((scan) => scan.id !== id)
        setScans(updatedScans)
        setSelectedItem(null)

        // Success notification
        showNotification("Сканерлеу сәтті өшірілді", "success")
      } catch (error) {
        console.error("Сканерлеуді өшіру қатесі:", error)
        showNotification("Сканерлеуді өшіру кезінде қате орын алды", "error")
      }
    }
  }

  const showNotification = (message, type) => {
    // Simple notification - can be replaced with toast library
    const notification = document.createElement("div")
    notification.className = `fixed top-4 right-4 p-4 rounded-lg text-white z-50 ${
      type === "success" ? "bg-green-500" : "bg-red-500"
    }`
    notification.textContent = message
    document.body.appendChild(notification)

    setTimeout(() => {
      document.body.removeChild(notification)
    }, 3000)
  }

  const shareItem = async (item) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `PlantID: ${item.commonName}`,
          text: `Мен ${item.commonName} (${item.scientificName}) өсімдігін PlantID арқылы анықтадым!`,
          url: window.location.href,
        })
      } catch (error) {
        console.log("Бөлісу қатесі:", error)
      }
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(`${item.commonName} - ${item.description}`)
      showNotification("Ақпарат көшірілді!", "success")
    }
  }

  const exportData = () => {
    const csvContent = [
      ["Атауы", "Ғылыми атауы", "Дәлдік", "Күні"],
      ...filteredScans.map((scan) => [
        scan.commonName,
        scan.scientificName,
        `${scan.accuracy}%`,
        formatDate(scan.createdAt),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "plant-history.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 95) return "bg-green-100 text-green-800"
    if (accuracy >= 90) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  const getAccuracyIcon = (accuracy) => {
    if (accuracy >= 95) return <Star className="w-4 h-4 text-green-600" />
    if (accuracy >= 90) return <TrendingUp className="w-4 h-4 text-yellow-600" />
    return <Eye className="w-4 h-4 text-red-600" />
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Stats */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">📚 Сканерлеу тарихы</h1>
              <div className="flex gap-4 text-sm text-gray-600">
                <span>Барлығы: {pagination.totalScans || 0}</span>
                <span>•</span>
                <span>Көрсетілген: {filteredScans.length}</span>
                {scans.length > 0 && (
                  <>
                    <span>•</span>
                    <span>
                      Орташа дәлдік: {Math.round(scans.reduce((acc, scan) => acc + scan.accuracy, 0) / scans.length)}%
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Export Button */}
            {filteredScans.length > 0 && (
              <button onClick={exportData} className="btn btn-secondary flex items-center gap-2">
                <Download className="w-4 h-4" />
                CSV экспорт
              </button>
            )}
          </div>

          {/* Search and Filters */}
          <div className="grid md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Өсімдік атын іздеу..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>

            {/* Sort */}
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input">
              <option value="newest">Жаңадан ескіге</option>
              <option value="oldest">Ескіден жаңаға</option>
              <option value="accuracy">Дәлдік бойынша</option>
            </select>

            {/* Filter */}
            <select value={filterBy} onChange={(e) => setFilterBy(e.target.value)} className="input">
              <option value="all">Барлығы</option>
              <option value="high-accuracy">Жоғары дәлдік (95%+)</option>
              <option value="recent">Соңғы апта</option>
            </select>
          </div>
        </div>

        {filteredScans.length === 0 ? (
          <div className="card border-0 shadow-lg">
            <div className="p-12 text-center">
              <Leaf className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {searchTerm || filterBy !== "all" ? "Ештеңе табылмады" : "Тарих бос"}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || filterBy !== "all"
                  ? "Іздеу параметрлерін өзгертіп көріңіз"
                  : "Алғашқы өсімдікті сканерлеп, тарих жасаңыз"}
              </p>
              <button onClick={() => (window.location.href = "/scan")} className="btn btn-primary">
                🌿 Жаңа сканерлеу
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-6">
              {filteredScans.map((scan) => (
                <div
                  key={scan.id}
                  className="card border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="p-6">
                    <div className="grid md:grid-cols-4 gap-6 items-center">
                      <div className="relative h-32 w-full rounded-lg overflow-hidden bg-gray-100 group">
                        <img
                          src={scan.imageUrl || "/placeholder.svg"}
                          alt={scan.commonName}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-xl font-semibold text-gray-800">{scan.commonName}</h3>
                          <div className="flex items-center gap-1">
                            {getAccuracyIcon(scan.accuracy)}
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getAccuracyColor(scan.accuracy)}`}
                            >
                              {scan.accuracy}% дәлдік
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-600 italic">{scan.scientificName}</p>
                        <p className="text-gray-700 line-clamp-2">{scan.description}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          {formatDate(scan.createdAt)}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => setSelectedItem(scan)}
                          className="btn btn-secondary text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Қарау
                        </button>
                        <button
                          onClick={() => shareItem(scan)}
                          className="btn btn-secondary text-sm hover:bg-green-50 hover:text-green-700 transition-colors"
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          Бөлісу
                        </button>
                        <button
                          onClick={() => deleteScan(scan.id)}
                          className="btn text-sm text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Өшіру
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Enhanced Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className={`btn text-sm ${currentPage === 1 ? "btn-secondary opacity-50 cursor-not-allowed" : "btn-secondary"}`}
                >
                  Алғашқы
                </button>

                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!pagination.hasPrev}
                  className={`btn ${pagination.hasPrev ? "btn-secondary" : "btn-secondary opacity-50 cursor-not-allowed"}`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-gray-600">
                    {currentPage} / {pagination.totalPages}
                  </span>
                  <span className="text-gray-400 text-sm">({pagination.totalScans} жазба)</span>
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!pagination.hasNext}
                  className={`btn ${pagination.hasNext ? "btn-secondary" : "btn-secondary opacity-50 cursor-not-allowed"}`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handlePageChange(pagination.totalPages)}
                  disabled={currentPage === pagination.totalPages}
                  className={`btn text-sm ${currentPage === pagination.totalPages ? "btn-secondary opacity-50 cursor-not-allowed" : "btn-secondary"}`}
                >
                  Соңғы
                </button>
              </div>
            )}
          </>
        )}

        {/* Enhanced Modal */}
        {selectedItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="card w-full max-w-3xl max-h-[90vh] overflow-y-auto border-0 shadow-2xl">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold">{selectedItem.commonName}</h2>
                    {getAccuracyIcon(selectedItem.accuracy)}
                  </div>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="text-gray-500 hover:text-gray-700 text-2xl hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>

                <p className="text-gray-600 italic mb-6">{selectedItem.scientificName}</p>

                <div className="relative h-64 w-full rounded-lg overflow-hidden bg-gray-100 mb-6">
                  <img
                    src={selectedItem.imageUrl || "/placeholder.svg"}
                    alt={selectedItem.commonName}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    {getAccuracyIcon(selectedItem.accuracy)}
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getAccuracyColor(selectedItem.accuracy)}`}
                    >
                      {selectedItem.accuracy}% дәлдік
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    {formatDate(selectedItem.createdAt)}
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 mb-2">📝 Сипаттама</h4>
                  <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">{selectedItem.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">🌍 Шығу тегі</h4>
                    <p className="text-gray-600">{selectedItem.origin}</p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">☀️ Жарық</h4>
                    <p className="text-gray-600">{selectedItem.sunlight}</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">💧 Суару</h4>
                    <p className="text-gray-600">{selectedItem.water}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">📈 Өсу қарқыны</h4>
                    <p className="text-gray-600">{selectedItem.growthRate}</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button onClick={() => setSelectedItem(null)} className="btn btn-secondary flex-1">
                    Жабу
                  </button>
                  <button onClick={() => shareItem(selectedItem)} className="btn btn-primary flex-1">
                    <Share2 className="w-4 h-4 mr-2" />
                    Бөлісу
                  </button>
                  <button
                    onClick={() => deleteScan(selectedItem.id)}
                    className="btn flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Өшіру
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default HistoryPage
