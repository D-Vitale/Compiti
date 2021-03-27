const myFunction = (field, ship) => {
  const x = ship.x
  const y = ship.y
  if (ship.vertical) {
    for (let i = 0; i < ship.maxHp; i++) {
      if (!field[y + i] || !field[y + i][x] || field[y + i][x].ship) {
        return false
      }
    }
  } else {
    for (let i = 0; i < ship.maxHp; i++) {
      if (!field[y] || !field[y][x + i] || field[y][x + i].ship) {
        return false
      }
    }
  }
  return true
}

module.exports.fillField = (w, h, s, field, ships) => {
  let count = 0

  for (let y = 0; y < h; y++) {
    const row =  []
    for (let x = 0; x < w; x++) {
      row.push({
        team: null,
        x,
        y,
        ship: null,
        shipId: null,
        hit: false
      })
    }
    field.push(row)
  }

  while (count < s) {
    const x = Math.floor(Math.random() * w)
    const y = Math.floor(Math.random() * h)
    const maxHp = Math.floor(Math.random() * (6 - 2)) + 2
    const vertical = Math.random() < 0.5
    const ship = {
      id: count,
      x,
      y,
      vertical,
      maxHp,
      curHp: maxHp,
      alive: true,
      killer: null,
      killerId: null
    }

    if (myFunction(field, ship)) {
      ships.push(ship)
      for (let e = 0; e < ship.maxHp; e ++) {
        const x = ship.vertical ? ship.x : ship.x + e
        const y = ship.vertical ? ship.y + e : ship.y
        field[y][x].ship = ship
        field[y][x].shipId = count
      }
      count ++
    }
  }
}

module.exports.renderField = (field) => {
  return (`
  <table>
    <tbody>
      ${field.map(row => `<tr>${row.map(cell => `<td class="${cell.hit ? "hit " : ""}${cell.hit && cell.ship ? "ship " : ""}${cell.ship?.alive ? "" : "killed "}"></td>`).join("")}</tr>`).join("")}
    </tbody>
  </table>
`)
}

module.exports.getVisibleField = (field) => {
  return field.map(row => row.map(cell => (
    {
      team: cell.team,
      x: cell.x,
      y: cell.y,
      hit: cell.hit,
      ship: cell.hit ? cell.ship ? { id: cell.shipId, alive: cell.ship.alive, killer: cell.ship.killer } : null : null
    }
  )))
}