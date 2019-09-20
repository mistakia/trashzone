const path = require('path')

const jsonfile = require('jsonfile')
const espn = require('espnff')
const async = require('async')
const moment = require('moment')
const request = require('request')

const config = require('../config')
const format_player = require('../lib/player')

const current_week = moment().diff(config.week_one, 'weeks')
const weekStart = moment(config.week_one).add(current_week, 'weeks').format('YYYYMMDD')
const weekEnd = moment(config.week_one).add(current_week + 1, 'weeks').format('YYYYMMDD')
const data_path = path.resolve(__dirname, `../data/odds_analysis_${current_week}.json`)

let odds_data
try {
  odds_data = jsonfile.readFileSync(data_path)
} catch(err) {
  console.log(err)
  odds_data = []
}

const getHistory = function(team_id) {
  if (!odds_data.odds || !odds_data.odds.length) {
    return {
      probability: [],
      score: [],
      projected: []
    }
  }

  let matchups = odds_data.odds

  for(let i=0; i<matchups.length; i++) {
    let matchup = matchups[i]

    if (matchup[0].id === team_id) {
      return matchup[0].history
    }

    if (matchup[1].id === team_id) {
      return matchup[1].history
    }
  }

  return {
    probability: [],
    score: [],
    projected: []
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
  league: espn.league.get.bind(null, config.espn),
  schedule: espn.schedule.get.bind(null, config.espn),
  boxscores: espn.boxscore.get.bind(null, {
    scoringPeriodId: current_week,
    weekStart,
    weekEnd,
    ...config.espn
  })
}, function(err, { boxscores, players, schedule, league }) {
  if (err)
    return console.log(err)

  const current_boxscores = boxscores.formatted.filter(b => b.week === current_week)

  async.mapLimit(current_boxscores, 2, function(boxscore, next) {
    let teams = []
    const addTeam = (team) => {
	  let item = {
        id: team.id,
	    pts: team.points,
	    values: []
	  }

	  team.starters.forEach(function(player) {
	    if (player.active) {
	      //TODO: get previous prediction
	      //TODO: calculate projection based on time remaining for player
	      //TODO: add to spread
	      return
	    }

	    let name = format_player.get(player.name)

	    let found = false
	    for (let i = 0; i < players.length; i++) {
	      if (players[i].value === name) {
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
    }

    addTeam(boxscore.home)
    addTeam(boxscore.away)

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
      if (prediction.errors && prediction.errors.length) {
        console.log(prediction.errors)
        return
      }

	  let boxscore = current_boxscores[index]

	  const analyze = function({ hist, prob, mean }, team) {
        let leagueTeam = league.formatted[team.id]
        const { abbrev, name } = leagueTeam
        team.abbrev = abbrev
        team.name = name
	    leagueTeam.projected_wins = leagueTeam.record.overall.wins
	    leagueTeam.projected_losses = leagueTeam.record.overall.losses
	    leagueTeam.projected_ties = leagueTeam.record.overall.ties
	    team.probability = prob
	    team.history = getHistory(leagueTeam.id)

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
		  leagueTeam.projected_wins += 1
	    } else {
		  leagueTeam.projected_losses += 1
	    }

	    leagueTeam.projected_points_for = leagueTeam.points + team.projection
	  }

	  analyze(prediction.teams ? prediction.teams[0] : { prob: prediction.team1.prob }, boxscore.home)
	  analyze(prediction.teams ? prediction.teams[1] : { prob: prediction.team2.prob }, boxscore.away)

	  data.odds.push([boxscore.home, boxscore.away])

      data.standings = league.formatted

    })

    jsonfile.writeFileSync(data_path, data, {spaces: 4})
  })
})
