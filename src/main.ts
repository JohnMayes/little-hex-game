'use strict';
import * as LittleJS from '@littlejs'
import { Color, drawPoly, vec2, mouseWheel, clamp, keyIsDown, cameraPos, cameraScale } from '@littlejs'
import { TerrainColor } from './types/terrain.js';
import { gameStore, grid } from './store.js';
import MovementManger from './MovementManger.js';

///////////////////////////////////////////////////////////////////////////////
function gameInit() {
  // called once after the engine starts up
  // setup the game
  const width = window.innerWidth;
  const height = window.innerHeight;
  LittleJS.setCanvasFixedSize(vec2(width, height));
  LittleJS.setCameraPos(vec2(9, 8));
  LittleJS.setCameraScale(50);
  gameStore.state.units;

}

///////////////////////////////////////////////////////////////////////////////
function gameUpdate() {
  // Camera pan and zoom
  if (mouseWheel) {
    const newScale = clamp(cameraScale * (1 - mouseWheel / 10), 50, 150);
    LittleJS.setCameraScale(newScale);
  }

  if (keyIsDown('KeyW')) {
    cameraPos.y = Math.min(18, cameraPos.y + 0.5)
  }

  if (keyIsDown('KeyS')) {
    cameraPos.y = Math.max(0, cameraPos.y - 0.5)
  }

  if (keyIsDown('KeyA')) {
    cameraPos.x = Math.max(0, cameraPos.x - 0.5)
  }

  if (keyIsDown('KeyD')) {
    cameraPos.x = Math.min(20, cameraPos.x + 0.5)
  }

  // Select Unit in Hex
  if (LittleJS.mouseWasPressed(0)) {
    const { x, y } = grid.pointToHex(LittleJS.mousePos);
    const counter = gameStore.state.units.find(unit => unit.pos.x === x && unit.pos.y === y);
    gameStore.state.selectedUnit = counter;
  }

  // Movement manager
  MovementManger.update()

}

///////////////////////////////////////////////////////////////////////////////
function gameUpdatePost() {
  // called after physics and objects are updated
  // setup camera and prepare for render
  const phase = gameStore.state.phase;
  const activeSide = gameStore.state.activePlayer;
  if (phase === 'movement') {
    const activeUnits = gameStore.state.units.filter(unit => unit.side === activeSide);
    activeUnits.forEach((unit) => unit.draggable = true);
  }
}

///////////////////////////////////////////////////////////////////////////////
function gameRender() {
  const reachable = new Set(gameStore.state.reachableHexes?.map(h => `${h.q},${h.r}`));
  const isMovementPhase = gameStore.state.phase === 'movement';

  for (const hex of grid) {
    const points = hex.corners;
    const corners = points.map(c => vec2(c.x, c.y));

    let baseColor = new Color().setHex(TerrainColor[hex.terrain.type]);
    let outlineColor = new Color(0, 0, 0); 

    if (isMovementPhase && gameStore.state.selectedUnit) {
      const key = `${hex.q},${hex.r}`;
      if (reachable.has(key)) {
        baseColor = baseColor.scale(1.1);
      } else {
        baseColor = baseColor.scale(0.9); 
      }
    }

    drawPoly(corners, baseColor, 0.05, outlineColor);
  }
}


///////////////////////////////////////////////////////////////////////////////
function gameRenderPost() {
  // called after objects are rendered
  // draw effects or hud that appear above all objects
  // LittleJS.drawTextScreen(gameStore.state.selectedUnit?.remainingMovement.toString() || '', LittleJS.mainCanvasSize.scale(.5), 80);
}

///////////////////////////////////////////////////////////////////////////////
// Startup LittleJS Engine
LittleJS.engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost, ['tiles.png']);