import path from 'path'
import serveRoute from './serve-route.js'

async function routeByVerb ({ file, ctx, appCtx, dir, pathPrefix, plugin, alias }) {
  const { importModule, getConfig, print, parseObject, isSet } = this.bajo.helper
  const { docSchemaDescription, transformResult } = this.bajoWebRestapi.helper
  const { methodMap, getParams } = this.bajoWeb.helper
  const { isFunction, merge } = this.bajo.helper._
  const cfg = getConfig('bajoWebRestapi')
  const me = this
  const url = path.dirname(file).replace(`${dir}/${pathPrefix}`, '')
    .replaceAll('@@', '*').replaceAll('@', ':')
  const action = path.basename(file, '.js')
  let method = methodMap[action]
  if (cfg.enablePatch) {
    if (action === 'update') method = 'PATCH'
    else if (action === 'replace') method = 'PUT'
  }
  let mod = await importModule(file)
  if (isFunction(mod)) {
    if (mod.length <= 1) mod = await mod.call(this, { ctx })
    else mod = { handler: mod }
  }
  mod.url = mod.url ?? url
  mod.method = method
  const defSchema = {
    description: docSchemaDescription(action),
    tags: [alias.toUpperCase()],
    response: {}
  }
  if (['create', 'update', 'replace'].includes(action)) {
    defSchema.response['4xx'] = {
      description: print.__('Document error response'),
      $ref: '4xxResp#'
    }
  }
  defSchema.response['5xx'] = {
    description: print.__('General error response'),
    $ref: '5xxResp#'
  }
  if (action === 'find') defSchema.querystring = { $ref: 'qsFilter#' }
  if (isFunction(mod.schema)) mod.schema = await mod.schema.call(this, appCtx, ctx)
  mod.schema = merge({}, defSchema, mod.schema ?? {})
  const oldHandler = mod.handler
  mod.handler = async function (req, reply) {
    let { fields, count } = getParams(req)
    let rels = []
    const headers = parseObject(req.headers, true, true)
    if (isSet(headers['x-count'])) count = headers['x-count']
    if (isSet(headers['x-rels'])) rels = headers['x-rels']
    if (typeof rels === 'string' && !['*', 'all'].includes(rels)) rels = [rels]
    const options = { fields, count, rels }
    if (method === 'find') options.forFind = true
    if (method === 'replace') options.partial = false
    const data = await oldHandler.call(me, this, req, reply, options)
    if (!data) return
    data.success = true
    data.statusCode = method === 'create' ? 201 : 200
    return transformResult({ data, req, reply, options })
  }
  mod.config = mod.config ?? {}
  mod.config.pathSrc = url
  return serveRoute.call(me, { mod, plugin, cfg })
}

export default routeByVerb
