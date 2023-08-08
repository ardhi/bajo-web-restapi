async function update ({ repo, req, reply, id, body }) {
  const { pascalCase, error } = this.bajo.helper
  if (!this.bajoDb) throw error('\'%s\' is not loaded yet')
  const { recordUpdate } = this.bajoDb.helper
  const { getParams, transformResult } = this.bajoWebRestapi.helper
  const params = await getParams(req, 'repo', 'id')
  const { fields, dataOnly } = params
  repo = repo || params.repo
  body = body || params.body
  id = id || params.id
  const options = { dataOnly, fields }
  const result = await recordUpdate(pascalCase(repo), id, body, options)
  return dataOnly ? result : await transformResult(result)
}

export default update
