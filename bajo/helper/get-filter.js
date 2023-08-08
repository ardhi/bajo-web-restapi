function getFilter (req) {
  const { getConfig } = this.bajo.helper
  const cfg = getConfig('bajoWebRestapi')
  const query = req.query[cfg.key.qs.query]
  const limit = req.query[cfg.key.qs.limit]
  const page = req.query[cfg.key.qs.page]
  const sort = req.query[cfg.key.qs.sort]
  return { query, limit, page, sort }
}

export default getFilter
