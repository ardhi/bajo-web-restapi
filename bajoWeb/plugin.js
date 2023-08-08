import path from 'path'

async function plugin () {
  const { getConfig, importPkg, eachPlugins, importModule } = this.bajo.helper
  const { methodMap } = this.bajoWebRestapi.helper
  const [fastGlob, bodyParser] = await importPkg('fast-glob', 'bajo-web:@fastify/formbody')
  const { isFunction } = await importPkg('lodash-es')
  const cfg = getConfig('bajoWebRestapi')
  const pathPrefix = 'bajoWebRestapi/route'
  const prefix = cfg.prefix
  await this.bajoWeb.instance.register(async (ctx) => {
    await ctx.register(bodyParser)
    await eachPlugins(async function ({ dir, alias }) {
      const pattern = `${dir}/${pathPrefix}/**/{find,get,create,update,remove}.js`
      const files = await fastGlob(pattern)
      if (files.length === 0) return undefined
      await ctx.register(async (childCtx) => {
        for (const f of files) {
          const url = path.dirname(f).replace(`${dir}/${pathPrefix}`, '').replaceAll('@', ':')
          const method = methodMap[path.basename(f, '.js')]
          let mod = await importModule(f)
          if (isFunction(mod)) mod = { handler: mod }
          mod.url = mod.url || url
          mod.method = method
          await childCtx.route(mod)
        }
      }, { prefix: cfg.appAsRoute ? '' : alias })
      console.log(files)
    })
  }, { prefix })
}

export default plugin
