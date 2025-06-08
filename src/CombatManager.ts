import * as LittleJS from '@littlejs';
import { gameStore, grid } from './store';
import { Unit } from './objects/unitObjects';
import { Tile } from './objects/baseObjects';
import { TerrainType, LOS_VALUES } from './types/terrain';
import { AxialCoordinates } from 'honeycomb-grid';
import { deselectUnit, clearFiringSelection } from './utils';

// Cache for LOS calculations to avoid expensive recalculations
const losCache = new Map<string, boolean>();

export interface LOSResult {
  hasLOS: boolean;
  blockedBy?: Tile;
  interveningHexes: Tile[];
}

/**
 * Get the LOS value for a terrain type in a specific context
 */
function getLOSValue(terrainType: TerrainType, context: 'firing' | 'intervening' | 'target'): number {
  return LOS_VALUES[terrainType]?.[context] ?? 0;
}

/**
 * Generate cache key for LOS calculation
 */
function getLOSCacheKey(fromHex: AxialCoordinates, toHex: AxialCoordinates): string {
  return `${fromHex.q},${fromHex.r}->${toHex.q},${toHex.r}`;
}

/**
 * Clear the LOS cache (call when terrain changes or turn changes)
 */
export function clearLOSCache(): void {
  losCache.clear();
}

/**
 * Find all hexes that a line passes through using hex line algorithm
 * Based on the hex line drawing algorithm from Red Blob Games
 */
function getInterveningHexes(fromHex: Tile, toHex: Tile): Tile[] {
  const distance = grid.distance(fromHex, toHex);
  const interveningHexes: Tile[] = [];
  
  // For adjacent hexes, there are no intervening hexes
  if (distance <= 1) {
    return interveningHexes;
  }
  
  // Use linear interpolation to find all hexes the line passes through
  for (let i = 1; i < distance; i++) {
    const t = i / distance;
    
    // Linear interpolation in cube coordinates
    const cubeFrom = { x: fromHex.q, y: -fromHex.q - fromHex.r, z: fromHex.r };
    const cubeTo = { x: toHex.q, y: -toHex.q - toHex.r, z: toHex.r };
    
    const interpX = cubeFrom.x + (cubeTo.x - cubeFrom.x) * t;
    const interpY = cubeFrom.y + (cubeTo.y - cubeFrom.y) * t;
    const interpZ = cubeFrom.z + (cubeTo.z - cubeFrom.z) * t;
    
    // Round to nearest hex
    const roundedHex = cubeRound({ x: interpX, y: interpY, z: interpZ });
    const axialCoords = { q: roundedHex.x, r: roundedHex.z };
    
    const hex = grid.getHex(axialCoords);
    if (hex && !interveningHexes.some(h => h.q === hex.q && h.r === hex.r)) {
      interveningHexes.push(hex);
    }
  }
  
  return interveningHexes;
}

/**
 * Round cube coordinates to nearest hex
 */
function cubeRound(cube: { x: number; y: number; z: number }): { x: number; y: number; z: number } {
  let rx = Math.round(cube.x);
  let ry = Math.round(cube.y);
  let rz = Math.round(cube.z);
  
  const xDiff = Math.abs(rx - cube.x);
  const yDiff = Math.abs(ry - cube.y);
  const zDiff = Math.abs(rz - cube.z);
  
  if (xDiff > yDiff && xDiff > zDiff) {
    rx = -ry - rz;
  } else if (yDiff > zDiff) {
    ry = -rx - rz;
  } else {
    rz = -rx - ry;
  }
  
  return { x: rx, y: ry, z: rz };
}

/**
 * Calculate line of sight between two hexes
 */
export function calculateLOS(fromHex: Tile, toHex: Tile): LOSResult {
  // Adjacent hexes always have LOS
  const distance = grid.distance(fromHex, toHex);
  if (distance <= 1) {
    return {
      hasLOS: true,
      interveningHexes: []
    };
  }
  
  // Check cache first
  const cacheKey = getLOSCacheKey(fromHex, toHex);
  if (losCache.has(cacheKey)) {
    const hasLOS = losCache.get(cacheKey)!;
    return {
      hasLOS,
      interveningHexes: hasLOS ? getInterveningHexes(fromHex, toHex) : []
    };
  }
  
  // Get LOS values for firing and target hexes
  const firingValue = getLOSValue(fromHex.terrain.type, 'firing');
  const targetValue = getLOSValue(toHex.terrain.type, 'target');
  
  // Find all intervening hexes
  const interveningHexes = getInterveningHexes(fromHex, toHex);
  
  // Check each intervening hex
  for (const hex of interveningHexes) {
    const interveningValue = getLOSValue(hex.terrain.type, 'intervening');
    
    // LOS is blocked if intervening value > BOTH firing AND target values
    if (interveningValue > firingValue && interveningValue > targetValue) {
      losCache.set(cacheKey, false);
      return {
        hasLOS: false,
        blockedBy: hex,
        interveningHexes
      };
    }
  }
  
  // LOS is clear
  losCache.set(cacheKey, true);
  return {
    hasLOS: true,
    interveningHexes
  };
}

/**
 * Calculate LOS between two units
 */
export function calculateLOSBetweenUnits(fromUnit: Unit, toUnit: Unit): LOSResult {
  const fromHex = grid.pointToHex(fromUnit.pos);
  const toHex = grid.pointToHex(toUnit.pos);
  
  return calculateLOS(fromHex, toHex);
}

/**
 * Get all units that have LOS to a target unit
 */
