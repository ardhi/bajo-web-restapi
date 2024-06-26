function reformat ({ data, req, reply, options = {} }) {
  const { getConfig } = this.bajo.helper
  const { forOwn, get } = this.bajo.helper._
  const cfg = getConfig('bajoWebRestapi')
  const newData = {}
  forOwn(data, (v, k) => {
    let key = get(cfg, `responseKey.${k}`, k)
    if (options.forFind && k === 'data') key = get(cfg, 'responseKey.data')
    newData[key] = v
  })
  return newData
}

function returnError ({ data, req, reply, options = {} }) {
  const { print, getConfig, pascalCase } = this.bajo.helper
  const { map, kebabCase, upperFirst, keys, each, get, isEmpty } = this.bajo.helper._
  const cfg = getConfig('bajoWebRestapi', { full: true })
  const cfgWeb = getConfig('bajoWeb')
  const restapi = pascalCase(cfg.alias)
  data.error = print.__(map(kebabCase(data.constructor.name).split('-'), s => upperFirst(s)).join(' '))
  data.success = false
  data.statusCode = data.statusCode ?? 500
  if (reply && cfgWeb.dbColl.dataOnly) {
    each(keys(data), k => {
      const key = get(cfg, `responseKey.${k}`, k)
      if (k === 'details' && !isEmpty(data[k])) data[k] = JSON.stringify(data[k])
      reply.header(`X-${restapi}-${pascalCase(key)}`, data[k])
    })
  }
  reply.code(data.statusCode)
  const result = cfgWeb.dbColl.dataOnly ? { error: data.message } : data
  return reformat.call(this, { data: result, req, reply, options })
}

function returnSuccess ({ data, req, reply, options = {} }) {
  const { getConfig, pascalCase } = this.bajo.helper
  const { each, keys, omit, get } = this.bajo.helper._
  const cfg = getConfig('bajoWebRestapi', { full: true })
  const cfgWeb = getConfig('bajoWeb')
  const restapi = pascalCase(cfg.alias)
  if (reply) {
    reply.code(req.method.toUpperCase() === 'POST' ? 201 : 200)
    if (cfgWeb.dbColl.dataOnly) {
      each(keys(omit(data, ['data'])), k => {
        const key = get(cfg, `responseKey.${k}`, k)
        reply.header(`X-${restapi}-${pascalCase(key)}`, data[k])
      })
      return data.data
    }
  }
  return reformat.call(this, { data, req, reply, options })
}

function transformResult ({ data, req, reply, options = {} }) {
  const isError = data instanceof Error
  if (isError) return returnError.call(this, { data, req, reply, options })
  return returnSuccess.call(this, { data, req, reply, options })
}

export default transformResult
