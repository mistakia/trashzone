document.getElementById('date').innerHTML = moment().format('dddd, MMMM D, YYYY')

let week_one = moment('2018-08-28')
let current_week = moment().diff(week_one, 'weeks')
document.getElementById('current-week').innerHTML = `Week ${current_week}`

const baseStats = [
  'count',
  'spent',
  'wasted',
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

    Elem.create({
      parent: overall_parent,
      tag: 'tr',
      childs: tds
    })
  }
}).error((message) => {
  console.error(message.error)
})
