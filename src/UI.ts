import * as LittleJS from '@littlejs';
import { Color, drawRect, drawPoly, vec2, drawTextScreen, mainCanvasSize, initUISystem, UIObject, UIButton } from '@littlejs';
import { gameStore } from './store.js';
import { TerrainColor } from './types/terrain.js';
import { Unit } from './objects/unitObjects.js';

export function setCursor(cursor: string) {
  document.body.style.cursor = cursor;
}

const GRID_SIZE = 4;
const RECT_SIZE = 32;
const RECT_PADDING = 8;
const FIRST_BOX_WIDTH = 192;
const NUM_BOXES = 5;

const drawInfoBox = (pos: LittleJS.Vector2, size: LittleJS.Vector2, title: string) => {
  drawRect(pos, size, new Color(0, 0, 0, 0.1), 0, true, true);
  drawTextScreen(title, vec2(pos.x, pos.y - size.y / 2 + 16), 16, new Color(), undefined, undefined, 'center');
}

const drawUnitSelectors = (pos: LittleJS.Vector2) => {
  const totalPadding = (GRID_SIZE - 1) * RECT_PADDING;
  const gridWidth = GRID_SIZE * RECT_SIZE + totalPadding;
  const gridHeight = GRID_SIZE * RECT_SIZE + totalPadding;

  const startX = pos.x - gridWidth / 2;
  const startY = pos.y - gridHeight / 2;

  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const x = startX + col * (RECT_SIZE + RECT_PADDING) + RECT_SIZE / 2;
      const y = startY + row * (RECT_SIZE + RECT_PADDING) + RECT_SIZE / 2;
      drawRect(vec2(x, y), vec2(RECT_SIZE), new Color(1,1,1,.2), 0, true, true);
    }
  }
}

const drawUnitInfoSection = (pos: LittleJS.Vector2, size: LittleJS.Vector2) => {
  const selectedUnit = gameStore.state.selectedUnit;
  const title = selectedUnit ? selectedUnit.type.toUpperCase() : 'No unit selected'

  // Box background and title
  drawRect(pos, size, new Color(0, 0, 0, 0.1), 0, true, true);
  drawTextScreen(title, vec2(pos.x, pos.y - size.y / 2 + 16), 16, new Color(), undefined, undefined, 'center');

  if (selectedUnit) {
    const boxWidth = size.x;
    const boxHeight = size.y;

    const iconMaxSize = 128;
    const iconSize = Math.min(iconMaxSize, boxWidth * 0.35); // 35% of box width max
    const paddingX = boxWidth * 0.05;
    const contentLeft = pos.x - boxWidth / 2 + paddingX;
  
    // Icon Position
    const iconX = contentLeft + iconSize / 2;
    const iconY = pos.y;

    drawRect(vec2(iconX, iconY), vec2(iconSize), new Color(0, 0, 0, 0.1), 0, true, true);

    // Text block to right of icon
    const textStartX = iconX + iconSize / 2 + paddingX;
    const lineHeight = boxHeight * 0.12;  // Scales with container height
    const fontSize = Math.min(14, boxHeight * 0.15);  // Clamp to 14 max
    const textStartY = pos.y - lineHeight * 2;
    const color = new Color(1, 1, 1, 1);

    const stats = [
      `Firepower: ${selectedUnit.firepower}`,
      `Range: ${selectedUnit.range}`,
      `Movement: ${selectedUnit.movement}`,
      `Defense: ${selectedUnit.defense}`,
      `Remaining: ${selectedUnit.remainingMovement}`,
    ];

    for (let i = 0; i < stats.length; i++) {
      drawTextScreen(stats[i], vec2(textStartX, textStartY + i * lineHeight), fontSize, color, undefined, undefined, 'left');
    }
  }
};

