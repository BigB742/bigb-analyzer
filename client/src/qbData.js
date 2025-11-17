const espnHeadshot = (id) => `https://a.espncdn.com/i/headshots/nfl/players/full/${id}.png`;
const nflHeadshot = (token) => `https://static.www.nfl.com/image/upload/t_headshot_desktop/league/${token}`;

export const qbList = [
  { id: "lamar-jackson", name: "Lamar Jackson", team: "BAL", imageUrl: espnHeadshot(3916387) },
  { id: "daniel-jones", name: "Daniel Jones", team: "IND", imageUrl: nflHeadshot("nhuiypfjzpkisxllinyv") },
  { id: "trevor-lawrence", name: "Trevor Lawrence", team: "JAX", imageUrl: espnHeadshot(4360310) },
  { id: "josh-allen", name: "Josh Allen", team: "BUF", imageUrl: espnHeadshot(3918298) },
  { id: "tua-tagovailoa", name: "Tua Tagovailoa", team: "MIA", imageUrl: espnHeadshot(4241479) },
  { id: "drake-maye", name: "Drake Maye", team: "NE", imageUrl: nflHeadshot("oyap81gtzcvnfmripis1") },
  { id: "bo-nix", name: "Bo Nix", team: "DEN", imageUrl: nflHeadshot("igirshmrr6lqtxcpxsea") },
  { id: "patrick-mahomes", name: "Patrick Mahomes", team: "KC", imageUrl: espnHeadshot(3139477) },
  { id: "justin-herbert", name: "Justin Herbert", team: "LAC", imageUrl: nflHeadshot("s1oelyaroiaalgilbeqk") },
  { id: "jordan-love", name: "Jordan Love", team: "GB", imageUrl: espnHeadshot(4242335) },
  { id: "baker-mayfield", name: "Baker Mayfield", team: "TB", imageUrl: espnHeadshot(3052587) },
  { id: "dak-prescott", name: "Dak Prescott", team: "DAL", imageUrl: espnHeadshot(2577417) },
  { id: "jalen-hurts", name: "Jalen Hurts", team: "PHI", imageUrl: nflHeadshot("c47i9v6gmokkun9cat9s") },
  { id: "matthew-stafford", name: "Matthew Stafford", team: "LAR", imageUrl: espnHeadshot(12483) },
];
