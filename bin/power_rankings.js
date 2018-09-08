const espn = require('espnff')
const path = require('path')
const jsonfile = require('jsonfile')
const machine = require('machine')
const gaussian = require('gaussian')
const moment = require('moment')

const config = require('../config')

let history
const data_path = path.resolve(__dirname, '../data/power_rankings.json')

const getTotalWins = (team) => team.wins + team.projected_wins
const getTotalLosses = (team) => team.losses + team.projected_losses
const getTotalPoints = (team) => team.points_for + team.projected_points

const testLineup = (lineup) => {
  if (!lineup.qb) {
    console.log('missing qb')
  }
  if (!lineup.rb1) {
    console.log('missing rb1')
  }
  if (!lineup.rb2) {
    console.log('missing rb2')
  }
  if (!lineup.wr1) {
    console.log('missing wr1')
  }
  if (!lineup.wr2) {
    console.log('missing wr2')
  }
  if (!lineup.te) {
    console.log('missing te')
  }
  if (!lineup.k) {
    console.log('missing k')
  }
  if (!lineup.flex) {
    console.log('missing flex')
  }
  /* if (!lineup.dst) {
   *   console.log('missing dst')
   * } */
}

const run = async () => {
  const teams = await espn.roster.get(config.espn.leagueId)
  const current_standings = await espn.standings.get(config.espn)
  const schedule = await espn.schedule.getByLeague(config.espn)

  let result = {}

  for (const team of current_standings) {
    team.projected_points = team.points_for
    team.projected_wins = team.wins
    team.projected_losses = team.losses
    team.projected_ties = team.ties
    team.simulated_playoff_appearances = 0
    team.simulated_first_round_bye = 0
    team.total_simulated_wins = 0
    team.total_simulated_losses = 0
    team.simulated_championship_win = 0
    team.matchups = {}
  }

  let standings = JSON.parse(JSON.stringify(current_standings))

  for (const week in schedule) {
    console.log(`Week ${week}`)

    const leagueId = config.pff
    const projections = await machine.projections.pff({ leagueId, weeks: week })
    result[week] = {}
    for (const teamId in teams) {
      const players = teams[teamId]
      result[week][teamId] = machine.utils.calculateLineup({ players, projections })
    }

    const matchups = schedule[week]
    if (!matchups.length) {
      continue
    }
    for (const matchup of matchups) {
      const home_team = standings.find(t => t.team_id === matchup.home_id)
      const away_team = standings.find(t => t.team_id === matchup.away_id)
      const home_lineup = matchup.home_lineup = result[week][matchup.home_id]
      const away_lineup = matchup.away_lineup = result[week][matchup.away_id]

      testLineup(home_lineup)
      testLineup(away_lineup)

      const distribution = gaussian(home_lineup.total, Math.pow(15, 2))
      matchup.away_team_probability = distribution.cdf(away_lineup.total)
      matchup.home_team_probability = (1 - matchup.away_team_probability)

      home_team.matchups[week] = matchup
      away_team.matchups[week] = matchup

      home_team.projected_points += home_lineup.total
      away_team.projected_points += away_lineup.total

      if (home_lineup.total === away_lineup.total) {
        home_team.projected_ties += 1
        away_team.projected_ties += 1
      } else if (home_lineup.total > away_lineup.total) {
        home_team.projected_wins += 1
        away_team.projected_losses += 1
      } else {
        home_team.projected_losses += 1
        away_team.projected_wins += 1
      }
    }
  }

  const number_of_simulations = 10000
  for (let i=0; i<number_of_simulations; i++) {
    // go through schedule - randomly set results
    let simulation_standings = JSON.parse(JSON.stringify(current_standings))
    for (const week in schedule) {
      const matchups = schedule[week]
      for (const matchup of matchups) {
        const random = Math.floor(Math.random() * 10) + 1
        const home_team = simulation_standings.find(t => t.team_id === matchup.home_id)
        const away_team = simulation_standings.find(t => t.team_id === matchup.away_id)
        if (random < (matchup.home_team_probability * 10)) {
          home_team.projected_wins += 1
          away_team.projected_losses += 1
        } else {
          away_team.projected_wins += 1
          home_team.projected_losses += 1
        }
      }
    }

    simulation_standings = simulation_standings.sort((a, b) => {
      const a_wins = getTotalWins(a)
      const b_wins = getTotalWins(b)
      const value = b_wins - a_wins
      if (value !== 0) {
        return value
      }

      const team_a = standings.find(t => t.team_id === a.team_id)
      const team_b = standings.find(t => t.team_id === b.team_id)

      const a_points = getTotalPoints(team_a)
      const b_points = getTotalPoints(team_b)

      return b_points - a_points
    })

    simulation_standings.forEach((simulated_team, index) => {
      const team = standings.find(t => t.team_id === simulated_team.team_id)
      if (index < 3) team.simulated_first_round_bye += 1
      if (index < 7) team.simulated_playoff_appearances += 1
      team.total_simulated_wins += getTotalWins(simulated_team)
      team.total_simulated_losses += getTotalLosses(simulated_team)
    })

    const getPlayoffGameWinner = (home, away, week) => {
      const distribution = gaussian(result[week][home.team_id].total, Math.pow(15, 2))
      const away_probability = distribution.cdf(result[week][away.team_id].total)
      const random = Math.floor(Math.random() * 10) + 1
      if (random < (away_probability * 10)) {
        return away
      } else {
        return home
      }
    }

    // week 14
    const seed_5 = simulation_standings.slice(4, 5)[0]
    const seed_4 = simulation_standings.slice(3, 4)[0]
    const game_one_winner = getPlayoffGameWinner(seed_4, seed_5, '14')

    const seed_3 = simulation_standings.slice(2, 3)[0]
    const seed_6 = simulation_standings.slice(5, 6)[0]
    const game_two_winner = getPlayoffGameWinner(seed_3, seed_6, '14')

    // week 15
    const seed_2 = simulation_standings.slice(1, 2)[0]
    const game_three_winner = getPlayoffGameWinner(seed_2, game_two_winner, '15')

    const seed_1 = simulation_standings.slice(0, 1)[0]
    const game_four_winner = getPlayoffGameWinner(seed_1, game_one_winner, '15')

    // championship
    const champion = getPlayoffGameWinner(game_three_winner, game_four_winner, '16')
    const champion_team = standings.find(t => t.team_id === champion.team_id)
    champion_team.simulated_championship_win += 1
  }

  try {
    history = jsonfile.readFileSync(data_path).history
  } catch (err) {
    console.log(err)
    history = {}
    standings.forEach((t) => {
      history[t.team_id] = []
    })
  }

  standings = standings.sort((a, b) => {
    return b.simulated_playoff_appearances - a.simulated_playoff_appearances
  })

  const now = moment().format()
  for (const team of standings) {
    team.playoff_odds = team.simulated_playoff_appearances / number_of_simulations
    team.championship_odds = team.simulated_championship_win / number_of_simulations
    team.first_round_bye_odds = team.simulated_first_round_bye / number_of_simulations
    team.total_points = getTotalPoints(team).toFixed(1)
    team.avg_simulated_wins = (team.total_simulated_wins / number_of_simulations).toFixed(2)
    team.avg_simulated_losses = (team.total_simulated_losses / number_of_simulations).toFixed(2)
    history[team.team_id].push({
      odds: team.playoff_odds,
      date: now
    })
  }

  jsonfile.writeFileSync(data_path, { standings, history }, {spaces: 4})
}

try {
  run()
} catch (e) {
  console.log(e)
}
