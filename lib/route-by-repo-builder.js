import path from 'path'
import serveRoute from './serve-route.js'

async function routeByRepoBuilder ({ file, childCtx, dir, pathPrefix, plugin }) {
  const { getPlugin } = this.bajo.helper
  await getPlugin('bajoDb') // ensure bajoDb is loaded
  const { importPkg, readConfig, getConfig } = this.bajo.helper
  const { methodMap } = this.bajoWebRestapi.helper
  const { getInfo } = this.bajoDb.helper
  const { camelCase, omit, merge, keys } = await importPkg('lodash-es')
  const builder = await readConfig(file, { ignoreError: true })
  const { schema } = await getInfo(builder.repo)
  const url = path.dirname(file).replace(`${dir}/${pathPrefix}`, '').replaceAll('@', ':')
  const methods = keys(methodMap)
  const cfg = getConfig('bajoWebRestapi')
  for (const method of methods) {
    if (schema.disabled.includes(method) || (builder.disabled || []).includes(method)) continue
    const mod = omit(builder, ['repo', 'url', 'method', 'handler', ...methods])
    const customMod = builder[method] || {}
    merge(mod, customMod, {
      url: ['get', 'update', 'remove'].includes(method) ? `${url}/:id` : url,
      method: methodMap[method],
      handler: async (req, res) => {
        const helper = this.bajoWebRestapi.helper[camelCase(`record ${method}`)]
        return await helper({ repo: builder.repo, req, res })
      }
    })
    await serveRoute.call(this, { mod, childCtx, plugin, cfg })
  }
}

export default routeByRepoBuilder
