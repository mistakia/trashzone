const espnff = require('espnff')
const util = require('util')
const path = require('path')
const moment = require('moment')
const jsonfile = require('jsonfile')

const config = require('../config')
const recordStats = [
  'wins',
  'losses',
  'points',
  'points_total',
  'highest_score',
  'lowest_score',
  'highest_score_in_loss',
  'lowest_score_in_win',
  'largest_margin',
  'smallest_margin'
]
const types = ['overall', 'season', 'playoff', 'championship']
let owners = {}
let records = {}

const lowRecords = ['lowest_score', 'lowest_score_in_win', 'smallest_margin']
for (const type of types) {
  records[type] = {}
  for (const stat of recordStats) {
    records[type][stat] = { value: 0 }
    if (lowRecords.indexOf(stat) !== -1) {
      records[type][stat].value = 1000
    }
  }
}

records.season.most_wins = { value: 0 }
records.season.most_losses = { value: 0 }

const createOwnerStats = (member) => {
  let result = {}
  result.name = `${member.firstName} ${member.lastName}`
  result.opponents = {}
  result.seasons_played = 0

  const baseStats = ['gp', 'games_over_100', 'wins', 'losses', 'points_total', 'appearances']
  for (const type of types) {
    result[type] = {}
    for (const stat of baseStats) {
      result[type][stat] = 0
    }
  }

  return result
}

const addStats = ({
  teamOwners,
  ownerId,
  points_scored,
  points_against,
  week,
  season,
  game,
  opponents
}) => {
  const owner = owners[ownerId]
  let type
  const over100 = points_scored >= 100
  const win = points_scored > points_against
  const margin = points_scored - points_against

  switch (game.playoffTierType) {
    case 'NONE':
      type = 'season'
      break
    case 'WINNERS_BRACKET':
      type = 'playoff'
      break
  }

  switch (week) {
    case 13:
      owner.seasons_played += 1
      break
    case 16:
      owner.championship.appearances += 1
      type = 'championship'
      break
  }

  owner.overall.gp += 1
  owner.overall.points_total += points_scored
  owner[type].gp += 1
  owner[type].points_total += points_scored

  if (over100) {
    owner.overall.games_over_100 += 1
    owner[type].games_over_100 += 1
  }

  if (win) {
    owner.overall.wins += 1
    owner[type].wins += 1
  } else {
    owner.overall.losses += 1
    owner[type].losses += 1
  }

  // #################### Overall ###################
  if ((margin > 0) && margin < records.overall.smallest_margin.value) {
    records.overall.smallest_margin = {
      value: margin,
      owners: teamOwners,
      season,
      game
    }
  }

  if (margin > records.overall.largest_margin.value) {
    records.overall.largest_margin = {
      value: margin,
      owners: teamOwners,
      season,
      game
    }
  }

  if (!win && points_scored > records.overall.highest_score_in_loss.value) {
    records.overall.highest_score_in_loss = {
      value: points_scored,
      owners: teamOwners,
      season,
      game
    }
  }

  if (win && points_scored < records.overall.lowest_score_in_win.value) {
    records.overall.lowest_score_in_win = {
      value: points_scored,
      owners: teamOwners,
      season,
      game
    }
  }

  if (points_scored > records.overall.highest_score.value) {
    records.overall.highest_score = {
      value: points_scored,
      owners: teamOwners,
      season,
      game
    }
  }

  if (points_scored < records.overall.lowest_score.value) {
    records.overall.lowest_score = {
      value: points_scored,
      owners: teamOwners,
      season,
      game
    }
  }

  // #################### By Type ###################
  if ((margin > 0) && margin < records[type].smallest_margin.value) {
    records[type].smallest_margin = {
      value: margin,
      owners: teamOwners,
      season,
      game
    }
  }

  if (margin > records[type].largest_margin.value) {
    records[type].largest_margin = {
      value: margin,
      owners: teamOwners,
      season,
      game
    }
  }

  if (!win && points_scored > records[type].highest_score_in_loss.value) {
    records[type].highest_score_in_loss = {
      value: points_scored,
      owners: teamOwners,
      season,
      game
    }
  }

  if (win && points_scored < records[type].lowest_score_in_win.value) {
    records[type].lowest_score_in_win = {
      value: points_scored,
      owners: teamOwners,
      season,
      game
    }
  }

  if (points_scored > records[type].highest_score.value) {
    records[type].highest_score = {
      value: points_scored,
      owners: teamOwners,
      season,
      game
    }
  }

  if (points_scored < records[type].lowest_score.value) {
    records[type].lowest_score = {
      value: points_scored,
      owners: teamOwners,
      season,
      game
    }
  }

  opponents.forEach((member) => {
    addOpponentStats({
      owner,
      points_scored,
      points_against,
      win,
      member
    })
  })
}

