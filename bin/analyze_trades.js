const util = require('util')

const async = require('async')
const espnff = require('espnff')
const moment = require('moment')
const _ = require('lodash')

const week_one = moment('2017-08-30', 'YYYY-MM-DD')
const current_week = moment().diff(week_one, 'weeks')

const getPlayerInfo = function(player_name, cb) {
  espnff.player.find({
    leagueId: 147002,
    slotCategoryId: -1,
    search: player_name,
    seasonId: 2017
  }, function(err, result0) {
    if (err)
      return cb(err)

    espnff.player.info({
      leagueId: 147002,
      playerId: result0.id,
      seasonId: 2017
    }, function(err, result1) {
      if (err)
	return cb(err)

      result = Object.assign({}, result0, result1)

      cb(null, result)
    })    
  })
}

const getTeamInfo = function(opts, cb) {
  let week = opts.week
  let boxscores = {
    teamId: opts.id,
    weeks: {}
  }
  async.doWhilst(function(next) {
    espnff.boxscore.get({
      leagueId: 147002,
      teamId: opts.id,
      scoringPeriodId: week
    }, function(err, boxscore) {
      next(err)
      boxscores.weeks[week] = boxscore
    })
  }, function() {
    week += 1
    return week < current_week
  }, function(err) {
    cb(err, boxscores)
  })
}
  
espnff.activity.get({
  leagueId:147002,
  seasonId:2017,
  activityType:2,
  startDate: '20170717',
  endDate: moment().format('YYYYMMDD'),
  teamId:-1,
  tranType:4
}, function(err, items) {
  if (err)
    return console.log(err)

  let trades = []
  let players = []
  let teams = []

  items.forEach(function(item) {
    if (item.type.includes('Upheld') || item.type.includes('Processed')) {

      let date = moment(item.date, 'ddd, MMM D H:mm A')

      let trade = {
	teams: {},
	date: date.format(),
	week: date.diff(week_one, 'weeks')
      }

      let firstTeam = null
      item.detail.forEach(function(detail) {
	if (!firstTeam)
	  firstTeam = detail.team

	let teamIndex = detail.team === firstTeam ? 0 : 1
	let teamId = item.teams[teamIndex]

	if (!trade.teams[teamId])
	  trade.teams[teamId] = {
	    traded: [],
	    abbrev: detail.team
	  }

	let player = detail.player.replace('*', '')
	trade.teams[teamId].traded.push(player)
	players.push(player)
      })
      
      item.teams.forEach(function(teamId) {
	if (!_.find(teams, { 'id': teamId }))
	  teams.push({
	    id: teamId,
	    week: trade.week
	  })
      })
      
      trades.push(trade)
    }
  })

  async.parallel({
    players: async.mapLimit.bind(null, players, 2, getPlayerInfo),
    boxscores: async.mapLimit.bind(null, teams, 2, getTeamInfo)
  }, function(err, results) {
    if (err)
      return console.log(err)

    //console.log(util.inspect(results, false, null))

    trades.forEach(function(trade) {
      Object.keys(trade.teams).forEach(function(teamId) {
	let traded_players = trade.teams[teamId].traded
	trade.teams[teamId].traded = traded_players.map(function(player_name) {
	  let p = _.find(results.players, { name: player_name })
	  p.points_since_trade = 0

	  let total_weeks = 0
	  Object.keys(p.weeks).forEach(function(week) {
	    if (isNaN(p.weeks[week]))
	      return
	    
	    if (parseInt(week, 10) > trade.week) {
	      total_weeks += 1
	      p.points_since_trade += p.weeks[week]
	    }
	  })

	  //console.log(`Total Weeks: ${total_weeks}`)

	  p.points_avg_since_trade = p.points_since_trade / total_weeks

	  return p
	})

	let boxscores = _.find(results.boxscores, { 'teamId': parseInt(teamId, 10) })

	Object.keys(boxscores.weeks).forEach(function(week) {
	  let boxscore = boxscores.weeks[week]
	  console.log(boxscore)
	  console.log(teamId)
	  let team = _.find(boxscore, {id: parseInt(teamId, 10)})

	  console.log(team)

	  // remove received player if part of starting lineup
	  // add traded player to starting lineup if improvement
	  // compare to actual point total
	  // compare to opponent
	})
      })
    })
   
    //console.log(util.inspect(players, false, null))    
    //console.log(util.inspect(trades, false, null))    

  })

  // show value at trade time
  // - cbs
  // - pff

  // get player points since trade (done)
  // player point average since trade (done)

  // get team schedule
  // get lineups since trade
  // calculate trade impact on points
  // - remove received player if part of starting lineup
  // - add traded player to starting lineup if improvement
  // - compare point total to actual
  // - analyze win impact

  // # of startable weeks for traded player
  // # of startable weeks for received player
  // # of actual weeks for received player
})