export function getUnitsWithLOSTo(targetUnit: Unit, potentialFiringUnits: Unit[]): Unit[] {
  const unitsWithLOS: Unit[] = [];
  
  for (const unit of potentialFiringUnits) {
    // Don't check LOS to self
    if (unit === targetUnit) continue;
    
    const losResult = calculateLOSBetweenUnits(unit, targetUnit);
    if (losResult.hasLOS) {
      unitsWithLOS.push(unit);
    }
  }
  
  return unitsWithLOS;
}

/**
 * Get all hexes that a unit has line of sight to
 */
export function getVisibleHexes(fromUnit: Unit): AxialCoordinates[] {
  const fromHex = grid.pointToHex(fromUnit.pos);
  const visibleHexes: AxialCoordinates[] = [];
  
  // Check LOS to all hexes on the map
  for (const hex of grid) {
    const losResult = calculateLOS(fromHex, hex);
    if (losResult.hasLOS) {
      visibleHexes.push({ q: hex.q, r: hex.r });
    }
  }
  
  return visibleHexes;
}

/**
 * Get all valid targets for a firing unit (enemy units within range and with LOS)
 */
export function getValidTargets(firingUnit: Unit): Unit[] {
  const enemyUnits = gameStore.state.units.filter(
    unit => unit.side !== firingUnit.side
  );
  
  // Filter by range first, then check LOS
  const unitsInRange = enemyUnits.filter(unit => {
    const firingHex = grid.pointToHex(firingUnit.pos);
    const targetHex = grid.pointToHex(unit.pos);
    const distance = grid.distance(firingHex, targetHex);
    return distance <= firingUnit.range;
  });
  
  return getUnitsWithLOSTo(firingUnit, unitsInRange);
}

// Combat state is now managed in the central game store

function selectFiringUnit(unit: Unit) {
  // Only allow selection during fire phase and if it's the correct player's turn
  if (gameStore.state.phase !== 'fire' || unit.side !== gameStore.state.firingPlayer) {
    return;
  }

  // Clear previous selections
  gameStore.state.units.forEach((u) => (u.selected = false));
  clearFiringSelection();

  // Select new unit
  unit.selected = true;
  gameStore.state.selectedUnit = unit;
  
  
  // Select new firing unit
  gameStore.setState(state => ({
    ...state,
    combat: {
      ...state.combat,
      selectedFiringUnit: unit,
      validTargets: getValidTargets(unit),
      visibleHexes: getVisibleHexes(unit)
    }
  }));
  
  // Update LOS visualization for new selection
  updateLOSVisualization();
}

function updateLOSVisualization() {
  const { selectedFiringUnit, hoveredTarget } = gameStore.state.combat;
  
  if (!selectedFiringUnit || !hoveredTarget) {
    gameStore.setState(state => ({
      ...state,
      combat: {
        ...state.combat,
        losLine: undefined
      }
    }));
    return;
  }
  
  // Create LOS line to hovered target
  const losResult = calculateLOSBetweenUnits(selectedFiringUnit, hoveredTarget);
  const losLine = {
    from: selectedFiringUnit.pos,
    to: hoveredTarget.pos,
    blocked: !losResult.hasLOS
  };
  
  gameStore.setState(state => ({
    ...state,
    combat: {
      ...state.combat,
      losLine
    }
  }));
}

const CombatManager = {
  update() {
    if (gameStore.state.phase === 'fire') {
      // Handle mouse clicks for unit selection and targeting
      if (LittleJS.mouseWasPressed(0)) {
        const hex = grid.pointToHex(LittleJS.mousePos);
        const { x, y } = hex;
        
        // Check if clicking on a unit
        const clickedUnit = gameStore.state.units.find(
          unit => Math.abs(unit.pos.x - x) < 0.1 && Math.abs(unit.pos.y - y) < 0.1
        );
        
        if (clickedUnit) {
          if (clickedUnit.side === gameStore.state.firingPlayer) {
            // Clicking on friendly unit - select for firing
            selectFiringUnit(clickedUnit);
          } else if (gameStore.state.combat.selectedFiringUnit && 
                     gameStore.state.combat.validTargets.some((target) => target == clickedUnit)) {
            // Clicking on valid enemy target - initiate combat
            console.log('Initiating combat!', {
              attacker: gameStore.state.combat.selectedFiringUnit,
              target: clickedUnit
            });
            // TODO: Implement actual combat resolution
          }
        }
      }
      
      // Handle right click or ESC to clear selection
      if (LittleJS.mouseWasPressed(2) || LittleJS.keyWasPressed('Escape')) {
        deselectUnit();
        clearFiringSelection();
        updateLOSVisualization();
      }
      
      // Update hovered target for LOS visualization
      const mouseHex = grid.pointToHex(LittleJS.mousePos);
      const hoveredUnit = gameStore.state.units.find(
        unit => Math.abs(unit.pos.x - mouseHex.x) < 0.1 && 
                Math.abs(unit.pos.y - mouseHex.y) < 0.1
      );
      
      if (hoveredUnit !== gameStore.state.combat.hoveredTarget) {
        gameStore.setState(state => ({
          ...state,
          combat: {
            ...state.combat,
            hoveredTarget: hoveredUnit
          }
        }));
        updateLOSVisualization();
      }
    }
  },
  
  // Getter functions for rendering (now use store)
  getSelectedFiringUnit: () => gameStore.state.combat.selectedFiringUnit,
  getValidTargets: () => gameStore.state.combat.validTargets,
  getHoveredTarget: () => gameStore.state.combat.hoveredTarget,
  getLOSLine: () => gameStore.state.combat.losLine,
  getVisibleHexes: () => gameStore.state.combat.visibleHexes,
  
  // Utility functions
  clearFiringSelection,
  calculateLOS,
  calculateLOSBetweenUnits,
  // getValidTargets,
  clearLOSCache
};

export default CombatManager;