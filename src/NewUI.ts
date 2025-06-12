import * as LittleJS from '@littlejs';
import { Color, drawRect, drawPoly, vec2, drawTextScreen, mainCanvasSize, initUISystem, UIObject, UIButton } from '@littlejs';
import { gameStore } from './store.js';
import { TerrainColor } from './types/terrain.js';
import { Unit } from './objects/unitObjects.js';

export function setCursor(cursor: string) {
  document.body.style.cursor = cursor;
}

class UnitButton extends UIButton {
  unit: Unit; 
  constructor(pos: LittleJS.Vector2, size: LittleJS.Vector2, text: string, unit: Unit) {
    super(pos, size, text);
    this.unit = unit;
  }
}

export class UIManager {
  static barHeight = 250;
  static actionBarHeight = 50;
  static statusBarHeight = 200;

  // Interactive UI objects (only where needed)
  static uiRoot: UIObject | null;
  static unitButtons: UnitButton[];
  static actionButtons: UIButton[];
  static minimapClickArea: UIObject | null;

  static init() {
    // Initialize minimal UI system for interactive elements only
    initUISystem();
    this.createInteractiveElements();
  }

  static createInteractiveElements() {
    // Create root for interactive elements only
    this.uiRoot = new UIObject();

    // Create interactive buttons
    this.createActionButtons();
    this.createUnitButtons();
    this.createMinimapClickArea();
  }

  static createActionButtons() {
    const buttonSize = vec2(35, 35);
    const buttonSpacing = 45;
    const actionBarY = mainCanvasSize.y - this.barHeight + this.actionBarHeight / 2;
    const startX = mainCanvasSize.x - 160;

    // Clear existing buttons
    if (this.actionButtons) {
      this.actionButtons.forEach(btn => this.uiRoot?.removeChild(btn));
    }
    this.actionButtons = [];

    // Zoom Out button
    const zoomOutBtn = new UIButton(vec2(startX, actionBarY), buttonSize, 'Z-');
    zoomOutBtn.color = new Color(0.3, 0.3, 0.4, 0);  // Transparent - we'll draw our own background
    zoomOutBtn.lineWidth = 0;
    zoomOutBtn.onPress = () => {
      console.log('Zoom out pressed');
      // Add your zoom logic here
    };
    this.uiRoot!.addChild(zoomOutBtn);
    this.actionButtons.push(zoomOutBtn);

    // Zoom In button
    const zoomInBtn = new UIButton(vec2(startX + buttonSpacing, actionBarY), buttonSize, 'Z+');
    zoomInBtn.color = new Color(0.3, 0.3, 0.4, 0);
    zoomInBtn.lineWidth = 0;
    zoomInBtn.onPress = () => {
      console.log('Zoom in pressed');
    };
    this.uiRoot!.addChild(zoomInBtn);
    this.actionButtons.push(zoomInBtn);

    // Settings button
    const settingsBtn = new UIButton(vec2(startX + buttonSpacing * 2, actionBarY), buttonSize, 'SET');
    settingsBtn.color = new Color(0.4, 0.3, 0.3, 0);
    settingsBtn.lineWidth = 0;
    settingsBtn.onPress = () => {
      console.log('Settings pressed');
    };
    this.uiRoot!.addChild(settingsBtn);
    this.actionButtons.push(settingsBtn);
  }