const drawTerrainInfoSection = (pos: LittleJS.Vector2, size: LittleJS.Vector2) => {
  const selectedHex = gameStore.state.selectedHex;
  const title = selectedHex ? selectedHex.terrain.type.toUpperCase() : 'No terrain selected';

  // Box background and title
  drawRect(pos, size, new Color(0, 0, 0, 0.1), 0, true, true);
  drawTextScreen(title, vec2(pos.x, pos.y - size.y / 2 + 16), 16, new Color(), undefined, undefined, 'center');

  if (selectedHex) {
    const boxWidth = size.x;
    const boxHeight = size.y;

    const iconMaxSize = 128;
    const iconSize = Math.min(iconMaxSize, boxWidth * 0.35); // 35% of box width max
    const paddingX = boxWidth * 0.05;
    const contentLeft = pos.x - boxWidth / 2 + paddingX;

    // Hex preview center position
    const hexCenter = vec2(contentLeft + iconSize / 2, pos.y);
    const hexRadius = iconSize / 2;
    const iconX = contentLeft + iconSize / 2;
    const iconY = pos.y;
    // Generate hex corners
    const corners = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i * 60 - 30) * Math.PI / 180;
      corners.push(vec2(
        hexCenter.x + hexRadius * Math.cos(angle),
        hexCenter.y + hexRadius * Math.sin(angle)
      ));
    }

    // Terrain color fill
    const terrainColor = new Color().setHex(TerrainColor[selectedHex.terrain.type]);
    // drawPoly(corners, terrainColor, 2, new Color(1, 1, 1), true);
    drawRect(vec2(iconX, iconY), vec2(iconSize), terrainColor, 0, true, true)

    // Text block to right of hex
    const textStartX = hexCenter.x + iconSize / 2 + paddingX;
    const lineHeight = boxHeight * 0.12;
    const fontSize = Math.min(14, boxHeight * 0.15);
    const textStartY = pos.y - lineHeight * 2;
    const color = new Color(1, 1, 1, 1);

    const stats = [
      `Position: (${selectedHex.col}, ${selectedHex.row})`,
      `Type: ${selectedHex.terrain.type}`,
      `Move Cost: ${selectedHex.terrain.movementCost === Infinity ? 'Impassable' : selectedHex.terrain.movementCost}`,
      `Direct Fire: +${selectedHex.terrain.directFireModifier}`,
      `Indirect Fire: +${selectedHex.terrain.indirectFireModifier}`
    ];

    for (let i = 0; i < stats.length; i++) {
      drawTextScreen(stats[i], vec2(textStartX, textStartY + i * lineHeight), fontSize, color, undefined, undefined, 'left');
    }
  }
};

const drawBottomBar = () => {
  const canvasSize = mainCanvasSize;
  const barHeight = 200;

  // Draw bar background
  drawRect(
    vec2(canvasSize.x / 2, canvasSize.y - barHeight - 40 / 2),
    vec2(canvasSize.x, 40),
    new Color().setHex('#707D65'),
    0, true, true
  );

  drawRect(
    vec2(canvasSize.x / 2, canvasSize.y - barHeight / 2),
    vec2(canvasSize.x, barHeight),
    new Color().setHex('#47503f'),
    0, true, true
  );

  // Calculate box layout
 // Layout
  const spacing = 10;
  const boxHeight = 180;
  const yPos = canvasSize.y - barHeight / 2;

  const remainingWidth = canvasSize.x - FIRST_BOX_WIDTH - spacing * (NUM_BOXES + 1);
  const remainingBoxes = NUM_BOXES - 1;
  const boxWidth = remainingWidth / remainingBoxes;

  // First box
  const firstX = spacing + FIRST_BOX_WIDTH / 2;
  drawInfoBox(vec2(firstX, yPos), vec2(FIRST_BOX_WIDTH, boxHeight), `Box 1`);
  drawUnitSelectors(vec2(firstX, yPos));

  // Remaining boxes
  for (let i = 1; i < NUM_BOXES; i++) {
    const xPos = spacing + FIRST_BOX_WIDTH + spacing + boxWidth / 2 + (i - 1) * (boxWidth + spacing);
    if (i === 1) {
      drawUnitInfoSection(vec2(xPos, yPos), vec2(boxWidth, boxHeight));  
    } else if (i === 2) {
      drawTerrainInfoSection(vec2(xPos, yPos), vec2(boxWidth, boxHeight));  
    } else drawInfoBox(vec2(xPos, yPos), vec2(boxWidth, boxHeight), `Box ${i + 1}`);
  }
};


export const UIManager = {
  init() {

  },
  
  render () {
    drawBottomBar();
  }
}