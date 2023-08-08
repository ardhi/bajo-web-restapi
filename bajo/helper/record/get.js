async function get ({ repo, req, reply, id }) {
  const { pascalCase, error } = this.bajo.helper
  if (!this.bajoDb) throw error('\'%s\' is not loaded yet')
  const { recordGet } = this.bajoDb.helper
  const { getParams, transformResult } = this.bajoWebRestapi.helper
  const params = await getParams(req, 'repo', 'id')
  const { fields, dataOnly } = params
  repo = repo || params.repo
  id = id || params.id
  const options = { dataOnly, fields }
  const result = await recordGet(pascalCase(repo), id, options)
  return dataOnly ? result : await transformResult(result)
}

export default get
