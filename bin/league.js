const { league } = require('espnff')
const jsonfile = require('jsonfile')
const path = require('path')

const config = require('../config')

league.get(config.espn, (err, { formatted }) => {
  if (err) {
    console.log(err)
    return
  }

  const file_path = path.resolve(__dirname, '../data/league.json')
  const data = Object.values(formatted)
  jsonfile.writeFileSync(file_path, data, { spaces: 4 })
})
