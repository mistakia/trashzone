const machine = require('machine')
const moment = require('moment')
const espn = require('espnff')
const path = require('path')
const jsonfile = require('jsonfile')
const gaussian = require('gaussian')

const { projections } = machine
const { getPlayerName } = machine.utils

const config = require('../config')
const current_week = moment().diff(config.week_one, 'weeks')

const run = async () => {
  const positions = ['qb', 'rb', 'wr', 'te', 'k', 'dst']
  const projection_data = {}
  for (const position of positions) {
    const data = await projections.fantasypros({ position })
    projection_data[position] = data
  }

  const schedule = await espn.schedule.getByLeague(config.espn)

  const matchups = schedule[current_week]
  const home_ids = matchups.map(m => m.home_id)

  let boxscores = []
  for (const teamId of home_ids) {
    const boxscore = await espn.boxscore.get({
      scoringPeriodId: current_week,
      teamId,
      ...config.espn
    })
    boxscores.push(boxscore)
  }

  const defenseAlias = {
    'D/ST': 'dst',
  }
  const normalizePosition = (e) => (defenseAlias[e] || e).toLowerCase()

  const match = (a, b) => {
    return getPlayerName(a) === getPlayerName(b)
  }

  for (const boxscore of boxscores) {
    for (const team of boxscore) {

      team.ceiling = 0
      team.floor = 0
      team.fantasypros_projection = 0

      for (const player of team.players) {
        let position = [normalizePosition(player.position)]
        //console.log(position)
        if (position[0] === 'rb/wr') {
          position = ['rb', 'wr']
        }

        let found = false
        let projection

        for (const p of position) {
          projection = projection_data[p].find(p => match(p.name, player.name))
          if (projection) {
            found = true
            break
          }
        }

        if (!found) {
          console.warn(`could not find ${player.name}:${p}`)
        } else {
          team.ceiling += projection.ceiling
          team.floor += projection.floor
          team.fantasypros_projection += projection.points
          //console.log(projection)
        }
      }
    }
  }

  for (const boxscore of boxscores) {
    for (const team of boxscore) {
      const dev = (team.ceiling - team.fantasypros_projection) / 2
      team.distribution = gaussian(team.fantasypros_projection, Math.pow(dev, 2))
    }

    const distribution = boxscore[0].distribution.sub(boxscore[1].distribution)
    const probability = distribution.cdf(0)
    boxscore[0].probability = 1 - probability
    boxscore[1].probability = probability
  }

  const data_path = path.resolve(__dirname, '../data/weekly_odds.json')
  jsonfile.writeFileSync(data_path, boxscores, {spaces: 4})
}

run()
