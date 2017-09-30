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
 	  teams[team.id].team = {
 	    id: team.id,
 	    name: team.name,
 	    href: team.href,
 	    image: team.image
 	  }

	  let this_week_score = 0
	  
 	  team.players.forEach(function(player) {
	    
 	    if ((this_week) == current_week) {
 	      if (draft_data[player.name])
 		teams[team.id].current_draft_cost += draft_data[player.name].price
 	    }

	    let add = function(price) {
 	      if (!teams[team.id].draft_cost_per_week[this_week])
 		teams[team.id].draft_cost_per_week[this_week] = price
 	      else
 		teams[team.id].draft_cost_per_week[this_week] += price
	      
 	      if (player.points) {
 		teams[team.id].cost += price
 		teams[team.id].drafted_points += player.points
		this_week_score += player.points
 	      }
	    }
	    
 	    if (draft_data[player.name]) {
 	      if (draft_data[player.name].team_id === team.id) {
		add(draft_data[player.name].price)
	      } else if (player.points) {
		teams[team.id].undrafted_points += player.points
	      }

	      if (draft_data[player.name][team.id]) {
		add(draft_data[player.name][team.id])
 	      }
 	    } else if (player.points) {
	      teams[team.id].undrafted_points += player.points
	    }
 	  })

 	  teams[team.id].points_per_week[this_week] = this_week_score
	  
 	})
      })
    })
    
    jsonfile.writeFileSync(path.resolve(__dirname, '../data/draft_analysis.json'), teams, {spaces: 4})
  })
})

// get top scorers for all positions
async.parallel({
  teams: espn.teams.get.bind(null, {
    leagueId: 147002,
    seasonId: 2017
  }),
  qb1: espn.leaders.get.bind(null, {
    leagueId: 147002,
    seasonId: 2017,
    slotCategoryId: 0
  }),
  qb2: espn.leaders.get.bind(null, {
    leagueId: 147002,
    seasonId: 2017,
    slotCategoryId: 0,
    startIndex: 50
  }),  
  wr1: espn.leaders.get.bind(null, {
    leagueId: 147002,
    seasonId: 2017,
    slotCategoryId: 4
  }),
  wr2: espn.leaders.get.bind(null, {
    leagueId: 147002,
    seasonId: 2017,
    slotCategoryId: 4,
    startIndex: 50
  }),
  wr3: espn.leaders.get.bind(null, {
    leagueId: 147002,
    seasonId: 2017,
    slotCategoryId: 4,
    startIndex: 100,
  }),  
  rb1: espn.leaders.get.bind(null, {
    leagueId: 147002,
    seasonId: 2017,
    slotCategoryId: 2
  }),
  rb2: espn.leaders.get.bind(null, {
    leagueId: 147002,
    seasonId: 2017,
    slotCategoryId: 2,
    startIndex: 50
  }),
  rb3: espn.leaders.get.bind(null, {
    leagueId: 147002,
    seasonId: 2017,
    slotCategoryId: 2,
    startIndex: 100
  }),  
  te1: espn.leaders.get.bind(null, {
    leagueId: 147002,
    seasonId: 2017,
    slotCategoryId: 6
  }),
  te2: espn.leaders.get.bind(null, {
    leagueId: 147002,
    seasonId: 2017,
    slotCategoryId: 6,
    startIndex: 50
  }),  
  k: espn.leaders.get.bind(null, {
    leagueId: 147002,
    seasonId: 2017,
    slotCategoryId: 17
  }),
  dst: espn.leaders.get.bind(null, {
    leagueId: 147002,
    seasonId: 2017,
    slotCategoryId: 16
  })
}, function(err, result) {
  if (err)
    console.log(err)

  leaders = {
    qb: Object.assign({}, result.qb1, result.qb2),
    wr: Object.assign({}, result.wr1, result.wr2, result.wr3),
    rb: Object.assign({}, result.rb1, result.rb2, result.rb3),
    te: Object.assign({}, result.te1, result.te2),
    k: Object.assign({},  result.k),
    dst: Object.assign({}, result.dst)
  }

  console.log(leaders.qb)

  let drafted = {
    qb: [],
    rb: [],
    wr: [],
    te: [],
    k: [],
    dst: []
  }

  Object.keys(draft_data).forEach(function(name) {
    let item = draft_data[name]

    if (item.not_drafted)
      return

    drafted[item.position].push({
      name: name,
      team_id: item.team_id,
      price: item.price,
      team: result.teams[item.team_id]
    })
  })

  const getRank = function(players, target_key) {
    let index = Object.keys(players).findIndex(function(key, index) {
      return key === target_key
    })
    return index += 1
  }

  Object.keys(drafted).forEach(function(position) {

    drafted[position] = drafted[position].map(function(player) {
      
      if (!leaders[position][player.name]) {
	console.log(`Could not find ${player.name}`)
	player.points = 0
	player.points_per_dollar = 0
	return player
      }
	
      player.points = leaders[position][player.name]
      player.rank = getRank(leaders[position], player.name)
      player.points_per_dollar = player.points / player.price
      return player
    })
    
  })

  jsonfile.writeFileSync(path.resolve(__dirname, '../data/player_draft_analysis.json'), drafted, {spaces: 4})  

})
