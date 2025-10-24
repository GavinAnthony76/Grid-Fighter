/**
 * Tests for GameManager
 */

const fs = require('fs');
const path = require('path');

// Load source files in dependency order
const sourceFiles = [
  'tile.js',
  'grid.js',
  'local_storage_manager.js',
  'keyboard_input_manager.js',
  'html_actuator.js',
  'game_manager.js'
];

// Mock window and document
global.window = {
  localStorage: {
    _data: {},
    setItem(key, value) { this._data[key] = String(value); },
    getItem(key) { return this._data[key] || null; },
    removeItem(key) { delete this._data[key]; }
  },
  fakeStorage: {
    _data: {},
    setItem(key, value) { this._data[key] = String(value); },
    getItem(key) { return this._data[key] || undefined; },
    removeItem(key) { delete this._data[key]; }
  },
  requestAnimationFrame: (cb) => setTimeout(cb, 0),
  navigator: { msPointerEnabled: false }
};

global.document = {
  querySelector: () => ({ textContent: '', setAttribute: () => {}, appendChild: () => {}, getElementsByTagName: () => [{ textContent: '' }], classList: { add: () => {}, remove: () => {} } }),
  getElementById: () => ({ textContent: '' }),
  getElementsByClassName: () => [{ addEventListener: () => {} }],
  createElement: () => ({ textContent: '', classList: { add: () => {} }, appendChild: () => {}, setAttribute: () => {} }),
  addEventListener: () => {}
};

// Load all source files
sourceFiles.forEach(file => {
  const code = fs.readFileSync(path.join(__dirname, '../js', file), 'utf8');
  eval(code);
});

