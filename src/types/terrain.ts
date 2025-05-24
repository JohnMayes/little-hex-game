export type tileVisibility = 'undiscovered' | 'discovered' | 'visible'

export interface Terrain {
  type: TerrainType
  passable: boolean
  opaque: boolean
}

export enum TerrainType {
  Field = 'Field',
  Water = 'Water',
  Trees = 'Trees',
  Building = 'Building',
  Road = 'Road',
}

export const FIELD: Terrain = {
  type: TerrainType.Field,
  passable: true,
  opaque: false,
}

export const WATER: Terrain = {
  type: TerrainType.Water,
  passable: false,
  opaque: false,
}

export const TREES: Terrain = {
  type: TerrainType.Trees,
  passable: false,
  opaque: true,
}

export const BUILDING: Terrain = {
  type: TerrainType.Building,
  passable: false,
  opaque: true,
}

export const ROAD: Terrain = {
  type: TerrainType.Road,
  passable: true,
  opaque: false,
}

type TerrainMap = {
  [key in TerrainType]: string
};

export const TerrainColor: TerrainMap = {
  Field: '#2ecc40',
  Water: '#0074d9',
  Trees: '#3d9970',
  Building: '#999',
  Road: '#666'
}