import path from 'path'
import serveRoute from './serve-route.js'

async function routeByCollBuilder ({ file, ctx, childCtx, dir, pathPrefix, plugin }) {
  const { getPlugin } = this.bajo.helper
  getPlugin('bajoDb') // ensure bajoDb is loaded
  const { importPkg, readConfig, getConfig } = this.bajo.helper
  const { docSchemaColl, transformResult } = this.bajoWebRestapi.helper
  const { methodMap, getParams } = this.bajoWeb.helper
  const { getInfo } = this.bajoDb.helper
  const { camelCase, omit, merge, keys } = await importPkg('lodash-es')
  const builder = await readConfig(file, { ignoreError: true })
  const { schema } = await getInfo(builder.coll)
  const url = path.dirname(file).replace(`${dir}/${pathPrefix}`, '').replaceAll('@', ':')
  const cfg = getConfig('bajoWebRestapi')
  const methods = keys(methodMap)
  if (cfg.enablePatch) methods.push('replace')
  const me = this
  for (const method of methods) {
    let disabled = schema.disabled.includes(method) || (builder.disabled ?? []).includes(method)
    if (method === 'replace' && (schema.disabled.includes('update') || (builder.disabled ?? []).includes('update'))) disabled = true
    if (disabled) continue
    const mod = omit(builder, ['coll', 'url', 'method', 'handler', ...methods])
    const customMod = builder[method] ?? {}
    customMod.schema = await docSchemaColl({ coll: builder.coll, method, ctx })
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
        const params = await getParams(req)
        const { fields, dataOnly } = params
        const options = { fields, dataOnly }
        if (method === 'replace') options.partial = false
        const data = await helper({ coll: builder.coll, req, reply, ctx: this, options })
        data.success = true
        data.statusCode = method === 'create' ? 201 : 200
        if (method === 'find') options.forFind = true
        return await transformResult({ data, req, reply, options })
      }
    })
    if (cfg.format.asExt) mod.url += '.:format'
    await serveRoute.call(me, { mod, childCtx, plugin, cfg })
  }
}

export default routeByCollBuilder
