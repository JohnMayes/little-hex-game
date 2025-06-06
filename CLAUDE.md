# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with Vite
- `npm run build` - TypeScript compilation followed by Vite production build
- `npm run preview` - Preview the production build

## Architecture Overview

This is a hex-based strategy game built with TypeScript and the LittleJS engine. The game follows a modular architecture:

### Core State Management
- **Central Store**: `src/store.ts` uses Tanstack Store for global game state
- **Game State**: Manages turn phases (movement/fire), active player, units, and selected unit data
- **Grid System**: Uses Honeycomb Grid library for hex coordinate calculations and pathfinding

### Key Managers
- **MovementManager** (`src/MovementManger.ts`): Handles unit selection, movement validation, A* pathfinding, and animated movement
- **CombatManager** (`src/CombatManager.ts`): Handles line-of-sight calculations, unit targeting, and combat resolution during fire phase
- **TurnManager** (`src/TurnManager.ts`): Manages turn phases and player transitions

### Unit System
- **Unit Class** (`src/objects/unitObjects.ts`): Extends base Counter class with combat stats, movement animations, and selection logic
- **Unit Types** (`src/types/units.ts`): Defines 15 unit types with firepower/range/defense/movement ratings
- **Factory Pattern**: `createUnit()` function for instantiating units with proper stats

### Hex Grid Integration
- **Tile Class** (`src/objects/baseObjects.ts`): Extends Honeycomb's defineHex with terrain and movement cost data
- **Pathfinding**: Uses abstract-astar library with movement cost constraints
- **Coordinate Systems**: Seamlessly converts between pixel coordinates and hex coordinates
- **Line of Sight**: Hex line algorithm for LOS calculations with terrain-based blocking rules

### Rendering Pipeline
- **Main Loop** (`src/main.ts`): Standard LittleJS game loop with hex rendering and camera controls
- **Path Visualization**: Real-time movement path preview with yellow lines and orange dots
- **Unit Selection**: Gold outline rendering for selected units

## Technical Notes

- Uses CommonJS module system with ES6+ features
- LittleJS engine alias configured as `@littlejs` in both tsconfig and vite config
- Movement animations use linear interpolation with configurable speed (0.3s per hex)
- Reachable hex calculation uses breadth-first search with movement point constraints
- Camera bounds constrained to prevent viewing outside game area (0-20 x, 0-18 y)
- LOS calculations use caching for performance optimization
- Terrain system expanded with LOS values (firing/intervening/target) for combat mechanics