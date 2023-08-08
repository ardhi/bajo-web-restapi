async function getParams (req) {
  const { importPkg } = this.bajo.helper
  const { map, trim } = await importPkg('lodash-es')
  let fields
  if (req.query.fields) fields = map(req.query.fields.split(','), i => trim(i))
  const { repo, id } = req.params
  return { fields, repo, id }
}

async function putHandler (req) {
  const { pascalCase, getConfig } = this.bajo.helper
  const { recordUpdate } = this.bajoDb.helper
  const { transformWithKeys } = this.bajoWebRestapi.helper
  const cfg = getConfig('bajoWebRestapi')
  const { repo, id, fields } = await getParams.call(this, req)
  const { body } = req
  const options = { dataOnly: cfg.dbRec.dataOnly, fields }
  const result = await recordUpdate(pascalCase(repo), id, body, options)
  return options.dataOnly ? result : await transformWithKeys.call(this, result)
}

async function dbRec (ctx) {
  if (!this.bajoDb) return
  const { getConfig, pascalCase } = this.bajo.helper
  const { recordFind, recordGet, recordCreate, recordRemove } = this.bajoDb.helper
  const { getFilter, transformWithKeys } = this.bajoWebRestapi.helper
  const cfg = getConfig('bajoWebRestapi')

  await ctx.register(async (childCtx) => {
    await childCtx.get('/:repo', async (req, reply) => {
      const { repo, fields } = await getParams.call(this, req)
      const options = { dataOnly: cfg.dbRec.dataOnly, fields }
      const result = await recordFind(pascalCase(repo), getFilter.call(this, req), options)
      return options.dataOnly ? result : await transformWithKeys.call(this, result, true)
    })
    await childCtx.get('/:repo/:id', async (req, reply) => {
      const { repo, id, fields } = await getParams.call(this, req)
      const options = { dataOnly: cfg.dbRec.dataOnly, fields }
      const result = await recordGet(pascalCase(repo), id, options)
      return options.dataOnly ? result : await transformWithKeys.call(this, result)
    })
    await childCtx.post('/:repo', async (req, reply) => {
      const { repo, fields } = await getParams.call(this, req)
      const { body } = req
      const options = { dataOnly: cfg.dbRec.dataOnly, fields }
      const result = await recordCreate(pascalCase(repo), body, options)
      return options.dataOnly ? result : await transformWithKeys.call(this, result)
    })
    await childCtx.put('/:repo/:id', async (req, reply) => {
      return await putHandler.call(this, req)
    })
    await childCtx.patch('/:repo/:id', async (req, reply) => {
      return await putHandler.call(this, req)
    })
    await childCtx.delete('/:repo/:id', async (req, reply) => {
      const { repo, id, fields } = await getParams.call(this, req)
      const options = { dataOnly: cfg.dbRec.dataOnly, fields }
      const result = await recordRemove(pascalCase(repo), id, options)
      return options.dataOnly ? result : await transformWithKeys.call(this, result)
    })
  }, { prefix: cfg.dbRec.prefix })
}

export default dbRec
