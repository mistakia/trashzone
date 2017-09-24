module.exports = {
  aliases: {
    'chiefs-dst': 'kansas-city-defense',
    'terrelle-pryor-sr': 'terrelle-pryor',
    'steelers-dst': 'pittsburgh-defense',
    'panthers-dst': 'carolina-defense',
    'seahawks-dst': 'seattle-defense',
    'wil-lutz': 'will-lutz',
    'odell-beckham-jr': 'odell-beckham',
    'rams-dst': 'los-angeles-defense',
    'buccaneers-dst': 'tampa-bay-defense',
    'patriots-dst': 'new-england-defense',
    'michael-thomas': 'michael-thomas-wr',
    'packers-dst': 'green-bay-defense',
    'dolphins-dst': 'miami-defense',
    'broncos-dst': 'denver-defense',
    'ravens-dst': 'baltimore-defense',
    'eagles-dst': 'philadelphia-defense'
  },
  get: function(name) {
    name = name.toLowerCase().replace(/\s/ig, '-')
    name = name.replace(/\//ig, '').replace(/\\/ig, '').replace(/\./ig, '')
    name = name.replace(/\'/ig,'')
    
    name = this.aliases[name] || name

    return name
  }
}
