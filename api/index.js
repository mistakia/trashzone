const express = require('express')
const cheerio = require('cheerio')
const request = require('request')
const espn = require('espnff')
const jsonfile = require('jsonfile')
const path = require('path')

const config = require('../config')

const router = express.Router()

const odds_data_path = path.resolve(__dirname, '../data/power_rankings.json')

router.get('/odds', (req, res) => {
  try {
    const { standings } = jsonfile.readFileSync(odds_data_path)

    const odds = standings.map((team) => ({
      team: team.team,
      playoff: team.playoff_odds,
      championship: team.championship_odds
    }))

    res.status(200).send(odds)
  } catch (e) {
    res.status(500).send({ error: e.toString() })
  }
})

router.get('/news/rotoworld', (req, res) => {
  request({
    url: 'https://www.rotoworld.com/api/player_news?sort=-created&page%5Blimit%5D=20&page%5Boffset%5D=0&filter%5Bleague%5D=21&include=player,position,team,team.secondary_logo,player.image,related_players,related_teams',
    json: true,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36'
    }
  }, (err, response, data) => {
    if (err) {
      return res.status(500).send({
	    error: err.toString()
      })
    }

    res.status(200).send({ items: data.data })
  })
})

module.exports = router
