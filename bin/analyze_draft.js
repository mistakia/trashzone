const espn = require('espnff')
const path = require('path')
const jsonfile = require('jsonfile')
const moment = require('moment')
const async = require('async')

const week_one = moment('2017-08-29')
const current_week = moment().diff(week_one, 'weeks')

const draft_data_file = path.resolve(__dirname, '../data/draft.json')
const draft_data = jsonfile.readFileSync(draft_data_file)

espn.schedule.getByLeague({
  leagueId: 147002,
  seasonId: 2017
}, function(err, schedule) {
  if (err)
    console.log(err)

  let weeks = []
  Object.keys(schedule).forEach(function(week) {
    if (week <= current_week)
      weeks.push(schedule[week])
  })

  let week_count = 0
  async.mapSeries(weeks, function(week, next) {
    console.log(week)
    week_count++

    let home_ids = week.map(function(m) {
      return m.home_id
    })

    async.mapLimit(home_ids, 2, function(home_id, next) {
      espn.boxscore.get({
	leagueId: 147002,
	teamId: home_id,
	scoringPeriodId: week_count,
	seasonId: 2017
      }, next)
    }, function(err, boxscores) {
      next(err, boxscores)
    })
    
  }, function(err, results) {
    if (err)
      console.log(err)

    let teams = {}
    for(let i=1;i<13;i++) {
      teams[i] = {
	cost: 0,
	drafted_points: 0,
	current_draft_cost: 0,
	undrafted_points: 0,
	points_per_week: {},
	draft_cost_per_week: {}
      }
    }

    results.forEach(function(week, index) {
      const this_week = index + 1
      week.forEach(function(matchup) {
	matchup.forEach(function(team) {
	  teams[team.id].points_per_week[this_week] = team.score
	  teams[team.id].team = {
	    id: team.id,
	    name: team.name,
	    href: team.href,
	    image: team.image
	  }

	  team.players.forEach(function(player) {

	    if ((this_week) == current_week) {
	      if (draft_data[player.name])
		teams[team.id].current_draft_cost += draft_data[player.name].price
	    }

	    if (!player.points)
	      return

	    if (draft_data[player.name] && draft_data[player.name].team_id === team.id) {
	      if (!teams[team.id].draft_cost_per_week[this_week])
		teams[team.id].draft_cost_per_week[this_week] = draft_data[player.name].price
	      else
		teams[team.id].draft_cost_per_week[this_week] += draft_data[player.name].price

	      teams[team.id].cost += draft_data[player.name].price
	      teams[team.id].drafted_points += player.points
	    } else {
	      teams[team.id].undrafted_points += player.points
	    }
	  })
	})
      })
    })

    console.log(teams)
    jsonfile.writeFileSync(path.resolve(__dirname, '../data/draft_analysis.json'), teams, {spaces: 4})
  })
})
