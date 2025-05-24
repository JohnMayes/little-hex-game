import * as LittleJS from '@littlejs'
import { gameStore, grid } from "./store";

// Helper functions
function hexesInRange(center: { q: number, r: number }, distance: number): { q: number, r: number }[] {
  const results = [];

  for (let dq = -distance; dq <= distance; dq++) {
    for (let dr = Math.max(-distance, -dq - distance); dr <= Math.min(distance, -dq + distance); dr++) {
      const q = center.q + dq;
      const r = center.r + dr;
      results.push({ q, r });
    }
  }

  return results;
}

function setHexesInRange(center: { q: number, r: number }, distance: number) {
  gameStore.state.reachableHexes = hexesInRange(center, distance);
}

const MovementManger = {
  update() {
    if (gameStore.state.phase === 'movement') {

      if (LittleJS.mouseWasPressed(0)) {
        const { q, r, x, y } = grid.pointToHex(LittleJS.mousePos);
        const clickedUnit = gameStore.state.units.find(unit => unit.pos.x === x && unit.pos.y === y);

        const selected = gameStore.state.selectedUnit;
        const isSameUnit = selected && clickedUnit && selected === clickedUnit;

        // Only recalculate reachable hexes if clicking the already-selected unit
        if (isSameUnit) {
          const range = selected.remainingMovement;
          setHexesInRange({ q, r }, range);
        }
      }

      // move to Hex
      if (LittleJS.mouseWasReleased(0)) {
        const hex = grid.pointToHex(LittleJS.mousePos);
        
        const withinRange = gameStore.state.reachableHexes.some(hexI => {
          const { q: qi, r: ri } = hexI;
          const { q, r } = hex;
          return q === qi && r === ri;
        })
        const counter = gameStore.state.units.find(c => c.dragging === true);

        if (counter && withinRange ) {
          const lastHex = grid.pointToHex(counter.lastPos);
          const distance = grid.distance(lastHex, hex);
          counter.move(LittleJS.vec2(hex.x, hex.y), distance, (num) => setHexesInRange({ q: hex.q, r: hex.r }, num));
        } else {
          counter?.snapToHex(LittleJS.vec2(counter.lastPos))
        }
      }
    }
  }
}

export default MovementManger;