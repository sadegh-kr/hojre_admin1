export function paginateRows(rows, page = 1, pageSize = 10) {
  const safeRows = Array.isArray(rows) ? rows : []
  const size = Math.max(1, Number(pageSize) || 1)
  const total = safeRows.length
  const totalPages = Math.max(1, Math.ceil(total / size))
  const currentPage = Math.min(Math.max(1, Number(page) || 1), totalPages)
  const startIndex = (currentPage - 1) * size
  const endIndex = Math.min(startIndex + size, total)

  return {
    rows: safeRows.slice(startIndex, endIndex),
    page: currentPage,
    pageSize: size,
    total,
    totalPages,
    rangeStart: total ? startIndex + 1 : 0,
    rangeEnd: endIndex,
  }
}
