import { Store } from "@tanstack/store";
import { Grid, OffsetCoordinates, AxialCoordinates } from "honeycomb-grid";
import { createUnit, Unit } from "./objects/unitObjects";
import { UnitSide, UnitType } from "./types/units";
import { Tile } from "./objects/baseObjects";
import { TEST_MAP } from "./defs/maps";
import { vec2 } from "@littlejs";

type Side = 'red' | 'blue'
type Phase = 'movement' | 'fire';

type Setup = {
  unit: UnitType,
  side: UnitSide,
  pos: OffsetCoordinates
}

interface GameState {
  turn: number;
  activePlayer: Side;
  phase: Phase;
  units: Unit[];
  selectedUnit: Unit | undefined;
  reachableHexes: AxialCoordinates[];
}

export const grid = new Grid(Tile, TEST_MAP.map(Tile.create));

const setup: Setup[] = [
  {unit: 'heavy_tank', side: 'blue', pos: {col: 1, row: 1}},
  {unit: 'infantry', side: 'blue', pos: {col: 0, row: 0}},
  {unit: 'missile_tank', side: 'red', pos: {col: 9, row: 9}},
  {unit: 'infantry', side: 'red', pos: {col: 10, row: 10}},
]

const initialGameState: GameState = {
  turn: 1,
  activePlayer: 'blue',
  phase: 'movement',
  units: setup.map((item) => {
    const hex = grid.getHex(item.pos);
    const vec = vec2(hex?.x, hex?.y);
    const counter = createUnit(vec, item.side, item.unit)
    return counter;
  }),
  selectedUnit: undefined,
  reachableHexes: []
} 

export const gameStore = new Store(initialGameState);