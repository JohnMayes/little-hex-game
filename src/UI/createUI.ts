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

const BACKGROUND_HEIGHT = 250;
const NUM_BOXES = 5;
const BOX_PADDING = 20;

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
  private labels: UIText[] = [];

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
      if (state.selectedUnit !== this.selectedUnit) {
        this.selectedUnit = state.selectedUnit;
        this.updateUnitDisplay();
      }
      
      if (state.selectedHex !== this.selectedHex) {
        this.selectedHex = state.selectedHex;
        this.updateHexDisplay();
      }
    });
  }

  private createLayout() {
    const width = this.size.x;

    const infoSection = new UIObject(vec2(0, 0));
    this.addChild(infoSection);

    const uiBackground = new UIObject(vec2(0, 0), vec2(width, BACKGROUND_HEIGHT));
    uiBackground.color = new Color().setHex('#47503f');
    infoSection.addChild(uiBackground);

    const totalPadding = BOX_PADDING * (NUM_BOXES + 1);
    const boxWidth = (width - totalPadding) / NUM_BOXES;
    const boxHeight = BACKGROUND_HEIGHT - 40;

    for (let i = 0; i < NUM_BOXES; i++) {
      const x = -width / 2 + BOX_PADDING + boxWidth / 2 + i * (boxWidth + BOX_PADDING);
      const box = new UIObject(vec2(x, 0), vec2(boxWidth, boxHeight));
      box.color = new Color(0, 0, 0, 0.3);

      const label = new UIText(vec2(0, 0), vec2(100, 40), '');
      box.addChild(label);

      this.addChild(box);
      this.infoBoxes.push(box);
      this.labels.push(label);
    }
  }


  private updateUnitDisplay(): void {
    if (this.labels[0]) {
      this.labels[0].text = this.selectedUnit
        ? `Unit: ${this.selectedUnit.type}`
        : 'No Unit Selected';
    }
  }

  private updateHexDisplay(): void {
    if (this.labels[1]) {
      this.labels[1].text = this.selectedHex
        ? `Hex: ${this.selectedHex.q},${this.selectedHex.r}`
        : 'No Hex Selected';
    }
  }
}

export const createUI = () => {
  const width = mainCanvasSize.x;
  return new UIMenu(vec2(0, 0), vec2(width, BACKGROUND_HEIGHT));
};
