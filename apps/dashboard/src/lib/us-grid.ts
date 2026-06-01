// Geographic tile-grid positions [code, row, col] — 50 states + DC.
// Copied verbatim from docs/design-bundle/source/overview.jsx (US_GRID).
// Row/col place each state to approximate its real map position on an 11-col grid.
export const US_GRID: [string, number, number][] = [
  ['AK', 1,  1], ['ME', 1, 11],
  ['VT', 2, 10], ['NH', 2, 11],
  ['WA', 3,  1], ['ID', 3,  2], ['MT', 3,  3], ['ND', 3,  4], ['MN', 3,  5], ['WI', 3,  6], ['MI', 3,  8], ['NY', 3,  9], ['MA', 3, 11],
  ['OR', 4,  1], ['NV', 4,  2], ['WY', 4,  3], ['SD', 4,  4], ['IA', 4,  5], ['IL', 4,  6], ['IN', 4,  7], ['OH', 4,  8], ['PA', 4,  9], ['NJ', 4, 10], ['CT', 4, 11],
  ['CA', 5,  1], ['UT', 5,  2], ['CO', 5,  3], ['NE', 5,  4], ['MO', 5,  5], ['KY', 5,  6], ['WV', 5,  7], ['VA', 5,  8], ['MD', 5,  9], ['DE', 5, 10], ['RI', 5, 11],
  ['AZ', 6,  2], ['NM', 6,  3], ['KS', 6,  4], ['AR', 6,  5], ['TN', 6,  6], ['NC', 6,  8], ['DC', 6,  9],
  ['OK', 7,  4], ['LA', 7,  5], ['MS', 7,  6], ['AL', 7,  7], ['GA', 7,  8], ['SC', 7,  9],
  ['HI', 8,  1], ['TX', 8,  4], ['FL', 8,  8],
];

export const US_NAMES: Record<string, string> = {
  AL:'Alabama', AK:'Alaska', AZ:'Arizona', AR:'Arkansas', CA:'California',
  CO:'Colorado', CT:'Connecticut', DE:'Delaware', DC:'District of Columbia',
  FL:'Florida', GA:'Georgia', HI:'Hawaii', ID:'Idaho', IL:'Illinois',
  IN:'Indiana', IA:'Iowa', KS:'Kansas', KY:'Kentucky', LA:'Louisiana',
  ME:'Maine', MD:'Maryland', MA:'Massachusetts', MI:'Michigan', MN:'Minnesota',
  MS:'Mississippi', MO:'Missouri', MT:'Montana', NE:'Nebraska', NV:'Nevada',
  NH:'New Hampshire', NJ:'New Jersey', NM:'New Mexico', NY:'New York',
  NC:'North Carolina', ND:'North Dakota', OH:'Ohio', OK:'Oklahoma', OR:'Oregon',
  PA:'Pennsylvania', RI:'Rhode Island', SC:'South Carolina', SD:'South Dakota',
  TN:'Tennessee', TX:'Texas', UT:'Utah', VT:'Vermont', VA:'Virginia',
  WA:'Washington', WV:'West Virginia', WI:'Wisconsin', WY:'Wyoming',
};
