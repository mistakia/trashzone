document.getElementById('date').innerHTML = moment().format('dddd, MMMM D, YYYY')

let week_one = moment('2019-08-27')
let current_week = moment().diff(week_one, 'weeks')
document.getElementById('current-week').innerHTML = `Week ${current_week}`

const sortMoneyline = (a, b) => a.moneyline - b.moneyline
const getMoneyline = (decimal) => {
  const moneyline = decimal < 2.0
    ? ((-100)/(decimal - 1)).toPrecision(5)
    : ((decimal - 1) * 100 ).toPrecision(5)

  return Math.ceil(moneyline / 10) * 10
}

App.api('/odds').get().success((data) => {
  let playoff_odds = []
  let championship_odds = []

  let playoff_odds_parent = document.querySelector('#playoff-odds')
  let championship_odds_parent = document.querySelector('#championship-odds')

  data.forEach((o) => {
    playoff_odds.push({
      team: o.team,
      moneyline: getMoneyline(1/o.playoff)
    })
    championship_odds.push({
      team: o.team,
      moneyline: getMoneyline(1/o.championship)
    })
  })


  playoff_odds = playoff_odds.sort(sortMoneyline)
  championship_odds = championship_odds.sort(sortMoneyline)

  const addOddsElement = (o, parent) => {
    Elem.create({
      parent: parent,
      tag: 'div',
      className: 'team',
      childs: [{
        tag: 'div',
        className: 'name',
	    text: o.team
      }, {
        tag: 'div',
        className: 'moneyline',
        text: o.moneyline
      }]
    })
  }

  playoff_odds.forEach((o) => addOddsElement(o, playoff_odds_parent))
  championship_odds.forEach((o) => addOddsElement(o, championship_odds_parent))

}).error(message => {
  console.error(message.error)
})

App.api('/news/rotoworld').get().success((data) => {
  const newsParent = document.querySelector('#player-news ul')
  const analysisParent = document.querySelector('#player-analysis')
  data.items.forEach(function(i) {
    let childs = [{
	  tag: i.attributes.source_url ? 'a' : 'span',
	  text: i.attributes.headline,
	  attributes: {
	    href: i.attributes.source_url,
	    target: '_blank'
	  }
    }]

    if (i.attributes.analysis) {
      childs.push({
        tag: 'div',
        html: i.attributes.analysis.processed
      })
      Elem.create({
        parent: analysisParent,
        tag: 'article',
        childs
      })
    } else {
      Elem.create({
        parent: newsParent,
        tag: 'li',
        childs
      })
    }
  })
}).error((message) => {
  console.error(message.error)
})

App.data('/weekly_odds.json').get().success(({ boxscores, updated_at }) => {
  let odds = []
  let parent = document.querySelector('#matchups')
  boxscores.forEach(function(matchups) {
    const child = (team) => {
      const probability = team.probability * 100
      odds.push({
        team: team.name,
        odds: 1/team.probability
      })
      const favorite = probability > 50
      const className = favorite ? 'team favorite' : 'team'
      return {
        tag: 'div',
        className,
        childs: [{
	      tag: 'a',
	      attributes: {
	        href: team.href,
	        target: '_blank'
	      },
	      className: 'text',
	      text: team.name
        }, {
          tag: 'div',
          className: 'prob-bar',
          attributes: {
            style: `width: ${probability}%`
          }
        }, {
          tag: 'small',
          className: 'prob-percentage',
          text: `${probability.toFixed(2)}%`
        }]
      }
    }

    Elem.create({
      parent: parent,
      className: 'matchup',
      childs: [child(matchups[1]), child(matchups[0])]
    })
  })

  Elem.create({
    parent: parent,
    className: 'timestamp',
    text: `Last updated on ${moment(updated_at).format('dddd [the] Do [at] h:mm:ss a')}`
  })

  Elem.create({
    parent: parent,
    tag: 'small',
    text: '*based on current, not optimized, lineup'
  })

  let weekly_odds_parent = document.querySelector('#weekly-odds')
  odds.forEach((o) => {
    o.moneyline = getMoneyline(o.odds)
  })

  odds = odds.sort(sortMoneyline)

  odds.forEach((o) => {
    Elem.create({
      parent: weekly_odds_parent,
      tag: 'div',
      className: 'team',
      childs: [{
        tag: 'div',
        className: 'name',
	    text: o.team
      }, {
        tag: 'div',
        className: 'moneyline',
        text: o.moneyline
      }]
    })
  })
}).error((message) => {
  console.log(message.error)
})


App.data('/league.json').get().success((data) => {
  console.log(data)
  let standings = data.slice().sort((a, b) => a.playoffSeed - b.playoffSeed)
  let leaders = data.sort((a, b) => b.points - a.points).slice(0,6)
  let leaders_parent = document.querySelector('#most-points ol')
  leaders.forEach(function(i) {
    Elem.create({
      parent: leaders_parent,
      tag: 'li',
      childs: [{
	    tag: 'a',
	    attributes: {
	      href: i.href,
	      target: '_blank'
	    },
	    text: `${i.name} (${i.points})`
      }]
    })
  })

  let standings_parent = document.querySelector('#standings ol')
  standings.forEach(function(i) {
    Elem.create({
      parent: standings_parent,
      tag: 'li',
      childs: [{
	    tag: 'a',
	    attributes: {
	      href: i.href,
	      target: '_blank'
	    },
	    text: `${i.name} (${i.record.overall.wins}-${i.record.overall.losses}-${i.record.overall.ties})`
      }]
    })
  })
}).error((err) => {
  console.log(err)
})

App.data('/drops.json').get().success((data) => {
  var parent = document.querySelector('#drops ul')
  var items = data.slice(0, 15)

  items.forEach(function(i) {
    if (i.detail.player)
      Elem.create({
	    parent: parent,
	    tag: 'li',
	    text: i.detail.player
      })
  })
}).error((message) => {
  console.log(message.error)
})

App.data('/adds.json').get().success((data) => {
  var parent = document.querySelector('#adds ul')
  var items = data.slice(0, 15)

  items.forEach(function(i) {
    if (i.detail.player) {
      Elem.create({
	    parent: parent,
	    tag: 'li',
	    text: i.detail.player
      })
    }
  })
}).error((message) => {
  console.log(message.error)
})
