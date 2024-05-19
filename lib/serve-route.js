async function serveRoute ({ mod, plugin, cfg, parent }) {
  const { defaultsDeep, getConfig, getPluginName } = this.bajo.helper
  const { mergeRouteHooks } = this.bajoWeb.helper
  const { pick } = this.bajo.helper._
  const cfgWeb = getConfig('bajoWeb', { full: true })
  mod.config = mod.config ?? {}
  mod.config.webApp = getPluginName()
  mod.config.plugin = parent ?? plugin
  mod.config.title = mod.title
  if (parent) mod.config.subRouteOf = plugin
  delete mod.title
  if (mod.method === 'PUT' && cfgWeb.dbColl.patchEnabled) mod.method = [mod.method, 'PATCH']
  mod = defaultsDeep(pick(cfg, ['exposeHeadRoute', 'bodyLimit']), mod)
  await mergeRouteHooks(mod, false)
  return mod
}

export default serveRoute
