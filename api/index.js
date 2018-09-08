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

router.get('/schedule', (req, res) => {
  espn.schedule.getByLeague(config.espn, (err, items) => {
    if (err) {
      return res.status(500).send({
	    error: err.toString()
      })
    }

    res.status(200).send({ items })
  })
})

router.get('/standings', (req, res) => {
  espn.standings.get(config.espn, (err, items) => {
    if (err) {
      return res.status(500).send({
	    error: err.toString()
      })
    }

    res.status(200).send({ items })
  })
})

router.get('/drops', (req, res) => {
  espn.activity.get({
    ...config.espn,
    activityType:2,
    tranType:3,
    teamId: -1
  }, (err, items) => {
    if (err) {
      return res.status(500).send({
	    error: err.toString()
      })
    }

    res.status(200).send({ items })
  })
})

router.get('/adds', (req, res) => {
  espn.activity.get({
    ...config.espn,
    activityType:2,
    tranType:2,
    teamId: -1
  }, (err, items) => {
    if (err) {
      return res.status(500).send({
	    error: err.toString()
      })
    }

    res.status(200).send({ items })
  })
})

router.get('/news/rotoworld', (req, res) => {
  request({
    url: 'http://www.rotoworld.com/playernews/nfl/football-player-news'
  }, (err, response, html) => {
    if (err) {
      return res.status(500).send({
	    error: err.toString()
      })
    }

    const $ = cheerio.load(html)
    let items = []

    $('.RW_playernews .pb').each(function(index, element) {
      let link = $(this).find('.source a').attr('href')
      items.push({
	    report: $(this).find('.report').text().trim(),
	    source: link ? link.trim() : ''
      })
    })

    res.status(200).send({ items })
  })
})

router.get('/news/fantasy', (req, res) => {
  request({
    url: 'https://www.4for4.com/'
  }, function(err, response, html) {
    if (err) {
      return res.status(500).send({
	    error: err.toString()
      })
    }

    const $ = cheerio.load(html)

    let items = []
    $('.view-fantasy-news .item-list li a').each(function(index, element) {
      items.push($(this).text())
    })

    res.status(200).send({ items })
  })
})

module.exports = router
