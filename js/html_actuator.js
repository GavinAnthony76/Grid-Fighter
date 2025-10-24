class HTMLActuator {
  constructor() {
    this.tileContainer    = document.querySelector(".tile-container");
    this.scoreContainer   = document.querySelector(".score-container");
    this.bestContainer    = document.querySelector(".best-container");
    this.messageContainer = document.querySelector(".game-message");
    this.announcerContainer = document.getElementById("game-announcer");

    this.score = 0;
  }

  actuate(grid, metadata) {
    // Use requestAnimationFrame for smooth 60fps rendering on mobile
    window.requestAnimationFrame(() => {
      this.clearContainer(this.tileContainer);

      // Use DocumentFragment for better mobile performance
      const fragment = document.createDocumentFragment();
      const tiles = [];

      grid.cells.forEach(column => {
        column.forEach(cell => {
          if (cell) {
            tiles.push(cell);
          }
        });
      });

      // Batch DOM updates
      tiles.forEach(tile => {
        const tileElement = this.createTileElement(tile);
        fragment.appendChild(tileElement);
      });

      this.tileContainer.appendChild(fragment);

      this.updateScore(metadata.score);
      this.updateBestScore(metadata.bestScore);

      if (metadata.terminated) {
        if (metadata.over) {
          this.message(false); // You lose
        } else if (metadata.won) {
          this.message(true); // You win!
        }
      }
    });
  }

  createTileElement(tile) {
    const wrapper = document.createElement("div");
    const inner = document.createElement("div");
    const position = tile.previousPosition || { x: tile.x, y: tile.y };
    const positionClass = this.positionClass(position);

    const classes = ["tile", `tile-${tile.value}`, positionClass];

    if (tile.value > 2048) classes.push("tile-super");

    this.applyClasses(wrapper, classes);

    inner.classList.add("tile-inner");
    inner.textContent = tile.value;

    if (tile.previousPosition) {
      window.requestAnimationFrame(() => {
        classes[2] = this.positionClass({ x: tile.x, y: tile.y });
        this.applyClasses(wrapper, classes);
      });
    } else if (tile.mergedFrom) {
      classes.push("tile-merged");
      this.applyClasses(wrapper, classes);

      tile.mergedFrom.forEach(merged => {
        const mergedElement = this.createTileElement(merged);
        this.tileContainer.appendChild(mergedElement);
      });
    } else {
      classes.push("tile-new");
      this.applyClasses(wrapper, classes);
    }

    wrapper.appendChild(inner);
    return wrapper;
  }

  // Continues the game (both restart and keep playing)
  continueGame() {
    this.clearMessage();
  }

  clearContainer(container) {
    // Optimized for mobile performance
    container.innerHTML = '';
  }

  applyClasses(element, classes) {
    element.setAttribute("class", classes.join(" "));
  }

  normalizePosition(position) {
    return { x: position.x + 1, y: position.y + 1 };
  }

  positionClass(position) {
    position = this.normalizePosition(position);
    return `tile-position-${position.x}-${position.y}`;
  }

  updateScore(score) {
    this.clearContainer(this.scoreContainer);

    const difference = score - this.score;
    this.score = score;

    this.scoreContainer.textContent = this.score;
    this.scoreContainer.setAttribute('aria-label', `Current score: ${this.score}`);

    if (difference > 0) {
      const addition = document.createElement("div");
      addition.classList.add("score-addition");
      addition.textContent = `+${difference}`;

      this.scoreContainer.appendChild(addition);

      // Announce score increase to screen readers
      this.announce(`Score increased by ${difference}. Current score: ${this.score}`);
    }
  }

  updateBestScore(bestScore) {
    this.bestContainer.textContent = bestScore;
    this.bestContainer.setAttribute('aria-label', `Best score: ${bestScore}`);
  }

  message(won) {
    const type = won ? "game-won" : "game-over";
    const message = won ? "You win!" : "Game over!";

    this.messageContainer.classList.add(type);
    this.messageContainer.getElementsByTagName("p")[0].textContent = message;

    // Announce game end to screen readers
    const announcement = won
      ? `Congratulations! You reached 2048 and won the game! Final score: ${this.score}`
      : `Game over! No more moves available. Final score: ${this.score}`;
    this.announce(announcement);
  }

  clearMessage() {
    // IE only takes one value to remove at a time.
    this.messageContainer.classList.remove("game-won");
    this.messageContainer.classList.remove("game-over");
  }

  // Announce game state changes to screen readers
  announce(message) {
    if (this.announcerContainer) {
      this.announcerContainer.textContent = message;

      // Clear after a short delay to allow re-announcement of same message
      setTimeout(() => {
        this.announcerContainer.textContent = '';
      }, 1000);
    }
  }
}
