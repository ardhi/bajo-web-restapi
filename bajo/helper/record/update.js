async function update ({ repo, req, reply, id, body }) {
  const { pascalCase, getPlugin } = this.bajo.helper
  await getPlugin('bajoDb') // ensure bajoDb is loaded
  const { recordUpdate } = this.bajoDb.helper
  const { getParams, transformResult } = this.bajoWebRestapi.helper
  const params = await getParams(req, 'repo', 'id')
  const { fields, dataOnly } = params
  repo = repo ?? params.repo
  body = body ?? params.body
  id = id ?? params.id
  const options = { dataOnly, fields }
  const data = await recordUpdate(pascalCase(repo), id, body, { fields, dataOnly: false })
  data.success = true
  data.statusCode = 200
  return await transformResult({ data, req, reply, options })
}

export default update
