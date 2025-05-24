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
  EngineersUnit } from "../types/units";
import { Counter } from "./baseObjects";
import { Color, Vector2, drawText, vec2 } from "@littlejs";

export class Unit extends Counter {
  side: UnitSide;
  type: UnitType;
  firepower: number;
  range: number;
  movement: number;
  defense: number;
  remainingMovement: number;

  constructor(pos: Vector2, side: UnitSide, unitStats: UnitStats) {
    super(pos);
    this.side = side;
    this.color = new Color().setHex(this.side === 'blue' ? '#000000' : '#FFFFFF');
    this.type = unitStats.type;
    this.firepower = unitStats.rating.firepower;
    this.range = unitStats.rating.range;
    this.movement = unitStats.rating.movement;
    this.defense = unitStats.rating.defense;
    this.remainingMovement = this.movement;
  }

  move(pos: Vector2, hexesMoved: number, callBack: (remainingMovement: number) => void) {
    if (hexesMoved <= 0) {
      this.snapToHex(pos);
      return;
    }
    
    const remainingMovement = this.remainingMovement - hexesMoved;
    this.remainingMovement = remainingMovement;
    this.snapToHex(pos);
    callBack(remainingMovement);
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
    engineers: EngineersUnit
  };
  return new Unit(pos, side, unitData[type]);
}

