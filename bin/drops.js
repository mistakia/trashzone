const { activity } = require('espnff')
const jsonfile = require('jsonfile')
const path = require('path')

const config = require('../config')

activity.get({
  ...config.espn,
  activityType:2,
  tranType:3,
  teamId: -1
}, (err, items) => {
  if (err) {
    console.log(err)
    return
  }

  const file_path = path.resolve(__dirname, '../data/drops.json')
  jsonfile.writeFileSync(file_path, items, { spaces: 4 })
})
