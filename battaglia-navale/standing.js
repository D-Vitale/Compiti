module.exports.renderStanding = (standing) => {
  return (`
  <h1 class="headin">Standings</h1>
  <table>
    <tbody>
      <tr class="col">
        <th>#</th>
        <th>Team</th>
        <th>Score</th>
        <th>Kills</th>
        <th>Bullets</th>
      </tr>
      ${standing.map(e => `<tr class="${e.position <= 3 ? "wpos" : "pos"}">
      <td>${e.position}</td>
      <td>${e.team}</td>
      <td>${e.score}</td>
      <td>${e.shipsKilled}</td>
      <td>${e.bulletsFired}</td>
      </tr>`)}
    </tbody>
  </table>
  `)
}