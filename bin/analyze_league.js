const async = require('async')
const jsonfile = require('jsonfile')
const path = require('path')
const espnff = require('espnff')
const fs = require('fs')
const glob = require('glob')

const config = require('../config')

let schedules = {}
let owners = {}

const recordStats = ['wins', 'losses', 'points', 'points_total', 'highest_score', 'lowest_score']
const types = ['overall', 'season', 'playoff', 'championship']
let records = {}

for (const type of types) {
  records[type] = {}
  for (const stat of recordStats) {
    records[type][stat] = { value: 0 }
    if (stat === 'lowest_score') {
      records[type][stat].value = 1000
    }
  }
}

records.season.most_wins = { value: 0 }
records.season.most_losses = { value: 0 }

const addSchedule = (schedule, year) => {
  console.log(`Adding schedule for ${year}`)
  Object.keys(schedule).forEach(function(owner) {
    owners[owner][year].schedule = schedule[owner]
  })
}

const loadScheduleFile = (file_path, cb) => {
  fs.readFile(file_path, { encoding: 'utf8'}, function(err, html) {
    if (err)
      return cb(err)

    const result = espnff.schedule.parseHTMLByTeams(html)
    const year = /-([\d]*)/.exec(file_path)[1]
    addSchedule(result, year)
    cb()
  })
}

const addStandings = (standings, year) => {
  console.log(`Adding Standings for ${year}`)
  Object.keys(standings).forEach(function(owner) {
    if (!owners[owner])
	  owners[owner] = {}

    owners[owner][year] = standings[owner]
  })
}

const loadStandingFile = (file_path, cb) => {
  fs.readFile(file_path, { encoding: 'utf8'}, function(err, html) {
    if (err)
      return cb(err)

    const result = espnff.standings.parseHTMLByOwner(html)
    const year = /-([\d]*)/.exec(file_path)[1]
    addStandings(result, year)
    cb()
  })
}