  static createUnitButtons() {
    // Clear existing unit buttons
    if (this.unitButtons) {
      this.unitButtons.forEach(btn => this.uiRoot?.removeChild(btn));
    }
    this.unitButtons = [];

    const phase = gameStore.state.phase;
    const activePlayer = phase === 'movement' ? gameStore.state.movingPlayer : gameStore.state.firingPlayer;
    const activeUnits = gameStore.state.units.filter(unit => unit.side === activePlayer);

    if (activeUnits.length === 0) return;

    // Grid layout for unit buttons
    const unitsPerRow = 4;
    const unitButtonSize = vec2(25, 25);
    const unitSpacing = 35;
    const statusBarY = mainCanvasSize.y - this.statusBarHeight;
    const sectionStartX = 40;
    const startY = statusBarY + 70;

    activeUnits.forEach((unit, index) => {
      const row = Math.floor(index / unitsPerRow);
      const col = index % unitsPerRow;
      const x = sectionStartX + col * unitSpacing;
      const y = startY + row * unitSpacing;

      const button = new UnitButton(vec2(x, y), unitButtonSize, '', unit);
      button.color = new Color(0, 0, 0, 0); // Transparent - we'll draw our own
      button.lineWidth = 0;

      button.onPress = () => {
        this.selectUnit(unit);
      };

      this.uiRoot!.addChild(button);
      this.unitButtons.push(button);
    });
  }

  static createMinimapClickArea() {
    const minimapWidth = 130;
    const minimapHeight = 100;
    const statusBarY = mainCanvasSize.y - this.statusBarHeight;
    const minimapX = mainCanvasSize.x - minimapWidth - 20;
    const minimapY = statusBarY + 60;

    this.minimapClickArea = new UIObject(
      vec2(minimapX + minimapWidth / 2, minimapY + minimapHeight / 2),
      vec2(minimapWidth, minimapHeight)
    );
    this.minimapClickArea.color = new Color(0, 0, 0, 0); // Transparent
    this.minimapClickArea.lineWidth = 0;
    this.minimapClickArea.onPress = () => {
      console.log('Minimap clicked at:', LittleJS.mousePosScreen);
      // Add minimap navigation logic here
    };
    this.uiRoot!.addChild(this.minimapClickArea);
  }

  static selectUnit(unit: Unit) {
    // Clear previous selections
    gameStore.state.units.forEach((u) => (u.selected = false));

    // Select new unit
    unit.selected = true;
    gameStore.state.selectedUnit = unit;

    // Calculate reachable hexes (integrate with your movement system)
    // const unitHex = unit.getHexCoords(gameStore.grid);
    // setHexesInRange(unitHex, unit.remainingMovement); // Your existing function
  }

  static drawUIBox(pos: LittleJS.Vector2, size: LittleJS.Vector2, color: Color, text: string, textColor = new Color(1, 1, 1)) {
    // Standard UI box pattern from the examples
    drawRect(pos, size, color, 0, true, true);

    if (text) {
      drawTextScreen(text, pos, Math.min(size.y * 0.6, 14), textColor, 0, undefined, 'center');
    }
  }

  static drawButton(pos: LittleJS.Vector2, size: LittleJS.Vector2, color: Color, text: string, isHovered = false, textColor = new Color(1, 1, 1)) {
    const buttonColor = isHovered ? color.scale(1.2) : color;
    drawRect(pos, size, buttonColor, 0, true, true);

    if (text) {
      drawTextScreen(text, pos, Math.min(size.y * 0.4, 12), textColor, 0, undefined, 'center');
    }
  }

  static render() {
    const canvasSize = mainCanvasSize;

    // Draw all static UI elements using direct drawing
    this.drawBottomBar(canvasSize);
    this.drawActionBar(canvasSize);
    this.drawStatusSections(canvasSize);
  }

