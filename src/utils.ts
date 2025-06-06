import { gameStore } from "./store";

export function deselectUnit() {
  if (gameStore.state.selectedUnit) {
    gameStore.state.selectedUnit.selected = false;
    gameStore.state.selectedUnit = undefined;
    gameStore.state.reachableHexes = [];
    gameStore.state.movementPath = [];
  }
}