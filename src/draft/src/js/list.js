const buildList = function(opts) {
  const rows = []
  opts.data.forEach(function(player) {
    rows.push({
      tag: 'li',
      html: `${player.name} (${player.team.abbrev}) <small>${player.points_per_dollar.toFixed(2)}pts/$</small`
    })    
  })

  Elem.create({
    parent: opts.parent,
    childs: [{
      tag: 'h2',
      text: opts.title
    }, {
      tag: 'ol',
      childs: rows
    }]
  })
}
