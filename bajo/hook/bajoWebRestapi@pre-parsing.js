const bajoWebRestapiPreHandler = {
  level: 9,
  handler: async function (ctx, req, reply) {
    const { getConfig, importModule } = this.bajo.helper
    const cfg = getConfig('bajoWebRestapi')
    const cfgWeb = getConfig('bajoWeb', { full: true })
    const attachI18N = await importModule(`${cfgWeb.dir}/lib/attach-i18n.js`)
    await attachI18N.call(this, cfg.i18n.detectors, req, reply)
    reply.header('Content-Language', req.lang)
  }
}

export default bajoWebRestapiPreHandler