  static drawBottomBar(canvasSize: LittleJS.Vector2) {
    // Main background using screen space
    drawRect(
      vec2(canvasSize.x / 2, canvasSize.y - this.barHeight / 2),
      vec2(canvasSize.x, this.barHeight),
      new Color(0.15, 0.15, 0.2, 1),
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

  static drawActionBar(canvasSize: LittleJS.Vector2) {
    const actionBarY = canvasSize.y - this.barHeight + this.actionBarHeight / 2;

    // Action bar background
    drawRect(
      vec2(canvasSize.x / 2, actionBarY),
      vec2(canvasSize.x, this.actionBarHeight),
      new Color(0.2, 0.2, 0.25, 0.9),
      0, true, true
    );

    // Player and phase info
    const phase = gameStore.state.phase;
    const player = phase === 'movement' ? gameStore.state.movingPlayer : gameStore.state.firingPlayer;

    drawTextScreen(
      `Player ${player} | ${phase.toUpperCase()} PHASE`,
      vec2(20, actionBarY),
      18,
      new Color(1, 1, 1),
      0, undefined, 'left'
    );

    // Draw button backgrounds for interactive buttons
    const buttonSize = vec2(35, 35);
    const buttonSpacing = 45;
    const startX = canvasSize.x - 160;

    this.actionButtons.forEach((button, index) => {
      const x = startX + index * buttonSpacing;
      const isHovered = button.mouseIsOver;

      let color = new Color();
      let text = '';
      switch (index) {
        case 0: color = new Color(0.3, 0.3, 0.4); text = ''; break;
        case 1: color = new Color(0.3, 0.3, 0.4); text = ''; break;
        case 2: color = new Color(0.4, 0.3, 0.3); text = ''; break;
      }

      this.drawButton(vec2(x, actionBarY), buttonSize, color, text, isHovered);
    });
  }

  static drawStatusSections(canvasSize: LittleJS.Vector2) {
    const statusBarY = canvasSize.y - this.statusBarHeight;
    const padding = 20;

    // Calculate section widths (same as before)
    const unitInfoWidth = 250;
    const terrainInfoWidth = 250;
    const remainingWidth = canvasSize.x -  unitInfoWidth - terrainInfoWidth;
    const commsWidth = remainingWidth * 0.6;
    const minimapWidth = remainingWidth * 0.4;

    let currentX = 0;

    // Draw sections
    this.drawSectionDivider(vec2(currentX - padding / 2, statusBarY + this.statusBarHeight / 2));

    this.drawUnitInfoSection(vec2(currentX, statusBarY), vec2(unitInfoWidth, this.statusBarHeight));
    currentX += unitInfoWidth + padding;

    this.drawSectionDivider(vec2(currentX - padding / 2, statusBarY + this.statusBarHeight / 2));

    this.drawTerrainInfoSection(vec2(currentX, statusBarY), vec2(terrainInfoWidth, this.statusBarHeight));
    currentX += terrainInfoWidth + padding;

    this.drawSectionDivider(vec2(currentX - padding / 2, statusBarY + this.statusBarHeight / 2));

    this.drawCommsSection(vec2(currentX, statusBarY), vec2(commsWidth, this.statusBarHeight));
    currentX += commsWidth + padding;

    this.drawSectionDivider(vec2(currentX - padding / 2, statusBarY + this.statusBarHeight / 2));

    this.drawMinimapSection(vec2(currentX, statusBarY), vec2(minimapWidth, this.statusBarHeight));
  }

  static drawSectionDivider(pos: LittleJS.Vector2) {
    drawRect(
      pos,
      vec2(2, this.statusBarHeight),
      new Color(0.3, 0.3, 0.35, 0.6),
      0, true, true
    );
  }

  static drawUnitInfoSection(topLeft: LittleJS.Vector2, size: LittleJS.Vector2) {
    const selectedUnit = gameStore.state.selectedUnit;

    // Section header
    drawTextScreen(
      'UNIT INFO',
      vec2(topLeft.x + size.x / 2, topLeft.y + 20),
      14,
      new Color(0.8, 0.8, 0.9),
      0, undefined, 'center'
    );

    if (!selectedUnit) return;

    // Unit image preview background
    const imageSize = 80;
    const imageX = topLeft.x + 50;
    const imageY = topLeft.y + 80;

    this.drawUIBox(
      vec2(imageX, imageY),
      vec2(imageSize, imageSize),
      new Color(0.4, 0.4, 0.5),
      ''
    );

    // Unit info text
    const infoX = topLeft.x + 140;
    const infoStartY = topLeft.y + 50;

    // Unit type
    drawTextScreen(
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
      drawTextScreen(
        stat,
        vec2(infoX, infoStartY + 25 + (i * 18)),
        11,
        new Color(0.9, 0.9, 0.9),
        0, undefined, 'left'
      );
    });
  }

  static drawTerrainInfoSection(topLeft: LittleJS.Vector2, size: LittleJS.Vector2) {
    const selectedHex = gameStore.state.selectedHex;

    drawTextScreen(
      'TERRAIN',
      vec2(topLeft.x + size.x / 2, topLeft.y + 20),
      14,
      new Color(0.8, 0.8, 0.9),
      0, undefined, 'center'
    );

    if (!selectedHex) return;

    // Hex preview
    const previewSize = 80;
    const previewX = topLeft.x + 40;
    const previewY = topLeft.y + 80;

    // Create hexagon shape
    const hexRadius = previewSize / 2;
    const corners = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i * 60 - 30) * Math.PI / 180;
      corners.push(vec2(
        previewX + hexRadius * Math.cos(angle),
        previewY + hexRadius * Math.sin(angle)
      ));
    }

