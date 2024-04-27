const bajoWebRestapiPreHandler = {
  level: 9,
  handler: async function (ctx, req, reply) {
    const { getConfig, importModule, error } = this.bajo.helper
    const cfg = getConfig('bajoWebRestapi')
    const attachI18N = await importModule('bajoWeb:/lib/attach-i18n.js')
    await attachI18N.call(this, cfg.i18n.detectors, req, reply)
    reply.header('Content-Language', req.lang)
    if (cfg.format.asExt && req.params.format) {
      if (!cfg.format.supported.includes(req.params.format)) {
        throw error('Unsupported format \'%s\'', req.params.format, { statusCode: 406 })
      }
    }
  }
}

export default bajoWebRestapiPreHandler
