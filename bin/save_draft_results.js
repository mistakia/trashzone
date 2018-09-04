const espn = require('espnff')
const path = require('path')
const jsonfile = require('jsonfile')

const draft_data_file = path.resolve(__dirname, '../data/draft.json')
const draft_data = jsonfile.readFileSync(draft_data_file)

const config = require('../config')

espn.draft.get({
  ...config.espn
}, (err, results) => {
  if (err) {
    return console.log(err)
  }

  jsonfile.writeFileSync(draft_data_file, results, {spaces: 4})
  console.log('Draft Results saved')
})
