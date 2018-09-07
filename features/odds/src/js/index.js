function acr(s){
  var words, acronym, nextWord

  words = s.split(' ')
  acronym= ''
  index = 0
  while (index<words.length) {
    nextWord = words[index]
    acronym = acronym + nextWord.charAt(0)
    index = index + 1
  }
  return acronym
}

document.getElementById('date').innerHTML = moment().format('dddd, MMMM D, YYYY')

let week_one = moment('2018-08-28')
let current_week = moment().diff(week_one, 'weeks')
document.getElementById('current-week').innerHTML = `Week ${current_week}`

const odds_parent = document.querySelector('main section.odds')

const init = function() {
  App.data('/odds_analysis.json').get().success((data) => {

    odds_parent.innerHTML = null

    data.odds.forEach(function(matchup, index) {

      let rows = []
      matchup.forEach(function(team, index) {
	    let probability = team.probability
	    rows.push({
	      tag: 'tr',
	      childs: [{
	        tag: 'td',
            className: 'team-logo',
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
              tag: 'div',
              className: 'label'
            }, {
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
	        text: team.mean.toFixed(1)
	      }, {
	        tag: 'td',
	        className: 'proj',
	        text: team.projection
	      }, {
	        tag: 'td',
	        className: 'proj',
	        text: team.minutes_remaining
	      }]
	    })
      })

      Elem.create({
	    parent: odds_parent,
	    className: 'game',
	    attributes: { id: `matchup${index}` },
	    childs: [{
	      className: 'chart'
        }, {
          className: 'ct-chart'
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
		        text: 'mean'
	          }, {
		        tag: 'td',
		        className: 'proj',
		        text: 'espn proj'
	          }, {
		        tag: 'td',
		        className: 'proj',
		        text: 'Mins. Remaining'
	          }]
	        }]
	      }, {
	        tag: 'tbody',
	        childs: rows
	      }]
	    }]
      })
    })

    data.odds.forEach(function(matchup, index) {
      let team1Data = []
      let team2Data = []
      for (let i=0; i<matchup[0].histogram.cutoff.length; i++) {
        team1Data.push({
          y: matchup[0].histogram.cutoff[i],
          x: matchup[0].histogram.dens[i]
        })
        team2Data.push({
          y: matchup[1].histogram.cutoff[i],
          x: matchup[1].histogram.dens[i]
        })
      }
      new Chartist.Line(`#matchup${index} .ct-chart`, {
        series: [{
          name: acr(matchup[0].name),
          data: team1Data
        }, {
          name: acr(matchup[1].name),
          data: team2Data
        }]
      }, {
        showArea: true,
        showLine: false,
        showPoint: false,
        fullWidth: true,
        axisX: {
          type: Chartist.AutoScaleAxis,
          scaleMinSpace: 20,
          onlyInteger: true,
          showLabel: true,
          showGrid: true,
          onlyInteger: true
        },
        axisY: {
          showLabel: false,
          showGrid: false
        }
      })

      let team1_data = matchup[0].history.probability.map(function(item) {
	    item.date = new Date(item.date)
	    return item
      })

      let team2_data = matchup[1].history.probability.map(function(item) {
	    item.date = new Date(item.date)
	    return item
      })

      MG.data_graphic({
	    data: [team1_data, team2_data],
	    full_width: true,
	    format: 'percentage',
	    height: 200,
	    right: 40,
	    x_accessor: 'date',
	    y_accessor: 'value',
	    area: true,
	    x_extended_ticks: true,
	    legend: [acr(matchup[0].name), acr(matchup[1].name)],
	    colors: ['#3CB852', '#f05b4f'],
	    target: `#matchup${index} .chart`
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
	      html: `${i.team} <small>${i.projected_points_for.toFixed(1)}</small>`
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

const valid_days = [0,1,4,5,6]
const day_of_week = moment().day()

if (valid_days.indexOf(day_of_week) === -1) {
  odds_parent.innerHTML = '<div class="loading">Availble on Sundays and Mondays only</div>'
} else {
  init()
}
