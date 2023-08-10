async function create ({ repo, req, body }) {
  const { pascalCase, getPlugin } = this.bajo.helper
  await getPlugin('bajoDb') // ensure bajoDb is loaded
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
