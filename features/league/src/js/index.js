document.getElementById('date').innerHTML = moment().format('dddd, MMMM D, YYYY')

let week_one = moment('2018-08-28')
let current_week = moment().diff(week_one, 'weeks')
document.getElementById('current-week').innerHTML = `Week ${current_week}`

App.data('/league.json').get().success((response) => {
  const data = response.owners
  const records = response.records

  for (const type in records) {
    const parent = document.querySelector(`.record.${type}`)

    let items = []

    const label = {
      'wins': 'Total Wins',
      'losses': 'Total Losses',
      'points': 'Most Points (Single)',
      'points_total':'Total Points',
      'highest_score': 'Highest Single Game Point Total',
      'lowest_score': 'Lowest Single Game Point Total',
      'most_wins': 'Single Season Most Wins',
      'most_losses': 'Single Season Most Losses'
    }

    for (const stat in records[type]) {
      const record = records[type][stat]
      if (!record.value) {
        continue
      }

      items.push({
        html: `<div><span class="label">${label[stat]}</span>  ${record.owner} <strong>(${record.value.toFixed(0)})</strong> <small>${record.season}</small></div>`
      })
    }

    Elem.create({
      parent: parent,
      tag: 'div',
      childs: items
    })
  }

  const baseStats = [
    'win_pct',
    'wins',
    'losses',
    'gp',
    'points_avg',
    'points_total',
    'appearances',
    'appearance_pct'
  ]

  const baseTypes = [
    'overall',
    'season',
    'playoff',
    'championship'
  ]

  let minStats = {}
  let maxStats = {}

  for (const type of baseTypes) {
    minStats[type] = {}
    maxStats[type] = {}
    for (const stat of baseStats) {
      minStats[type][stat] = 100000
      maxStats[type][stat] = 0
    }
  }

  const setMinMax = (type, stat, value) => {
    value = parseFloat(value)

    if (value > maxStats[type][stat]) {
       maxStats[type][stat] = value
    }

    if (value <  minStats[type][stat]) {
       minStats[type][stat] = value
    }
  }

  for (const team in data) {
    if (team === 'status') {
      continue
    }

    for (const type of baseTypes) {
      for (const stat in data[team][type]) {
        if (baseStats.includes(stat)) {
          setMinMax(type, stat, data[team][type][stat])
        }
      }
    }
  }

  const getPercentage = (type, stat, value) => {
    const min = minStats[type][stat]
    const max = maxStats[type][stat]
    return (value - min) / (max - min)
  }

  const overall_parent = document.querySelector('main table.overall tbody')
  for (const name in data) {
    if (name === 'status') {
      continue
    }
    const stats = data[name]

    const overall_tds = [{
      tag: 'td',
      text: name
    }, {
      tag: 'td',
      text: stats.seasons_played
    }, {
      tag: 'td',
      text: stats.championship.wins
    }, {
      tag: 'td',
      text: stats.overall.win_pct,
	  style: {
	    backgroundColor: `rgba(46,163,221,${getPercentage('overall', 'win_pct', stats.overall.win_pct)})`
	  }
    }, {
      tag: 'td',
      text: stats.overall.wins,
	  style: {
	    backgroundColor: `rgba(46,163,221,${getPercentage('overall', 'wins', stats.overall.wins)})`
      }
    }, {
      tag: 'td',
      text: stats.overall.losses,
	  style: {
	    backgroundColor: `rgba(46,163,221,${getPercentage('overall', 'losses', stats.overall.losses)})`
      }
    }, {
      tag: 'td',
      text: stats.overall.gp,
	  style: {
	    backgroundColor: `rgba(46,163,221,${getPercentage('overall', 'gp', stats.overall.gp)})`
      }
    }, {
      tag: 'td',
      text: stats.overall.points_avg,
	  style: {
	    backgroundColor: `rgba(46,163,221,${getPercentage('overall', 'points_avg', stats.overall.points_avg)})`
      }
    }, {
      tag: 'td',
      text: stats.overall.points_total,
	  style: {
	    backgroundColor: `rgba(46,163,221,${getPercentage('overall', 'points_total', stats.overall.points_total)})`
      }
    }]

    Elem.create({
      parent: overall_parent,
      tag: 'tr',
      childs: overall_tds
    })


    const seasons_parent = document.querySelector('main table.seasons tbody')
    const seasons_tds = [{
      tag: 'td',
      text: name
    }, {
      tag: 'td',
      text: stats.season.gp
    }, {
      tag: 'td',
      text: stats.season.win_pct,
	  style: {
	    backgroundColor: `rgba(46,163,221,${getPercentage('season', 'win_pct', stats.season.win_pct)})`
      }
    }, {
      tag: 'td',
      text: stats.season.wins,
	  style: {
	    backgroundColor: `rgba(46,163,221,${getPercentage('season', 'wins', stats.season.wins)})`
      }
    }, {
      tag: 'td',
      text: stats.season.losses,
	  style: {
	    backgroundColor: `rgba(46,163,221,${getPercentage('season', 'losses', stats.season.losses)})`
      }
    }, {
      tag: 'td',
      text: stats.season.points_avg,
	  style: {
	    backgroundColor: `rgba(46,163,221,${getPercentage('season', 'points_avg', stats.season.points_avg)})`
      }
    }, {
      tag: 'td',
      text: stats.season.points_total,
	  style: {
	    backgroundColor: `rgba(46,163,221,${getPercentage('season', 'points_total', stats.season.points_total)})`
      }
    }]
    Elem.create({
      parent: seasons_parent,
      tag: 'tr',
      childs: seasons_tds
    })

    if (stats.playoff.appearances) {
      const playoffs_parent = document.querySelector('main table.playoffs tbody')
      const playoffs_tds = [{
        tag: 'td',
        text: name
      }, {
        tag: 'td',
        text: stats.playoff.appearances,
	    style: {
	      backgroundColor: `rgba(46,163,221,${getPercentage('playoff', 'appearances', stats.playoff.appearances)})`
        }
      }, {
        tag: 'td',
        text: stats.playoff.appearance_pct,
	    style: {
	      backgroundColor: `rgba(46,163,221,${getPercentage('playoff', 'appearance_pct', stats.playoff.appearance_pct)})`
        }
      }, {
        tag: 'td',
        text: stats.playoff.gp
      }, {
        tag: 'td',
        text: stats.playoff.win_pct,
	    style: {
	      backgroundColor: `rgba(46,163,221,${getPercentage('playoff', 'win_pct', stats.playoff.win_pct)})`
        }
      }, {
        tag: 'td',
        text: stats.playoff.wins,
	    style: {
	      backgroundColor: `rgba(46,163,221,${getPercentage('playoff', 'wins', stats.playoff.wins)})`
        }
      }, {
        tag: 'td',
        text: stats.playoff.losses,
	    style: {
	      backgroundColor: `rgba(46,163,221,${getPercentage('playoff', 'losses', stats.playoff.losses)})`
        }
      }, {
        tag: 'td',
        text: stats.playoff.points_avg,
	    style: {
	      backgroundColor: `rgba(46,163,221,${getPercentage('playoff', 'points_avg', stats.playoff.points_avg)})`
        }
      }, {
        tag: 'td',
        text: stats.playoff.points_total,
	    style: {
	      backgroundColor: `rgba(46,163,221,${getPercentage('playoff', 'points_total', stats.playoff.points_total)})`
        }
      }]
      Elem.create({
        parent: playoffs_parent,
        tag: 'tr',
        childs: playoffs_tds
      })
    }

    if (stats.championship.gp) {
      const championships_parent = document.querySelector('main table.championships tbody')
      const championships_tds = [{
        tag: 'td',
        text: name
      }, {
        tag: 'td',
        text: stats.championship.appearances,
	    style: {
	      backgroundColor: `rgba(46,163,221,${getPercentage('championship', 'appearances', stats.championship.appearances)})`
        }
      }, {
        tag: 'td',
        text: stats.championship.appearance_pct,
	    style: {
	      backgroundColor: `rgba(46,163,221,${getPercentage('championship', 'appearance_pct', stats.championship.appearance_pct)})`
        }
      }, {
        tag: 'td',
        text: stats.championship.win_pct,
	    style: {
	      backgroundColor: `rgba(46,163,221,${getPercentage('championship', 'win_pct', stats.championship.win_pct)})`
        }
      }, {
        tag: 'td',
        text: stats.championship.wins,
	    style: {
	      backgroundColor: `rgba(46,163,221,${getPercentage('championship', 'wins', stats.championship.wins)})`
        }
      }, {
        tag: 'td',
        text: stats.championship.losses,
	    style: {
	      backgroundColor: `rgba(46,163,221,${getPercentage('championship', 'losses', stats.championship.losses)})`
        }
      }, {
        tag: 'td',
        text: stats.championship.points_avg,
	    style: {
	      backgroundColor: `rgba(46,163,221,${getPercentage('championship', 'points_avg', stats.championship.points_avg)})`
        }
      }, {
        tag: 'td',
        text: stats.championship.points_total,
	    style: {
	      backgroundColor: `rgba(46,163,221,${getPercentage('championship', 'points_total', stats.championship.points_total)})`
        }
      }]
      Elem.create({
        parent: championships_parent,
        tag: 'tr',
        childs: championships_tds
      })
    }


    const opponent_parent = document.querySelector('.opponents')
    let opponents_childs = [{
      tag: 'h3',
      text: name
    }]
    for (const opponent in stats.opponents) {
      const stat = stats.opponents[opponent]
      opponents_childs.push({
        html: `<div><strong>${stat.wins}-${stat.losses}</strong> vs ${opponent}<small>${stat.points.toFixed(0)} to ${stat.points_against.toFixed(0)}</small></div>`
      })
    }
    Elem.create({
      parent: opponent_parent,
      tag: 'div',
      className: 'list',
      childs: opponents_childs
    })
  }
})
