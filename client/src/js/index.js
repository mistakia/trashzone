document.getElementById('date').innerHTML = moment().format('dddd, MMMM D, YYYY')

let week_one = moment('2018-08-28')
let current_week = moment().diff(week_one, 'weeks')
document.getElementById('current-week').innerHTML = `Week ${current_week}`

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

App.data('/weekly_odds.json').get().success((data) => {
  console.log(data)
  let parent = document.querySelector('#matchups')
  data.forEach(function(matchups) {
    const child = (team) => {
      const probability = team.probability * 100
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
