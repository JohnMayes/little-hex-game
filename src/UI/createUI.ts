import {
  UIObject,
  UIText,
  mainCanvasSize,
  Color,
  vec2,
  Vector2
} from "@littlejs";
import { Unit } from "src/objects/unitObjects";
import { GameState, gameStore } from "../store";
import { Tile } from "src/objects/baseObjects";
import { TerrainColor } from "../types/terrain";

const BACKGROUND_HEIGHT = 350;
const BOX_WIDTH = 300;
const BOX_HEIGHT = 250;

abstract class ReactiveUIObject extends UIObject {
  protected unsubscribers: Array<() => void> = [];

  constructor(pos: Vector2, size?: Vector2) {
    super(pos, size);
  }

  protected subscribeToStore(callback: (store: GameState) => void): void {
    const unsubscriber = gameStore.subscribe(() => {
      callback(gameStore.state)
    });
    this.unsubscribers.push(unsubscriber);
  }

  destroy(): void {
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
  }
}

export class UIMenu extends ReactiveUIObject {
  private selectedUnit: Unit | undefined = undefined;
  private selectedHex: Tile | undefined = undefined;
  private infoBoxes: UIObject[] = [];

  constructor(pos: Vector2, size: Vector2) {
    super(pos, size);
    this.selectedUnit = undefined;
    this.selectedHex = undefined;
    this.createLayout();
    this.setupSubscriptions();
  }

  private setupSubscriptions(): void {
    // Subscribe to specific state changes
    this.subscribeToStore((state: GameState) => {
      if (state.selectedUnit !== this.selectedUnit || state.selectedHex !== this.selectedHex) {
        this.selectedUnit = state.selectedUnit;
        this.selectedHex = state.selectedHex;
        this.updateDisplay();
      }
    });
  }

  private createLayout() {
    const width = this.size.x;
    const padding = 40;
    const boxWidth = 300;
    const boxHeight = 250;

    const infoSection = new UIObject(vec2(0, 0));
    this.addChild(infoSection);

    // Left box for unit and hex display
    const leftX = -width / 2 + padding + boxWidth / 2;
    const leftBox = new UIObject(vec2(leftX, 20), vec2(boxWidth, boxHeight));
    leftBox.color = new Color().setHex('#47503f');
    leftBox.lineWidth = 4;

    infoSection.addChild(leftBox);
    this.infoBoxes.push(leftBox);
  }

  private createUnitDisplay(unit: Unit): UIObject {
    const unitContainer = new UIObject(vec2(0, -60), vec2(BOX_WIDTH - 20, 120));
    
    // Unit name at top
    const unitName = new UIText(vec2(0, -40), vec2(280, 30), unit.type.replace(/_/g, ' '));
    unitName.textColor = new Color(1, 1, 1);
    unitContainer.addChild(unitName);

    // Unit preview rectangle
    const unitPreview = new UIObject(vec2(-100, 0), vec2(60));
    unitPreview.color = unit.side === 'red' ? new Color(0.8, 0.2, 0.2) : new Color(0.2, 0.2, 0.8);
    unitContainer.addChild(unitPreview);

    // Unit stats container
    const statsContainer = new UIObject(vec2(20, 0), vec2(160, 80));
        
    const stats = [
      { label: 'F', value: unit.firepower },
      { label: 'R', value: unit.range },
      { label: 'D', value: unit.defense },
      { label: 'M', value: unit.movement }
    ];

    stats.forEach((stat, index) => {
      const x = (index % 2) * 80 - 40;
      const y = Math.floor(index / 2) * 30 - 15;
      
      const statText = new UIText(vec2(x, y), vec2(70, 20), `${stat.label}: ${stat.value}`);
      statText.textColor = new Color(1, 1, 1);
      statsContainer.addChild(statText);
    });
    
    unitContainer.addChild(statsContainer);
    return unitContainer;
  }

  private createHexDisplay(hex: Tile): UIObject {
    const hexContainer = new UIObject(vec2(0, 60), vec2(BOX_WIDTH - 20, 120));
    
    // Hex preview rectangle
    const hexPreview = new UIObject(vec2(-100, 0), vec2(60));
    const hexColor = TerrainColor[`${this.selectedHex!.terrain.type}`]
    hexPreview.color = new Color().setHex(hexColor);
    hexContainer.addChild(hexPreview);

    // Hex type label
    const hexTypeText = new UIText(vec2(20, -30), vec2(160, 20), hex.terrain.type);
    hexTypeText.textColor = new Color(1, 1, 1);
    hexContainer.addChild(hexTypeText);

    // Hex stats container
    const statsContainer = new UIObject(vec2(20, 10), vec2(160, 80));
    
    const stats = [
      { label: 'Movement cost', value: hex.terrain.movementCost },
      { label: 'Direct fire +', value: hex.terrain.directFireModifier },
      { label: 'Indirect fire +', value: hex.terrain.indirectFireModifier },
      { label: 'POS', value: `${hex.col}, ${hex.row}` }
    ];

    stats.forEach((stat, index) => {
      const x = (index % 2) * 80 - 40;
      const y = Math.floor(index / 2) * 25 - 12;
      
      const statText = new UIText(vec2(x, y), vec2(70, 20), `${stat.label}: ${stat.value}`);
      statText.textColor = new Color(1, 1, 1);
      statsContainer.addChild(statText);
    });
    
    hexContainer.addChild(statsContainer);
    return hexContainer;
  }

  private updateDisplay(): void {
    const leftBox = this.infoBoxes[0];
    if (!leftBox) return;

    // Clear existing children
    leftBox.children = [];

    // Add unit display if unit is selected
    if (this.selectedUnit) {
      const unitDisplay = this.createUnitDisplay(this.selectedUnit);
      leftBox.addChild(unitDisplay);
    }

    // Add hex display if hex is selected
    if (this.selectedHex) {
      const hexDisplay = this.createHexDisplay(this.selectedHex);
      leftBox.addChild(hexDisplay);
    }
  }
}

export const createUI = () => {
  const width = mainCanvasSize.x;
  return new UIMenu(vec2(0, 0), vec2(width, BACKGROUND_HEIGHT));
};
