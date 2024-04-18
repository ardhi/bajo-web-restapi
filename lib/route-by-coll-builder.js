import path from 'path'
import serveRoute from './serve-route.js'

async function routeByCollBuilder ({ file, ctx, childCtx, dir, pathPrefix, plugin, prefix, appPrefix }) {
  const { getPlugin } = this.bajo.helper
  getPlugin('bajoDb') // ensure bajoDb is loaded
  const { readConfig, getConfig, parseObject, isSet } = this.bajo.helper
  const { docSchemaColl, transformResult } = this.bajoWebRestapi.helper
  const { methodMap, getParams } = this.bajoWeb.helper
  const { getInfo } = this.bajoDb.helper
  const { camelCase, omit, merge, keys } = this.bajo.helper._
  const builder = await readConfig(file, { ignoreError: true })
  const { schema } = getInfo(builder.coll)
  const url = path.dirname(file).replace(`${dir}/${pathPrefix}`, '').replaceAll('@', ':')
  const cfg = getConfig('bajoWebRestapi')
  const methods = keys(methodMap)
  if (cfg.enablePatch) methods.push('replace')
  const me = this
  for (const method of methods) {
    let disabled = schema.disabled.includes(method) || (builder.disabled ?? []).includes(method)
    if (method === 'replace' && (schema.disabled.includes('update') || (builder.disabled ?? []).includes('update'))) disabled = true
    if (disabled) continue
    const mod = omit(builder, ['coll', 'url', 'method', 'handler', 'hidden', ...methods])
    const customMod = builder[method] ?? {}
    customMod.schema = customMod.schema ?? await docSchemaColl({ coll: builder.coll, method, ctx, options: { hidden: builder.hidden } })
    let mapmethod = methodMap[method]
    if (cfg.enablePatch) {
      if (method === 'replace') mapmethod = 'PUT'
      else if (method === 'update') mapmethod = 'PATCH'
    }
    merge(mod, customMod, {
      url: ['get', 'update', 'replace', 'remove'].includes(method) ? `${url}/:id` : url,
      method: mapmethod,
      handler: async function (req, reply) {
        const helper = me.bajoWeb.helper[camelCase(`record ${method === 'replace' ? 'update' : method}`)]
        let { fields, count } = getParams(req)
        let rels = []
        const headers = parseObject(req.headers, true, true)
        if (isSet(headers['x-count'])) count = headers['x-count']
        if (isSet(headers['x-rels'])) rels = headers['x-rels']
        if (typeof rels === 'string' && !['*', 'all'].includes(rels)) rels = [rels]
        const options = { fields, count, rels }
        options.hidden = builder.hidden ?? []
        if (method === 'replace') options.partial = false
        const data = await helper({ coll: builder.coll, req, reply, ctx: this, options })
        data.success = true
        data.statusCode = method === 'create' ? 201 : 200
        if (method === 'find') options.forFind = true
        return transformResult({ data, req, reply, options })
      }
    })
    if (cfg.format.asExt) mod.url += '.:format'
    if (builder.schema === false) delete mod.schema
    await serveRoute.call(me, { mod, childCtx, plugin, cfg, prefix, appPrefix })
  }
}

export default routeByCollBuilder
