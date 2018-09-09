const espn = require('espnff')
const path = require('path')
const jsonfile = require('jsonfile')
const machine = require('machine')
const gaussian = require('gaussian')
const moment = require('moment')

const config = require('../config')
const current_week = moment().diff(config.week_one, 'weeks')

let history
const data_path = path.resolve(__dirname, '../data/power_rankings.json')
const { leagueId } = config.pff

const run = async () => {
  const teams = await espn.roster.get(config.espn.leagueId)
  const standings = await espn.standings.get(config.espn)
  const schedule = await espn.schedule.getByLeague(config.espn)
  const results = await machine.simulateSeason({
    current_week,
    leagueId,
    teams,
    standings,
    schedule
  })

  let history
  try {
    history = jsonfile.readFileSync(data_path).history
  } catch (err) {
    console.log(err)
    history = {}
    results.forEach((t) => history[t.team_id] = [])
  }

  const now = moment().format()
  for (const team of results) {
    history[team.team_id].push({
      playoff: team.playoff_odds,
      first_round_bye: team.first_round_bye_odds,
      championship: team.championship_odds,
      date: now
    })
  }

  jsonfile.writeFileSync(data_path, { standings: results, history }, {spaces: 4})
}

try {
  run()
} catch (e) {
  console.log(e)
}
