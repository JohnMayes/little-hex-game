import * as LittleJS from '@littlejs'
import { Color, drawRect, drawPoly, vec2 } from '@littlejs'
import { gameStore } from './store.js'
import { TerrainColor } from './types/terrain.js'

export function setCursor(cursor: string) {
  document.body.style.cursor = cursor;
}

export class UIManager {
  static barHeight = 200;
  static actionBarHeight = 50;
  static statusBarHeight = 150;
  
  static render() {
    const canvasSize = LittleJS.mainCanvasSize;
    
    this.drawBottomBar(canvasSize);
    this.drawActionBar(canvasSize);
    this.drawStatusBar(canvasSize);
  }
  
  private static drawBottomBar(canvasSize: LittleJS.Vector2) {
    // Main background
    drawRect(
      vec2(canvasSize.x / 2, canvasSize.y - this.barHeight / 2), 
      vec2(canvasSize.x, this.barHeight), 
      new Color(0.15, 0.15, 0.2, 0.95),
      0, true, true
    );
    
    // Top border
    drawRect(
      vec2(canvasSize.x / 2, canvasSize.y - this.barHeight + 1), 
      vec2(canvasSize.x, 2), 
      new Color(0.4, 0.4, 0.5, 0.8),
      0, true, true
    );
  }
  
  private static drawActionBar(canvasSize: LittleJS.Vector2) {
    const actionBarY = canvasSize.y - this.barHeight;
    
    // Action bar background (slightly lighter)
    drawRect(
      vec2(canvasSize.x / 2, actionBarY + this.actionBarHeight / 2), 
      vec2(canvasSize.x, this.actionBarHeight), 
      new Color(0.2, 0.2, 0.25, 0.9),
      0, true, true
    );
    
    // Player and phase info (left side)
    const phase = gameStore.state.phase;
    const player = phase === 'movement' ? gameStore.state.movingPlayer : gameStore.state.firingPlayer;
    
    LittleJS.drawTextScreen(
      `Player ${player} | ${phase.toUpperCase()} PHASE`,
      vec2(20, actionBarY + this.actionBarHeight / 2),
      18,
      new Color(1, 1, 1),
      0, undefined, 'left'
    );
    
    // Button placeholders (right side)
    const buttonY = actionBarY + this.actionBarHeight / 2;
    const buttonSize = vec2(35, 35);
    const buttonSpacing = 45;
    const startX = canvasSize.x - 160;
    
    // Zoom Out button
    this.drawButton(vec2(startX, buttonY), buttonSize, new Color(0.3, 0.3, 0.4), 'Z-');
    
    // Zoom In button  
    this.drawButton(vec2(startX + buttonSpacing, buttonY), buttonSize, new Color(0.3, 0.3, 0.4), 'Z+');
    
    // Settings button
    this.drawButton(vec2(startX + buttonSpacing * 2, buttonY), buttonSize, new Color(0.4, 0.3, 0.3), 'SET');
  }
  
  private static drawStatusBar(canvasSize: LittleJS.Vector2) {
    const statusBarY = canvasSize.y - this.statusBarHeight;
    const padding = 15;
    
    // Calculate section widths
    const unitSelectorWidth = 200;
    const unitInfoWidth = 250;
    const terrainInfoWidth = 250;
    const remainingWidth = canvasSize.x - unitSelectorWidth - unitInfoWidth - terrainInfoWidth - (padding * 5);
    const commsWidth = remainingWidth * 0.6;
    const minimapWidth = remainingWidth * 0.4;
    
    let currentX = padding;
    
    // Section 1: Unit Selector
    this.drawUnitSelectorSection(
      vec2(currentX, statusBarY),
      vec2(unitSelectorWidth, this.statusBarHeight)
    );
    currentX += unitSelectorWidth + padding;
    
    // Section divider
    this.drawSectionDivider(vec2(currentX - padding/2, statusBarY + this.statusBarHeight / 2));
    
    // Section 2: Unit Info
    this.drawUnitInfoSection(
      vec2(currentX, statusBarY),
      vec2(unitInfoWidth, this.statusBarHeight)
    );
    currentX += unitInfoWidth + padding;
    
    // Section divider
    this.drawSectionDivider(vec2(currentX - padding/2, statusBarY + this.statusBarHeight / 2));
    
    // Section 3: Terrain Info
    this.drawTerrainInfoSection(
      vec2(currentX, statusBarY),
      vec2(terrainInfoWidth, this.statusBarHeight)
    );
    currentX += terrainInfoWidth + padding;
    
    // Section divider
    this.drawSectionDivider(vec2(currentX - padding/2, statusBarY + this.statusBarHeight / 2));
    
    // Section 4: Comms
    this.drawCommsSection(
      vec2(currentX, statusBarY),
      vec2(commsWidth, this.statusBarHeight)
    );
    currentX += commsWidth + padding;
    
    // Section divider
    this.drawSectionDivider(vec2(currentX - padding/2, statusBarY + this.statusBarHeight / 2));
    
    // Section 5: Minimap
    this.drawMinimapSection(
      vec2(currentX, statusBarY),
      vec2(minimapWidth, this.statusBarHeight)
    );
  }
  
