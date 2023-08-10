async function find ({ repo, req }) {
  const { pascalCase, getPlugin } = this.bajo.helper
  await getPlugin('bajoDb') // ensure bajoDb is loaded
  const { recordFind } = this.bajoDb.helper
  const { getFilter, getParams, transformResult } = this.bajoWebRestapi.helper
  const params = await getParams(req, 'repo')
  const { fields, dataOnly } = params
  repo = repo || params.repo
  const options = { dataOnly, fields }
  const result = await recordFind(pascalCase(repo), getFilter(req), options)
  return dataOnly ? result : await transformResult(result, true)
}

export default find
