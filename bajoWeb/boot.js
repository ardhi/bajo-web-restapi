import path from 'path'
import routeByRepoBuilder from '../lib/route-by-repo-builder.js'
import routeByVerb from '../lib/route-by-verb.js'
import notFound from '../lib/not-found.js'
import error from '../lib/error.js'

async function boot () {
  const { getConfig, importPkg, eachPlugins } = this.bajo.helper
  const [fastGlob, bodyParser] = await importPkg('fast-glob', 'bajo-web:@fastify/formbody')
  const cfg = getConfig('bajoWebRestapi')
  const pathPrefix = 'bajoWebRestapi/route'
  const prefix = cfg.prefix
  await this.bajoWeb.instance.register(async (ctx) => {
    await ctx.register(bodyParser)
    await error.call(this, ctx)
    await eachPlugins(async function ({ dir, alias, plugin }) {
      const appPrefix = cfg.mountAppAsRoot ? '' : alias
      const pattern = [
        `${dir}/${pathPrefix}/**/{find,get,create,update,remove}.js`,
        `${dir}/${pathPrefix}/**/repo-builder.*`
      ]
      const files = await fastGlob(pattern)
      if (files.length === 0) return undefined
      await ctx.register(async (childCtx) => {
        for (const file of files) {
          const base = path.basename(file, path.extname(file))
          if (base === 'repo-builder') await routeByRepoBuilder.call(this, { file, childCtx, dir, pathPrefix, plugin, prefix, appPrefix })
          else await routeByVerb.call(this, { file, childCtx, dir, pathPrefix, plugin, prefix, appPrefix })
        }
      }, { prefix: appPrefix })
    })
    await notFound.call(this, ctx)
  }, { prefix })
}

export default boot
