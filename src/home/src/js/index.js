document.getElementById('date').innerHTML = moment().format('dddd, MMMM D, YYYY')

let week_one = moment('2018-08-28')
let current_week = moment().diff(week_one, 'weeks')
document.getElementById('current-week').innerHTML = `Week ${current_week}`

const sortMoneyline = (a, b) => a.moneyline - b.moneyline
const getMoneyline = (decimal) => {
  const moneyline = decimal < 2.0
    ? ((-100)/(decimal - 1)).toPrecision(5)
    : ((decimal - 1) * 100 ).toPrecision(5)

  return Math.ceil(moneyline / 10) * 10
}

App.api('/news/fantasy').get().success((data) => {
  var parent = document.querySelector('#nfl-news ul')
  data.items.forEach(function(i) {
    Elem.create({
      parent: parent,
      tag: 'li',
      text: i
    })
  })
}).error((message) => {
  console.error(message.error)
})

App.api('/odds').get().success((data) => {
  console.log(data)
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
  var parent = document.querySelector('#player-news ul')
  data.items.forEach(function(i) {
    Elem.create({
      parent: parent,
      tag: 'li',
      childs: [{
	    tag: i.source ? 'a' : 'span',
	    text: i.report,
	    attributes: {
	      href: i.source,
	      target: '_blank'
	    }
      }]
    })
  })
}).error((message) => {
  console.error(message.error)
})

App.api('/adds').get().success((data) => {
  var parent = document.querySelector('#adds ul')
  var items = data.items.slice(0, 15)

  items.forEach(function(i) {
    console.log(i)
    i.detail.forEach(function(d) {
      console.log(d)
      Elem.create({
	    parent: parent,
	    tag: 'li',
	    text: `${d.team} - ${d.player}`
      })
    })
  })
}).error((message) => {
  console.log(message.error)
})

App.data('/weekly_odds.json').get().success(({ boxscores, updated_at }) => {
  console.log(boxscores)
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
    console.log(o.team)
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


  /* App.api('/schedule').get().success((data) => {
   *   let current_matchups = data.items[current_week]
   *   console.log(current_matchups)
   * }).error((message) => {
   *   console.log(message.error)
   * })
   *  */
  App.api('/standings').get().success((data) => {
    let standings = data.items.slice()
    let leaders = data.items.sort((a, b) => {
      return b.points_for - a.points_for
    }).slice(0,4)

    let leaders_parent = document.querySelector('#most-points ol')
    leaders.forEach(function(i) {
      Elem.create({
        parent: leaders_parent,
        tag: 'li',
        childs: [{
	      tag: 'a',
	      attributes: {
	        href: i.team_href,
	        target: '_blank'
	      },
	      text: `${i.team} (${i.points_for})`
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
	        href: i.team_href,
	        target: '_blank'
	      },
	      text: `${i.team} (${i.record})`
        }]
      })
    })
  }).error((err) => {
    console.log(err)
  })

  App.api('/drops').get().success((data) => {
    var parent = document.querySelector('#drops ul')
    var items = data.items.slice(0, 15)

    items.forEach(function(i) {
      i.detail.forEach(function(d) {
        Elem.create({
	      parent: parent,
	      tag: 'li',
	      text: `${d.team} - ${d.player}`
        })
      })
    })
  }).error((message) => {
    console.log(message.error)
  })
