const express = require('express')
const cheerio = require('cheerio')
const request = require('request')
const espn = require('espnff')

const router = express.Router()

router.get('/schedule', function(req, res) {
  espn.schedule.getByLeague({
    leagueId:147002,
    seasonId:2017
  }, function(err, items) {
    if (err)
      return res.status(500).send({
	error: err
      })

    res.status(200).send({ items: items })
  })
})

router.get('/standings', function(req, res) {
  espn.standings.get({
    leagueId:147002,
    seasonId:2017
  }, function(err, items) {
    if (err)
      return res.status(500).send({
	error: err
      })

    res.status(200).send({ items: items })
  })
})

router.get('/drops', function(req, res) {
  espn.activity.get({
    leagueId:147002,
    seasonId:2017,
    activityType:2,
    tranType:3,
    teamId: -1
  }, function(err, items) {
    if (err)
      return res.status(500).send({
	error: err
      })

    res.status(200).send({ items: items })
  })
})

router.get('/adds', function(req, res) {
  espn.activity.get({
    leagueId:147002,
    seasonId:2017,
    activityType:2,
    tranType:2,
    teamId: -1
  }, function(err, items) {
    if (err)
      return res.status(500).send({
	error: err
      })

    res.status(200).send({ items: items })
  })
})

router.get('/news/rotoworld', function(req, res) {
  request({
    url: 'http://www.rotoworld.com/playernews/nfl/football-player-news'
  }, function(err, response, html) {
    if (err)
      return res.status(500).send({
	error: err
      })

    const $ = cheerio.load(html)
    let items = []

    $('.RW_playernews .pb').each(function(index, element) {
      let link = $(this).find('.source a').attr('href')
      items.push({
	report: $(this).find('.report').text().trim(),
	source: link ? link.trim() : ''
      })
    })

    res.status(200).send({ items: items })
  })
})

router.get('/news/fantasy', function(req, res) {
  request({
    url: 'https://www.4for4.com/'
  }, function(err, response, html) {
    if (err)
      return res.status(500).send({
	error: err
      })

    const $ = cheerio.load(html)

    let items = []
    $('.view-fantasy-news .item-list li a').each(function(index, element) {
      items.push($(this).text())
    })

    res.status(200).send({ items: items })
  })
})

module.exports = router
