export type UnitSide = 'red' | 'blue';

export type UnitType = 'heavy_tank' 
| 'missile_tank' 
| 'light_tank' 
| 'superheavy' 
| 'howitzer' 
| 'LAD' 
| 'mobile_howitzer' 
| 'GEV' 
| 'light_GEV' 
| 'GEV_carrier' 
| 'infantry' 
| 'heavy_weapons_team' 
| 'engineers';

export type UnitRatings = {
  firepower: number;
  range: number;
  defense: number;
  movement: number;
};

export type UnitStats = {
  side?: UnitSide;
  type: UnitType;
  rating: UnitRatings;
}

export const HeavyTankUnit: UnitStats = {
  type: 'heavy_tank',
  rating: {
    firepower: 4,
    range: 2,
    defense: 3,
    movement: 3
  }
};

export const MissileTankUnit: UnitStats = {
  type: 'missile_tank',
  rating: {
    firepower: 3,
    range: 4,
    defense: 2,
    movement: 2
  }
};

export const LightTankUnit: UnitStats = {
  type: 'light_tank',
  rating: {
    firepower: 2,
    range: 2,
    defense: 2,
    movement: 3
  }
};

export const SuperheavyUnit: UnitStats = {
  type: 'superheavy', // assuming typo: should be 'superheavy'
  rating: {
    firepower: 6, // ×2 suggests two attacks; you'll handle this in logic
    range: 3,
    defense: 5,
    movement: 3
  }
};

export const HowitzerUnit: UnitStats = {
  type: 'howitzer',
  rating: {
    firepower: 6,
    range: 8,
    defense: 1,
    movement: 0
  }
};

export const LADUnit: UnitStats = {
  type: 'LAD',
  rating: {
    firepower: 2,
    range: 8,
    defense: 1,
    movement: 0
  }
};

export const MobileHowitzerUnit: UnitStats = {
  type: 'mobile_howitzer',
  rating: {
    firepower: 6,
    range: 6,
    defense: 2,
    movement: 1
  }
};

export const GEVUnit: UnitStats = {
  type: 'GEV',
  rating: {
    firepower: 2,
    range: 2,
    defense: 2,
    movement: 7 // M4+3: assumed combined movement
  }
};

export const LightGEVUnit: UnitStats = {
  type: 'light_GEV',
  rating: {
    firepower: 1,
    range: 2,
    defense: 1,
    movement: 7 // M4+3
  }
};

export const GEVCarrierUnit: UnitStats = {
  type: 'GEV_carrier',
  rating: {
    firepower: 1,
    range: 2,
    defense: 2,
    movement: 5 // M3+2
  }
};

export const InfantryUnit: UnitStats = {
  type: 'infantry',
  rating: {
    firepower: 1, // assuming light attack
    range: 1,
    defense: 1,
    movement: 2
  }
};

export const HeavyWeaponsTeamUnit: UnitStats = {
  type: 'heavy_weapons_team',
  rating: {
    firepower: 3, // prioritizing 3/4 over 1/1
    range: 4,
    defense: 1,
    movement: 2
  }
};

export const EngineersUnit: UnitStats = {
  type: 'engineers',
  rating: {
    firepower: 2,
    range: 1,
    defense: 2,
    movement: 2
  }
};


