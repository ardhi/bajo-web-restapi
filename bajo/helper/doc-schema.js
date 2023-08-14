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

async function buildResponse (schema, method) {
  const { print, getConfig } = this.bajo.helper
  const { transformResult } = this.bajoWebRestapi.helper
  const cfg = getConfig('bajoWebRestapi', { full: true })
  const { properties, required } = await buildPropsReqs.call(this, schema, method)

  function buildData (keys) {
    const data = {}
    for (const k of keys) {
      data[k] = {
        type: 'object',
        properties,
        required
      }
    }
    return data
  }

  const result = {
    200: {
      description: print.__('Successfull response'),
      type: 'object'
    }
  }
  if (cfg.dbRepo.dataOnly) {
    result['200'].properties = properties
    return result
  }
  if (['create', 'get'].includes(method)) {
    result['200'].properties = await transformResult({ data: buildData(['data']) })
  } else if (['update', 'patch'].includes(method)) {
    result['200'].properties = await transformResult({ data: buildData(['data', 'oldData']) })
  } else if (['remove'].includes(method)) {
    result['200'].properties = await transformResult({ data: buildData(['oldData']) })
  } else if (['find'].includes(method)) {
    result['200'].properties = await transformResult({
      data: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties
          }
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

async function docSchema ({ repo, method }) {
  const { print, getConfig, importPkg } = this.bajo.helper
  const { getInfo } = this.bajoDb.helper
  const { schema } = await getInfo(repo)
  const { each, keys } = await importPkg('lodash-es')
  const cfg = getConfig(schema.plugin, { full: true })
  const cfgApi = getConfig('bajoWebRestapi')
  const out = {
    description: print.__(desc[method]),
    tags: [cfg.alias]
  }
  if (['find'].includes(method)) {
    out.querystring = {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: print.__('NQL/Mongo Query. Leave empty to disable query')
        },
        limit: {
          type: 'integer',
          description: print.__('Number of records per page. Must be >= 1'),
          default: 25
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
      out.querystring.properties[v] = out.querystring.properties[k]
      delete out.querystring.properties[k]
    })
  }
  if (['get', 'update', 'remove'].includes(method)) {
    out.params = {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: print.__('Record ID')
        }
      }
    }
  }
  if (['create', 'update'].includes(method)) {
    const { properties, required } = await buildPropsReqs.call(this, schema, method)
    out.body = {
      type: 'object',
      properties,
      required
    }
    if (method === 'update') delete out.body.properties.id
  }
  out.response = await buildResponse.call(this, schema, method)
  return out
}

export default docSchema
