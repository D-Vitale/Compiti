void(() => {
  const fieldElement = document.getElementById("field")
  const standingElement = document.getElementById("standing")
  if (fieldElement) {
    setInterval(async() => {
      const res = await fetch("getHtmlField")
      const fieldHtml = await res.text()
      fieldElement.innerHTML = fieldHtml
    }, 1000)
  }
  if (standingElement) {
    setInterval(async() => {
      const res = await fetch("getHtmlStanding")
      const standingHtml = await res.text()
      standingElement.innerHTML = standingHtml
    }, 1000)
  }
})()