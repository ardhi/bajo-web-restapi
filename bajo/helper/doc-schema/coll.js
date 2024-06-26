function getType (input) {
  let type = 'string'
  if (['float', 'double'].includes(input)) type = 'number'
  if (['boolean'].includes(input)) type = 'boolean'
  if (['integer', 'smallint'].includes(input)) type = 'integer'
  if (['object'].includes(input)) type = 'object'
  if (['array'].includes(input)) type = 'array'
  return type
}

async function buildPropsReqs ({ schema, method, options = {} }) {
  const { getSchema } = this.bajoDb.helper
  const properties = {}
  const required = []
  const rels = {}
  const hidden = options.hidden ?? []
  for (const p of schema.properties) {
    if (hidden.includes(p.name)) continue
    properties[p.name] = { type: getType(p.type) }
    if (!p.required) properties[p.name].nullable = true
    else if (method === 'create' && p.name !== 'id') required.push(p.name)
    if (['datetime'].includes(p.type)) properties[p.name].format = 'date-time'
    if (p.rel) {
      for (const key in p.rel) {
        const val = p.rel[key]
        if (val.fields.length === 0) continue
        const props = { type: 'object', properties: {} }
        const relschema = getSchema(val.schema)
        for (const f of val.fields) {
          const item = relschema.properties.find(s => s.name === f)
          props.properties[item.name] = { type: getType(item.type) }
        }
        if (Object.keys(props.properties).length > 0) {
          if (val.type === 'one-to-many') {
            rels[key] = { type: 'array', items: props }
          } else if (val.type === 'one-to-one') {
            rels[key] = props
          }
        }
      }
    }
  }
  if (Object.keys(rels).length > 0) properties._rel = { type: 'object', properties: rels }
  return { properties, required }
}

async function buildResponse ({ ctx, schema, method, options }) {
  const { print, getConfig } = this.bajo.helper
  const { transformResult, docSchemaLib, docSchemaForFind } = this.bajoWebRestapi.helper
  const { merge, cloneDeep } = this.bajo.helper._
  const cfgWeb = getConfig('bajoWeb')
  const { properties } = await buildPropsReqs.call(this, { schema, method, options })

  async function buildData (keys) {
    const data = {}
    for (const k of keys) {
      const name = 'coll' + schema.name
      const props = cloneDeep(properties)
      await docSchemaLib(ctx, name, {
        type: 'object',
        properties: props
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
    } else if (method === 'get') result['2xx'] = (await buildData.call(this, ['data'])).data
    else result['2xx'] = (await buildData.call(this, ['data'], true)).data
    return result
  }
  const success = { type: 'boolean', default: true }
  const statusCode = { type: 'integer', default: 200 }
  if (method === 'get') {
    result['2xx'].properties = transformResult({ data: merge({}, await buildData.call(this, ['data']), { success, statusCode }) })
  } else if (method === 'create') {
    statusCode.default = 201
    result['2xx'].properties = transformResult({ data: merge({}, await buildData.call(this, ['data']), { success, statusCode }) })
  } else if (['update', 'replace'].includes(method)) {
    result['2xx'].properties = transformResult({ data: merge({}, await buildData.call(this, ['data', 'oldData']), { success, statusCode }) })
  } else if (method === 'remove') {
    result['2xx'].properties = transformResult({ data: merge({}, await buildData.call(this, ['oldData']), { success, statusCode }) })
  } else if (method === 'find') {
    result['2xx'].properties = transformResult({
      data: await docSchemaForFind(ctx, { type: 'object', properties }),
      options: { forFind: true }
    })
  }
  return result
}

async function docSchemaColl ({ coll, method, ctx, options = {} }) {
  const { getConfig } = this.bajo.helper
  const { docSchemaDescription, docSchemaLib } = this.bajoWebRestapi.helper
  const { getInfo } = this.bajoDb.helper
  const { schema } = getInfo(coll)
  const { omit } = this.bajo.helper._
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
    if (!options.noId) out.params = { $ref: 'paramsId#' }
  }
  if (['update'].includes(method)) {
    const { properties } = await buildPropsReqs.call(this, { schema, method, options })
    const name = 'coll' + schema.name + 'Update'
    delete properties._rel
    await docSchemaLib(ctx, name, {
      type: 'object',
      properties: omit(properties, ['id'])
    })
    out.body = { $ref: name + '#' }
  }
  if (['replace'].includes(method)) {
    const { properties, required } = await buildPropsReqs.call(this, { schema, method, options })
    const name = 'coll' + schema.name + 'Replace'
    delete properties._rel
    await docSchemaLib(ctx, name, {
      type: 'object',
      properties: omit(properties, ['id']),
      required
    })
    out.body = { $ref: name + '#' }
  }
  if (['create'].includes(method)) {
    const { properties, required } = await buildPropsReqs.call(this, { schema, method, options })
    const name = 'coll' + schema.name + 'Create'
    delete properties._rel
    await docSchemaLib(ctx, name, {
      type: 'object',
      properties,
      required
    })
    out.body = { $ref: name + '#' }
    out.querystring = { $ref: 'qsFields#' }
  }
  out.response = await buildResponse.call(this, { ctx, schema, method, options })
  return out
}

export default docSchemaColl
