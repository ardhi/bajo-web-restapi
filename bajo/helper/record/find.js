async function find ({ repo, req, reply }) {
  const { pascalCase, getPlugin } = this.bajo.helper
  await getPlugin('bajoDb') // ensure bajoDb is loaded
  const { recordFind } = this.bajoDb.helper
  const { getFilter, getParams } = this.bajoWebRestapi.helper
  const params = await getParams(req, 'repo')
  const { fields } = params
  repo = repo ?? params.repo
  const filter = await getFilter(req)
  return await recordFind(pascalCase(repo), filter, { fields, dataOnly: false, req })
}

export default find
