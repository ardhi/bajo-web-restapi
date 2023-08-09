async function getParams (req, ...items) {
  const { importPkg, getConfig } = this.bajo.helper
  const { map, trim, get, each } = await importPkg('lodash-es')
  const cfg = getConfig('bajoWebRestapi')
  let fields
  if (req.query.fields) fields = map(req.query.fields.split(','), i => trim(i))
  const params = {
    fields,
    dataOnly: get(cfg, 'dbRepo.dataOnly', false),
    body: req.body
  }
  each(items, i => {
    params[i] = req.params[i]
  })
  return params
}

export default getParams
