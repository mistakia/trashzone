document.getElementById('date').innerHTML = moment().format('dddd, MMMM D, YYYY')
let week_one = moment('2018-08-28')
let current_week = moment().diff(week_one, 'weeks')
document.getElementById('current-week').innerHTML = `Week ${current_week}`

const parent = document.querySelector('main section.rankings')
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

App.data('/power_rankings.json').get().success(({ standings, history }) => {
  parent.innerHTML = null

  console.log(standings)
  console.log(history)
  standings.forEach((team, index) => {

    const html = `
      <div class='heading'>
        <div class='team-name'>
          <small>${index+1}.</small> ${team.team}<small>${team.record}</small>
        </div>
        <div class='stat-container'>
          <div class='stat'>
            <div class='stat-heading'><span>wins</span></div>
            <div class='stat-value'>${team.avg_simulated_wins}</div>
          </div>
          <div class='stat'>
            <div class='stat-heading'><span>losses</span></div>
            <div class='stat-value'>${team.avg_simulated_losses}</div>
          </div>
          <div class='stat'>
            <div class='stat-heading'><span>projected points</span></div>
            <div class='stat-value'>${team.total_points}</div>
          </div>
          <div class='stat'>
            <div class='stat-heading'><span>make playoffs</span></div>
            <div class='stat-value'>${(team.playoff_odds * 100).toFixed(1)}%</div>
          </div>
          <div class='stat'>
            <div class='stat-heading'><span>1st-round bye</span></div>
            <div class='stat-value'>${(team.first_round_bye_odds * 100).toFixed(1)}%</div>
          </div>
          <div class='stat'>
            <div class='stat-heading'><span>win championship</span></div>
            <div class='stat-value'>${(team.championship_odds * 100).toFixed(1)}%</div>
          </div>
        </div>
      </div>
      <div class='chart'></div>
    `

    Elem.create({
      className: 'team',
      attributes: {
        id: `team${team.team_id}`
      },
      parent: parent,
      html: html
    })

    const odds_history = history[team.team_id]

    let odds_data = odds_history.map((item) => {
	  item.date = new Date(item.date)
      item.value = item.playoff
	  return item
    })

    const random = Math.floor(Math.random() * odds_data.length) + 1

    MG.data_graphic({
	  data: [odds_data],
	  full_width: true,
	  format: 'percentage',
	  height: 200,
	  right: 40,
	  x_accessor: 'date',
	  y_accessor: 'value',
	  area: true,
	  x_extended_ticks: true,
	  colors: ['#f05b4f'],
      markers: [{date: odds_data[random - 1].date, 'label': `${acr(team.team)} picked up Trash`}],
	  target: `#team${team.team_id} .chart`
    })
  })



}).error((message) => {
  console.error(message.error)
})
