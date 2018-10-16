document.getElementById('date').innerHTML = moment().format('dddd, MMMM D, YYYY')

let week_one = moment('2018-08-28')
let current_week = moment().diff(week_one, 'weeks')
document.getElementById('current-week').innerHTML = `Week ${current_week}`

const baseStats = [
  'count',
  'spent',
  'wasted',
  'discarded',
  'max',
  'min',
  'points',
  'starterPoints',
  'points_per_dollar',
  'starter_points_per_dollar'
]

let limits = {}
for (const stat of baseStats) {
  limits[stat] = {}
  limits[stat].max = 0
  limits[stat].min = 10000
}

const setMinMax = (stat, value) => {
  if (value > limits[stat].max)
    limits[stat].max = value

  if (value < limits[stat].min)
    limits[stat].min = value
}

const getPercentage = (stat, value) => {
  const min = limits[stat].min
  const max = limits[stat].max
  return (value - min) / (max - min)
}

const getMedian = (array) => {
  array.sort((a, b) => {
    return a - b
  })

  const half = Math.floor(array.length / 2)

  if (array.length % 2) {
    return array[half]
  } else {
    return (array[half-1] + array[half]) / 2.0
  }
}

const createPositionTable = (position) => {
  const parent = document.querySelector('#position--tables')

  const columns = [
    'Team',
    'Bids',
    'Total',
    'Min',
    'Max',
    'Average',
    'Median'
  ]
  let columnHeaders = ''
  for (const header of columns) {
    columnHeaders += `<td>${header}</td>`
  }

  Elem.create({
    parent,
    tag: 'table',
    id: `${position}--table`,
    html: `
      <thead>
        <tr><td colspan="100%">${position} Waiver Analysis</td></tr>
        <tr>${columnHeaders}</tr>
      </thead>
      <tbody>
      </tbody>
    `
  })
}

const positions = ['qb', 'rb', 'wr', 'te', 'k', 'dst']
for (const pos of positions) {
  createPositionTable(pos)
}

App.data('/waivers.json').get().success((data) => {
  console.log(data)
  const overall_parent = document.querySelector('main table.waivers tbody')
  for (const teamId in data) {
    if (teamId === 'status')
      continue

    const teamData = data[teamId]
    teamData.points_per_dollar  = teamData.points / teamData.spent
    teamData.starter_points_per_dollar = teamData.starterPoints / teamData.spent

    for (const stat of baseStats) {
      setMinMax(stat, data[teamId][stat])
    }
  }

  console.log(limits)

  for (const teamId in data) {
    if (teamId === 'status')
      continue

    if (!data[teamId].count)
      continue

    const teamData = data[teamId]

    const tds = [{
      tag: 'td',
      text: teamData.name
    }, {
      tag: 'td',
      text: teamData.count,
	  style: {
	    backgroundColor: `rgba(46,163,221,${getPercentage('count', teamData.count)})`
	  }
    }, {
      tag: 'td',
      text: teamData.spent.toString(),
	  style: {
	    backgroundColor: `rgba(46,163,221,${getPercentage('spent', teamData.spent)})`
	  }
    }, {
      tag: 'td',
      text: teamData.discarded.toString(),
	  style: {
	    backgroundColor: `rgba(46,163,221,${getPercentage('discarded', teamData.discarded)})`
	  }
    }, {
      tag: 'td',
      text: teamData.wasted.toString(),
	  style: {
	    backgroundColor: `rgba(46,163,221,${getPercentage('wasted', teamData.wasted)})`
	  }
    }, {
      tag: 'td',
      text: teamData.max.toString(),
	  style: {
	    backgroundColor: `rgba(46,163,221,${getPercentage('max', teamData.max)})`
	  }
    }, {
      tag: 'td',
      text: teamData.min.toString(),
	  style: {
	    backgroundColor: `rgba(46,163,221,${getPercentage('min', teamData.min)})`
	  }
    }, {
      tag: 'td',
      text: teamData.points.toString(),
	  style: {
	    backgroundColor: `rgba(46,163,221,${getPercentage('points', teamData.points)})`
	  }
    }, {
      tag: 'td',
      text: (teamData.points_per_dollar).toFixed(1).toString(),
	  style: {
	    backgroundColor: `rgba(46,163,221,${getPercentage('points_per_dollar', teamData.points_per_dollar)})`
	  }
    }, {
      tag: 'td',
      text: teamData.starterPoints.toString(),
	  style: {
	    backgroundColor: `rgba(46,163,221,${getPercentage('starterPoints', teamData.starterPoints)})`
	  }
    }, {
      tag: 'td',
      text: (teamData.starter_points_per_dollar).toFixed(1).toString(),
	  style: {
	    backgroundColor: `rgba(46,163,221,${getPercentage('starter_points_per_dollar', teamData.starter_points_per_dollar)})`
	  }
    }]

    console.log(tds)

    for (const pos in teamData.positions) {
      const positionData = teamData.positions[pos]
      if (!positionData.count)
        continue
      const position_tds = [{
        tag: 'td',
        text: teamData.name
      }, {
        tag: 'td',
        text: positionData.count
      }, {
        tag: 'td',
        text: positionData.spent
      }, {
        tag: 'td',
        text: positionData.min
      }, {
        tag: 'td',
        text: positionData.max
      }, {
        tag: 'td',
        text: (positionData.spent / positionData.count).toFixed(1)
      }, {
        tag: 'td',
        text: getMedian(positionData.bids)
      }]
      Elem.create({
        tag: 'tr',
        childs: position_tds,
        parent: document.querySelector(`#${pos}--table tbody`)
      })
    }

    Elem.create({
      parent: overall_parent,
      tag: 'tr',
      childs: tds
    })
  }
}).error((message) => {
  console.error(message.error)
})
