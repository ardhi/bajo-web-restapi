async function serveRoute ({ mod, childCtx, plugin, cfg, prefix, appPrefix }) {
  const { importPkg, log, defaultsDeep } = this.bajo.helper
  const { camelCase, isString, pick } = await importPkg('lodash-es')
  mod.config = mod.config || {}
  mod.config.name = `${plugin}:${camelCase(mod.method + ' ' + mod.url)}`
  if (mod.method === 'PUT' && cfg.dbRepo.patchEnabled) mod.method = [mod.method, 'PATCH']
  mod = defaultsDeep(pick(cfg, ['exposeHeadRoute', 'bodyLimit']), mod)
  log.trace('Serving Rest API: %s (%s)', `/${prefix}/${appPrefix}${mod.url}`.replaceAll('///', '/').replaceAll('//', '/'),
    isString(mod.method) ? mod.method : mod.method.join(','))
  await childCtx.route(mod)
}

export default serveRoute
