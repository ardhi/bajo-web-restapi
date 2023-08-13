async function create ({ repo, req, reply, body }) {
  const { pascalCase, getPlugin } = this.bajo.helper
  await getPlugin('bajoDb') // ensure bajoDb is loaded
  const { recordCreate } = this.bajoDb.helper
  const { getParams, transformResult } = this.bajoWebRestapi.helper
  const params = await getParams(req, 'repo')
  const { fields, dataOnly } = params
  repo = repo || params.repo
  body = body || params.body
  const options = { dataOnly, fields }
  const data = await recordCreate(pascalCase(repo), body, { fields, dataOnly: false })
  return await transformResult({ data, req, reply, options })
}

export default create
