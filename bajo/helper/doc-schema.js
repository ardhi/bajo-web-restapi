const desc = {
  create: 'Post a new record',
  find: 'Find records by query, page size and number.',
  get: 'Get record by ID',
  update: 'Update record by ID',
  remove: 'Remove record by ID'
}

async function buildPropsReqs (schema, method) {
  const properties = {}
  const required = []
  for (const p of schema.properties) {
    let type = 'string'
    if (['float', 'double'].includes(p.type)) type = 'number'
    if (['boolean'].includes(p.type)) type = 'boolean'
    if (['integer'].includes(p.type)) type = 'integer'
    if (['object'].includes(p.type)) type = 'object'
    properties[p.name] = { type }
    if (!p.required) properties[p.name].nullable = true
    else if (method === 'create' && p.name !== 'id') required.push(p.name)
    if (['datetime'].includes(p.type)) properties[p.name].format = 'date-time'
  }
  return { properties, required }
}

async function buildErrResp (ctx) {
  const { importPkg } = this.bajo.helper
  const { cloneDeep, merge } = await importPkg('lodash-es')
  const def = {
    type: 'object',
    properties: {
      success: { type: 'boolean', default: false },
      error: { type: 'string' },
      message: { type: 'string' }
    }
  }
  for (const type of ['4xx', '5xx']) {
    const item = cloneDeep(def)
    if (type === '4xx') {
      merge(item, {
        properties: {
          details: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string' },
                error: { type: 'string' }
              }
            }
          },
          statusCode: { type: 'integer', default: 400 }
        }
      })
    } else {
      merge(item, {
        properties: {
          statusCode: { type: 'integer', default: 500 }
        }
      })
    }
    await lib.call(this, ctx, type + 'Resp', item)
  }
}

async function buildResponse (ctx, schema, method) {
  const { print, getConfig } = this.bajo.helper
  const { transformResult } = this.bajoWebRestapi.helper
  const cfg = getConfig('bajoWebRestapi', { full: true })
  const { properties } = await buildPropsReqs.call(this, schema, method)
  await buildErrResp.call(this, ctx)

  async function buildData (keys) {
    const data = {}
    for (const k of keys) {
      const name = 'repo' + schema.name
      await lib.call(this, ctx, name, {
        type: 'object',
        properties
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
  if (['create', 'update'].includes(method)) {
    result['4xx'] = {
      description: print.__('Document error response'),
      $ref: '4xxResp#'
    }
  }
  result['5xx'] = {
    description: print.__('General error response'),
    $ref: '5xxResp#'
  }
  if (cfg.dbRepo.dataOnly) {
    if (method === 'find') {
      result['2xx'] = {
        type: 'array',
        items: (await buildData.call(this, ['data'])).data
      }
    } else result['2xx'] = (await buildData.call(this, ['data'])).data
    return result
  }
  if (['create', 'get'].includes(method)) {
    result['2xx'].properties = await transformResult({ data: await buildData.call(this, ['data']) })
  } else if (['update', 'patch'].includes(method)) {
    result['2xx'].properties = await transformResult({ data: await buildData.call(this, ['data', 'oldData']) })
  } else if (['remove'].includes(method)) {
    result['2xx'].properties = await transformResult({ data: await buildData.call(this, ['oldData']) })
  } else if (['find'].includes(method)) {
    result['2xx'].properties = await transformResult({
      data: {
        data: {
          type: 'array',
          items: (await buildData.call(this, ['data'])).data
        },
        limit: { type: 'integer' },
        page: { type: 'integer' },
        pages: { type: 'integer' },
        count: { type: 'integer' }
      },
      options: { forFind: true }
    })
  }
  return result
}

async function lib (ctx, name, obj) {
  const { importPkg } = this.bajo.helper
  const { merge } = await importPkg('lodash-es')
  if (ctx.getSchema(name)) return
  const value = merge({}, obj, { $id: name })
  ctx.addSchema(value)
}

async function docSchema ({ repo, method, ctx, options = {} }) {
  const { print, getConfig, importPkg } = this.bajo.helper
  const { getInfo } = this.bajoDb.helper
  const { schema } = await getInfo(repo)
  const { each, keys, omit } = await importPkg('lodash-es')
  const cfg = getConfig(schema.plugin, { full: true })
  const cfgApi = getConfig('bajoWebRestapi')
  const cfgDb = getConfig('bajoDb')
  const out = {
    description: options.description || print.__(desc[method]),
    tags: [cfg.alias.toUpperCase(), ...(options.alias || [])]
  }
  if (['find'].includes(method)) {
    const def = {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: print.__('NQL/Mongo Query. Leave empty to disable query')
        },
        limit: {
          type: 'integer',
          description: print.__('Number of records per page. Must be >= 1'),
          default: cfgDb.defaults.filter.limit
        },
        page: {
          type: 'integer',
          description: print.__('Desired page number. Must be >= 1'),
          default: 1
        },
        sort: {
          type: 'string',
          description: print.__('Order of records, format: &lt;field&gt;:&lt;dir&gt;[,&lt;field&gt;:&lt;dir&gt;,[...]]')
        },
        fields: {
          type: 'string',
          description: print.__('Comma delimited fields to show. Leave empty to show all fields')
        }
      }
    }
    each(keys(cfgApi.key.qs), k => {
      const v = cfgApi.key.qs[k]
      if (k === v) return undefined
      def.properties[v] = def.properties[k]
      delete def.properties[k]
    })
    await lib.call(this, ctx, 'qsFilter', def)
    out.querystring = { $ref: 'qsFilter#' }
  }
  if (['get', 'update', 'remove'].includes(method)) {
    await lib.call(this, ctx, 'paramsId', {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: print.__('Record ID')
        }
      }
    })
    out.params = { $ref: 'paramsId#' }
  }
  if (['update'].includes(method)) {
    const { properties } = await buildPropsReqs.call(this, schema, method)
    const name = 'repo' + schema.name + 'Update'
    await lib.call(this, ctx, name, {
      type: 'object',
      properties: omit(properties, ['id'])
    })
    out.body = { $ref: name + '#' }
  }
  if (['create'].includes(method)) {
    const { properties, required } = await buildPropsReqs.call(this, schema, method)
    const name = 'repo' + schema.name + 'Create'
    await lib.call(this, ctx, name, {
      type: 'object',
      properties,
      required
    })
    out.body = { $ref: name + '#' }
  }
  out.response = await buildResponse.call(this, ctx, schema, method)
  return out
}

export default docSchema
