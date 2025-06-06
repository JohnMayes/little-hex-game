import * as LittleJS from '@littlejs';
import { gameStore, grid } from './store';
import { Unit } from './objects/unitObjects';
import { AxialCoordinates, Point, ring } from 'honeycomb-grid';
import { aStar } from 'abstract-astar';
import { Tile } from './objects/baseObjects';
import { deselectUnit } from './utils';

// Optimized reachable hex calculation with caching
const reachableHexCache = new Map<string, { hexSet: Set<string>, tiles: Tile[] }>();

export function getReachableHexes(start: Tile, movementPoints: number): { hexSet: Set<string>, tiles: Tile[] } {
  const cacheKey = `${start.q},${start.r},${movementPoints}`;
  
  if (reachableHexCache.has(cacheKey)) {
    return reachableHexCache.get(cacheKey)!;
  }

  const visited = new Map<string, number>();
  const queue: { tile: Tile; cost: number }[] = [{ tile: start, cost: 0 }];
  const reachableTiles: Tile[] = [];

  while (queue.length > 0) {
    const { tile, cost } = queue.shift()!;
    const key = `${tile.q},${tile.r}`;

    if (visited.has(key) && visited.get(key)! <= cost) continue;
    visited.set(key, cost);
    reachableTiles.push(tile);

    const neighbors = grid.traverse(ring({ radius: 1, center: tile })).toArray();

    for (const neighbor of neighbors) {
      const nextCost = cost + neighbor.cost;
      if (nextCost <= movementPoints) {
        queue.push({ tile: neighbor, cost: nextCost });
      }
    }
  }

  const hexSet = new Set(visited.keys());
  const result = { hexSet, tiles: reachableTiles };
  reachableHexCache.set(cacheKey, result);
  
  return result;
}

function getReachableHexSet(center: { q: number; r: number }, movementPoints: number): Set<string> {
  const centerTile = grid.getHex(center);
  if (!centerTile) return new Set();

  const { hexSet } = getReachableHexes(centerTile, movementPoints);
  return hexSet;
}

function setHexesInRange(center: { q: number; r: number }, distance: number) {
  const centerTile = grid.getHex(center);
  if (!centerTile) {
    gameStore.state.reachableHexes = [];
    return;
  }

  const { tiles } = getReachableHexes(centerTile, distance);
  gameStore.state.reachableHexes = tiles.map(({ q, r }) => ({ q, r }));
}

function calculateMovementPath(fromPos: Point, toPos: Point, movementPoints: number) {
  const start = grid.pointToHex(fromPos);
  const goal = grid.pointToHex(toPos);

  // Get reachable tiles with optimized lookup
  const { hexSet: reachableSet } = getReachableHexes(start, movementPoints);
  const goalKey = `${goal.q},${goal.r}`;

  // If goal is not reachable, exit early
  if (!reachableSet.has(goalKey)) return [];

  // Now safely run aStar since goal is within range
  const shortestPath = aStar<Tile>({
    start,
    goal,
    estimateFromNodeToGoal: (tile) => grid.distance(tile, goal),
    neighborsAdjacentToNode: (center) =>
      grid
        .traverse(ring({ radius: 1, center }))
        .toArray()
        .filter(n => reachableSet.has(`${n.q},${n.r}`)), // Use axial coordinates
    actualCostToMove: (_, __, tile) => tile.cost,
  });

  return shortestPath;
}

function selectUnit(unit: Unit) {
  // Only allow selection of units that can move and aren't moving
  if (!unit.canBeSelected()) {
    console.log('Unit cannot be selected (no movement or currently moving)');
    return;
  }

  // Clear previous selections
  gameStore.state.units.forEach((u) => (u.selected = false));

  // Select new unit
  unit.selected = true;
  gameStore.state.selectedUnit = unit;

  // Calculate reachable hexes using cached coordinates
  const unitHex = unit.getHexCoords(grid);
  setHexesInRange(unitHex, unit.remainingMovement);
}

