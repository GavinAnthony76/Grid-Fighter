/**
 * Integration Tests
 * Tests interactions between multiple components
 */

const fs = require('fs');
const path = require('path');

// Mock window and document
global.window = {
  localStorage: {
    _data: {},
    setItem(key, value) { this._data[key] = String(value); },
    getItem(key) { return this._data[key] || null; },
    removeItem(key) { delete this._data[key]; },
    clear() { this._data = {}; }
  },
  fakeStorage: {
    _data: {},
    setItem(key, value) { this._data[key] = String(value); },
    getItem(key) { return this._data[key] || undefined; },
    removeItem(key) { delete this._data[key]; },
    clear() { this._data = {}; }
  },
  requestAnimationFrame: (cb) => setTimeout(cb, 0),
  navigator: { msPointerEnabled: false }
};

global.document = {
  querySelector: () => ({
    textContent: '',
    setAttribute: () => {},
    appendChild: () => {},
    removeChild: () => {},
    firstChild: null,
    getElementsByTagName: () => [{ textContent: '' }],
    classList: { add: () => {}, remove: () => {} }
  }),
  getElementById: () => ({ textContent: '' }),
  getElementsByClassName: () => [{ addEventListener: () => {} }],
  createElement: () => ({
    textContent: '',
    classList: { add: () => {} },
    appendChild: () => {},
    setAttribute: () => {}
  }),
  addEventListener: () => {}
};

// Load all source files
const sourceFiles = [
  'tile.js',
  'grid.js',
  'local_storage_manager.js',
  'keyboard_input_manager.js',
  'html_actuator.js',
  'game_manager.js'
];

sourceFiles.forEach(file => {
  const code = fs.readFileSync(path.join(__dirname, '../js', file), 'utf8');
  eval(code);
});

