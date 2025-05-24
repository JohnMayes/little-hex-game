import { AxialCoordinates, defineHex } from 'honeycomb-grid';
import { mousePos, EngineObject, vec2, mouseWasPressed, mouseIsDown, mouseWasReleased, Vector2 } from '@littlejs';
import { Terrain, tileVisibility } from '../types/terrain';

export class Counter extends EngineObject  {
  draggable: boolean;
  dragging: boolean;
  // dragOffset: Vector2;
  lastPos: Vector2;
  
  constructor(pos: Vector2) {
    super(pos);
    this.size = vec2(1);
    this.dragging = false;
    this.draggable = false;
    // this.dragOffset = vec2();
    this.lastPos = pos;
  }

  snapToHex(hexPos: Vector2) {
    if (this.dragging) {
      this.pos = hexPos;
    }
  }

  update() {
    // Begin drag when mouse is down and over brick
    if (mouseWasPressed(0) && this.draggable === true) {
      const inX = mousePos.x > this.pos.x - this.size.x / 2 &&
        mousePos.x < this.pos.x + this.size.x / 2;
      const inY = mousePos.y > this.pos.y - this.size.y / 2 &&
        mousePos.y < this.pos.y + this.size.y / 2;

      if (inX && inY) {
        this.lastPos = this.pos;
        this.dragging = true;
        // this.dragOffset = mousePos.subtract(this.pos); // save offset for smooth dragging
      }
    }

    // Drag while mouse is down
    if (mouseIsDown(0) && this.dragging) {
      // this.pos = mousePos.subtract(this.dragOffset);
      this.pos = mousePos;
    }

    //Stop dragging when mouse is released
    if (mouseWasReleased(0)) {
      this.dragging = false;
    }
  }
}

export class Tile extends defineHex({dimensions: 1}) {
  static create(config: AxialCoordinates & { terrain: Terrain }) {
    const tile = new Tile(config)
    tile.terrain = config.terrain
    return tile
  }

  visibility: tileVisibility = 'undiscovered'
  terrain!: Terrain
}
