import { gameStore } from "./store";

export function deselectUnit() {
  if (gameStore.state.selectedUnit) {
    gameStore.state.selectedUnit.selected = false;
    gameStore.setState(state => ({
      ...state,
      selectedUnit: undefined,
      reachableHexes: [],
      movementPath: []
    }));
  }
}

export function clearFiringSelection() {
  if (gameStore.state.selectedUnit) {

    gameStore.setState(state => ({
      ...state,
      combat: {
        selectedFiringUnit: undefined,
        validTargets: [],
        hoveredTarget: undefined,
        visibleHexes: []
      }
    }));
  }
}