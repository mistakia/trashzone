document.getElementById('date').innerHTML = moment().format('dddd, MMMM D, YYYY')

let week_one = moment('2017-08-29')
let current_week = moment().diff(week_one, 'weeks')
document.getElementById('current-week').innerHTML = `Week ${current_week}`

App.data('/draft_analysis.json').get().success((data) => {
  console.log(data)
  // get draft cost per point per game

  let undrafted_points = []
  let drafted_points = []

  let weeks = {}
  Object.keys(data[1].points_per_week).forEach(function(week) {
    weeks[week] = {
      cost_max: 0,
      cost_min: 1000,
      points_max: 0,
      points_min: 1000,
      efficiency_max: 0,
      efficiency_min: 5
    }
  })

  Object.keys(data).forEach(function(team_id) {
    if (team_id === 'status')
      return

    const team = data[team_id]

    let undrafted_item = team.team
    undrafted_item.undrafted_points = team.undrafted_points
    undrafted_points.push(undrafted_item)

    let drafted_item = team.team
    drafted_item.drafted_points = team.drafted_points
    drafted_item.cost = team.cost
    drafted_item.efficiency = drafted_item.drafted_points / drafted_item.cost
    drafted_item.weeks = {}

    Object.keys(team.draft_cost_per_week).forEach(function(week) {
      const cost = team.draft_cost_per_week[week]
      const points = team.points_per_week[week]
      const efficiency = points / cost
      drafted_item.weeks[week] = {
	cost: cost,
	points: points,
	efficiency: efficiency
      }

      if (weeks[week].points_max < points)
	weeks[week].points_max = points

      if (weeks[week].cost_max < cost)
	weeks[week].cost_max = cost

      if (weeks[week].efficiency_max < efficiency)
	weeks[week].efficiency_max = efficiency

      if (weeks[week].points_min > points)
	weeks[week].points_min = points

      if (weeks[week].cost_min > cost)
	weeks[week].cost_min = cost

      if (weeks[week].efficiency_min > efficiency)
	weeks[week].efficiency_min = efficiency      
    })
    drafted_points.push(drafted_item)

  })

  // sort
  drafted_points.sort((a, b) => {
    return b.efficiency - a.efficiency
  })

  undrafted_points.sort((a, b) => {
    return b.undrafted_points - a.undrafted_points
  })

  const drafted_parent_thead = document.querySelector('main table.drafted thead')

  let thead_tds = [{
    tag: 'td',
    text: 'Team'
  }, {
    tag: 'td',
    text: 'Overall Efficiency'
  }]

  Object.keys(weeks).forEach(function(week) {
    thead_tds.push({
      tag: 'td',
      text: `Week ${week} Cost`
    })
    thead_tds.push({
      tag: 'td',
      text: `Week ${week} Points`
    })
    thead_tds.push({
      tag: 'td',
      text: `Week ${week} Efficiency`
    })
  })

  Elem.create({
    parent: drafted_parent_thead,
    tag: 'tr',
    childs: thead_tds
  })
  

  const drafted_parent_tbody = document.querySelector('main table.drafted tbody')

  drafted_points.forEach(function(team) {
    let tds = [{
	tag: 'td',
	text: team.name
    }, {
      tag: 'td',
      className: 'stat',
      text: team.efficiency.toFixed(2)
    }]
    Object.keys(team.weeks).forEach(function(week) {
      team.weeks[week].cost_percentage = (team.weeks[week].cost - weeks[week].cost_min) / (weeks[week].cost_max - weeks[week].cost_min)
      team.weeks[week].points_percentage = (team.weeks[week].points - weeks[week].points_min) / (weeks[week].points_max - weeks[week].points_min)
      team.weeks[week].efficiency_percentage = (team.weeks[week].efficiency - weeks[week].efficiency_min) / (weeks[week].efficiency_max - weeks[week].efficiency_min)

      tds.push({
	tag: 'td',
	className: 'stat',	
	text: team.weeks[week].cost
      })

      tds.push({
	tag: 'td',
	className: 'stat',	
	text: team.weeks[week].points.toFixed(2),
	style: {
	  backgroundColor: `rgba(46,163,221,${team.weeks[week].points_percentage})`
	}	
      })

      tds.push({
	tag: 'td',
	className: 'stat',	
	text: team.weeks[week].efficiency.toFixed(2),
	style: {
	  backgroundColor: `rgba(46,163,221,${team.weeks[week].efficiency_percentage})`
	}	
      })
    })

    Elem.create({
      parent: drafted_parent_tbody,
      tag: 'tr',
      childs: tds
    })
  })

  const undrafted_parent = document.querySelector('#undrafted')  
  let undrafted_rows = []
  undrafted_points.forEach(function(team) {
    undrafted_rows.push({
      tag: 'li',
      childs: [{
	tag: 'a',
	attributes: {
	  href: team.href,
	  target: '_blank'
	},
	html: `${team.name} <small>${team.undrafted_points.toFixed(2)}</small`
      }]
    })
  })

  Elem.create({
    parent: undrafted_parent,
    childs: [{
      tag: 'h2',
      text: 'Undrafted Points'
    }, {
      tag: 'ol',
      childs: undrafted_rows
    }]
  })

  console.log(drafted_points)
  console.log(undrafted_points)
  console.log(weeks)

}).error((message) => {
  console.error(message.error)
})

