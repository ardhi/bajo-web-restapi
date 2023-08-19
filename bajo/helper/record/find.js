async function find ({ repo, req, reply }) {
  const { pascalCase, getPlugin, importPkg } = this.bajo.helper
  await getPlugin('bajoDb') // ensure bajoDb is loaded
  const { merge } = await importPkg('lodash-es')
  const { recordFind } = this.bajoDb.helper
  const { getFilter, getParams, transformResult } = this.bajoWebRestapi.helper
  const params = await getParams(req, 'repo')
  const { fields, dataOnly } = params
  repo = repo ?? params.repo
  const options = { dataOnly, fields }
  const filter = await getFilter(req)
  const data = await recordFind(pascalCase(repo), filter, { fields, dataOnly: false })
  data.success = true
  data.statusCode = 200
  return await transformResult({ data, req, reply, options: merge({ forFind: true }, options) })
}

export default find
