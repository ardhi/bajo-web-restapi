async function update ({ repo, req, reply, id, body }) {
  const { pascalCase, getPlugin } = this.bajo.helper
  await getPlugin('bajoDb') // ensure bajoDb is loaded
  const { recordUpdate } = this.bajoDb.helper
  const { getParams } = this.bajoWebRestapi.helper
  const params = await getParams(req, 'repo', 'id')
  const { fields } = params
  repo = repo ?? params.repo
  body = body ?? params.body
  id = id ?? params.id
  return await recordUpdate(pascalCase(repo), id, body, { fields, dataOnly: false, req })
}

export default update