  private static drawSectionDivider(pos: LittleJS.Vector2) {
    drawRect(
      pos,
      vec2(2, this.statusBarHeight),
      new Color(0.3, 0.3, 0.35, 0.6),
      0, true, true
    );
  }
  
  private static drawButton(pos: LittleJS.Vector2, size: LittleJS.Vector2, color: Color, text: string) {
    // Button background
    drawRect(pos, size, color, 0, true, true);
    
    // Button border
    drawRect(pos, size, undefined, 0, true, true);
    
    // Button text
    LittleJS.drawTextScreen(text, pos, 12, new Color(1, 1, 1));
  }
  
  private static drawUnitSelectorSection(topLeft: LittleJS.Vector2, size: LittleJS.Vector2) {
    const phase = gameStore.state.phase;
    const activePlayer = phase === 'movement' ? gameStore.state.movingPlayer : gameStore.state.firingPlayer;
    
    // Section header at top
    LittleJS.drawTextScreen(
      'UNITS',
      vec2(topLeft.x + size.x / 2, topLeft.y + 20),
      14,
      new Color(0.8, 0.8, 0.9),
      0, undefined, 'center'
    );
    
    // Filter units for active player
    const activeUnits = gameStore.state.units.filter(unit => unit.side === activePlayer);
    
    if (activeUnits.length === 0) {
      LittleJS.drawTextScreen(
        'No units',
        vec2(topLeft.x + size.x / 2, topLeft.y + size.y / 2),
        12,
        new Color(0.6, 0.6, 0.6),
        0, undefined, 'center'
      );
      return;
    }
    
    // Grid layout for unit selector buttons
    const unitsPerRow = 4;
    const unitButtonSize = 25;
    const unitSpacing = 35;
    const startX = topLeft.x + 25;
    const startY = topLeft.y + 50;
    
    activeUnits.forEach((unit, index) => {
      const row = Math.floor(index / unitsPerRow);
      const col = index % unitsPerRow;
      const x = startX + col * unitSpacing;
      const y = startY + row * unitSpacing;
      
      // Unit button background
      const isSelected = gameStore.state.selectedUnit === unit;
      const buttonColor = isSelected 
        ? new Color(0.6, 0.6, 0.2) 
        : new Color(0.3, 0.3, 0.4);
      
      drawRect(
        vec2(x, y),
        vec2(unitButtonSize, unitButtonSize),
        buttonColor,
        0, true, true
      );
      
      // Unit button border
      drawRect(
        vec2(x, y),
        vec2(unitButtonSize, unitButtonSize),
        undefined,
        0, true, true
      );
      
      // Unit type abbreviation
      const unitAbbrev = unit.type.substring(0, 3).toUpperCase();
      LittleJS.drawTextScreen(
        unitAbbrev,
        vec2(x, y),
        8,
        new Color(1, 1, 1),
        0, undefined, 'center'
      );
    });
  }
  
