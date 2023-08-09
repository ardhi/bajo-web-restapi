import path from 'path'
import serveRoute from './serve-route.js'

async function routeByVerb ({ files, childCtx, dir, pathPrefix, plugin }) {
  const { importPkg, importModule, getConfig } = this.bajo.helper
  const { methodMap } = this.bajoWebRestapi.helper
  const { isFunction } = await importPkg('lodash-es')
  const cfg = getConfig('bajoWebRestapi')
  for (const f of files) {
    const url = path.dirname(f).replace(`${dir}/${pathPrefix}`, '').replaceAll('@', ':')
    const method = methodMap[path.basename(f, '.js')]
    let mod = await importModule(f)
    if (isFunction(mod)) mod = { handler: mod }
    mod.url = mod.url || url
    mod.method = method
    if (method === 'PUT' && !cfg.patchDisabled) mod.method = [method, 'PATCH']
    const oldHandler = mod.handler
    mod.handler = async (req, res) => {
      return await oldHandler.call(this, req, res)
    }
    await serveRoute.call(this, { mod, childCtx, plugin, cfg })
  }
}

export default routeByVerb
