const bajoWebMpaPreHandler = {
  level: 10,
  handler: async function (ctx, req, reply) {
    const { getConfig, importModule } = this.bajo.helper
    const cfg = getConfig('bajoWeb', { full: true })
    const attachI18N = await importModule(`${cfg.dir}/lib/attach-i18n.js`)
    await attachI18N.call(this, ctx, req, reply)
  }
}

export default bajoWebMpaPreHandler
