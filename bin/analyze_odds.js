const path = require('path')

const jsonfile = require('jsonfile')
const espn = require('espnff')
const async = require('async')
const moment = require('moment')
const request = require('request')

const config = require('../config')
const format_player = require('../lib/player')

const current_week = moment().diff(config.week_one, 'weeks')
const data_path = path.resolve(__dirname, `../data/odds_analysis_${current_week}.json`)

let odds_data
try {
  odds_data = jsonfile.readFileSync(data_path)
} catch(err) {
  console.log(err)
  odds_data = []
}

const getHistory = function(team_id) {
  if (!odds_data.odds || !odds_data.odds.length)
    return {
      probability: [],
      score: [],
      projected: []
    }

  let matchups = odds_data.odds

  for(let i=0; i<matchups.length; i++) {
    let matchup = matchups[i]

    for (let t=0; t<matchup.length; t++) {
      let team = matchup[t]
      if (team.id === team_id)
	    return team.history
    }
  }
}

const getPlayers = function(cb) {
  request({
    url: 'https://api.fantasymath.com/players/',
    json: true
  }, function(err, res, data) {
    cb(err, data)
  })
}

async.parallel({
  players: getPlayers,
  standings: espn.standings.get.bind(null, config.espn),
  schedule: espn.schedule.getByLeague.bind(null, config.espn)
}, function(err, result) {
  if (err)
    return console.log(err)

  const current_matchups = result.schedule[current_week]

  let home_ids = current_matchups.map(function(m) {
    return m.home_id
  })

  async.mapLimit(home_ids, 2, function(home_id, next) {
    espn.boxscore.get({
      teamId: home_id,
      scoringPeriodId: current_week,
      ...config.espn
    }, next)
  }, function(err, boxscores) {
    if (err)
      return console.log(err)

    async.mapLimit(boxscores, 2, function(boxscore, next) {
      let teams = []
      boxscore.forEach(function(team) {
	    let item = {
	      pts: team.score,
	      values: []
	    }

	    team.players.forEach(function(player) {
	      if (!isNaN(player.points)) {
	        //TODO: get previous prediction
	        //TODO: calculate projection based on time remaining for player
	        //TODO: add to spread
	        return
	      }

	      let name = format_player.get(player.name)

	      let found = false
	      for (let i=0;i<result.players.length;i++) {
	        if (result.players[i].value === name) {
	          found = true
	          break
	        }
	      }

	      if (!found)
	        console.log(`could not find ${name}`)
	      else
	        item.values.push(name)
	    })

	    teams.push(item)
      })

      let params = [
	    'scoring=non_ppr',
	    'qb=pass4',
	    'dst=mfl',
        'monday=True',
	    'pts1=' + teams[0].pts,
	    'pts2=' + teams[1].pts
      ]

      if (teams[0].values.length) {
	    teams[0].values.forEach(v => params.push(`team1=${v}`))
      }

      if (teams[1].values.length) {
        teams[1].values.forEach(v => params.push(`team2=${v}`))
      }

      const url = 'https://api.fantasymath.com/v2/matchup-monday/?' + params.join('&')

      if (!teams[0].values.length && teams[0].pts < teams[1].pts)
	    return next(null, {
	      team1: { prob: 0 },
	      team2: { prob: 1 }
	    })

      if (!teams[1].values.length && teams[1].pts < teams[0].pts)
	    return next(null, {
	      team1: { prob: 1 },
	      team2: { prob: 0 }
	    })

      request({
	    url: url,
	    json: true
      }, function(err, res, json) {
	    next(err, json)
      })
    }, function(err, predictions) {
      if (err)
	    return console.log(err)

      let data = {
	    odds: []
      }

      predictions.forEach(function(prediction, index) {

	    let teams = boxscores[index]
	    const team1_id = teams[0].id
	    const team2_id = teams[1].id

	    const analyze = function({ hist, prob, mean }, team) {
	      let teams = result.standings
	      for (let i=0;i<teams.length;i++) {
	        if (teams[i].team_id === team.id) {
	          teams[i].projected_wins = teams[i].wins
	          teams[i].projected_losses = teams[i].losses
	          teams[i].projected_ties = teams[i].ties
	          team.probability = prob
	          team.history = getHistory(teams[i].team_id)

	          const now = moment().format()

              team.histogram = hist
              team.mean = mean || team.projection

	          team.history.probability.push({
		        value: prob,
		        date: now
	          })

	          team.history.projected.push({
		        value: team.projection,
		        date: now
	          })

	          team.history.score.push({
		        value: team.score,
		        date: now
	          })

	          if (prob > .5) {
		        teams[i].projected_wins += 1
	          } else {
		        teams[i].projected_losses += 1
	          }

	          teams[i].projected_points_for = teams[i].points_for + team.projection
	          break
	        }
	      }
	    }

	    analyze(prediction.teams ? prediction.teams[0] : { prob: prediction.team1.prob }, teams[0])
	    analyze(prediction.teams ? prediction.teams[1] : { prob: prediction.team2.prob }, teams[1])

	    data.odds.push(teams)
      })

      data.standings = result.standings

      jsonfile.writeFileSync(data_path, data, {spaces: 4})
    })
  })
})
