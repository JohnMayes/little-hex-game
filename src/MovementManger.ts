import * as LittleJS from '@littlejs';
import { gameStore, grid } from './store';
import { Unit } from './objects/unitObjects';
import { AxialCoordinates, Point, ring } from 'honeycomb-grid';
import { aStar } from 'abstract-astar';
import { Tile } from './objects/baseObjects';

// Helper functions
export function getReachableHexes(start: Tile, movementPoints: number): Tile[] {
  const visited = new Map<string, number>(); // key: tile id, value: cost
  const queue: { tile: Tile; cost: number }[] = [{ tile: start, cost: 0 }];

  while (queue.length > 0) {
    const { tile, cost } = queue.shift()!;
    const key = `${tile.q},${tile.r}`;

    if (visited.has(key) && visited.get(key)! <= cost) continue;
    visited.set(key, cost);

    const neighbors = grid.traverse(ring({ radius: 1, center: tile })).toArray();

    for (const neighbor of neighbors) {
      const nextCost = cost + neighbor.cost;
      if (nextCost <= movementPoints) {
        queue.push({ tile: neighbor, cost: nextCost });
      }
    }
  }

  return Array.from(visited.keys()).map((key) => {
    const [q, r] = key.split(',').map(Number);
    return grid.getHex({ q, r })!;
  });
}

function hexesInRange(center: { q: number; r: number }, movementPoints: number): { q: number; r: number }[] {
  const centerTile = grid.getHex(center);
  if (!centerTile) return [];

  const reachableTiles = getReachableHexes(centerTile, movementPoints);

  return reachableTiles.map(({ q, r }) => ({ q, r }));
}

function setHexesInRange(center: { q: number; r: number }, distance: number) {
  gameStore.state.reachableHexes = hexesInRange(center, distance);
}

function calculateMovementPath(fromPos: Point, toPos: Point, movementPoints: number) {
  const start = grid.pointToHex(fromPos);
  const goal = grid.pointToHex(toPos);

  // First collect reachable tiles
  const reachable = new Set(getReachableHexes(start, movementPoints).map(t => `${t.x},${t.y}`));

  // If goal is not reachable, exit early
  if (!reachable.has(`${goal.x},${goal.y}`)) return [];

  // Now safely run aStar since goal is within range
  const shortestPath = aStar<Tile>({
    start,
    goal,
    estimateFromNodeToGoal: (tile) => grid.distance(tile, goal),
    neighborsAdjacentToNode: (center) =>
      grid
        .traverse(ring({ radius: 1, center }))
        .toArray()
        .filter(n => reachable.has(`${n.x},${n.y}`)), // restrict neighbors
    actualCostToMove: (_, __, tile) => tile.cost,
  });

  // return shortestPath?.map(({ x, y }) => ({ x, y })) || [];
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

  // Calculate reachable hexes
  const unitHex = grid.pointToHex(unit.pos);
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
            const newHex = grid.pointToHex(unit.pos);
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

function deselectUnit() {
  if (gameStore.state.selectedUnit) {
    gameStore.state.selectedUnit.selected = false;
    gameStore.state.selectedUnit = undefined;
    gameStore.state.reachableHexes = [];
    gameStore.state.movementPath = []; // Clear any movement preview
  }
}

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

        if (clickedUnit) {
          // Clicking on a unit - select it
          if (gameStore.state.selectedUnit === clickedUnit) {
            // Clicking same unit - recalculate range (refresh)
            const range = clickedUnit.remainingMovement;
            setHexesInRange({ q, r }, range);
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
      }

      // Optional: Show movement path preview on mouse hover
      if (
        gameStore.state.selectedUnit &&
        !gameStore.state.selectedUnit.isMoving
      ) {
        const mouseHex = grid.pointToHex(LittleJS.mousePos);
        const targetHex = { q: mouseHex.q, r: mouseHex.r };

        const isReachable = gameStore.state.reachableHexes?.some(
          (hex) => hex.q === targetHex.q && hex.r === targetHex.r
        );

        if (isReachable) {
          // Calculate and store path for rendering
          const targetPos = LittleJS.vec2(mouseHex.x, mouseHex.y);
          gameStore.state.movementPath = calculateMovementPath(
            gameStore.state.selectedUnit.pos,
            targetPos,
            gameStore.state.selectedUnit.movement
          )!.map((tile) => {
            const x = tile.x;
            const y = tile.y

            return { x, y }
          });
        } else {
          gameStore.state.movementPath = [];
        }
      } else {
        gameStore.state.movementPath = [];
      }
    }
  },
};

export default MovementManager;