    const terrainColor = new Color().setHex(TerrainColor[selectedHex.terrain.type]);
    drawPoly(corners, terrainColor, 2, new Color(1, 1, 1), true);

    // Terrain info
    const infoX = topLeft.x + 130;
    const infoStartY = topLeft.y + 50;

    const terrainInfo = [
      `Position: (${selectedHex.col}, ${selectedHex.row})`,
      `Type: ${selectedHex.terrain.type}`,
      `Move Cost: ${selectedHex.terrain.movementCost === Infinity ? 'Impassable' : selectedHex.terrain.movementCost}`,
      `Direct Fire: +${selectedHex.terrain.directFireModifier}`,
      `Indirect Fire: +${selectedHex.terrain.indirectFireModifier}`
    ];

    terrainInfo.forEach((info, i) => {
      drawTextScreen(
        info,
        vec2(infoX, infoStartY + (i * 16)),
        10,
        new Color(0.9, 0.9, 0.9),
        0, undefined, 'left'
      );
    });
  }

  static drawCommsSection(topLeft: LittleJS.Vector2, size: LittleJS.Vector2) {
    drawTextScreen(
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

    // Sample messages
    const messages = [
      'Turn started',
      'Unit moved to (5,7)',
      'Combat resolved: Hit!',
      'Phase complete',
      'New turn begins'
    ];

    messages.forEach((msg, i) => {
      drawTextScreen(
        msg,
        vec2(topLeft.x + 15, messageAreaY + 20 + (i * 15)),
        10,
        new Color(0.7, 0.9, 0.7),
        0, undefined, 'left'
      );
    });
  }

  static drawMinimapSection(topLeft: LittleJS.Vector2, size: LittleJS.Vector2) {
    drawTextScreen(
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

    // Simple grid representation
    const gridSpacing = 20;
    for (let i = 1; i < mapWidth / gridSpacing; i++) {
      const x = topLeft.x + 10 + i * gridSpacing;
      drawRect(
        vec2(x, mapY + mapHeight / 2),
        vec2(1, mapHeight),
        new Color(0.2, 0.3, 0.2, 0.5),
        0, true, true
      );
    }
  }

  // static update() {
  //   // Update interactive elements
  //   const canvasSize = mainCanvasSize;

  //   // Check if we need to recreate unit buttons (when active player changes)
  //   static lastActivePlayer = null;
  //   const phase = gameStore.state.phase;
  //   const currentActivePlayer = phase === 'movement' ? gameStore.state.movingPlayer : gameStore.state.firingPlayer;

  //   if (currentActivePlayer !== this.lastActivePlayer) {
  //     this.createUnitButtons();
  //     this.lastActivePlayer = currentActivePlayer;
  //   }

  //   // Update button positions if screen size changed
  //   if (canvasSize.x !== this.lastCanvasWidth || canvasSize.y !== this.lastCanvasHeight) {
  //     this.createActionButtons();
  //     this.createMinimapClickArea();
  //     this.lastCanvasWidth = canvasSize.x;
  //     this.lastCanvasHeight = canvasSize.y;
  //   }
  // }

  // static destroy() {
  //   this.unitButtons = [];
  //   this.actionButtons = [];
  //   this.uiRoot = null;
  // }
}