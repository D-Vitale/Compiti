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
      killer: null
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