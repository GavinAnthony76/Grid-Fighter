/**
 * Tests for Grid
 */

const fs = require('fs');
const path = require('path');

// Load dependencies
const tileSource = fs.readFileSync(
  path.join(__dirname, '../js/tile.js'),
  'utf8'
);
const gridSource = fs.readFileSync(
  path.join(__dirname, '../js/grid.js'),
  'utf8'
);

eval(tileSource);
eval(gridSource);

describe('Grid', () => {
  describe('Constructor', () => {
    test('should create empty grid of specified size', () => {
      const grid = new Grid(4);

      expect(grid.size).toBe(4);
      expect(grid.cells.length).toBe(4);
      expect(grid.cells[0].length).toBe(4);
    });

    test('should create grid from previous state', () => {
      const previousState = [
        [null, new Tile({ x: 0, y: 1 }, 2), null, null],
        [null, null, null, null],
        [null, null, new Tile({ x: 2, y: 2 }, 4), null],
        [null, null, null, null]
      ];

      const grid = new Grid(4, previousState);

      expect(grid.cells[0][1]).not.toBeNull();
      expect(grid.cells[0][1].value).toBe(2);
      expect(grid.cells[2][2]).not.toBeNull();
      expect(grid.cells[2][2].value).toBe(4);
    });

    test('should create grids of different sizes', () => {
      const sizes = [2, 3, 4, 5, 6];

      sizes.forEach(size => {
        const grid = new Grid(size);
        expect(grid.size).toBe(size);
        expect(grid.cells.length).toBe(size);
        expect(grid.cells[0].length).toBe(size);
      });
    });
  });

  describe('empty', () => {
    test('should create grid with all null cells', () => {
      const grid = new Grid(4);

      grid.eachCell((x, y, tile) => {
        expect(tile).toBeNull();
      });
    });
  });

  describe('availableCells', () => {
    test('should return all cells for empty grid', () => {
      const grid = new Grid(4);
      const available = grid.availableCells();

      expect(available.length).toBe(16);
    });

    test('should return no cells for full grid', () => {
      const grid = new Grid(2);

      for (let x = 0; x < 2; x++) {
        for (let y = 0; y < 2; y++) {
          grid.insertTile(new Tile({ x, y }, 2));
        }
      }

      const available = grid.availableCells();
      expect(available.length).toBe(0);
    });

    test('should return correct number of available cells', () => {
      const grid = new Grid(4);

      grid.insertTile(new Tile({ x: 0, y: 0 }, 2));
      grid.insertTile(new Tile({ x: 1, y: 1 }, 4));
      grid.insertTile(new Tile({ x: 2, y: 2 }, 8));

      const available = grid.availableCells();
      expect(available.length).toBe(13);
    });
  });

  describe('cellsAvailable', () => {
    test('should return true for empty grid', () => {
      const grid = new Grid(4);
      expect(grid.cellsAvailable()).toBe(true);
    });

    test('should return false for full grid', () => {
      const grid = new Grid(2);

      for (let x = 0; x < 2; x++) {
        for (let y = 0; y < 2; y++) {
          grid.insertTile(new Tile({ x, y }, 2));
        }
      }

      expect(grid.cellsAvailable()).toBe(false);
    });

    test('should return true when at least one cell is available', () => {
      const grid = new Grid(2);

      grid.insertTile(new Tile({ x: 0, y: 0 }, 2));
      grid.insertTile(new Tile({ x: 0, y: 1 }, 4));
      grid.insertTile(new Tile({ x: 1, y: 0 }, 8));

      expect(grid.cellsAvailable()).toBe(true);
    });
  });

  describe('randomAvailableCell', () => {
    test('should return a cell from available cells', () => {
      const grid = new Grid(4);
      const cell = grid.randomAvailableCell();

      expect(cell).toBeDefined();
      expect(cell.x).toBeGreaterThanOrEqual(0);
      expect(cell.x).toBeLessThan(4);
      expect(cell.y).toBeGreaterThanOrEqual(0);
      expect(cell.y).toBeLessThan(4);
    });

    test('should return undefined for full grid', () => {
      const grid = new Grid(2);

      for (let x = 0; x < 2; x++) {
        for (let y = 0; y < 2; y++) {
          grid.insertTile(new Tile({ x, y }, 2));
        }
      }

      const cell = grid.randomAvailableCell();
      expect(cell).toBeUndefined();
    });

    test('should eventually return different cells', () => {
      const grid = new Grid(4);
      const cells = new Set();

      for (let i = 0; i < 20; i++) {
        const cell = grid.randomAvailableCell();
        cells.add(`${cell.x},${cell.y}`);
      }

      expect(cells.size).toBeGreaterThan(1);
    });
  });

  describe('cellAvailable', () => {
    test('should return true for empty cell', () => {
      const grid = new Grid(4);
      expect(grid.cellAvailable({ x: 0, y: 0 })).toBe(true);
    });

    test('should return false for occupied cell', () => {
      const grid = new Grid(4);
      grid.insertTile(new Tile({ x: 1, y: 1 }, 2));

      expect(grid.cellAvailable({ x: 1, y: 1 })).toBe(false);
    });
  });

  describe('cellOccupied', () => {
    test('should return false for empty cell', () => {
      const grid = new Grid(4);
      expect(grid.cellOccupied({ x: 0, y: 0 })).toBe(false);
    });

    test('should return true for occupied cell', () => {
      const grid = new Grid(4);
      grid.insertTile(new Tile({ x: 2, y: 3 }, 4));

      expect(grid.cellOccupied({ x: 2, y: 3 })).toBe(true);
    });
  });

  describe('cellContent', () => {
    test('should return null for empty cell', () => {
      const grid = new Grid(4);
      expect(grid.cellContent({ x: 0, y: 0 })).toBeNull();
    });

    test('should return tile for occupied cell', () => {
      const grid = new Grid(4);
      const tile = new Tile({ x: 1, y: 2 }, 8);
      grid.insertTile(tile);

      expect(grid.cellContent({ x: 1, y: 2 })).toBe(tile);
    });

    test('should return null for out of bounds cell', () => {
      const grid = new Grid(4);

      expect(grid.cellContent({ x: -1, y: 0 })).toBeNull();
      expect(grid.cellContent({ x: 0, y: -1 })).toBeNull();
      expect(grid.cellContent({ x: 4, y: 0 })).toBeNull();
      expect(grid.cellContent({ x: 0, y: 4 })).toBeNull();
    });
  });

  describe('withinBounds', () => {
    test('should return true for valid positions', () => {
      const grid = new Grid(4);

      expect(grid.withinBounds({ x: 0, y: 0 })).toBe(true);
      expect(grid.withinBounds({ x: 3, y: 3 })).toBe(true);
      expect(grid.withinBounds({ x: 2, y: 1 })).toBe(true);
    });

    test('should return false for out of bounds positions', () => {
      const grid = new Grid(4);

      expect(grid.withinBounds({ x: -1, y: 0 })).toBe(false);
      expect(grid.withinBounds({ x: 0, y: -1 })).toBe(false);
      expect(grid.withinBounds({ x: 4, y: 0 })).toBe(false);
      expect(grid.withinBounds({ x: 0, y: 4 })).toBe(false);
      expect(grid.withinBounds({ x: -1, y: -1 })).toBe(false);
      expect(grid.withinBounds({ x: 10, y: 10 })).toBe(false);
    });
  });

  describe('insertTile', () => {
    test('should insert tile at correct position', () => {
      const grid = new Grid(4);
      const tile = new Tile({ x: 2, y: 3 }, 16);

      grid.insertTile(tile);

      expect(grid.cells[2][3]).toBe(tile);
    });

    test('should replace existing tile', () => {
      const grid = new Grid(4);
      const tile1 = new Tile({ x: 1, y: 1 }, 2);
      const tile2 = new Tile({ x: 1, y: 1 }, 4);

      grid.insertTile(tile1);
      grid.insertTile(tile2);

      expect(grid.cells[1][1]).toBe(tile2);
    });
  });

  describe('removeTile', () => {
    test('should remove tile from grid', () => {
      const grid = new Grid(4);
      const tile = new Tile({ x: 1, y: 2 }, 32);

      grid.insertTile(tile);
      expect(grid.cells[1][2]).toBe(tile);

      grid.removeTile(tile);
      expect(grid.cells[1][2]).toBeNull();
    });

    test('should not affect other tiles', () => {
      const grid = new Grid(4);
      const tile1 = new Tile({ x: 0, y: 0 }, 2);
      const tile2 = new Tile({ x: 1, y: 1 }, 4);

      grid.insertTile(tile1);
      grid.insertTile(tile2);
      grid.removeTile(tile1);

      expect(grid.cells[0][0]).toBeNull();
      expect(grid.cells[1][1]).toBe(tile2);
    });
  });

  describe('eachCell', () => {
    test('should call callback for every cell', () => {
      const grid = new Grid(3);
      let count = 0;

      grid.eachCell(() => {
        count++;
      });

      expect(count).toBe(9);
    });

    test('should pass correct parameters to callback', () => {
      const grid = new Grid(2);
      const tile = new Tile({ x: 1, y: 0 }, 4);
      grid.insertTile(tile);

      const cells = [];
      grid.eachCell((x, y, t) => {
        cells.push({ x, y, tile: t });
      });

      expect(cells.length).toBe(4);
      expect(cells[2]).toEqual({ x: 1, y: 0, tile });
    });
  });

  describe('serialize', () => {
    test('should serialize empty grid', () => {
      const grid = new Grid(4);
      const serialized = grid.serialize();

      expect(serialized.size).toBe(4);
      expect(serialized.cells.length).toBe(4);
      expect(serialized.cells[0].length).toBe(4);

      serialized.cells.forEach(row => {
        row.forEach(cell => {
          expect(cell).toBeNull();
        });
      });
    });

    test('should serialize grid with tiles', () => {
      const grid = new Grid(4);
      grid.insertTile(new Tile({ x: 0, y: 1 }, 2));
      grid.insertTile(new Tile({ x: 2, y: 3 }, 8));

      const serialized = grid.serialize();

      expect(serialized.cells[0][1]).toEqual({
        position: { x: 0, y: 1 },
        value: 2
      });
      expect(serialized.cells[2][3]).toEqual({
        position: { x: 2, y: 3 },
        value: 8
      });
    });

    test('should create independent copy', () => {
      const grid = new Grid(2);
      const tile = new Tile({ x: 0, y: 0 }, 4);
      grid.insertTile(tile);

      const serialized = grid.serialize();
      grid.removeTile(tile);

      expect(serialized.cells[0][0]).toEqual({
        position: { x: 0, y: 0 },
        value: 4
      });
    });
  });

  describe('fromState', () => {
    test('should restore grid from serialized state', () => {
      const grid1 = new Grid(4);
      grid1.insertTile(new Tile({ x: 0, y: 1 }, 2));
      grid1.insertTile(new Tile({ x: 2, y: 3 }, 8));

      const serialized = grid1.serialize();
      const grid2 = new Grid(4, serialized.cells);

      expect(grid2.cells[0][1].value).toBe(2);
      expect(grid2.cells[2][3].value).toBe(8);
    });
  });

  describe('Integration', () => {
    test('should handle tile insertion and removal workflow', () => {
      const grid = new Grid(4);

      expect(grid.cellsAvailable()).toBe(true);
      expect(grid.availableCells().length).toBe(16);

      const tile1 = new Tile({ x: 1, y: 1 }, 2);
      grid.insertTile(tile1);

      expect(grid.cellOccupied({ x: 1, y: 1 })).toBe(true);
      expect(grid.availableCells().length).toBe(15);

      const tile2 = new Tile({ x: 2, y: 2 }, 4);
      grid.insertTile(tile2);

      expect(grid.availableCells().length).toBe(14);

      grid.removeTile(tile1);

      expect(grid.cellAvailable({ x: 1, y: 1 })).toBe(true);
      expect(grid.availableCells().length).toBe(15);
    });

    test('should correctly track state through serialization', () => {
      const grid1 = new Grid(3);

      for (let i = 0; i < 5; i++) {
        const cell = grid1.randomAvailableCell();
        if (cell) {
          grid1.insertTile(new Tile(cell, 2));
        }
      }

      const serialized = grid1.serialize();
      const grid2 = new Grid(3, serialized.cells);

      expect(grid2.availableCells().length).toBe(
        grid1.availableCells().length
      );
    });
  });
});
