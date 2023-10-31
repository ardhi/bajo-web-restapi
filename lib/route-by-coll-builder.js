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
  const methods = keys(methodMap)
  const cfg = getConfig('bajoWebRestapi')
  const me = this
  for (const method of methods) {
    if (schema.disabled.includes(method) || (builder.disabled ?? []).includes(method)) continue
    const mod = omit(builder, ['coll', 'url', 'method', 'handler', ...methods])
    const customMod = builder[method] ?? {}
    customMod.schema = await docSchemaColl({ coll: builder.coll, method, ctx })
    merge(mod, customMod, {
      url: ['get', 'update', 'remove'].includes(method) ? `${url}/:id` : url,
      method: methodMap[method],
      handler: async function (req, reply) {
        const helper = me.bajoWeb.helper[camelCase(`record ${method}`)]
        const data = await helper({ coll: builder.coll, req, reply, ctx: this })
        data.success = true
        data.statusCode = 200
        const params = await getParams(req)
        const { fields, dataOnly } = params
        const options = { fields, dataOnly }
        if (method === 'find') options.forFind = true
        return await transformResult({ data, req, reply, options })
      }
    })
    await serveRoute.call(me, { mod, childCtx, plugin, cfg })
  }
}

export default routeByCollBuilder