App.data('/player_draft_analysis.json').get().success((data) => {

  let top_value = {}
  let top_points = {}

  Object.keys(data).forEach(function(position) {
    if (position === 'status')
      return

    top_value[position] = data[position].slice()
    top_value[position].sort((a, b) => {
      return b.points_per_dollar - a.points_per_dollar
    })

    top_points[position] = data[position].slice()
    top_points[position].sort((a, b) => {
      return b.points - a.points
    })

  })

  console.log(top_value)
  console.log(data)

  const parentTables = document.querySelector('#tables')
  buildTable({
    data: top_points['qb'].slice(0, 15),
    title: 'Top 15 QB (Points)',
    parent: parentTables
  })

  buildTable({
    data: top_points['rb'].slice(0, 40),
    title: 'Top 40 RB (Points)',
    parent: parentTables
  })

  buildTable({
    data: top_points['wr'].slice(0, 40),
    title: 'Top 40 WR (Points)',
    parent: parentTables
  })

  buildTable({
    data: top_points['te'].slice(0, 15),
    title: 'Top 15 TE (Points)',
    parent: parentTables
  })

  buildTable({
    data: top_points['k'].slice(0, 10),
    title: 'Top 10 K (Points)',
    parent: parentTables
  })

  buildTable({
    data: top_points['dst'].slice(0, 10),
    title: 'Top 10 DST (Points)',
    parent: parentTables
  })

  buildList({
    data: top_value['qb'].slice(0, 20),
    title: 'Top 20 QB Value',
    parent: document.querySelector('.list.qb')
  })

  buildList({
    data: top_value['rb'].slice(0, 20),
    title: 'Top 20 RB Value',
    parent: document.querySelector('.list.rb')
  })

  buildList({
    data: top_value['wr'].slice(0, 20),
    title: 'Top 20 QB Value',
    parent: document.querySelector('.list.wr')
  })

  buildList({
    data: top_value['te'].slice(0, 10),
    title: 'Top 10 TE Value',
    parent: document.querySelector('.list.te')
  })

  buildList({
    data: top_value['k'].slice(0, 10),
    title: 'Top 10 K Value',
    parent: document.querySelector('.list.k')
  })

  buildList({
    data: top_value['dst'].slice(0, 10),
    title: 'Top 10 DST Value',
    parent: document.querySelector('.list.dst')
  })  
  
}).error((message) => {
  console.error(message.error)
})
  
