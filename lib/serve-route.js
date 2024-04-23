async function serveRoute ({ mod, childCtx, plugin, cfg, parent, prefix, appPrefix }) {
  const { log, defaultsDeep, getConfig, importModule, getPluginName } = this.bajo.helper
  const { routeDir, mergeRouteHooks } = this.bajoWeb.helper
  const { isString, pick, isEmpty } = this.bajo.helper._
  const cfgWeb = getConfig('bajoWeb', { full: true })
  const isRouteDisabled = await importModule(`${cfgWeb.dir.pkg}/lib/is-route-disabled.js`)
  const url = (isEmpty(appPrefix) ? '' : `/${appPrefix}`) + mod.url
  if (await isRouteDisabled.call(this, url, mod.method, cfg.disabled)) {
    log.warn('Route %s (%s) is disabled', mod.url, mod.method)
    return
  }
  const lang = cfg.i18n.detectors.includes('path') ? '/:lang' : ''
  mod.config = mod.config ?? {}
  mod.config.webApp = getPluginName()
  mod.config.plugin = parent ?? plugin
  mod.config.title = mod.title
  if (parent) mod.config.subRouteOf = plugin
  delete mod.title
  if (mod.method === 'PUT' && cfgWeb.dbColl.patchEnabled) mod.method = [mod.method, 'PATCH']
  mod = defaultsDeep(pick(cfg, ['exposeHeadRoute', 'bodyLimit']), mod)
  await mergeRouteHooks(mod, false)
  log.trace('Serving Rest API: %s (%s)', `${lang}${routeDir(plugin, 'bajoWebRestapi')}${mod.url}`.replaceAll('///', '/').replaceAll('//', '/'),
    isString(mod.method) ? mod.method : mod.method.join(','))
  await childCtx.route(mod)
}

export default serveRoute