function attemptMove(unit: Unit, targetPos: Point) {
  // Don't allow movement if unit is already moving
  if (unit.isMoving) {
    return;
  }

  const targetHex = grid.pointToHex(targetPos);
  const isReachable = gameStore.state.reachableHexes?.some(
    (hex) => hex.q === targetHex.q && hex.r === targetHex.r
  );

  if (isReachable) {
    // Calculate the movement path
    const path = calculateMovementPath(unit.pos, targetPos, unit.movement);
    if (path) {
      const movementCost = path.slice(1).reduce(
        (total, tile) => total + tile.terrain.movementCost,
        0
      );
      const pathToVecArray = path.map((p) => LittleJS.vec2(p.x, p.y));
      unit.moveAnimated(
        pathToVecArray,
        movementCost,
        (remainingMovement: number) => {
          if (remainingMovement <= 0) {
            // No movement left, deselect
            deselectUnit();
          } else {
            // Recalculate reachable hexes for continued movement
            const newHex = unit.getHexCoords(grid);
            setHexesInRange(newHex, remainingMovement);
          }
        }
      );

      // Clear movement path preview while animating
      gameStore.state.movementPath = [];
    }
  } else {
    console.log('Target hex is not reachable');
  }
}

// Clear reachable hex cache when needed (e.g., turn changes)
export function clearReachableHexCache() {
  reachableHexCache.clear();
}

// Path preview optimization
let lastPreviewHex: string | null = null;
let previewThrottleTime = 0;
const PREVIEW_THROTTLE_MS = 100; // Only update preview every 100ms

const MovementManager = {
  update() {
    if (gameStore.state.phase === 'movement') {
      if (LittleJS.mouseWasPressed(0)) {
        const hex = grid.pointToHex(LittleJS.mousePos);
        const { q, r, x, y } = hex;

        // Check if clicking on a unit
        const clickedUnit = gameStore.state.units.find(
          (unit) =>
            Math.abs(unit.pos.x - x) < 0.1 && Math.abs(unit.pos.y - y) < 0.1
        );

        if (clickedUnit && clickedUnit.side === gameStore.state.movingPlayer) {
          // Clicking on a unit - select it
          if (gameStore.state.selectedUnit === clickedUnit) {
            // Clicking same unit - recalculate range (refresh)
            const range = clickedUnit.remainingMovement;
            const unitHex = clickedUnit.getHexCoords(grid);
            setHexesInRange(unitHex, range);
          } else {
            // Select new unit
            selectUnit(clickedUnit);
          }
        } else if (gameStore.state.selectedUnit) {
          // Clicking on empty hex with unit selected - try to move
          const targetPos = LittleJS.vec2(x, y);
          attemptMove(gameStore.state.selectedUnit, targetPos);
        }
      }

      // Right click or ESC to deselect
      if (LittleJS.mouseWasPressed(2) || LittleJS.keyWasPressed('Escape')) {
        deselectUnit();
        lastPreviewHex = null; // Reset preview cache
      }

      // Optimized movement path preview with throttling
      if (
        gameStore.state.selectedUnit &&
        !gameStore.state.selectedUnit.isMoving
      ) {
        const currentTime = Date.now();
        const mouseHex = grid.pointToHex(LittleJS.mousePos);
        const currentHexKey = `${mouseHex.q},${mouseHex.r}`;

        // Only update preview if hex changed and enough time has passed
        if (
          currentHexKey !== lastPreviewHex &&
          currentTime > previewThrottleTime
        ) {
          lastPreviewHex = currentHexKey;
          previewThrottleTime = currentTime + PREVIEW_THROTTLE_MS;

          const isReachable = gameStore.state.reachableHexes?.some(
            (hex) => hex.q === mouseHex.q && hex.r === mouseHex.r
          );

          if (isReachable) {
            // Calculate and store path for rendering
            const targetPos = LittleJS.vec2(mouseHex.x, mouseHex.y);
            const path = calculateMovementPath(
              gameStore.state.selectedUnit.pos,
              targetPos,
              gameStore.state.selectedUnit.movement
            );
            
            gameStore.state.movementPath = path?.map((tile) => ({
              x: tile.x,
              y: tile.y
            })) || [];
          } else {
            gameStore.state.movementPath = [];
          }
        }
      } else {
        gameStore.state.movementPath = [];
        lastPreviewHex = null;
      }
    }
  },
};

export default MovementManager;
