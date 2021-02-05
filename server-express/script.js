module.exports = function (obj, html) {
  const regex = /\{([^}]+)\}/g
  const element = [...html.matchAll(regex)] // [["{e}", "e", index, input, group]]
  const values = element.map(e => {
    const value = obj[e[1]]
    return (
      { key : e[1], value }
    )
  })
  values.forEach(e => {
    return html = html.replace(`{${e.key}}`, e.value)
  })
  return html
}