async function remove ({ repo, req, reply, id }) {
  const { pascalCase, getPlugin } = this.bajo.helper
  await getPlugin('bajoDb') // ensure bajoDb is loaded
  const { recordRemove } = this.bajoDb.helper
  const { getParams, transformResult } = this.bajoWebRestapi.helper
  const params = await getParams(req, 'repo', 'id')
  const { fields, dataOnly } = params
  repo = repo || params.repo
  id = id || params.id
  const options = { dataOnly, fields }
  const result = await recordRemove(pascalCase(repo), id, options)
  return dataOnly ? result : await transformResult(result)
}

export default remove
