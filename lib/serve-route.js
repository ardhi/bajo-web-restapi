async function serveRoute ({ mod, childCtx, plugin, cfg }) {
  const { importPkg, log, defaultsDeep, getConfig } = this.bajo.helper
  const { routeDir } = this.bajoWeb.helper
  const { isString, pick } = await importPkg('lodash-es')
  const cfgWeb = getConfig('bajoWeb')
  const lang = cfg.i18nDetectors.includes('path') ? '/:lang' : ''
  mod.config = mod.config ?? {}
  mod.config.plugin = plugin
  if (mod.method === 'PUT' && cfgWeb.dbRepo.patchEnabled) mod.method = [mod.method, 'PATCH']
  mod = defaultsDeep(pick(cfg, ['exposeHeadRoute', 'bodyLimit']), mod)
  log.trace('Serving Rest API: %s (%s)', `${lang}${routeDir(plugin, 'bajoWebRestapi')}${mod.url}`.replaceAll('///', '/').replaceAll('//', '/'),
    isString(mod.method) ? mod.method : mod.method.join(','))
  await childCtx.route(mod)
}

export default serveRoute
