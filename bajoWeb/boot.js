import path from 'path'
import decorate from '../lib/decorate.js'
import routeByCollBuilder from '../lib/route-by-coll-builder.js'
import routeByVerb from '../lib/route-by-verb.js'
import notFound from '../lib/not-found.js'
import error from '../lib/error.js'
import doc from '../lib/doc.js'
import handleResponse from '../lib/handle-response.js'

const routeActions = { routeByCollBuilder, routeByVerb }

function formatExt (item) {
  return item + '.:format'
}

const boot = {
  level: 10,
  handler: async function () {
    const { fastGlob, getConfig, importPkg, eachPlugins, importModule, runHook, log } = this.bajo.helper
    const { docSchemaGeneral } = this.bajoWebRestapi.helper
    const [bodyParser, accepts] = await importPkg('bajoWeb:@fastify/formbody', 'bajoWeb:@fastify/accepts')
    const cfg = getConfig('bajoWebRestapi')
    const pathPrefix = 'bajoWebRestapi/route'
    let prefix = cfg.prefix === '' ? '' : ('/' + cfg.prefix)
    if (cfg.i18n.detectors.includes('path')) prefix = `/:lang${prefix}`
    const routeHook = await importModule('bajoWeb:/lib/route-hook.js')
    const handleMultipart = await importModule('bajoWeb:/lib/handle-multipart-body.js')
    const handleXmlBody = await importModule('bajoWeb:/lib/handle-xml-body.js')
    const handleCors = await importModule('bajoWeb:/lib/handle-cors.js')
    const handleHelmet = await importModule('bajoWeb:/lib/handle-helmet.js')
    const handleCompress = await importModule('bajoWeb:/lib/handle-compress.js')
    const handleRateLimit = await importModule('bajoWeb:/lib/handle-rate-limit.js')
    const reroutedPath = await importModule('bajoWeb:/lib/rerouted-path.js')
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
        const appPrefix = '/' + (plugin === 'app' && cfg.mountAppAsRoot ? '' : alias)
        const pattern = [
          `${dir}/${pathPrefix}/**/{${actions.join(',')}}.js`,
          `${dir}/${pathPrefix}/**/coll-builder.*`
        ]
        const files = await fastGlob(pattern)
        if (files.length === 0) return undefined
        await ctx.register(async (appCtx) => {
          for (const file of files) {
            const base = path.basename(file, path.extname(file))
            const action = base === 'coll-builder' ? 'routeByCollBuilder' : 'routeByVerb'
            let mods = await routeActions[action].call(this, { file, appCtx, ctx, dir, pathPrefix, plugin, alias })
            if (!Array.isArray(mods)) mods = [mods]
            for (const mod of mods) {
              const fullPath = appPrefix === '/' ? mod.url : (appPrefix + mod.url)
              const isRouteDisabled = await importModule('bajoWeb:/lib/is-route-disabled.js')
              if (await isRouteDisabled.call(this, fullPath, mod.method, cfg.disabled)) {
                log.warn('Route %s (%s) is disabled', `${prefix}${fullPath}`, mod.method)
                continue
              }
              const rpath = await reroutedPath.call(this, fullPath, cfg.rerouted)
              if (cfg.format.asExt) mod.url = formatExt(mod.url)
              if (rpath) {
                mod.config.pathReroutedTo = rpath
                log.warn('Rerouted %s -> %s', `${prefix}${fullPath}`, `${prefix}${rpath}`)
                mod.url = cfg.format.asExt ? formatExt(rpath) : rpath
                await ctx.route(mod)
              } else await appCtx.route(mod)
            }
          }
        }, { prefix: appPrefix })
      })
      await runHook('bajoWebRestapi:afterCreateRoutes', ctx)
      await notFound.call(this, ctx)
    }, { prefix })
  }
}

export default boot
