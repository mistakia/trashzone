document.getElementById('date').innerHTML = moment().format('dddd, MMMM D, YYYY')

let week_one = moment('2017-08-29')
let current_week = moment().diff(week_one, 'weeks')
document.getElementById('current-week').innerHTML = `Week ${current_week}`

const odds_parent = document.querySelector('main section.odds')

const day_of_week = moment().day()

const init = function() {
  App.data('/odds_analysis.json').get().success((data) => {

    odds_parent.innerHTML = null

    data.odds.forEach(function(matchup, index) {

      matchup.forEach(function(team, index) {
	let rows = []
	let probability = team.probability
	rows.push({
	  tag: 'tr',
	  childs: [{
	    tag: 'td',
	    childs: [{
	      className: 'logo',
	      style: {
		backgroundImage: `url(${team.image})`
	      }
	    }]
	  }, {
	    tag: 'td',
	    className: 'team',
	    childs: [{
	      tag: 'a',
	      attributes: {
		href: team.href,
		target: '_blank'
	      },
	      text: team.name
	    }]
	  }, {
	    tag: 'td',
	    className: 'prob',
	    style: {
	      backgroundColor: `rgba(231,137,116,${probability})`
	    },
	    text: `${Math.floor(probability * 100)}%`
	  }, {
	    tag: 'td',
	    className: 'score',
	    text: team.score
	  }, {
	    tag: 'td',
	    className: 'proj',
	    text: team.projection
	  }]
	})

	Elem.create({
	  parent: odds_parent,
	  className: 'game',
	  childs: [{

	    childs: [{
  	      className: 'ct-chart ct-golden-section',
	      attributes: { id: `matchup${index}team${team.id}` }
	    }]

	  }, {
	    tag: 'table',
	    childs: [{
	      tag: 'thead',
	      childs: [{
		tag: 'tr',
		childs: [{
		  tag: 'td'
		}, {
		  tag: 'td'
		}, {
		  tag: 'td',
		  text: 'win prob.'
		}, {
		  tag: 'td',
		  className: 'score',
		  text: 'score'
		}, {
		  tag: 'td',
		  className: 'proj',
		  text: 'proj'
		}]
	      }]
	    }, {
	      tag: 'tbody',
	      childs: rows
	    }]
	  }]
	})	
      })

      matchup.forEach(function(team, index) {
	let chart_data = matchup[index].history
	chart_data = chart_data.map(function(prob) {
	  return prob * 100
	})
	console.log(matchup[index].history)      
	MG.data_graphic({
	  title: "Confidence Band",
	  description: "This is an example of a graphic with a confidence band and extended x-axis ticks enabled.",
	  data: matchup[index].history,
	  //format: 'percentage',
	  width: '100%',
	  height: 200,
	  right: 40,
	  area: false,
	  target: `#matchup${index}team${team.id}`,
	  show_secondary_x_label: false,
	  //show_confidence_band: ['l', 'u'],
	  x_extended_ticks: true
	});

	/* new Chartist.Line(, {
	   labels: [0, 100],
	   series: [chart_data]
	   }, {
	   high: 100,
	   low: 0,
	   showArea: true,
	   showLine: false,
	   showPoint: false,
	   fullWidth: true,
	   axisX: {
	   showLabel: false,
	   showGrid: false
	   }
	   })*/
      })
    })


    let standings = data.standings.slice()
    let leaders = data.standings.sort((a, b) => {
      return b.projected_points_for - a.projected_points_for
    }).slice(0,4)

    let leaders_parent = document.querySelector('#most-points')
    let most_points_rows = []
    leaders.forEach(function(i) {
      most_points_rows.push({
	tag: 'li',
	childs: [{
	  tag: 'a',
	  attributes: {
	    href: i.team_href,
	    target: '_blank'
	  },
	  html: `${i.team} <small>${i.projected_points_for}</small>`
	}]
      })
    })

    Elem.create({
      parent: leaders_parent,
      childs: [{
	tag: 'h2',
	text: 'Projected Point Leaders'
      }, {
	tag: 'ol',
	childs: most_points_rows
      }]
    })

    standings.sort((a, b) => {
      return b.projected_wins - a.projected_wins || b.projected_points_for - a.projected_points_for
    })

    let standings_parent = document.querySelector('#standings')
    let standings_rows = []
    standings.forEach(function(i) {
      standings_rows.push({
	tag: 'li',
	childs: [{
	  tag: 'a',
	  attributes: {
	    href: i.team_href,
	    target: '_blank'
	  },
	  html: `${i.team} <small>${i.projected_wins}-${i.projected_losses}-${i.projected_ties}</small>`
	}]
      })
    })

    Elem.create({
      parent: standings_parent,
      childs: [{
	tag: 'h2',
	text: 'Projected Standings'
      }, {
	tag: 'ol',
	childs: standings_rows
      }]
    })
  }).error((message) => {
    console.error(message.error)
  })
}

if (day_of_week !== 0 && day_of_week !== 1) {
  odds_parent.innerHTML = '<div class="loading">Availble on Sundays and Mondays only</div>'
} else {
  init()
}
