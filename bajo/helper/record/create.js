async function create ({ repo, req, reply, body }) {
  const { pascalCase, error } = this.bajo.helper
  if (!this.bajoDb) throw error('\'%s\' is not loaded yet')
  const { recordCreate } = this.bajoDb.helper
  const { getParams, transformResult } = this.bajoWebRestapi.helper
  const params = await getParams(req, 'repo')
  const { fields, dataOnly } = params
  repo = repo || params.repo
  body = body || params.body
  const options = { dataOnly, fields }
  const result = await recordCreate(pascalCase(repo), body, options)
  return dataOnly ? result : await transformResult(result)
}

export default create