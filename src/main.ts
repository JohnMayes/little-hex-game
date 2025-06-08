'use strict';
import * as LittleJS from '@littlejs'
import { Color, drawPoly, drawLine, vec2, mouseWheel, clamp, keyIsDown, cameraPos, cameraScale } from '@littlejs'
import { TerrainColor } from './types/terrain.js';
import { gameStore, grid } from './store.js';
import MovementManager from './MovementManger.js';
import TurnManager from './TurnManager.js';
import CombatManager from './CombatManager.js';

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

  // Movement manager handles all unit selection and movement
  TurnManager.update()
  MovementManager.update()
  CombatManager.update()
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdatePost() {
  // called after physics and objects are updated
  // No need for draggable logic with click-to-move
}

///////////////////////////////////////////////////////////////////////////////
function gameRender() {
  // render hexes
  const reachable = new Set(gameStore.state.reachableHexes?.map(h => `${h.q},${h.r}`));
  const visibleHexes = new Set(gameStore.state.combat.visibleHexes?.map(h => `${h.q},${h.r}`));
  const isMovementPhase = gameStore.state.phase === 'movement';
  const isCombatPhase = gameStore.state.phase === 'fire'

  if (isCombatPhase) {
    const selectedFiringUnit = CombatManager.getSelectedFiringUnit();
    const hoveredTarget = CombatManager.getHoveredTarget();
    const validTargets = CombatManager.getValidTargets();
    const losLine = CombatManager.getLOSLine()

    if (losLine && selectedFiringUnit && hoveredTarget) {
      const lineColor = validTargets.some(unit => unit == hoveredTarget) 
        ? new Color(0,1,0)  // Green for valid targets
        : new Color(1,0,0); // Red for invalid targets
      
      drawLine(vec2(losLine.from.x, losLine.from.y), vec2(losLine.to.x, losLine.to.y), 0.1, lineColor);
    }
  }

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
        baseColor = baseColor.scale(0.8);
      }
    }

    if (isCombatPhase && gameStore.state.combat.selectedFiringUnit) {
      const key = `${hex.q},${hex.r}`;
      if (visibleHexes.has(key)) {
        baseColor = baseColor.scale(1.1);
      } else {
        baseColor = baseColor.scale(0.8);
      }
    }

    drawPoly(corners, baseColor, 0.05, outlineColor);
  }

  // Draw movement path preview
  if (gameStore.state.movementPath && gameStore.state.movementPath.length > 1) {
    const pathColor = new Color().setHex('#FFFF00'); // Yellow path
    const pathWidth = 0.1;

    for (let i = 0; i < gameStore.state.movementPath.length - 1; i++) {
      const start = gameStore.state.movementPath[i];
      const end = gameStore.state.movementPath[i + 1];
      drawLine(vec2(start.x, start.y), vec2(end.x, end.y), pathWidth, pathColor);
    }

    // Optional: Draw arrows or dots along the path
    gameStore.state.movementPath.forEach((point, index) => {
      if (index > 0) { // Skip starting position
        const dotColor = new Color().setHex('#FF8800'); // Orange dots
        const dotSize = vec2(0.15, 0.15);
        LittleJS.drawTile(vec2(point.x, point.y), dotSize, undefined, dotColor);
      }
    });
  }
}

///////////////////////////////////////////////////////////////////////////////
function gameRenderPost() {
  // called after objects are rendered
  // draw effects or hud that appear above all objects
  if (gameStore.state.phase === 'movement') {
    LittleJS.drawTextScreen('Player: ' + gameStore.state.movingPlayer + ' Phase: ' + gameStore.state.phase, LittleJS.mainCanvasSize.scale(.5), 80);
  } else if (gameStore.state.phase === 'fire') {
    LittleJS.drawTextScreen('Player: ' + gameStore.state.firingPlayer + ' Phase: ' + gameStore.state.phase, LittleJS.mainCanvasSize.scale(.5), 80);
  }
}

///////////////////////////////////////////////////////////////////////////////
// Startup LittleJS Engine
LittleJS.engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost, ['tiles.png']);