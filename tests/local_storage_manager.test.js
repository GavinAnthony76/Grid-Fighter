/**
 * Tests for LocalStorageManager
 */

// Mock localStorage
const mockStorage = {
  _data: {},
  setItem: function(key, value) {
    this._data[key] = String(value);
  },
  getItem: function(key) {
    return this._data.hasOwnProperty(key) ? this._data[key] : null;
  },
  removeItem: function(key) {
    delete this._data[key];
  },
  clear: function() {
    this._data = {};
  }
};

// Load the source file
const fs = require('fs');
const path = require('path');
const sourceCode = fs.readFileSync(
  path.join(__dirname, '../js/local_storage_manager.js'),
  'utf8'
);

// Mock window object
global.window = {
  localStorage: mockStorage,
  fakeStorage: mockStorage
};

// Execute the source code to define LocalStorageManager
eval(sourceCode);

describe('LocalStorageManager', () => {
  let manager;

  beforeEach(() => {
    mockStorage.clear();
    manager = new LocalStorageManager();
  });

  describe('Best Score', () => {
    test('should return 0 for initial best score', () => {
      expect(manager.getBestScore()).toBe(0);
    });

    test('should save and retrieve best score', () => {
      manager.setBestScore(1024);
      expect(manager.getBestScore()).toBe(1024);
    });

    test('should update best score', () => {
      manager.setBestScore(512);
      expect(manager.getBestScore()).toBe(512);
      manager.setBestScore(2048);
      expect(manager.getBestScore()).toBe(2048);
    });

    test('should handle invalid best score gracefully', () => {
      mockStorage.setItem('bestScore', 'invalid');
      const score = manager.getBestScore();
      expect(isNaN(score) || score === 0).toBe(true);
    });
  });

  describe('Game State', () => {
    const validGameState = {
      grid: {
        size: 4,
        cells: [[null, null], [null, null]]
      },
      score: 128,
      over: false,
      won: false,
      keepPlaying: false
    };

    test('should return null when no game state exists', () => {
      expect(manager.getGameState()).toBeNull();
    });

    test('should save and retrieve game state', () => {
      manager.setGameState(validGameState);
      const retrieved = manager.getGameState();

      expect(retrieved).not.toBeNull();
      expect(retrieved.score).toBe(128);
      expect(retrieved.over).toBe(false);
      expect(retrieved.won).toBe(false);
    });

    test('should clear game state', () => {
      manager.setGameState(validGameState);
      expect(manager.getGameState()).not.toBeNull();

      manager.clearGameState();
      expect(manager.getGameState()).toBeNull();
    });

    test('should handle corrupted JSON gracefully', () => {
      mockStorage.setItem('gameState', '{invalid json}');
      expect(manager.getGameState()).toBeNull();
    });

    test('should reject invalid game state structure', () => {
      const invalidStates = [
        { score: 'not a number' },
        { score: 100, over: 'not a boolean' },
        { score: 100, over: false, won: false, keepPlaying: false },
        null,
        'string',
        123
      ];

      invalidStates.forEach(invalidState => {
        mockStorage.setItem('gameState', JSON.stringify(invalidState));
        expect(manager.getGameState()).toBeNull();
      });
    });
  });

  describe('Game State Validation', () => {
    test('should validate correct game state', () => {
      const validState = {
        grid: { size: 4, cells: [] },
        score: 100,
        over: false,
        won: false,
        keepPlaying: false
      };
      expect(manager.isValidGameState(validState)).toBe(true);
    });

    test('should reject null or undefined', () => {
      expect(manager.isValidGameState(null)).toBe(false);
      expect(manager.isValidGameState(undefined)).toBe(false);
    });

    test('should reject non-objects', () => {
      expect(manager.isValidGameState('string')).toBe(false);
      expect(manager.isValidGameState(123)).toBe(false);
      expect(manager.isValidGameState(true)).toBe(false);
    });

    test('should reject missing required properties', () => {
      expect(manager.isValidGameState({})).toBe(false);
      expect(manager.isValidGameState({ score: 100 })).toBe(false);
    });

    test('should reject invalid property types', () => {
      const invalidState = {
        grid: { size: 4, cells: [] },
        score: 'not a number',
        over: false,
        won: false,
        keepPlaying: false
      };
      expect(manager.isValidGameState(invalidState)).toBe(false);
    });

    test('should reject invalid grid structure', () => {
      const invalidStates = [
        {
          grid: null,
          score: 100,
          over: false,
          won: false,
          keepPlaying: false
        },
        {
          grid: { size: 'invalid' },
          score: 100,
          over: false,
          won: false,
          keepPlaying: false
        },
        {
          grid: { size: 1, cells: [] },
          score: 100,
          over: false,
          won: false,
          keepPlaying: false
        }
      ];

      invalidStates.forEach(state => {
        expect(manager.isValidGameState(state)).toBe(false);
      });
    });
  });

  describe('localStorage Support Detection', () => {
    test('should detect localStorage support', () => {
      expect(manager.localStorageSupported()).toBe(true);
    });

    test('should fallback to fakeStorage when localStorage unavailable', () => {
      const originalLocalStorage = global.window.localStorage;

      global.window.localStorage = {
        setItem: () => { throw new Error('Not supported'); },
        removeItem: () => {},
        getItem: () => null
      };

      const newManager = new LocalStorageManager();
      expect(newManager.storage).toBe(window.fakeStorage);

      global.window.localStorage = originalLocalStorage;
    });
  });
});
