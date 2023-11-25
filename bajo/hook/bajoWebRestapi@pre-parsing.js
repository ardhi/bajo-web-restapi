const bajoWebRestapiPreHandler = {
  level: 9,
  handler: async function (ctx, req, reply) {
    const { getConfig, importModule, error } = this.bajo.helper
    const cfg = getConfig('bajoWebRestapi')
    const cfgWeb = getConfig('bajoWeb', { full: true })
    const attachI18N = await importModule(`${cfgWeb.dir.pkg}/lib/attach-i18n.js`)
    await attachI18N.call(this, cfg.i18n.detectors, req, reply)
    reply.header('Content-Language', req.lang)
    if (cfg.format.asExt) {
      if (!cfg.format.supported.includes(req.params.format)) {
        throw error('Unsupported format \'%s\'', req.params.format, { code: 406 })
      }
    }
  }
}

export default bajoWebRestapiPreHandler
