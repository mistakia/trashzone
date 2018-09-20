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
  let transactions
  try {
    const data = jsonfile.readFileSync(data_path)
    history = data.history
    transactions = data.transactions
  } catch (err) {
    console.log(err)
  }

  if (!history) {
    history = {}
    results.forEach((t) => history[t.team_id] = [])
  }

  if (!transactions) {
    transactions = {}
    results.forEach((t) => transactions[t.team_id] = {})
  }

  const trades = await espn.activity.get({
    activityType: 2,
    teamId: -1,
    tranType: 4,
    ...config.espn
  })
  trades.forEach((t) => {
    if (!t.type.includes('Upheld')) {
      return
    }

    t.teams.forEach((teamId) => transactions[teamId][t.date] = t)
  })
  const adds = await espn.activity.get({
    activityType: 2,
    teamId: -1,
    tranType: 2,
    ...config.espn
  })
  adds.forEach((t) => {
    if (t.type.includes('Waivers')) {
      return
    }

    t.teams.forEach((teamId) => transactions[teamId][t.date] = t)
  })

  const now = moment().format()
  for (const team of results) {
    history[team.team_id].push({
      playoff: team.playoff_odds,
      first_round_bye: team.first_round_bye_odds,
      championship: team.championship_odds,
      date: now
    })
  }

  jsonfile.writeFileSync(data_path, { standings: results, history, transactions }, {spaces: 4})
}

run().catch((err) => console.log(err))
