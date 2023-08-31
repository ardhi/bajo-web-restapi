async function buildErrResp (ctx) {
  const { importPkg, getConfig } = this.bajo.helper
  const { docSchemaLib } = this.bajoWebRestapi.helper
  const { cloneDeep, merge, each, get } = await importPkg('lodash-es')
  const cfg = getConfig('bajoWebRestapi')
  const cfgWeb = getConfig('bajoWeb')
  const def = {
    type: 'object',
    properties: {
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
          success: { type: 'boolean', default: false },
          statusCode: { type: 'integer', default: 400 }
        }
      })
    } else {
      merge(item, {
        properties: {
          success: { type: 'boolean', default: false },
          statusCode: { type: 'integer', default: 500 }
        }
      })
    }
    if (cfgWeb.dbRepo.dataOnly) item.properties = { error: item.properties.message }
    const props = {}
    each(item.properties, (v, k) => {
      const key = get(cfg, `responseKey.${k}`, k)
      props[key] = item.properties[k]
    })
    item.properties = props
    await docSchemaLib(ctx, type + 'Resp', item)
  }
}

async function buildFilter (ctx) {
  const { getConfig } = this.bajo.helper
  const { docSchemaParams } = this.bajoWebRestapi.helper
  const cfgDb = getConfig('bajoDb')
  await docSchemaParams(ctx, 'qsFilter',
    'query||NQL/Mongo Query. Leave empty to disable query',
    'limit|integer|Number of records per page. Must be >= 1|' + cfgDb.defaults.filter.limit,
    'page|integer|Desired page number. Must be >= 1|1',
    'sort||Order of records, format: &lt;field&gt;:&lt;dir&gt;[,&lt;field&gt;:&lt;dir&gt;,[...]]',
    'fields||Comma delimited fields to show. Leave empty to show all fields',
    true
  )
}

async function buildFields (ctx) {
  const { docSchemaParams } = this.bajoWebRestapi.helper
  await docSchemaParams(ctx, 'qsFields',
    'fields||Comma delimited fields to show. Leave empty to show all fields',
    true
  )
}

async function buildParamsId (ctx) {
  const { docSchemaParams } = this.bajoWebRestapi.helper
  await docSchemaParams(ctx, 'paramsId', 'id||Record ID')
}

async function docSchemaGeneral (ctx) {
  await buildErrResp.call(this, ctx)
  await buildFilter.call(this, ctx)
  await buildParamsId.call(this, ctx)
  await buildFields.call(this, ctx)
}

export default docSchemaGeneral
