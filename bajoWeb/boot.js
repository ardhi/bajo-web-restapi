import path from 'path'
import decorate from '../lib/decorate.js'
import routeByCollBuilder from '../lib/route-by-coll-builder.js'
import routeByVerb from '../lib/route-by-verb.js'
import notFound from '../lib/not-found.js'
import error from '../lib/error.js'
import doc from '../lib/doc.js'
import handleResponse from '../lib/handle-response.js'

const boot = {
  level: 10,
  handler: async function () {
    const { getConfig, importPkg, eachPlugins, importModule, runHook } = this.bajo.helper
    const { docSchemaGeneral } = this.bajoWebRestapi.helper
    const [fastGlob, bodyParser, accepts] = await importPkg('fast-glob',
      'bajoWeb:@fastify/formbody', 'bajoWeb:@fastify/accepts')
    const cfg = getConfig('bajoWebRestapi')
    const cfgWeb = getConfig('bajoWeb', { full: true })
    const pathPrefix = 'bajoWebRestapi/route'
    let prefix = cfg.prefix === '' ? '' : ('/' + cfg.prefix)
    if (cfg.i18n.detectors.includes('path')) prefix = `/:lang${prefix}`
    const routeHook = await importModule(`${cfgWeb.dir.pkg}/lib/route-hook.js`)
    const handleMultipart = await importModule(`${cfgWeb.dir.pkg}/lib/handle-multipart-body.js`)
    const handleXmlBody = await importModule(`${cfgWeb.dir.pkg}/lib/handle-xml-body.js`)
    const handleCors = await importModule(`${cfgWeb.dir.pkg}/lib/handle-cors.js`)
    const handleHelmet = await importModule(`${cfgWeb.dir.pkg}/lib/handle-helmet.js`)
    const handleCompress = await importModule(`${cfgWeb.dir.pkg}/lib/handle-compress.js`)
    const handleRateLimit = await importModule(`${cfgWeb.dir.pkg}/lib/handle-rate-limit.js`)
    await this.bajoWeb.instance.register(async (ctx) => {
      this.bajoWebRestapi.instance = ctx
      await runHook('bajoWebRestapi:afterCreateContext', ctx)
      await routeHook.call(this, 'bajoWebRestapi')
      await decorate.call(this, ctx)
      if (cfg.format.supported.includes('xml')) {
        await handleXmlBody.call(this, ctx, cfg.format.xml.bodyParser)
      }
      await ctx.register(accepts)
      await ctx.register(bodyParser)
      await handleRateLimit.call(this, ctx, cfg.rateLimit)
      await handleCors.call(this, ctx, cfg.cors)
      await handleHelmet.call(this, ctx, cfg.helmet)
      await handleMultipart.call(this, ctx, cfg.multipart)
      await handleCompress.call(this, ctx, cfg.compress)
      await handleResponse.call(this, ctx)
      await error.call(this, ctx)
      await docSchemaGeneral(ctx)
      if (cfg.doc.enabled) {
        await doc.call(this, ctx)
      }
      const actions = ['find', 'get', 'create', 'update', 'remove']
      if (cfg.enablePatch) actions.push('replace')
      await runHook('bajoWebRestapi:beforeCreateRoutes', ctx)
      await eachPlugins(async function ({ dir, alias, plugin }) {
        const appPrefix = plugin === 'app' && cfg.mountAppAsRoot ? '' : alias
        const pattern = [
          `${dir}/${pathPrefix}/**/{${actions.join(',')}}.js`,
          `${dir}/${pathPrefix}/**/coll-builder.*`
        ]
        const files = await fastGlob(pattern)
        if (files.length === 0) return undefined
        await ctx.register(async (childCtx) => {
          for (const file of files) {
            const base = path.basename(file, path.extname(file))
            if (base === 'coll-builder') await routeByCollBuilder.call(this, { file, ctx, childCtx, dir, pathPrefix, plugin, alias, prefix, appPrefix })
            else await routeByVerb.call(this, { file, ctx, childCtx, dir, pathPrefix, plugin, alias, prefix, appPrefix })
          }
        }, { prefix: appPrefix })
      })
      await runHook('bajoWebRestapi:afterCreateRoutes', ctx)
      await notFound.call(this, ctx)
    }, { prefix })
  }
}

export default boot