  private static drawUnitInfoSection(topLeft: LittleJS.Vector2, size: LittleJS.Vector2) {
    const selectedUnit = gameStore.state.selectedUnit;
    
    // Section header at top
    LittleJS.drawTextScreen(
      'UNIT INFO',
      vec2(topLeft.x + size.x / 2, topLeft.y + 20),
      14,
      new Color(0.8, 0.8, 0.9),
      0, undefined, 'center'
    );
    
    if (!selectedUnit) {
      return;
    }
    
    // Left side: Unit image preview
    const imageSize = 80;
    const imageX = topLeft.x + 50;
    const imageY = topLeft.y + 80;
    
    drawRect(
      vec2(imageX, imageY),
      vec2(imageSize, imageSize),
      new Color(0.4, 0.4, 0.5),
      0, true, true
    );
    
    // Right side: Unit info
    const infoX = topLeft.x + 140;
    const infoStartY = topLeft.y + 50;
    
    // Unit type
    LittleJS.drawTextScreen(
      selectedUnit.type.toUpperCase(),
      vec2(infoX, infoStartY),
      14,
      new Color(1, 1, 0.7),
      0, undefined, 'left'
    );
    
    // Unit stats
    const stats = [
      `Firepower: ${selectedUnit.firepower}`,
      `Range: ${selectedUnit.range}`,
      `Defense: ${selectedUnit.defense}`,
      `Movement: ${selectedUnit.movement}`
    ];
    
    stats.forEach((stat, i) => {
      LittleJS.drawTextScreen(
        stat,
        vec2(infoX, infoStartY + 25 + (i * 18)),
        11,
        new Color(0.9, 0.9, 0.9),
        0, undefined, 'left'
      );
    });
  }
  
  private static drawTerrainInfoSection(topLeft: LittleJS.Vector2, size: LittleJS.Vector2) {
    const selectedHex = gameStore.state.selectedHex;
    
    // Section header at top
    LittleJS.drawTextScreen(
      'TERRAIN',
      vec2(topLeft.x + size.x / 2, topLeft.y + 20),
      14,
      new Color(0.8, 0.8, 0.9),
      0, undefined, 'center'
    );
    
    if (!selectedHex) {      
      return;
    }
    
    // Left side: Hex polygon preview with terrain color
    const previewSize = 80;
    const previewX = topLeft.x + 40;
    const previewY = topLeft.y + 80;
    
    // Create a hexagon shape for preview
    const hexRadius = previewSize / 2;
    const corners: LittleJS.Vector2[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i * 60 - 30) * Math.PI / 180; // Start from top point
      corners.push(vec2(
        previewX + hexRadius * Math.cos(angle),
        previewY + hexRadius * Math.sin(angle)
      ));
    }
    
    // Draw hex with terrain color
    const terrainColor = new Color().setHex(TerrainColor[selectedHex.terrain.type]);
    drawPoly(corners, terrainColor, 2, new Color(1, 1, 1), true);
    
    // Right side: Terrain information
    const infoX = topLeft.x + 130;
    const infoStartY = topLeft.y + 50;
    
    // Position (col, row)
    LittleJS.drawTextScreen(
      `Position: (${selectedHex.col}, ${selectedHex.row})`,
      vec2(infoX, infoStartY),
      10,
      new Color(1, 1, 0.7),
      0, undefined, 'left'
    );
    
    // Terrain type
    LittleJS.drawTextScreen(
      `Type: ${selectedHex.terrain.type}`,
      vec2(infoX, infoStartY + 18),
      10,
      new Color(0.9, 0.9, 0.9),
      0, undefined, 'left'
    );
    
    // Movement cost
    const moveCost = selectedHex.terrain.movementCost === Infinity ? 'Impassable' : selectedHex.terrain.movementCost.toString();
    LittleJS.drawTextScreen(
      `Move Cost: ${moveCost}`,
      vec2(infoX, infoStartY + 36),
      10,
      new Color(0.9, 0.9, 0.9),
      0, undefined, 'left'
    );
    
    // Fire modifiers
    LittleJS.drawTextScreen(
      `Direct Fire: +${selectedHex.terrain.directFireModifier}`,
      vec2(infoX, infoStartY + 54),
      10,
      new Color(0.9, 0.7, 0.7),
      0, undefined, 'left'
    );
    
    LittleJS.drawTextScreen(
      `Indirect Fire: +${selectedHex.terrain.indirectFireModifier}`,
      vec2(infoX, infoStartY + 72),
      10,
      new Color(0.9, 0.7, 0.7),
      0, undefined, 'left'
    );
    
