import path from 'path'
import serveRoute from './serve-route.js'

async function routeByVerb ({ file, childCtx, dir, pathPrefix, plugin, prefix, appPrefix }) {
  const { importPkg, importModule, getConfig } = this.bajo.helper
  const { methodMap } = this.bajoWebRestapi.helper
  const { isFunction } = await importPkg('lodash-es')
  const cfg = getConfig('bajoWebRestapi')
  const me = this
  const url = path.dirname(file).replace(`${dir}/${pathPrefix}`, '').replaceAll('@', ':')
  const method = methodMap[path.basename(file, '.js')]
  let mod = await importModule(file)
  if (isFunction(mod)) mod = { handler: mod }
  mod.url = mod.url || url
  mod.method = method
  const oldHandler = mod.handler
  mod.handler = async function (req, reply) {
    return await oldHandler.call(me, this, req, reply)
  }
  await serveRoute.call(me, { mod, childCtx, plugin, cfg, prefix, appPrefix })
}

export default routeByVerb
