module.exports = {
  PIN: process.env.NETPULSE_PIN || '060606',
  PORT: process.env.PORT || 3001,
  SESSION_SECRET: process.env.SESSION_SECRET || require('crypto').randomBytes(32).toString('hex'),
  RATE_LIMIT: { maxAttempts: 1000, windowMs: 60000 },
  GAME_SERVERS: [
    { name: 'Valorant Mumbai', host: '20.207.0.1', port: 443, region: 'Mumbai', type: 'local', game: 'Valorant' },
    { name: 'Valorant Singapore', host: '13.215.0.1', port: 443, region: 'Singapore', type: 'abroad', game: 'Valorant' },
    { name: 'Valorant Tokyo', host: '43.206.0.1', port: 443, region: 'Tokyo', type: 'abroad', game: 'Valorant' },
    { name: 'Valorant Frankfurt', host: '3.120.0.1', port: 443, region: 'Frankfurt', type: 'abroad', game: 'Valorant' },
    { name: 'Valorant US-West', host: '52.40.0.1', port: 443, region: 'US-West', type: 'abroad', game: 'Valorant' },

    { name: 'CS2 Mumbai SDR', host: '169.150.238.1', port: 27015, region: 'Mumbai', type: 'local', game: 'CS2' },
    { name: 'CS2 Singapore', host: 'sgp-1.valve.net', port: 27015, region: 'Singapore', type: 'abroad', game: 'CS2' },
    { name: 'CS2 EU West', host: '155.133.248.1', port: 27015, region: 'EU West', type: 'abroad', game: 'CS2' },
    { name: 'CS2 US East', host: '162.254.197.1', port: 27015, region: 'US East', type: 'abroad', game: 'CS2' },

    { name: 'PUBG Mumbai', host: '13.127.0.1', port: 443, region: 'Mumbai', type: 'local', game: 'PUBG/BGMI' },
    { name: 'PUBG Singapore', host: '52.76.0.1', port: 443, region: 'Singapore', type: 'abroad', game: 'PUBG/BGMI' },
    { name: 'PUBG Seoul', host: '52.79.0.1', port: 443, region: 'Seoul', type: 'abroad', game: 'PUBG/BGMI' },

    { name: 'Apex Legends Mumbai', host: '13.235.0.1', port: 443, region: 'Mumbai', type: 'local', game: 'Apex Legends' },
    { name: 'Apex Legends Singapore', host: '13.212.0.1', port: 443, region: 'Singapore', type: 'abroad', game: 'Apex Legends' },
    { name: 'Apex Legends US-West', host: '44.237.0.1', port: 443, region: 'US-West', type: 'abroad', game: 'Apex Legends' },
    { name: 'Apex Legends EU', host: '18.200.0.1', port: 443, region: 'EU', type: 'abroad', game: 'Apex Legends' },

    { name: 'Fortnite Mumbai', host: '13.234.0.1', port: 443, region: 'Mumbai', type: 'local', game: 'Fortnite' },
    { name: 'Fortnite NAE', host: '54.162.0.1', port: 443, region: 'NAE', type: 'abroad', game: 'Fortnite' },
    { name: 'Fortnite EU', host: '52.47.0.1', port: 443, region: 'EU', type: 'abroad', game: 'Fortnite' },
    { name: 'Fortnite Asia', host: '13.250.0.1', port: 443, region: 'Asia', type: 'abroad', game: 'Fortnite' },

    { name: 'LoL SEA', host: '203.116.112.1', port: 443, region: 'SEA', type: 'abroad', game: 'League of Legends' },
    { name: 'LoL KR', host: '121.254.171.1', port: 443, region: 'KR', type: 'abroad', game: 'League of Legends' },
    { name: 'LoL JP', host: '104.160.142.1', port: 443, region: 'JP', type: 'abroad', game: 'League of Legends' },
    { name: 'LoL NA', host: '104.160.131.1', port: 443, region: 'NA', type: 'abroad', game: 'League of Legends' },
    { name: 'LoL EUW', host: '104.160.141.1', port: 443, region: 'EUW', type: 'abroad', game: 'League of Legends' },

    { name: 'Dota 2 India', host: '169.150.238.5', port: 27015, region: 'India', type: 'local', game: 'Dota 2' },
    { name: 'Dota 2 SEA', host: '103.28.54.1', port: 27015, region: 'SEA', type: 'abroad', game: 'Dota 2' },
    { name: 'Dota 2 EU', host: '155.133.248.5', port: 27015, region: 'EU', type: 'abroad', game: 'Dota 2' },
    { name: 'Dota 2 US East', host: '208.78.164.1', port: 27015, region: 'US East', type: 'abroad', game: 'Dota 2' },

    { name: 'Minecraft Hypixel', host: 'mc.hypixel.net', port: 25565, region: 'US', type: 'abroad', game: 'Minecraft' },
    { name: 'Minecraft India', host: 'in.mineplex.com', port: 25565, region: 'India', type: 'local', game: 'Minecraft' },
    { name: 'Minecraft 2b2t', host: '2b2t.org', port: 25565, region: 'US', type: 'abroad', game: 'Minecraft' },

    { name: 'Rocket League USE', host: '54.174.0.1', port: 443, region: 'USE', type: 'abroad', game: 'Rocket League' },
    { name: 'Rocket League EU', host: '52.58.0.1', port: 443, region: 'EU', type: 'abroad', game: 'Rocket League' },
    { name: 'Rocket League Asia', host: '13.228.0.1', port: 443, region: 'Asia', type: 'abroad', game: 'Rocket League' },

    { name: 'GTA Online US', host: '185.56.65.1', port: 6672, region: 'US', type: 'abroad', game: 'GTA Online' },
    { name: 'GTA Online EU', host: '185.56.64.1', port: 6672, region: 'EU', type: 'abroad', game: 'GTA Online' },

    { name: 'Warzone Mumbai', host: '13.233.0.1', port: 443, region: 'Mumbai', type: 'local', game: 'Call of Duty Warzone' },
    { name: 'Warzone US', host: '34.117.0.1', port: 443, region: 'US', type: 'abroad', game: 'Call of Duty Warzone' },
    { name: 'Warzone EU', host: '35.246.0.1', port: 443, region: 'EU', type: 'abroad', game: 'Call of Duty Warzone' },

    { name: 'Genshin Impact Asia', host: '47.74.0.1', port: 443, region: 'Asia', type: 'abroad', game: 'Genshin Impact' },
    { name: 'Genshin Impact Global', host: '8.211.0.1', port: 443, region: 'Global', type: 'abroad', game: 'Genshin Impact' },

    { name: 'Honkai Star Rail Asia', host: '47.74.0.2', port: 443, region: 'Asia', type: 'abroad', game: 'Honkai Star Rail' },
    { name: 'Honkai Star Rail Global', host: '8.211.0.2', port: 443, region: 'Global', type: 'abroad', game: 'Honkai Star Rail' }
  ]
};
