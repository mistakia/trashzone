module.exports = {
  aliases: {
    'chargers-dst': 'san-diego-defense',
    'chiefs-dst': 'kansas-city-defense',
    'will-lutz': 'wil-lutz',
    'bears-dst': 'chicago-defense',
    'cardinals-dst': 'arizona-defense',
    'vikings-dst': 'minnesota-defense',
    'bengals-dst': 'cincinnati-defense',
    'giants-dst': 'new-york-giants-defense',
    'jaguars-dst': 'jacksonville-defense',
    'terrelle-pryor-sr': 'terrelle-pryor',
    'alex-smith': 'alex-smith-sf',
    'texans-dst': 'houston-defense',
    'todd-gurley-ii': 'todd-gurley',
    'rob-kelley': 'robert-kelley',
    'steelers-dst': 'pittsburgh-defense',
    'panthers-dst': 'carolina-defense',
    'seahawks-dst': 'seattle-defense',
    'titans-dst': 'tennessee-defense',
    'saints-dst': 'new-orleans-defense',
    'adrian-peterson': 'adrian-peterson-min',
    'redskins-dst': 'washington-defense',
    'falcons-dst': 'atlanta-defense',
    'odell-beckham-jr': 'odell-beckham',
    'rams-dst': 'los-angeles-defense',
    'buccaneers-dst': 'tampa-bay-defense',
    'patriots-dst': 'new-england-defense',
    'michael-thomas': 'michael-thomas-wr',
    'packers-dst': 'green-bay-defense',
    'dolphins-dst': 'miami-defense',
    'broncos-dst': 'denver-defense',
    'ravens-dst': 'baltimore-defense',
    'eagles-dst': 'philadelphia-defense',
    'will-fuller-v': 'will-fuller',
    'bills-dst': 'buffalo-defense',
    'jets-dst': 'new-york-jets-defense',
    'marvin-jones-jr': 'marvin-jones',
    'lions-dst': 'detroit-defense',
    'stephen-hauschka': 'steven-hauschka',
    'duke-johnson-jr': 'duke-johnson'
  },
  get: function(name) {
    name = name.toLowerCase().replace(/\s/ig, '-')
    name = name.replace(/\//ig, '').replace(/\\/ig, '').replace(/\./ig, '')
    name = name.replace(/\'/ig,'')
    
    name = this.aliases[name] || name

    return name
  }
}