    // Special rules (if any)
    if (selectedHex.terrain.specialRules && selectedHex.terrain.specialRules.length > 0) {
      LittleJS.drawTextScreen(
        'Special Rules:',
        vec2(infoX, infoStartY + 90),
        9,
        new Color(0.7, 0.9, 0.7),
        0, undefined, 'left'
      );
      
      selectedHex.terrain.specialRules.forEach((rule, i) => {
        // Truncate long rules for display
        const displayRule = rule.length > 25 ? rule.substring(0, 22) + '...' : rule;
        LittleJS.drawTextScreen(
          `• ${displayRule}`,
          vec2(infoX, infoStartY + 105 + (i * 12)),
          8,
          new Color(0.7, 0.9, 0.7),
          0, undefined, 'left'
        );
      });
    }
  }
  
  private static drawCommsSection(topLeft: LittleJS.Vector2, size: LittleJS.Vector2) {
    // Section header at top
    LittleJS.drawTextScreen(
      'COMMS',
      vec2(topLeft.x + size.x / 2, topLeft.y + 20),
      14,
      new Color(0.8, 0.8, 0.9),
      0, undefined, 'center'
    );
    
    // Message area background
    const messageAreaY = topLeft.y + 40;
    const messageAreaHeight = size.y - 50;
    
    drawRect(
      vec2(topLeft.x + size.x / 2, messageAreaY + messageAreaHeight / 2),
      vec2(size.x - 20, messageAreaHeight),
      new Color(0.1, 0.1, 0.15, 0.8),
      0, true, true
    );
    
    // Placeholder messages
    const messages = [
      'Turn started',
      'Unit moved to (5,7)',
      'Combat resolved: Hit!',
      'Phase complete',
      'New turn begins'
    ];
    
    messages.forEach((msg, i) => {
      LittleJS.drawTextScreen(
        msg,
        vec2(topLeft.x + 15, messageAreaY + 20 + (i * 15)),
        10,
        new Color(0.7, 0.9, 0.7),
        0, undefined, 'left'
      );
    });
  }
  
  private static drawMinimapSection(topLeft: LittleJS.Vector2, size: LittleJS.Vector2) {
    // Section header at top
    LittleJS.drawTextScreen(
      'MINIMAP',
      vec2(topLeft.x + size.x / 2, topLeft.y + 20),
      14,
      new Color(0.8, 0.8, 0.9),
      0, undefined, 'center'
    );
    
    // Minimap area
    const mapY = topLeft.y + 40;
    const mapHeight = size.y - 50;
    const mapWidth = size.x - 20;
    
    // Minimap background
    drawRect(
      vec2(topLeft.x + size.x / 2, mapY + mapHeight / 2),
      vec2(mapWidth, mapHeight),
      new Color(0.1, 0.2, 0.1),
      0, true, true
    );
    
    // Minimap border
    drawRect(
      vec2(topLeft.x + size.x / 2, mapY + mapHeight / 2),
      vec2(mapWidth, mapHeight),
      undefined,
      0, true, true
    );
    
    // Grid lines to suggest hex grid
    const gridSpacing = 25;
    for (let i = 1; i < mapWidth / gridSpacing; i++) {
      const x = topLeft.x + 10 + i * gridSpacing;
      drawRect(
        vec2(x, mapY + mapHeight / 2),
        vec2(1, mapHeight),
        new Color(0.2, 0.3, 0.2, 0.5),
        0, true, true
      );
    }
    
    for (let i = 1; i < mapHeight / gridSpacing; i++) {
      const y = mapY + i * gridSpacing;
      drawRect(
        vec2(topLeft.x + size.x / 2, y),
        vec2(mapWidth, 1),
        new Color(0.2, 0.3, 0.2, 0.5),
        0, true, true
      );
    }
    
    // Navigation hint
    LittleJS.drawTextScreen(
      'Click to navigate',
      vec2(topLeft.x + size.x / 2, topLeft.y + size.y - 15),
      9,
      new Color(0.6, 0.6, 0.6),
      0, undefined, 'center'
    );
  }
}