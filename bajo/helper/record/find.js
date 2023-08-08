async function find ({ repo, req, reply }) {
  const { pascalCase, error } = this.bajo.helper
  if (!this.bajoDb) throw error('\'%s\' is not loaded yet')
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
