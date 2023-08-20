async function create ({ repo, req, reply, body }) {
  const { pascalCase, getPlugin } = this.bajo.helper
  await getPlugin('bajoDb') // ensure bajoDb is loaded
  const { recordCreate } = this.bajoDb.helper
  const { getParams } = this.bajoWebRestapi.helper
  const params = await getParams(req, 'repo')
  const { fields } = params
  repo = repo ?? params.repo
  body = body ?? params.body
  return await recordCreate(pascalCase(repo), body, { fields, dataOnly: false, req })
}

export default create
