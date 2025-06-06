import { gameStore, MovingPlayer, Phase } from "./store";
import { keyWasPressed } from "@littlejs";
import { deselectUnit } from "./utils";

// 1. Moving player moves
// 2. Both sides conduct fire, moving player first 
// 3. Moving player switches

const TurnManager = {
  update() {
    if (!keyWasPressed('KeyN')) return;

    const state = gameStore.state;

    const getOtherPlayer = (player: MovingPlayer): MovingPlayer =>
      player === 'blue' ? 'red' : 'blue';

    switch (state.phase) {
      case 'movement':
        // Start fire phase, with moving player firing first
        deselectUnit()
        state.phase = 'fire';
        state.firingPlayer = state.movingPlayer;
        break;

      case 'fire':
        if (state.firingPlayer === state.movingPlayer) {
          // Switch to other player’s fire turn
          deselectUnit()
          state.firingPlayer = getOtherPlayer(state.movingPlayer);
        } else {
          // Both players have fired, move to next turn
          deselectUnit()
          state.units.forEach(unit => unit.remainingMovement = unit.movement)
          const nextPlayer = getOtherPlayer(state.movingPlayer);
          state.movingPlayer = nextPlayer;
          state.firingPlayer = nextPlayer;
          state.phase = 'movement';
          state.turn += 1;
        }
        break;

      default:
        console.warn('Unknown phase:', state.phase);
        break;
    }
  }
};




export default TurnManager;