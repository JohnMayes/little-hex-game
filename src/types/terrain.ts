export type tileVisibility = 'undiscovered' | 'discovered' | 'visible'

export interface Terrain {
  type: TerrainType
  movementCost: number // Movement Factor (MF) to enter
  hoverMovementCost: number // MF for hover units
  directFireModifier: number // Defense modifier for direct fire
  indirectFireModifier: number // Defense modifier for indirect fire
  specialRules?: string[] // Any special movement or combat rules
}

export enum TerrainType {
  Clear = 'Clear',
  Roads = 'Roads & Bridges',
  Slope = 'Slope',
  Hilltop = 'Hilltop',
  City = 'City',
  River = 'River',
  Lake = 'Lake',
  Forest = 'Forest',
  Swamp = 'Swamp',
  Rubble = 'Rubble',
  Fortress = 'Fortress',
}

export const CLEAR: Terrain = {
  type: TerrainType.Clear,
  movementCost: 1,
  hoverMovementCost: 1,
  directFireModifier: 0,
  indirectFireModifier: 2,
}

export const ROADS: Terrain = {
  type: TerrainType.Roads,
  movementCost: 0.5,
  hoverMovementCost: 0.5,
  directFireModifier: 0,
  indirectFireModifier: 2,
  specialRules: ['Road movement ignores terrain of underlying hex']
}

export const SLOPE: Terrain = {
  type: TerrainType.Slope,
  movementCost: 2,
  hoverMovementCost: 2,
  directFireModifier: 2,
  indirectFireModifier: 4,
}

export const HILLTOP: Terrain = {
  type: TerrainType.Hilltop,
  movementCost: 2,
  hoverMovementCost: 2,
  directFireModifier: 2,
  indirectFireModifier: 4,
}

export const CITY: Terrain = {
  type: TerrainType.City,
  movementCost: 0.5,
  hoverMovementCost: 1,
  directFireModifier: 6,
  indirectFireModifier: 8,
}

export const RIVER: Terrain = {
  type: TerrainType.River,
  movementCost: 2,
  hoverMovementCost: 2,
  directFireModifier: 0,
  indirectFireModifier: 2,
  specialRules: ['Towed units may only cross at bridges']
}

export const LAKE: Terrain = {
  type: TerrainType.Lake,
  movementCost: Infinity,
  hoverMovementCost: 1,
  directFireModifier: 0,
  indirectFireModifier: 2,
  specialRules: ['Hover units only']
}

export const FOREST: Terrain = {
  type: TerrainType.Forest,
  movementCost: 2,
  hoverMovementCost: 2,
  directFireModifier: 2,
  indirectFireModifier: 4,
}

export const SWAMP: Terrain = {
  type: TerrainType.Swamp,
  movementCost: 2,
  hoverMovementCost: 1,
  directFireModifier: 0,
  indirectFireModifier: 2,
  specialRules: ['Tracked and wheeled vehicles may not enter', 'Dismounted infantry: 2 MF to enter']
}

export const RUBBLE: Terrain = {
  type: TerrainType.Rubble,
  movementCost: 2, // terrain +1 MF
  hoverMovementCost: 2, // terrain +1 MF
  directFireModifier: 2,
  indirectFireModifier: 2,
  specialRules: ['Additional +1 MF to underlying terrain cost']
}

export const FORTRESS: Terrain = {
  type: TerrainType.Fortress,
  movementCost: 2, // terrain +1 MF
  hoverMovementCost: 2, // terrain +1 MF
  directFireModifier: 12,
  indirectFireModifier: 12,
  specialRules: [
    'Additional +1 MF to underlying terrain cost',
    'Do not add additional terrain bonuses if rubbled',
    'If rubbled, remove fortress and treat as rubble hex'
  ]
}

type TerrainMap = {
  [key in TerrainType]: string
};

export const TerrainColor: TerrainMap = {
  [TerrainType.Clear]: '#90EE90', // Medium Green
  [TerrainType.Roads]: '#FF0000', // Red
  [TerrainType.Slope]: '#D2B48C', // Light Brown
  [TerrainType.Hilltop]: '#8B4513', // Dark Brown
  [TerrainType.City]: '#000000', // Black
  [TerrainType.River]: '#ADD8E6', // Light Blue
  [TerrainType.Lake]: '#0000FF', // Blue
  [TerrainType.Forest]: '#006400', // Dark Green
  [TerrainType.Swamp]: '#90EE90', // Light Green
  [TerrainType.Rubble]: '#808080', // Gray
  [TerrainType.Fortress]: '#696969', // Dark Gray
};

// Line of Sight values based on terrain type and context
export interface LOSValues {
  firing: number;
  intervening: number;
  target: number;
}

// LOS value lookup table from the rules
export const LOS_VALUES: Record<TerrainType, LOSValues> = {
  [TerrainType.Clear]: { firing: 0, intervening: 0, target: 0 },
  [TerrainType.Roads]: { firing: 0, intervening: 0, target: 0 },
  [TerrainType.River]: { firing: 0, intervening: 0, target: 0 },
  [TerrainType.Rubble]: { firing: 0, intervening: 0, target: 0 },
  [TerrainType.Fortress]: { firing: 0, intervening: 0, target: 0 },
  [TerrainType.Swamp]: { firing: 0, intervening: 0, target: 0 },
  [TerrainType.Lake]: { firing: 0, intervening: 0, target: 0 },
  [TerrainType.Forest]: { firing: 0, intervening: 2, target: 0 },
  [TerrainType.City]: { firing: 0, intervening: 2, target: 0 },
  [TerrainType.Slope]: { firing: 1, intervening: 1, target: 1 },
  [TerrainType.Hilltop]: { firing: 2, intervening: 3, target: 2 },
};