const addStats = function(owner, game, type, name) {
  const points = parseFloat(game.points)
  const points_against = parseFloat(game.points_against)

  const over100 = points >= 100
  const win = points > points_against

  owner[type].gp += 1
  owner[type].points_total += points

  if (over100) {
    owner[type].games_over_100 += 1
  }

  if (win) {
    owner[type].wins += 1
  } else {
    owner[type].losses += 1
  }

  if (points > records[type].highest_score.value) {
    records[type].highest_score = {
      value: points,
      season: game.season,
      owner: name,
      game: game
    }
  }

  if (points < records[type].lowest_score.value) {
    records[type].lowest_score = {
      value: points,
      season: game.season,
      owner: name,
      game: game
    }
  }

  return win
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

const analyze = (owners) => {

  Object.keys(owners).forEach(function(owner_name) {

    const seasons = Object.keys(owners[owner_name])

    let owner = owners[owner_name]

    owner.seasons_played = seasons.length
    owner.opponents = {}

    const baseStats = ['gp', 'games_over_100', 'wins', 'losses', 'points_total', 'appearances']
    for (const type of types) {
      owner[type] = {}
      for (const stat of baseStats) {
        owner[type][stat] = 0
      }
    }

    seasons.forEach(function(season) {
      const weeks = Object.keys(owners[owner_name][season].schedule)

      let playoff_appearance = false
      let season_points = 0
      let playoff_points = 0
      let season_wins = 0
      let season_losses = 0

      weeks.forEach(function(week) {
        const game = owners[owner_name][season].schedule[week]

        game.week = week
        game.season = season

        game.opponents.forEach(function(opponent) {
	      addOpponentStats(owner, game, opponent)
        })

        addStats(owner, game, 'overall', owner_name)

        if (game.playoff) {
	      playoff_appearance = true
	      addStats(owner, game, 'playoff', owner_name)

	      if (game.championship) {
            owner.championship.appearances += 1
	        addStats(owner, game, 'championship', owner_name)
          } else {
            playoff_points += parseFloat(game.points)
          }
        } else {
          season_points += parseFloat(game.points)
	      addStats(owner, game, 'season', owner_name) ? season_wins++ : season_losses++
        }
      })

      if (playoff_appearance)
        owner.playoff.appearances += 1


      if (season_points > records.season.points.value) {
        records.season.points = {
          value: season_points,
          season: season,
          owner: owner_name
        }
      }

      if (playoff_points > records.playoff.points.value) {
        records.playoff.points = {
          value: playoff_points,
          season: season,
          owner: owner_name
        }
      }

      if (season_wins > records.season.most_wins.value) {
        records.season.most_wins = {
          value: season_wins,
          season: season,
          owner: owner_name
        }
      }

      if (season_losses > records.season.most_losses.value) {
        records.season.most_losses = {
          value: season_losses,
          season: season,
          owner: owner_name
        }
      }

      for (const type of types) {
        for (const stat of recordStats) {
          if (owner[type][stat] && owner[type][stat] > records[type][stat].value) {
            records[type][stat] = {
              value: owner[type][stat],
              owner: owner_name,
              season: season
            }
          }
        }
      }
    })

    owner.overall.points_total = owner.overall.points_total.toFixed(2)
    owner.season.points_total = owner.season.points_total.toFixed(2)
    owner.playoff.points_total = owner.playoff.points_total.toFixed(2)
    owner.championship.points_total = owner.championship.points_total.toFixed(2)

    owner.overall.win_pct = (((owner.overall.wins / owner.overall.gp) * 100) || 0).toFixed(2)
    owner.season.win_pct = (((owner.season.wins / owner.season.gp) * 100) || 0).toFixed(2)
    owner.playoff.win_pct = (((owner.playoff.wins / owner.playoff.gp) * 100) || 0).toFixed(2)
    owner.championship.win_pct = (((owner.championship.wins / owner.championship.gp) * 100) || 0).toFixed(2)

    owner.playoff.appearance_pct = (((owner.playoff.appearances / owner.seasons_played) * 100) || 0).toFixed(2)

    owner.championship.appearance_pct = (((owner.championship.appearances / owner.seasons_played) * 100) || 0).toFixed(2)

    owner.overall.points_avg = (owner.overall.points_total / owner.overall.gp).toFixed(2)
    owner.season.points_avg = (owner.season.points_total / owner.season.gp).toFixed(2)
    owner.playoff.points_avg = ((owner.playoff.points_total / owner.playoff.gp) || 0).toFixed(2)
    owner.championship.points_avg = ((owner.championship.points_total / owner.championship.gp) || 0).toFixed(2)

    owner.overall.games_over_100_pct = ((owner.overall.games_over_100 / owner.overall.gp) * 100).toFixed(2)

  })

  return owners
}

async.parallel({
  standings: function(cb) {
    glob(path.resolve(__dirname, '../data/league/standings-*.html'), {},  cb)
  },
  schedules: function(cb) {
    glob(path.resolve(__dirname, '../data/league/schedules-*.html'), {}, cb)
  }
}, function(err, files) {
  if (err)
    return console.log(err)

  async.waterfall([
    function(cb) {
      async.each(files.standings, loadStandingFile, cb)
    },
    function(cb) {
      async.each(files.schedules, loadScheduleFile, cb)
    }
  ], async (err) => {
    if (err)
      return console.log(err)

    // TODO
    //const currentStandings = await espnff.standings.getByOwner(config.espn)
    //const currentSchedule = await espnff.schedule.getByTeams(config.espn)

    //addStandings(currentStandings, config.espn.seasonId)
    //addSchedule(currentSchedule, config.espn.seasonId)

    analyze(owners)

    const file_path = path.resolve(__dirname, '../data/league.json')
    jsonfile.writeFileSync(file_path, {
      owners,
      records
    }, { spaces: 4 })
  })
})
