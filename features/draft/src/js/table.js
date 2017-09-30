const buildTable = function(opts) {
  let min = 1000
  let max = 0

  opts.data.forEach(function(player) {
    if (max < player.points_per_dollar)
      max = player.points_per_dollar

    if (min > player.points_per_dollar)
      min = player.points_per_dollar
  })
  
  let data_rows = []
  opts.data.forEach(function(player, index) {
    let percentage = (player.points_per_dollar - min) / (max - min)
    data_rows.push({
      tag: 'tr',
      childs: [{
	tag: 'td',
	text: `${index + 1}. ${player.name}`
      }, {
	tag: 'td',
	text: player.team.abbrev
      }, {
	tag: 'td',
	className: 'stat',	
	text: player.points
      }, {
	tag: 'td',
	className: 'stat',
	text: player.price
      }, {
	tag: 'td',
	className: 'stat',
	style: {
	  backgroundColor: `rgba(46,163,221,${percentage})`
	},	
	text: `${player.points_per_dollar.toFixed(2)}pts/$`
      }]
    })    
  })
  Elem.create({
    tag: 'table',
    parent: opts.parent,
    childs: [{
      tag: 'thead',
      childs: [{
	tag: 'tr',
	childs: [{
	  tag: 'td',
	  attributes: {
	    colspan: '100%'
	  },
	  text: opts.title
	}]
      }, {
	tag: 'tr',
	childs: [{
	  tag: 'td',
	  text: 'Player'
	}, {
	  tag: 'td',
	  text: 'Team'
	}, {
	  tag: 'td',
	  text: 'Points'
	}, {
	  tag: 'td',
	  text: 'Cost'
	}, {
	  tag: 'td',
	  text: 'Pts/$'
	}]
      }],
    }, {
      tag: 'tbody',
      childs: data_rows
    }]
  })
}
