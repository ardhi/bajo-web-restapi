import path from 'path'
import routeByRepoBuilder from '../lib/route-by-repo-builder.js'
import routeByVerb from '../lib/route-by-verb.js'

async function plugin () {
  const { getConfig, importPkg, eachPlugins } = this.bajo.helper
  const [fastGlob, bodyParser] = await importPkg('fast-glob', 'bajo-web:@fastify/formbody')
  const cfg = getConfig('bajoWebRestapi')
  const pathPrefix = 'bajoWebRestapi/route'
  const prefix = cfg.prefix
  await this.bajoWeb.instance.register(async (ctx) => {
    await ctx.register(bodyParser)
    await eachPlugins(async function ({ dir, alias, plugin }) {
      const pattern = [
        `${dir}/${pathPrefix}/**/{find,get,create,update,remove}.js`,
        `${dir}/${pathPrefix}/**/repo-builder.*`
      ]
      const files = await fastGlob(pattern)
      if (files.length === 0) return undefined
      await ctx.register(async (childCtx) => {
        const match = files.length === 1 && path.basename(files[0], path.extname(files[0])) === 'repo-builder'
        if (match) await routeByRepoBuilder.call(this, { file: files[0], childCtx, dir, pathPrefix, plugin })
        else await routeByVerb.call(this, { files, childCtx, dir, pathPrefix, plugin })
      }, { prefix: cfg.appAsRoute ? '' : alias })
    })
  }, { prefix })
}

export default plugin
