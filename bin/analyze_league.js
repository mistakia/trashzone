const async = require('async')
const jsonfile = require('jsonfile')
const path = require('path')
const espnff = require('espnff')
const fs = require('fs')
const glob = require('glob')

let schedules = {}
let data = {}

const loadSchedule = function(file_path, cb) {
  fs.readFile(file_path, { encoding: 'utf8'}, function(err, html) {
    if (err)
      return cb(err)

    const result = espnff.schedule.parseHTMLByTeams(html)
    const year = /-([\d]*)/.exec(file_path)[1]

    Object.keys(result).forEach(function(owner) {
      data[owner][year].schedule = result[owner]
    })
    cb()
  })
}

const loadStanding = function(file_path, cb) {
  fs.readFile(file_path, { encoding: 'utf8'}, function(err, html) {
    if (err)
      return cb(err)

    const result = espnff.standings.parseHTML(html)
    const year = /-([\d]*)/.exec(file_path)[1]
    Object.keys(result).forEach(function(owner) {
      if (!data[owner])
	    data[owner] = {}

      data[owner][year] = result[owner]
    })
    cb()
  })
}

const addStats = function(owner, game, type) {
  const points = parseFloat(game.points)
  const points_against = parseFloat(game.points_against)

  const over100 = points >= 100
  const win = points > points_against

  owner[type].gp += 1
  owner[type].points_total += points

  if (over100)
    owner[type].games_over_100 += 1

  if (win)
    owner[type].wins += 1
  else
    owner[type].losses += 1
}

const addOpponentStats = function(owner, game, opponent) {
  const points = parseFloat(game.points)
  const points_against = parseFloat(game.points_against)

  const win = points > points_against

  if (!owner.opponents[opponent]) {
    owner.opponents[opponent] = {
      points: 0,
      points_against: 0,
      wins: 0,
      losses: 0
    }
  }

  owner.opponents[opponent].points += points
  owner.opponents[opponent].points_against += points_against

  if (win)
    owner.opponents[opponent].wins += 1
  else
    owner.opponents[opponent].losses += 1
}

const analyze = (data) => {

  // Records
  let highest_scored_game = { score: 0 }
  let highest_scored_season = { score: 0 }
  let highest_scored_playoff = { score: 0 }
  let highest_scored_championship = { score: 0 }

  let least_scored_game = { score: 0 }
  let least_scored_season = { score: 0 }
  let least_scored_playoff = { score: 0 }
  let least_scored_championship = { score: 0 }

  Object.keys(data).forEach(function(owner_name) {

    const seasons = Object.keys(data[owner_name])

    let owner = data[owner_name]

    owner.seasons_played = seasons.length
    owner.playoff_appearances = 0
    owner.opponents = {}

    owner.overall = {
      gp: 0,
      games_over_100: 0,
      wins: 0,
      losses: 0,
      points_total: 0
    }

    owner.season = {
      gp: 0,
      games_over_100: 0,
      wins: 0,
      losses: 0,
      points_total: 0
    }

    owner.playoff = {
      gp: 0,
      games_over_100: 0,
      wins: 0,
      losses: 0,
      points_total: 0
    }

    owner.championship = {
      gp: 0,
      games_over_100: 0,
      wins: 0,
      losses: 0,
      points_total: 0
    }


    seasons.forEach(function(season) {
      const weeks = Object.keys(data[owner_name][season].schedule)

      let playoff_appearance = false

      weeks.forEach(function(week) {
        const game = data[owner_name][season].schedule[week]


        game.opponents.forEach(function(opponent) {
	      addOpponentStats(owner, game, opponent)
        })

        addStats(owner, game, 'overall')

        if (game.playoff) {
	      playoff_appearance = true
	      addStats(owner, game, 'playoff')

	      if (game.championship)
	        addStats(owner, game, 'championship')

        } else {
	      addStats(owner, game, 'season')
        }
      })

      if (playoff_appearance)
        owner.playoff_appearances += 1
    })

    owner.overall.points_total = owner.overall.points_total.toFixed(2)
    owner.season.points_total = owner.season.points_total.toFixed(2)
    owner.playoff.points_total = owner.playoff.points_total.toFixed(2)
    owner.championship.points_total = owner.championship.points_total.toFixed(2)

    owner.overall.win_pct = (((owner.overall.wins / owner.overall.gp) * 100) || 0).toFixed(2)
    owner.season.win_pct = (((owner.season.wins / owner.season.gp) * 100) || 0).toFixed(2)
    owner.playoff.win_pct = (((owner.playoff.wins / owner.playoff.gp) * 100) || 0).toFixed(2)
    owner.championship.win_pct = (((owner.championship.wins / owner.championship.gp) * 100) || 0).toFixed(2)

    owner.playoff_appearance_pct = (((owner.playoff_appearances / owner.seasons_played) * 100) || 0).toFixed(2)

    owner.overall.points_avg = (owner.overall.points_total / owner.overall.gp).toFixed(2)
    owner.season.points_avg = (owner.season.points_total / owner.season.gp).toFixed(2)
    owner.playoff.points_avg = ((owner.playoff.points_total / owner.playoff.gp) || 0).toFixed(2)
    owner.championship.points_avg = ((owner.championship.points_total / owner.championship.gp) || 0).toFixed(2)

    owner.overall.games_over_100_pct = ((owner.overall.games_over_100 / owner.overall.gp) * 100).toFixed(2)

  })

  return data
}

async.parallel({
  standings: function(cb) {
    glob(path.resolve(__dirname, '../data/league/standings-*.html'), {},  cb)
  },
  schedules: function(cb) {
    glob(path.resolve(__dirname, '../data/league/schedules-*.html'), {}, cb)
  }
}, function(err, results) {
  if (err)
    return console.log(err)

  async.waterfall([
    function(cb) {
      async.each(results.standings, loadStanding, cb)
    },
    function(cb) {
      async.each(results.schedules, loadSchedule, cb)
    }
  ], function(err) {
    if (err)
      return console.log(err)

    analyze(data)

    const file_path = path.resolve(__dirname, '../data/league.json')
    jsonfile.writeFileSync(file_path, data, { spaces: 4 })
  })
})
