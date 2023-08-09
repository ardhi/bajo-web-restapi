async function serveRoute ({ mod, childCtx, plugin, cfg }) {
  const { importPkg, log, defaultsDeep } = this.bajo.helper
  const { camelCase, isString, pick } = await importPkg('lodash-es')
  mod.config = mod.config || {}
  mod.config.name = `${plugin}:${camelCase(mod.method + ' ' + mod.url)}`
  if (mod.method === 'PUT' && !cfg.patchDisabled) mod.method = [mod.method, 'PATCH']
  mod = defaultsDeep(pick(cfg, ['exposeHeadRoute', 'bodyLimit']), mod)
  await childCtx.route(mod)
  const prefix = cfg.prefix === '' ? '' : `/${cfg.prefix}`
  log.debug('Serving Rest API: %s (%s)', `${prefix}${mod.url}`, isString(mod.method) ? mod.method : mod.method.join(','))
}

export default serveRoute
