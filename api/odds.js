const express = require('express')
const async = require('async')
const request = require('request')
const moment = require('moment')
const espn = require('espnff')

const format_player = require('./player')

const week_one = moment('2017-08-29')
const current_week = moment().diff(week_one, 'weeks')

const router = express.Router()

const getPlayers = function(cb) {
  request({
    url: 'https://api.fantasymath.com/players/',
    json: true
  }, function(err, res, data) {
    cb(err, data)
  })
}



router.get('/', function(req, res) {
  async.parallel({
    players: getPlayers,
    standings: espn.standings.get.bind(null, {
      leagueId: 147002,
      seasonId: 2017
    }),
    schedule: espn.schedule.getByLeague.bind(null, {
      leagueId: 147002,
      seasonId: 2017
    })
  }, function(err, result) {
    if (err)
      return res.status(500).send({
	error: err
      })

    const current_matchups = result.schedule[current_week]

    let home_ids = current_matchups.map(function(m) {
      return m.home_id
    })

    async.mapLimit(home_ids, 2, function(home_id, next) {
      espn.boxscore.get({
	leagueId: 147002,
	teamId: home_id,
	scoringPeriodId: current_week,
	seasonId: 2017
      }, next)
    }, function(err, boxscores) {
      if (err)
	return res.status(500).send({
	  error: err
	})

      async.mapLimit(boxscores, 2, function(boxscore, next) {
	let teams = []
	boxscore.forEach(function(team) {
	  let item = {
	    pts: team.score,
	    values: []
	  }

	  team.players.forEach(function(player) {
	    if (!isNaN(player.points))
	      return

	    let name = format_player.get(player.name)

	    let found = false
	    for (let i=0;i<result.players.length;i++) {
	      if (result.players[i].value === name) {
		found = true
		break
	      }
	    }

	    if (!found)
	      console.log(`${name}`)
	    else
	      item.values.push(name)
	  })

	  teams.push(item)
	})

	let params = [
	  'scoring=non_ppr',
	  'qb=pass4',
	  'dst=mfl',
	  'pts1=' + teams[0].pts,
	  'pts2=' + teams[1].pts
	]

	if (teams[0].values.length)
	  params.push('team1=' + teams[0].values.join(','))

	if (teams[1].values.length)
	  params.push('team2=' + teams[1].values.join(','))
	
	const url = 'https://api.fantasymath.com/matchup/?' + params.join('&')

	if (!teams[0].values.length && teams[0].pts < teams[1].pts)
	  return next(null, {
	    team1: { prob: 0 },
	    team2: { prob: 1 }
	  })

	if (!teams[1].values.length && teams[1].pts < teams[0].pts)
	  return next(null, {
	    team1: { prob: 0 },
	    team2: { prob: 1 }
	  })

	request({
	  url: url,
	  json: true
	}, function(err, res, json) {
	  next(err, json)
	})
      }, function(err, predictions) {
	if (err)
	  return res.status(500).send({
	    error: err
	  })

	let data = {
	  odds: []
	}

	predictions.forEach(function(prediction, index) {

	  const teams = boxscores[index]
	  const team1_id = teams[0].id
	  const team2_id = teams[1].id

	  const analyze = function(probability, team) {
	    const teams = result.standings
	    for (let i=0;i<teams.length;i++) {
	      if (teams[i].team_id === team.id) {

		teams[i].projected_wins = teams[i].wins
		teams[i].projected_losses = teams[i].losses
		teams[i].projected_ties = teams[i].ties

		if (probability > .5) {
		  teams[i].projected_wins += 1
		} else {
		  teams[i].projected_losses += 1
		}

		teams[i].projected_points_for = teams[i].points_for + team.projection
		break
	      }
	    }
	  }

	  analyze(prediction['team1'].prob, teams[0])
	  analyze(prediction['team2'].prob, teams[1])

	  data.odds.push({
	    teams: teams,
	    prediction: prediction
	  })
	})

	data.standings = result.standings

	res.status(200).send(data)
      })
    })
  })

})

module.exports = router
