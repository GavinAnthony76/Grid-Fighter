window.fakeStorage = {
  _data: {},

  setItem: function (id, val) {
    return this._data[id] = String(val);
  },

  getItem: function (id) {
    return this._data.hasOwnProperty(id) ? this._data[id] : undefined;
  },

  removeItem: function (id) {
    return delete this._data[id];
  },

  clear: function () {
    return this._data = {};
  }
};

function LocalStorageManager() {
  this.bestScoreKey     = "bestScore";
  this.gameStateKey     = "gameState";

  var supported = this.localStorageSupported();
  this.storage = supported ? window.localStorage : window.fakeStorage;
}

LocalStorageManager.prototype.localStorageSupported = function () {
  var testKey = "test";
  var storage = window.localStorage;

  try {
    storage.setItem(testKey, "1");
    storage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
};

// Best score getters/setters
LocalStorageManager.prototype.getBestScore = function () {
  try {
    var score = this.storage.getItem(this.bestScoreKey);
    return score ? parseInt(score, 10) : 0;
  } catch (error) {
    console.error('Failed to get best score:', error);
    return 0;
  }
};

LocalStorageManager.prototype.setBestScore = function (score) {
  try {
    this.storage.setItem(this.bestScoreKey, score);
  } catch (error) {
    console.error('Failed to save best score:', error);
  }
};

// Game state getters/setters and clearing
LocalStorageManager.prototype.getGameState = function () {
  try {
    var stateJSON = this.storage.getItem(this.gameStateKey);
    if (!stateJSON) {
      return null;
    }
    var state = JSON.parse(stateJSON);

    // Validate game state structure
    if (this.isValidGameState(state)) {
      return state;
    } else {
      console.warn('Invalid game state found, clearing corrupted data');
      this.clearGameState();
      return null;
    }
  } catch (error) {
    console.error('Failed to parse game state:', error);
    this.clearGameState();
    return null;
  }
};

LocalStorageManager.prototype.setGameState = function (gameState) {
  try {
    this.storage.setItem(this.gameStateKey, JSON.stringify(gameState));
  } catch (error) {
    console.error('Failed to save game state:', error);
  }
};

LocalStorageManager.prototype.clearGameState = function () {
  this.storage.removeItem(this.gameStateKey);
};

// Validate game state structure
LocalStorageManager.prototype.isValidGameState = function (state) {
  if (!state || typeof state !== 'object') {
    return false;
  }

  // Check required properties
  if (typeof state.score !== 'number' ||
      typeof state.over !== 'boolean' ||
      typeof state.won !== 'boolean' ||
      typeof state.keepPlaying !== 'boolean') {
    return false;
  }

  // Check grid structure
  if (!state.grid || !state.grid.cells || !Array.isArray(state.grid.cells)) {
    return false;
  }

  // Check grid size
  if (typeof state.grid.size !== 'number' || state.grid.size < 2) {
    return false;
  }

  return true;
};
