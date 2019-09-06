const path = require('path')

const jsonfile = require('jsonfile')
const espn = require('espnff')
const moment = require('moment')
const config = require('../config')

const current_week = moment().diff(config.week_one, 'weeks')

const data_path = path.resolve(__dirname, '../data/waivers.json')

const emptyTeamsObject = (initialValue) => {
  let teams = {}
  for(let i=1; i<13; i++) {
    teams[i] = JSON.parse(JSON.stringify(initialValue))
  }

  return teams
}

const formatPosition = (pos) => {
  return pos.replace('/', '').toLowerCase()
}

const byPositionDefault = () => {
  let result = {}
  const positions = ['qb', 'wr', 'rb', 'te', 'dst', 'k']
  for (const position of positions) {
    result[position] = {
      spent: 0,
      max: 0,
      min: 200,
      count: 0,
      bids: [],
      points: 0,
      starterPoints: 0
    }
  }
  return result
}

const run = async () => {
  const { formatted: schedule } = await espn.schedule.get(config.espn)
  console.log(schedule)
  const { formatted: teams } = await espn.league.get(config.espn)
  console.log(teams)

  const boxscoresByTeam = emptyTeamsObject([])
  let resultsByTeam = emptyTeamsObject({
    wasted: 0,
    discarded: 0,
    max: 0,
    min: 200,
    spent: 0,
    count: 0,
    spentOnStarters: 0,
    points: 0,
    starterPoints: 0,
    positions: byPositionDefault(),
    waiverTransactions: []
  })

  /* const getBoxscores = async (teamId, week) => {
   *   const boxscores = await espn.boxscore.get({
   *     scoringPeriodId: week,
   *     teamId,
   *     ...config.espn
   *   })
   *   boxscores.forEach(boxscore => boxscoresByTeam[boxscore.id].push(boxscore))
   * }

   * for (let i=1; i<=current_week;i++) {
   *   const matchups = schedule[i]
   *   let home_ids = matchups.map(m => m.home_id)
   *   await Promise.all(home_ids.map(teamId => getBoxscores(teamId, i)))
   * }
   */
  /* for (const teamId in boxscoresByTeam) {
   *   const boxscore = boxscoresByTeam[teamId][0]
   *   resultsByTeam[teamId].name = boxscore.name
   *   resultsByTeam[teamId].image = boxscore.image
   *   resultsByTeam[teamId].team = teams[teamId]
   * }
   */
  const waiverStartDate = config.week_one.format('YYYYMMDD')
  const waiverEndDate = moment().format('YYYYMMDD')
  const adds = await espn.activity.get({
    activityType: 2,
    teamId: -1,
    tranType: 2,
    startDate: waiverStartDate,
    endDate: waiverEndDate,
    ...config.espn
  })
  console.log(adds)
  const drops = await espn.activity.get({
    activityType: 2,
    teamId: -1,
    tranType: 3,
    startDate: waiverStartDate,
    endDate: waiverEndDate,
    ...config.espn
  })
  console.log(drops)

  const waivers = adds.filter(add => add.type.includes('Waivers'))
  let waiversByTeam = emptyTeamsObject([])
  waivers.forEach(add => waiversByTeam[add.teams[0]].push(add))

  let dropsByTeam = emptyTeamsObject([])
  drops.forEach(drop => dropsByTeam[drop.teams[0]].push(drop))

  for (const teamId in waiversByTeam) {
    const transactions = waiversByTeam[teamId]
    let resultsTeam = resultsByTeam[teamId]

    for (const add of transactions) {
      const detail = add.detail[0]
      const { player } = detail
      const playerPosition = formatPosition(detail.position)
      let resultsPosition = resultsTeam.positions[playerPosition]
      const bid = parseInt(/\$(\d+)/ig.exec(detail.full)[1], 10)
      const team_drops = dropsByTeam[teamId]
      const add_timestamp = moment(add.date, 'ddd, MMM D h:m A')
      const team_drops_after_pickup = team_drops.filter((drop) => (
        moment(drop.date, 'ddd, MMM D h:m A').isAfter(add_timestamp)
      ))
      const drop = team_drops_after_pickup.filter((drop) => (
        drop.detail[0].player === player
      ))[0]
      const dropped = !!drop

      if (dropped) {
        add.date_dropped = drop.date
      }

      const startDate = moment(add.date, 'ddd, MMM D h:m A')
      const endDate = add.date_dropped ?
        moment(add.date_dropped, 'ddd, MMM D h:m A') :
        moment()
      const firstWeek = startDate.diff(config.week_one, 'weeks') - 1
      const endWeek = endDate.diff(config.week_one, 'weeks')
      /* const boxscores = boxscoresByTeam[teamId].slice(firstWeek, endWeek)
       * let games_started = []
       * if (boxscores.length) {
       *   games_started = boxscores.filter((boxscore) => {
       *     const start = boxscore.players.find(p => p.name === player)
       *     const bench = boxscore.bench.find(p => p.name === player)

       *     if (start && start.points) {
       *       const points = parseInt(start.points, 10)
       *       resultsTeam.starterPoints += points
       *       resultsTeam.points += points

       *       resultsPosition.points += points
       *       resultsPosition.starterPoints += points

       *     } else if (bench && bench.points) {
       *       const points = parseInt(bench.points, 10)
       *       resultsTeam.points += points
       *       resultsPosition.points += points
       *     }

       *     return start
       *   })
       * }
       */
      resultsTeam.spent += bid
      resultsTeam.count += 1
      resultsTeam.waiverTransactions.push(add)

      resultsPosition.count += 1
      resultsPosition.spent += bid
      resultsPosition.bids.push(bid)
      //resultsPosition.waiverTransactions[add.date] = add

      if (dropped) {
        resultsTeam.discarded += bid
      }

      if (dropped && games_started.length === 0) {
        resultsTeam.wasted += bid
      } else if (games_started.length) {
        resultsTeam.spentOnStarters += bid
      }

      if (bid > resultsTeam.max) {
        resultsTeam.max = bid
      }

      if (bid < resultsTeam.min) {
        resultsTeam.min = bid
      }

      if (bid < resultsPosition.min) {
        resultsPosition.min = bid
      }

      if (bid > resultsPosition.max) {
        resultsPosition.max = bid
      }
    }

    if (resultsTeam.count === 0) {
      resultsTeam.min = null
      resultsTeam.max = null
    }

    for (const pos in resultsTeam.positions) {
      let posResult = resultsTeam.positions[pos]
      if (posResult.count === 0) {
        posResult.min = null
        posResult.max = null
      }
    }

    // TODO: normalize points/starterPoints by week
  }

  jsonfile.writeFileSync(data_path, resultsByTeam, {spaces: 4})
}

run().catch(err => console.log(err))
