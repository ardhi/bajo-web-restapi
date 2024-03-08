async function buildPropsReqs (schema, method) {
  const properties = {}
  const required = []
  for (const p of schema.properties) {
    let type = 'string'
    if (['float', 'double'].includes(p.type)) type = 'number'
    if (['boolean'].includes(p.type)) type = 'boolean'
    if (['integer', 'smallint'].includes(p.type)) type = 'integer'
    if (['object'].includes(p.type)) type = 'object'
    if (['array'].includes(p.type)) type = 'array'
    properties[p.name] = { type }
    if (!p.required) properties[p.name].nullable = true
    else if (method === 'create' && p.name !== 'id') required.push(p.name)
    if (['datetime'].includes(p.type)) properties[p.name].format = 'date-time'
  }
  return { properties, required }
}

async function buildResponse (ctx, schema, method) {
  const { print, getConfig, importPkg } = this.bajo.helper
  const { transformResult, docSchemaLib, docSchemaForFind } = this.bajoWebRestapi.helper
  const { merge, cloneDeep } = await importPkg('lodash-es')
  const cfgWeb = getConfig('bajoWeb')
  const { properties } = await buildPropsReqs.call(this, schema, method)

  async function buildData (keys) {
    const data = {}
    for (const k of keys) {
      const name = 'coll' + schema.name
      await docSchemaLib(ctx, name, {
        type: 'object',
        properties: cloneDeep(properties)
      })
      data[k] = { $ref: name + '#' }
    }
    return data
  }

  const result = {
    '2xx': {
      description: print.__('Successfull response'),
      type: 'object'
    }
  }
  if (['create', 'update', 'replace'].includes(method)) {
    result['4xx'] = {
      description: print.__('Document error response'),
      $ref: '4xxResp#'
    }
  }
  result['5xx'] = {
    description: print.__('General error response'),
    $ref: '5xxResp#'
  }
  if (cfgWeb.dbColl.dataOnly) {
    if (method === 'find') {
      result['2xx'] = {
        type: 'array',
        items: (await buildData.call(this, ['data'])).data
      }
    } else result['2xx'] = (await buildData.call(this, ['data'])).data
    return result
  }
  const success = { type: 'boolean', default: true }
  let statusCode = { type: 'integer', default: 200 }
  if (['create', 'get'].includes(method)) {
    if (method === 'create') statusCode = 201
    result['2xx'].properties = await transformResult({ data: merge({}, await buildData.call(this, ['data']), { success, statusCode }) })
  } else if (['update', 'replace'].includes(method)) {
    result['2xx'].properties = await transformResult({ data: merge({}, await buildData.call(this, ['data', 'oldData']), { success, statusCode }) })
  } else if (['remove'].includes(method)) {
    result['2xx'].properties = await transformResult({ data: merge({}, await buildData.call(this, ['oldData']), { success, statusCode }) })
  } else if (['find'].includes(method)) {
    result['2xx'].properties = await transformResult({
      data: await docSchemaForFind(ctx, { type: 'object', properties }),
      options: { forFind: true }
    })
  }
  return result
}

async function docSchema ({ coll, method, ctx, options = {} }) {
  const { getConfig, importPkg } = this.bajo.helper
  const { docSchemaDescription, docSchemaLib } = this.bajoWebRestapi.helper
  const { getInfo } = this.bajoDb.helper
  const { schema } = await getInfo(coll)
  const { omit } = await importPkg('lodash-es')
  const cfg = getConfig(schema.plugin, { full: true })
  const out = {
    description: options.description ?? docSchemaDescription(method),
    tags: [cfg.alias.toUpperCase(), ...(options.alias ?? [])]
  }
  if (['find'].includes(method)) {
    out.querystring = { $ref: 'qsFilter#' }
  }
  if (['get', 'update', 'replace', 'remove'].includes(method)) {
    out.querystring = { $ref: 'qsFields#' }
    out.params = { $ref: 'paramsId#' }
  }
  if (['update'].includes(method)) {
    const { properties } = await buildPropsReqs.call(this, schema, method)
    const name = 'coll' + schema.name + 'Update'
    await docSchemaLib(ctx, name, {
      type: 'object',
      properties: omit(properties, ['id'])
    })
    out.body = { $ref: name + '#' }
  }
  if (['replace'].includes(method)) {
    const { properties, required } = await buildPropsReqs.call(this, schema, method)
    const name = 'coll' + schema.name + 'Replace'
    await docSchemaLib(ctx, name, {
      type: 'object',
      properties: omit(properties, ['id']),
      required
    })
    out.body = { $ref: name + '#' }
  }
  if (['create'].includes(method)) {
    const { properties, required } = await buildPropsReqs.call(this, schema, method)
    const name = 'coll' + schema.name + 'Create'
    await docSchemaLib(ctx, name, {
      type: 'object',
      properties,
      required
    })
    out.body = { $ref: name + '#' }
    out.querystring = { $ref: 'qsFields#' }
  }
  out.response = await buildResponse.call(this, ctx, schema, method)
  return out
}

export default docSchema
