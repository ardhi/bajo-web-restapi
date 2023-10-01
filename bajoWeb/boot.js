import path from 'path'
import decorate from '../lib/decorate.js'
import routeByRepoBuilder from '../lib/route-by-repo-builder.js'
import routeByVerb from '../lib/route-by-verb.js'
import notFound from '../lib/not-found.js'
import error from '../lib/error.js'
import doc from '../lib/doc.js'

const boot = {
  level: 10,
  handler: async function () {
    const { getConfig, importPkg, eachPlugins, importModule, runHook } = this.bajo.helper
    const { docSchemaGeneral } = this.bajoWebRestapi.helper
    const [fastGlob, bodyParser] = await importPkg('fast-glob', 'bajo-web:@fastify/formbody')
    const cfg = getConfig('bajoWebRestapi')
    const cfgWeb = getConfig('bajoWeb', { full: true })
    const pathPrefix = 'bajoWebRestapi/route'
    let prefix = cfg.prefix === '' ? '' : ('/' + cfg.prefix)
    if (cfg.i18n.detectors.includes('path')) prefix = `/:lang${prefix}`
    const routeHook = await importModule(`${cfgWeb.dir.pkg}/lib/route-hook.js`)
    const handleMultipart = await importModule(`${cfgWeb.dir.pkg}/lib/handle-multipart-body.js`)
    await this.bajoWeb.instance.register(async (ctx) => {
      this.bajoWebRestapi.instance = ctx
      await runHook('bajoWebRestapi:afterCreateContext', ctx)
      await routeHook.call(this, 'bajoWebRestapi')
      await decorate.call(this, ctx)
      await ctx.register(bodyParser)
      await handleMultipart.call(this, ctx, cfg.multipart)
      await error.call(this, ctx)
      await docSchemaGeneral(ctx)
      if (cfg.doc.enabled) {
        await doc.call(this, ctx)
      }
      await eachPlugins(async function ({ dir, alias, plugin }) {
        const appPrefix = plugin === 'app' && cfg.mountAppAsRoot ? '' : alias
        const pattern = [
          `${dir}/${pathPrefix}/**/{find,get,create,update,remove}.js`,
          `${dir}/${pathPrefix}/**/repo-builder.*`
        ]
        const files = await fastGlob(pattern)
        if (files.length === 0) return undefined
        await ctx.register(async (childCtx) => {
          for (const file of files) {
            const base = path.basename(file, path.extname(file))
            if (base === 'repo-builder') await routeByRepoBuilder.call(this, { file, ctx, childCtx, dir, pathPrefix, plugin, alias, prefix, appPrefix })
            else await routeByVerb.call(this, { file, ctx, childCtx, dir, pathPrefix, plugin, alias, prefix, appPrefix })
          }
        }, { prefix: appPrefix })
      })
      await notFound.call(this, ctx)
    }, { prefix })
  }
}

export default boot
