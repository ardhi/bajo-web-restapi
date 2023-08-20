async function remove ({ repo, req, reply, id }) {
  const { pascalCase, getPlugin } = this.bajo.helper
  await getPlugin('bajoDb') // ensure bajoDb is loaded
  const { recordRemove } = this.bajoDb.helper
  const { getParams } = this.bajoWebRestapi.helper
  const params = await getParams(req, 'repo', 'id')
  const { fields } = params
  repo = repo ?? params.repo
  id = id ?? params.id
  return await recordRemove(pascalCase(repo), id, { fields, dataOnly: false, req })
}

export default remove
