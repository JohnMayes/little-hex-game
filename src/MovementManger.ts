import * as LittleJS from '@littlejs';
import { gameStore, grid } from './store';
import { Unit } from './objects/unitObjects';
import { AxialCoordinates, Point } from 'honeycomb-grid';

// Helper functions
function hexesInRange(
  center: { q: number; r: number },
  distance: number
): { q: number; r: number }[] {
  const results = [];

  for (let dq = -distance; dq <= distance; dq++) {
    for (
      let dr = Math.max(-distance, -dq - distance);
      dr <= Math.min(distance, -dq + distance);
      dr++
    ) {
      const q = center.q + dq;
      const r = center.r + dr;
      results.push({ q, r });
    }
  }

  return results;
}

function setHexesInRange(center: { q: number; r: number }, distance: number) {
  gameStore.state.reachableHexes = hexesInRange(center, distance);
}

function calculateMovementPath(fromPos: Point, toPos: Point) {
  // Convert world positions to hex coordinates for pathfinding
  const startHex = grid.pointToHex(fromPos);
  const endHex = grid.pointToHex(toPos);

  // Simple hex pathfinding - you can enhance this with A* later
  const path = [fromPos]; // Start with current position

  // Calculate hex steps
  const dq = endHex.q - startHex.q;
  const dr = endHex.r - startHex.r;
  const distance = Math.max(Math.abs(dq), Math.abs(dr), Math.abs(-dq - dr));

  // Generate path hex by hex
  for (let i = 1; i <= distance; i++) {
    const progress = i / distance;
    const intermediateQ = Math.round(startHex.q + dq * progress);
    const intermediateR = Math.round(startHex.r + dr * progress);

    // Convert back to world coordinates
    const worldPos = grid.getHex({ q: intermediateQ, r: intermediateR });
    path.push(LittleJS.vec2(worldPos?.x, worldPos?.y));
  }

  return path;
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
    const path = calculateMovementPath(unit.pos, targetPos);
    const movementCost = path.length - 1; // Subtract 1 because path includes start position

    if (movementCost <= unit.remainingMovement) {
      // Use animated movement
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
    } else {
      console.log('Not enough movement points');
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
            targetPos
          );
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
