async function serveRoute ({ mod, childCtx, plugin, cfg }) {
  const { importPkg, log, defaultsDeep } = this.bajo.helper
  const { routeDir } = this.bajoWeb.helper
  const { isString, pick } = await importPkg('lodash-es')
  mod.config = mod.config ?? {}
  mod.config.plugin = plugin
  if (mod.method === 'PUT' && cfg.dbRepo.patchEnabled) mod.method = [mod.method, 'PATCH']
  mod = defaultsDeep(pick(cfg, ['exposeHeadRoute', 'bodyLimit']), mod)
  log.trace('Serving Rest API: %s (%s)', `${routeDir(plugin, 'bajoWebRestapi')}${mod.url}`.replaceAll('///', '/').replaceAll('//', '/'),
    isString(mod.method) ? mod.method : mod.method.join(','))
  await childCtx.route(mod)
}

export default serveRoute
