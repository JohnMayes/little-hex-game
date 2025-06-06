import { Store } from "@tanstack/store";
import { Grid, OffsetCoordinates, AxialCoordinates, Point } from "honeycomb-grid";
import { createUnit, Unit } from "./objects/unitObjects";
import { UnitSide, UnitType } from "./types/units";
import { Tile } from "./objects/baseObjects";
import { TEST_MAP } from "./defs/maps";
import { vec2 } from "@littlejs";

export type MovingPlayer = 'red' | 'blue'
export type Phase = 'movement' | 'fire';

type Setup = {
  unit: UnitType,
  side: UnitSide,
  pos: OffsetCoordinates
}

interface CombatState {
  selectedFiringUnit: Unit | undefined;
  validTargets: Unit[];
  hoveredTarget: Unit | undefined;
  losLines: Array<{ from: Point; to: Point; blocked: boolean }>;
  visibleHexes: AxialCoordinates[];
}

interface GameState {
  turn: number;
  movingPlayer: MovingPlayer;
  firingPlayer: MovingPlayer;
  phase: Phase;
  units: Unit[];
  selectedUnit: Unit | undefined;
  reachableHexes: AxialCoordinates[];
  movementPath: Point[];
  combat: CombatState;
}

export const grid = new Grid(
  Tile,
  TEST_MAP.map(tile => Tile.create({
    ...tile,
    cost: tile.terrain.movementCost,
  }))
);

const setup: Setup[] = [
  {unit: 'heavy_tank', side: 'blue', pos: {col: 1, row: 1}},
  {unit: 'infantry', side: 'blue', pos: {col: 0, row: 0}},
  {unit: 'missile_tank', side: 'red', pos: {col: 9, row: 9}},
  {unit: 'infantry', side: 'red', pos: {col: 10, row: 10}},
]

const initialGameState: GameState = {
  turn: 1,
  movingPlayer: 'blue',
  firingPlayer: 'blue',
  phase: 'movement',
  units: setup.map((item) => {
    const hex = grid.getHex(item.pos);
    const vec = vec2(hex?.x, hex?.y);
    return createUnit(vec, item.side, item.unit);
  }),
  selectedUnit: undefined,
  reachableHexes: [],
  movementPath: [],
  combat: {
    selectedFiringUnit: undefined,
    validTargets: [],
    hoveredTarget: undefined,
    losLines: [],
    visibleHexes: []
  }
};

export const gameStore = new Store(initialGameState);