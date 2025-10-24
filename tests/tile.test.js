/**
 * Tests for Tile
 */

const fs = require('fs');
const path = require('path');

// Load the Tile source file
const tileSource = fs.readFileSync(
  path.join(__dirname, '../js/tile.js'),
  'utf8'
);

eval(tileSource);

describe('Tile', () => {
  describe('Constructor', () => {
    test('should create tile with given position and value', () => {
      const tile = new Tile({ x: 2, y: 3 }, 4);

      expect(tile.x).toBe(2);
      expect(tile.y).toBe(3);
      expect(tile.value).toBe(4);
    });

    test('should default to value 2 when no value provided', () => {
      const tile = new Tile({ x: 0, y: 0 });

      expect(tile.value).toBe(2);
    });

    test('should initialize previousPosition as null', () => {
      const tile = new Tile({ x: 1, y: 1 }, 8);

      expect(tile.previousPosition).toBeNull();
    });

    test('should initialize mergedFrom as null', () => {
      const tile = new Tile({ x: 1, y: 1 }, 16);

      expect(tile.mergedFrom).toBeNull();
    });
  });

  describe('savePosition', () => {
    test('should save current position to previousPosition', () => {
      const tile = new Tile({ x: 2, y: 3 }, 8);

      tile.savePosition();

      expect(tile.previousPosition).toEqual({ x: 2, y: 3 });
    });

    test('should update previousPosition when called multiple times', () => {
      const tile = new Tile({ x: 0, y: 0 }, 2);

      tile.savePosition();
      expect(tile.previousPosition).toEqual({ x: 0, y: 0 });

      tile.updatePosition({ x: 1, y: 1 });
      tile.savePosition();
      expect(tile.previousPosition).toEqual({ x: 1, y: 1 });
    });

    test('should create independent copy of position', () => {
      const tile = new Tile({ x: 1, y: 1 }, 4);

      tile.savePosition();
      tile.x = 2;
      tile.y = 2;

      expect(tile.previousPosition).toEqual({ x: 1, y: 1 });
    });
  });

  describe('updatePosition', () => {
    test('should update tile position', () => {
      const tile = new Tile({ x: 0, y: 0 }, 16);

      tile.updatePosition({ x: 3, y: 2 });

      expect(tile.x).toBe(3);
      expect(tile.y).toBe(2);
    });

    test('should not affect value when updating position', () => {
      const tile = new Tile({ x: 1, y: 1 }, 32);

      tile.updatePosition({ x: 2, y: 2 });

      expect(tile.value).toBe(32);
    });

    test('should allow multiple position updates', () => {
      const tile = new Tile({ x: 0, y: 0 }, 64);

      tile.updatePosition({ x: 1, y: 0 });
      expect(tile.x).toBe(1);
      expect(tile.y).toBe(0);

      tile.updatePosition({ x: 2, y: 1 });
      expect(tile.x).toBe(2);
      expect(tile.y).toBe(1);

      tile.updatePosition({ x: 3, y: 3 });
      expect(tile.x).toBe(3);
      expect(tile.y).toBe(3);
    });
  });

  describe('serialize', () => {
    test('should serialize tile to object with position and value', () => {
      const tile = new Tile({ x: 2, y: 1 }, 128);

      const serialized = tile.serialize();

      expect(serialized).toEqual({
        position: { x: 2, y: 1 },
        value: 128
      });
    });

    test('should create independent copy when serializing', () => {
      const tile = new Tile({ x: 1, y: 2 }, 256);

      const serialized = tile.serialize();
      tile.x = 3;
      tile.y = 3;
      tile.value = 512;

      expect(serialized).toEqual({
        position: { x: 1, y: 2 },
        value: 256
      });
    });

    test('should serialize tiles with different values correctly', () => {
      const values = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048];

      values.forEach(value => {
        const tile = new Tile({ x: 0, y: 0 }, value);
        const serialized = tile.serialize();

        expect(serialized.value).toBe(value);
      });
    });
  });

  describe('Integration', () => {
    test('should track position changes with savePosition and updatePosition', () => {
      const tile = new Tile({ x: 0, y: 0 }, 4);

      expect(tile.previousPosition).toBeNull();

      tile.savePosition();
      expect(tile.previousPosition).toEqual({ x: 0, y: 0 });

      tile.updatePosition({ x: 2, y: 3 });
      expect(tile.x).toBe(2);
      expect(tile.y).toBe(3);
      expect(tile.previousPosition).toEqual({ x: 0, y: 0 });

      tile.savePosition();
      expect(tile.previousPosition).toEqual({ x: 2, y: 3 });
    });

    test('should handle merged tile workflow', () => {
      const tile1 = new Tile({ x: 0, y: 0 }, 4);
      const tile2 = new Tile({ x: 1, y: 0 }, 4);
      const merged = new Tile({ x: 1, y: 0 }, 8);

      merged.mergedFrom = [tile1, tile2];

      expect(merged.value).toBe(8);
      expect(merged.mergedFrom.length).toBe(2);
      expect(merged.mergedFrom[0]).toBe(tile1);
      expect(merged.mergedFrom[1]).toBe(tile2);
    });
  });
});