describe('Integration Tests', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  describe('Full Game Workflow', () => {
    test('should initialize complete game system', () => {
      const game = new GameManager(
        4,
        KeyboardInputManager,
        HTMLActuator,
        LocalStorageManager
      );

      expect(game).toBeDefined();
      expect(game.grid).toBeDefined();
      expect(game.inputManager).toBeDefined();
      expect(game.storageManager).toBeDefined();
      expect(game.actuator).toBeDefined();
    });

    test('should play complete game sequence', () => {
      const game = new GameManager(
        2,
        KeyboardInputManager,
        HTMLActuator,
        LocalStorageManager
      );

      // Set up specific tile configuration
      game.grid = new Grid(2);
      game.grid.insertTile(new Tile({ x: 0, y: 0 }, 2));
      game.grid.insertTile(new Tile({ x: 0, y: 1 }, 2));
      game.score = 0;

      // Move down - should merge tiles
      game.move(2);

      expect(game.score).toBeGreaterThan(0);

      // Verify grid state changed
      const bottomLeft = game.grid.cellContent({ x: 0, y: 1 });
      expect(bottomLeft).not.toBeNull();
      expect(bottomLeft.value).toBe(4);
    });

    test('should persist and restore game across sessions', () => {
      // Session 1: Play game
      const game1 = new GameManager(
        4,
        KeyboardInputManager,
        HTMLActuator,
        LocalStorageManager
      );

      game1.score = 150;
      game1.actuate();

      // Session 2: Restore game
      const game2 = new GameManager(
        4,
        KeyboardInputManager,
        HTMLActuator,
        LocalStorageManager
      );

      expect(game2.score).toBe(150);
    });

    test('should track best score across multiple games', () => {
      // Game 1
      const game1 = new GameManager(
        4,
        KeyboardInputManager,
        HTMLActuator,
        LocalStorageManager
      );
      game1.score = 100;
      game1.actuate();

      expect(game1.storageManager.getBestScore()).toBe(100);

      // Game 2 with higher score
      game1.restart();
      game1.score = 200;
      game1.actuate();

      expect(game1.storageManager.getBestScore()).toBe(200);

      // Game 3 with lower score shouldn't change best
      game1.restart();
      game1.score = 50;
      game1.actuate();

      expect(game1.storageManager.getBestScore()).toBe(200);
    });
  });

  describe('Grid and Tile Integration', () => {
    test('should handle tile movement and grid updates', () => {
      const grid = new Grid(4);
      const tile = new Tile({ x: 0, y: 0 }, 2);

      grid.insertTile(tile);
      expect(grid.cellOccupied({ x: 0, y: 0 })).toBe(true);

      grid.removeTile(tile);
      expect(grid.cellAvailable({ x: 0, y: 0 })).toBe(true);
    });

    test('should serialize and deserialize grid with tiles', () => {
      const grid1 = new Grid(4);
      grid1.insertTile(new Tile({ x: 1, y: 2 }, 4));
      grid1.insertTile(new Tile({ x: 3, y: 0 }, 8));

      const serialized = grid1.serialize();
      const grid2 = new Grid(4, serialized.cells);

      expect(grid2.cellContent({ x: 1, y: 2 }).value).toBe(4);
      expect(grid2.cellContent({ x: 3, y: 0 }).value).toBe(8);
    });
  });

  describe('Storage and State Management', () => {
    test('should handle localStorage errors gracefully', () => {
      const storage = new LocalStorageManager();

      // Corrupt the data
      window.localStorage.setItem('gameState', '{invalid json}');

      // Should return null instead of throwing
      const state = storage.getGameState();
      expect(state).toBeNull();
    });

    test('should validate game state before loading', () => {
      const storage = new LocalStorageManager();

      // Save invalid state
      window.localStorage.setItem(
        'gameState',
        JSON.stringify({ score: 'not a number' })
      );

      const state = storage.getGameState();
      expect(state).toBeNull();
    });

    test('should handle best score as number correctly', () => {
      const storage = new LocalStorageManager();

      storage.setBestScore(250);
      const score = storage.getBestScore();

      expect(typeof score).toBe('number');
      expect(score).toBe(250);
    });
  });

  describe('End-to-End Game Scenarios', () => {
    test('should handle winning scenario', () => {
      const game = new GameManager(
        4,
        KeyboardInputManager,
        HTMLActuator,
        LocalStorageManager
      );

      // Set up tiles that will create 2048
      game.grid = new Grid(4);
      game.grid.insertTile(new Tile({ x: 0, y: 0 }, 1024));
      game.grid.insertTile(new Tile({ x: 1, y: 0 }, 1024));

      game.move(3); // Move left to merge

      expect(game.won).toBe(true);
    });

    test('should handle game over scenario', () => {
      const game = new GameManager(
        2,
        KeyboardInputManager,
        HTMLActuator,
        LocalStorageManager
      );

      // Fill grid with no possible moves
      game.grid = new Grid(2);
      game.grid.insertTile(new Tile({ x: 0, y: 0 }, 2));
      game.grid.insertTile(new Tile({ x: 0, y: 1 }, 4));
      game.grid.insertTile(new Tile({ x: 1, y: 0 }, 8));
      game.grid.insertTile(new Tile({ x: 1, y: 1 }, 16));

      game.move(0); // Try any move

      expect(game.over).toBe(true);
    });

    test('should allow continuing after winning', () => {
      const game = new GameManager(
        4,
        KeyboardInputManager,
        HTMLActuator,
        LocalStorageManager
      );

      game.won = true;
      game.keepPlaying = false;

      expect(game.isGameTerminated()).toBe(true);

      game.keepPlaying = true;

      expect(game.isGameTerminated()).toBe(false);
    });
  });

  describe('Multiple Component Interactions', () => {
    test('should coordinate grid, storage, and game manager', () => {
      const game = new GameManager(
        4,
        KeyboardInputManager,
        HTMLActuator,
        LocalStorageManager
      );

      const initialTileCount = game.grid.availableCells().length;

      game.addRandomTile();

      const afterAddTileCount = game.grid.availableCells().length;

      expect(afterAddTileCount).toBe(initialTileCount - 1);
    });

    test('should maintain consistency across restart', () => {
      const game = new GameManager(
        4,
        KeyboardInputManager,
        HTMLActuator,
        LocalStorageManager
      );

      // Play some moves
      game.score = 500;
      game.over = true;

      // Restart
      game.restart();

      // Verify clean state
      expect(game.score).toBe(0);
      expect(game.over).toBe(false);
      expect(game.won).toBe(false);
      expect(game.grid).toBeDefined();

      // Verify new tiles added
      let tileCount = 0;
      game.grid.eachCell((x, y, tile) => {
        if (tile) tileCount++;
      });
      expect(tileCount).toBe(2);
    });
  });
});
