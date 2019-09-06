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
const weekStart = moment(config.week_one).add(current_week, 'weeks').format('YYYYMMDD')
const weekEnd = moment(config.week_one).add(current_week + 1, 'weeks').format('YYYYMMDD')

const run = async () => {
  const positions = ['qb', 'rb', 'wr', 'te', 'k', 'dst']
  const projection_data = {}
  for (const position of positions) {
    const data = await projections.fantasypros({ position })
    projection_data[position] = data
  }

  const data = await espn.boxscore.get({
    weekStart,
    weekEnd,
    scoringPeriodId: current_week,
    ...config.espn
  })
  const matchups = data.formatted.filter(m => m.week === current_week)

  const boxscores = matchups.map((m) => {
    let teams = []
    teams.push(m.home)
    teams.push(m.away)
    return teams
  })

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

      for (const player of team.starters) {
        let position = [normalizePosition(player.position)]
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
          console.warn(`could not find ${player.name}`)
        } else {
          team.ceiling += projection.ceiling
          team.floor += projection.floor
          team.fantasypros_projection += projection.points
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
  jsonfile.writeFileSync(data_path, { boxscores, updated_at: Date.now() }, {spaces: 4})
}

run().catch((err) => console.log(err))
