document.getElementById('date').innerHTML = moment().format('dddd, MMMM D, YYYY')

let week_one = moment('2017-08-29')
let current_week = moment().diff(week_one, 'weeks')
document.getElementById('current-week').innerHTML = `Week ${current_week}`

App.api('/odds').get().success((data) => {
  var parent = document.querySelector('main section')

  parent.innerHTML = null

  data.forEach(function(matchup) {
    let rows = []

    matchup.teams.forEach(function(team, index) {
      let probability = matchup.prediction['team' + (index +1)].prob
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
	      href: team.href
	    },
	    text: team.name
	  }]
	}, {
	  tag: 'td',
	  className: 'prob',
	  style: {
	    backgroundColor: `rgba(231,137,116,${probability})`
	  },
	  text: probability * 100
	}, {
	  tag: 'td',
	  className: 'score',
	  text: team.score
	}, {
	  tag: 'td',
	  className: 'proj',
	  text: matchup.prediction['team' + (index +1)].mean
	}]
      })
    })
    
    Elem.create({
      parent: parent,
      className: 'game',
      childs: [{
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
}).error((message) => {
  console.error(message.error)
})
