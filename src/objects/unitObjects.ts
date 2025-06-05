import {
  UnitSide,
  UnitType,
  UnitStats,
  HeavyTankUnit,
  MissileTankUnit,
  LightTankUnit,
  SuperheavyUnit,
  HowitzerUnit,
  LADUnit,
  MobileHowitzerUnit,
  GEVUnit,
  LightGEVUnit,
  GEVCarrierUnit,
  InfantryUnit,
  HeavyWeaponsTeamUnit,
  EngineersUnit,
} from '../types/units';
import { Counter } from './baseObjects';
import {
  Color,
  Vector2,
  drawLine,
  drawTile,
  vec2,
  time,
} from '@littlejs';

export class Unit extends Counter {
  side: UnitSide;
  type: UnitType;
  firepower: number;
  range: number;
  movement: number;
  defense: number;
  remainingMovement: number;
  selected: boolean;

  // Animation properties
  isMoving: boolean;
  movementPath: Vector2[];
  currentPathIndex: number;
  moveStartTime: number;
  moveSpeed: number; // Time per hex in seconds
  moveCompleteCallback: ((movement: number) => void) | null;

  constructor(pos: Vector2, side: UnitSide, unitStats: UnitStats) {
    super(pos);
    this.side = side;
    this.color = new Color().setHex(
      this.side === 'blue' ? '#000000' : '#FFFFFF'
    );
    this.type = unitStats.type;
    this.firepower = unitStats.rating.firepower;
    this.range = unitStats.rating.range;
    this.movement = unitStats.rating.movement;
    this.defense = unitStats.rating.defense;
    this.remainingMovement = this.movement;
    this.selected = false;

    // Animation initialization
    this.isMoving = false;
    this.movementPath = [];
    this.currentPathIndex = 0;
    this.moveStartTime = 0;
    this.moveSpeed = 0.3; // 0.3 seconds per hex
    this.moveCompleteCallback = null;
  }

  // New animated movement function
  moveAnimated(
    path: Vector2[],
    movementCost: number,
    callback: (remainingMovement: number) => void
  ) {
    if (movementCost <= 0 || path.length === 0) {
      callback(this.remainingMovement);
      return;
    }

    // Set up animation
    this.isMoving = true;
    this.movementPath = [...path]; // Copy the path
    this.currentPathIndex = 0;
    this.moveStartTime = time;

    // Calculate remaining movement
    const remainingMovement = this.remainingMovement - movementCost;
    this.remainingMovement = remainingMovement;

    // Store callback for when animation completes
    this.moveCompleteCallback = callback;
  }

  // Update method to handle animation
  update() {
    super.update();

    if (this.isMoving && this.movementPath.length > 0) {
      this.updateMovementAnimation();
    }
  }

  updateMovementAnimation() {
    const currentTime = time;
    const timeSinceStart = currentTime - this.moveStartTime;
    const timePerHex = this.moveSpeed;

    // Calculate which hex we should be moving to
    const targetPathIndex = Math.floor(timeSinceStart / timePerHex);

    if (targetPathIndex >= this.movementPath.length) {
      // Animation complete
      this.completeMovement();
      return;
    }

    // Get current and next positions
    const currentHexIndex = Math.min(
      targetPathIndex,
      this.movementPath.length - 1
    );
    const nextHexIndex = Math.min(
      currentHexIndex + 1,
      this.movementPath.length - 1
    );

    const currentHex = this.movementPath[currentHexIndex];
    const nextHex = this.movementPath[nextHexIndex];

    // Calculate interpolation factor for smooth movement
    const hexProgress = (timeSinceStart % timePerHex) / timePerHex;

    // Interpolate position between current and next hex
    if (currentHexIndex !== nextHexIndex) {
      this.pos = vec2(currentHex).lerp(nextHex, hexProgress);
    } else {
      // At final position
      this.pos = currentHex;
    }
  }

  completeMovement() {
    // Snap to final position
    this.pos = this.movementPath[this.movementPath.length - 1];

    // Reset animation state
    this.isMoving = false;
    this.movementPath = [];
    this.currentPathIndex = 0;

    // Call completion callback
    if (this.moveCompleteCallback) {
      this.moveCompleteCallback(this.remainingMovement);
      this.moveCompleteCallback = null;
    }
  }

  // Check if unit can be selected (not moving)
  canBeSelected(): boolean {
    return !this.isMoving && this.remainingMovement > 0;
  }

  render() {
    super.render();

    if (this.selected) {
      const goldColor = new Color().setHex('#FFD700');
      const lineWidth = 0.08;
      const offset = 0.1;

      const halfWidth = this.size.x / 2 + offset;
      const halfHeight = this.size.y / 2 + offset;

      const topLeft = vec2(this.pos.x - halfWidth, this.pos.y + halfHeight);
      const topRight = vec2(this.pos.x + halfWidth, this.pos.y + halfHeight);
      const bottomLeft = vec2(this.pos.x - halfWidth, this.pos.y - halfHeight);
      const bottomRight = vec2(this.pos.x + halfWidth, this.pos.y - halfHeight);

      drawLine(topLeft, topRight, lineWidth, goldColor);
      drawLine(topRight, bottomRight, lineWidth, goldColor);
      drawLine(bottomRight, bottomLeft, lineWidth, goldColor);
      drawLine(bottomLeft, topLeft, lineWidth, goldColor);
    }

    // Optional: Draw a subtle trail or indicator while moving
    if (this.isMoving) {
      const movingColor = new Color().setHex('#00FF00');
      const trailSize = vec2(0.1, 0.1);
      drawTile(this.pos, trailSize, undefined, movingColor);
    }
  }
}

export function createUnit(pos: Vector2, side: UnitSide, type: UnitType): Unit {
  const unitData: Record<UnitType, UnitStats> = {
    heavy_tank: HeavyTankUnit,
    missile_tank: MissileTankUnit,
    light_tank: LightTankUnit,
    superheavy: SuperheavyUnit,
    howitzer: HowitzerUnit,
    LAD: LADUnit,
    mobile_howitzer: MobileHowitzerUnit,
    GEV: GEVUnit,
    light_GEV: LightGEVUnit,
    GEV_carrier: GEVCarrierUnit,
    infantry: InfantryUnit,
    heavy_weapons_team: HeavyWeaponsTeamUnit,
    engineers: EngineersUnit,
  };
  return new Unit(pos, side, unitData[type]);
}