const addOpponentStats = ({
  owner,
  points_scored,
  points_against,
  win,
  member
}) => {
  if (!owner.opponents[member.id]) {
    owner.opponents[member.id] = {
      name: `${member.firstName} ${member.lastName}`,
      points: 0,
      points_against: 0,
      wins: 0,
      losses: 0
    }
  }

  const opponent = owner.opponents[member.id]

  opponent.points += points_scored
  opponent.points_against += points_against

  if (win)
    opponent.wins += 1
  else
    opponent.losses += 1
}

const main = async ({ leagueId }) => {
  const seasonId = moment().format('YYYY')
  const schedule = await espnff.schedule.get({ leagueId, seasonId })

  const { previousSeasons } = schedule.data.status
  const seasons = {}

  for (let i = 0; i < previousSeasons.length; i++) {
    const seasonId = previousSeasons[i]
    const data = await espnff.standings.get({ leagueId, seasonId })
    seasons[seasonId] = data[0]
  }

  seasons[seasonId] = schedule.data

  Object.keys(seasons).forEach((seasonId) => {
    const season = seasons[seasonId]

    const { teams, members, schedule } = season
    members.forEach((member) => {
      if (!owners[member.id]) {
        owners[member.id] = createOwnerStats(member)
      }
    })

    const seasonStats = {}
    teams.forEach((team) => {
      seasonStats[team.id] = {
        id: team.id,
        season_points: 0,
        playoff_points: 0,
        wins: 0,
        losses: 0
      }
    })

    const addSeasonStats = ({ teamId, points, win, playoff }) => {
      const team = seasonStats[teamId]
      if (playoff) {
        team.playoff_points += points
      } else {
        team.season_points += points
      }

      if (win) {
        team.wins += 1
      } else {
        team.losses += 1
      }
    }

    schedule.forEach((game) => {
      if (game.winner === 'UNDECIDED') {
        return
      }

      if (game.playoffTierType !== 'NONE' && game.playoffTierType !== 'WINNERS_BRACKET') {
        return
      }

      if (!game.away || !game.home) {
        return
      }

      const homeTeam = teams.find(t => t.id === game.home.teamId)
      const awayTeam = teams.find(t => t.id === game.away.teamId)

      homeTeam.owners.forEach((ownerId) => {
        addStats({
          teamOwners: homeTeam.owners.map(ownerId => members.find(m => m.id === ownerId)),
          ownerId,
          game,
          season: seasonId,
          week: game.matchupPeriodId,
          points_scored: game.home.totalPoints,
          points_against: game.away.totalPoints,
          opponents: awayTeam.owners.map(ownerId => members.find(member => member.id === ownerId))
        })
      })

      awayTeam.owners.forEach((ownerId) => {
        addStats({
          teamOwners: awayTeam.owners.map(ownerId => members.find(m => m.id === ownerId)),
          ownerId,
          game,
          season: seasonId,
          week: game.matchupPeriodId,
          points_scored: game.away.totalPoints,
          points_against: game.home.totalPoints,
          opponents: homeTeam.owners.map(ownerId => members.find(member => member.id === ownerId))
        })
      })

      addSeasonStats({
        teamId: game.away.teamId,
        points: game.away.totalPoints,
        playoff: game.playoffTierType === 'WINNERS_BRACKET',
        win: game.away.totalPoints > game.home.totalPoints
      })

      addSeasonStats({
        teamId: game.home.teamId,
        points: game.home.totalPoints,
        playoff: game.playoffTierType === 'WINNERS_BRACKET',
        win: game.home.totalPoints > game.away.totalPoints
      })
    })

    Object.values(seasonStats).forEach((stats) => {
      const team = teams.find(t => t.id === stats.id)
      const teamOwners = team.owners.map(ownerId => members.find(m => m.id === ownerId))

      if (stats.playoff_points) {
        team.owners.forEach((ownerId) => {
          const owner = owners[ownerId]
          owner.playoff.appearances += 1
        })
      }

      if (stats.season_points > records.season.points.value) {
        records.season.points = {
          value: stats.season_points,
          season: seasonId,
          owners: teamOwners
        }
      }

      if (stats.playoff_points > records.playoff.points.value) {
        records.playoff.points = {
          value: stats.playoff_points,
          season: seasonId,
          owners: teamOwners
        }
      }

      if (stats.wins > records.season.most_wins.value) {
        records.season.most_wins = {
          value: stats.wins,
          season: seasonId,
          owners: teamOwners
        }
      }

      if (stats.losses > records.season.most_losses.value) {
        records.season.most_losses = {
          value: stats.losses,
          season: seasonId,
          owners: teamOwners
        }
      }
    })
  })

  Object.keys(owners).forEach((ownerId) => {
    const owner = owners[ownerId]

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

  const file_path = path.resolve(__dirname, '../data/league_stats.json')
  jsonfile.writeFileSync(file_path, { owners, records }, { spaces: 4 })
}


try {
  const { leagueId } = config.espn
  main ({ leagueId })
} catch (e) {
  console.log(e)
}