describe('GameManager', () => {
  let game;

  beforeEach(() => {
    // Clear localStorage before each test
    window.localStorage._data = {};
    game = new GameManager(4, KeyboardInputManager, HTMLActuator, LocalStorageManager);
  });

  describe('Constructor', () => {
    test('should initialize with correct size', () => {
      expect(game.size).toBe(4);
    });

    test('should create grid', () => {
      expect(game.grid).toBeDefined();
      expect(game.grid.size).toBe(4);
    });

    test('should start with score of 0', () => {
      expect(game.score).toBe(0);
    });

    test('should start with 2 tiles', () => {
      let tileCount = 0;
      game.grid.eachCell((x, y, tile) => {
        if (tile) tileCount++;
      });
      expect(tileCount).toBe(2);
    });

    test('should not be won or over initially', () => {
      expect(game.won).toBe(false);
      expect(game.over).toBe(false);
    });
  });

  describe('addRandomTile', () => {
    test('should add tile to available cell', () => {
      const game = new GameManager(2, KeyboardInputManager, HTMLActuator, LocalStorageManager);
      // Game starts with 2 tiles in 2x2 grid (4 cells)
      let initialCount = 0;
      game.grid.eachCell((x, y, tile) => {
        if (tile) initialCount++;
      });

      game.addRandomTile();

      let finalCount = 0;
      game.grid.eachCell((x, y, tile) => {
        if (tile) finalCount++;
      });

      expect(finalCount).toBe(initialCount + 1);
    });

    test('should add tile with value 2 or 4', () => {
      game.addRandomTile();

      let foundNewTile = false;
      game.grid.eachCell((x, y, tile) => {
        if (tile && !foundNewTile) {
          expect([2, 4]).toContain(tile.value);
          foundNewTile = true;
        }
      });
    });
  });

  describe('moveTile', () => {
    test('should move tile to new position', () => {
      const tile = new Tile({ x: 0, y: 0 }, 2);
      game.grid.insertTile(tile);

      game.moveTile(tile, { x: 1, y: 1 });

      expect(game.grid.cells[0][0]).toBeNull();
      expect(game.grid.cells[1][1]).toBe(tile);
      expect(tile.x).toBe(1);
      expect(tile.y).toBe(1);
    });
  });

  describe('getVector', () => {
    test('should return correct vector for up', () => {
      const vector = game.getVector(0);
      expect(vector).toEqual({ x: 0, y: -1 });
    });

    test('should return correct vector for right', () => {
      const vector = game.getVector(1);
      expect(vector).toEqual({ x: 1, y: 0 });
    });

    test('should return correct vector for down', () => {
      const vector = game.getVector(2);
      expect(vector).toEqual({ x: 0, y: 1 });
    });

    test('should return correct vector for left', () => {
      const vector = game.getVector(3);
      expect(vector).toEqual({ x: -1, y: 0 });
    });
  });

  describe('buildTraversals', () => {
    test('should build traversals in correct order for right movement', () => {
      const vector = { x: 1, y: 0 };
      const traversals = game.buildTraversals(vector);

      expect(traversals.x).toEqual([3, 2, 1, 0]); // Reversed for right
      expect(traversals.y).toEqual([0, 1, 2, 3]);
    });

    test('should build traversals in correct order for down movement', () => {
      const vector = { x: 0, y: 1 };
      const traversals = game.buildTraversals(vector);

      expect(traversals.x).toEqual([0, 1, 2, 3]);
      expect(traversals.y).toEqual([3, 2, 1, 0]); // Reversed for down
    });
  });

  describe('findFarthestPosition', () => {
    test('should find farthest position in empty grid', () => {
      // Clear grid
      game.grid = new Grid(4);

      const cell = { x: 2, y: 2 };
      const vector = { x: -1, y: 0 }; // Left

      const result = game.findFarthestPosition(cell, vector);

      expect(result.farthest).toEqual({ x: 0, y: 2 });
      expect(result.next).toEqual({ x: -1, y: 2 });
    });

    test('should stop at occupied cell', () => {
      game.grid = new Grid(4);
      game.grid.insertTile(new Tile({ x: 1, y: 2 }, 2));

      const cell = { x: 3, y: 2 };
      const vector = { x: -1, y: 0 }; // Left

      const result = game.findFarthestPosition(cell, vector);

      expect(result.farthest).toEqual({ x: 2, y: 2 });
      expect(result.next).toEqual({ x: 1, y: 2 });
    });
  });

  describe('movesAvailable', () => {
    test('should return true when cells available', () => {
      game.grid = new Grid(4);
      game.grid.insertTile(new Tile({ x: 0, y: 0 }, 2));

      expect(game.movesAvailable()).toBe(true);
    });

    test('should return true when tiles can merge', () => {
      game.grid = new Grid(2);
      game.grid.insertTile(new Tile({ x: 0, y: 0 }, 2));
      game.grid.insertTile(new Tile({ x: 0, y: 1 }, 2)); // Same value, adjacent
      game.grid.insertTile(new Tile({ x: 1, y: 0 }, 4));
      game.grid.insertTile(new Tile({ x: 1, y: 1 }, 8));

      expect(game.movesAvailable()).toBe(true);
    });

    test('should return false when no moves available', () => {
      game.grid = new Grid(2);
      game.grid.insertTile(new Tile({ x: 0, y: 0 }, 2));
      game.grid.insertTile(new Tile({ x: 0, y: 1 }, 4));
      game.grid.insertTile(new Tile({ x: 1, y: 0 }, 8));
      game.grid.insertTile(new Tile({ x: 1, y: 1 }, 16));

      expect(game.movesAvailable()).toBe(false);
    });
  });

  describe('tileMatchesAvailable', () => {
    test('should return true for horizontal matches', () => {
      game.grid = new Grid(4);
      game.grid.insertTile(new Tile({ x: 0, y: 0 }, 2));
      game.grid.insertTile(new Tile({ x: 1, y: 0 }, 2));

      expect(game.tileMatchesAvailable()).toBe(true);
    });

    test('should return true for vertical matches', () => {
      game.grid = new Grid(4);
      game.grid.insertTile(new Tile({ x: 0, y: 0 }, 4));
      game.grid.insertTile(new Tile({ x: 0, y: 1 }, 4));

      expect(game.tileMatchesAvailable()).toBe(true);
    });

    test('should return false when no matches', () => {
      game.grid = new Grid(2);
      game.grid.insertTile(new Tile({ x: 0, y: 0 }, 2));
      game.grid.insertTile(new Tile({ x: 0, y: 1 }, 4));
      game.grid.insertTile(new Tile({ x: 1, y: 0 }, 8));
      game.grid.insertTile(new Tile({ x: 1, y: 1 }, 16));

      expect(game.tileMatchesAvailable()).toBe(false);
    });
  });

  describe('positionsEqual', () => {
    test('should return true for same position', () => {
      expect(game.positionsEqual({ x: 1, y: 2 }, { x: 1, y: 2 })).toBe(true);
    });

    test('should return false for different positions', () => {
      expect(game.positionsEqual({ x: 1, y: 2 }, { x: 2, y: 1 })).toBe(false);
    });
  });

  describe('serialize', () => {
    test('should serialize game state', () => {
      const state = game.serialize();

      expect(state.score).toBe(game.score);
      expect(state.over).toBe(game.over);
      expect(state.won).toBe(game.won);
      expect(state.keepPlaying).toBe(game.keepPlaying);
      expect(state.grid).toBeDefined();
    });
  });

  describe('restart', () => {
    test('should reset game state', () => {
      game.score = 100;
      game.over = true;

      game.restart();

      expect(game.score).toBe(0);
      expect(game.over).toBe(false);
      expect(game.won).toBe(false);
    });

    test('should create new grid', () => {
      const oldGrid = game.grid;
      game.restart();

      expect(game.grid).not.toBe(oldGrid);
    });
  });

  describe('isGameTerminated', () => {
    test('should return false for active game', () => {
      game.over = false;
      game.won = false;

      expect(game.isGameTerminated()).toBe(false);
    });

    test('should return true when game over', () => {
      game.over = true;

      expect(game.isGameTerminated()).toBe(true);
    });

    test('should return true when won and not continuing', () => {
      game.won = true;
      game.keepPlaying = false;

      expect(game.isGameTerminated()).toBe(true);
    });

    test('should return false when won but continuing', () => {
      game.won = true;
      game.keepPlaying = true;

      expect(game.isGameTerminated()).toBe(false);
    });
  });

  describe('Game Logic Integration', () => {
    test('should detect win condition at 2048', () => {
      game.grid = new Grid(4);
      game.grid.insertTile(new Tile({ x: 0, y: 0 }, 1024));
      game.grid.insertTile(new Tile({ x: 0, y: 1 }, 1024));

      // Move down to merge
      game.move(2);

      expect(game.won).toBe(true);
    });

    test('should increase score when tiles merge', () => {
      game.grid = new Grid(4);
      game.grid.insertTile(new Tile({ x: 0, y: 0 }, 2));
      game.grid.insertTile(new Tile({ x: 0, y: 1 }, 2));
      game.score = 0;

      // Move down to merge
      game.move(2);

      expect(game.score).toBe(4);
    });

    test('should set game over when no moves available', () => {
      game.grid = new Grid(2);
      game.grid.insertTile(new Tile({ x: 0, y: 0 }, 2));
      game.grid.insertTile(new Tile({ x: 0, y: 1 }, 4));
      game.grid.insertTile(new Tile({ x: 1, y: 0 }, 8));
      game.grid.insertTile(new Tile({ x: 1, y: 1 }, 16));
      game.over = false;

      // Try to move (should fail and set over)
      game.move(0);

      expect(game.over).toBe(true);
    });
  });

  describe('State Persistence', () => {
    test('should save game state', () => {
      game.score = 100;
      game.actuate();

      const saved = window.localStorage.getItem('gameState');
      expect(saved).toBeTruthy();

      const parsed = JSON.parse(saved);
      expect(parsed.score).toBe(100);
    });

    test('should restore game from saved state', () => {
      // Set up a game state
      game.score = 200;
      game.actuate();

      // Create new game (should restore)
      const newGame = new GameManager(4, KeyboardInputManager, HTMLActuator, LocalStorageManager);

      expect(newGame.score).toBe(200);
    });

    test('should save best score', () => {
      game.score = 500;
      game.actuate();

      const bestScore = window.localStorage.getItem('bestScore');
      expect(parseInt(bestScore)).toBe(500);
    });
  });
});
