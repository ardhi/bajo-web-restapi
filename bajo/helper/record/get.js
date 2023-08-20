async function get ({ repo, req, reply, id }) {
  const { pascalCase, getPlugin } = this.bajo.helper
  await getPlugin('bajoDb') // ensure bajoDb is loaded
  const { recordGet } = this.bajoDb.helper
  const { getParams } = this.bajoWebRestapi.helper
  const params = await getParams(req, 'repo', 'id')
  const { fields } = params
  repo = repo ?? params.repo
  id = id ?? params.id
  return await recordGet(pascalCase(repo), id, { fields, dataOnly: false, req })
}

export default get
