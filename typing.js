// convert string in to array
const words = "The quick brown fox jumps over the lazy dog.".split(" ");
console.log(words);
const wordsCount = words.length;
const gameTime = 60 * 1000;
window.timer = null;
window.gameStart = null;

function addClass(el, name) {
  if (el && !el.className.includes(name)) {
    el.classList.add(name);
  }
}

function removeClass(el, name) {
  if (el && el.className.includes(name)) {
    el.classList.remove(name);
  }
}

function randomWord() {
  const randomIndex = Math.floor(Math.random() * wordsCount);
  return words[randomIndex];
}

function formatWord(word) {
  return `<div class='word'><span class="letter">${word
    .split("")
    .join('</span><span class="letter">')}</span></div>`;
}

// by default cursor position
function positionCursor() {
  const game = document.getElementById("game");
  const cursor = document.getElementById("cursor");

  if (game && cursor) {
    const gameRect = game.getBoundingClientRect();

    cursor.style.top = gameRect.top + 4.5 + "px";
    cursor.style.left = gameRect.left + 3.5 + "px";
  }
}

// Update position on window resize and initial load
window.addEventListener("load", positionCursor);
window.addEventListener("resize", positionCursor);

// move lines forward / backward words
function adjustLinePosition() {
  const currentWord = document.querySelector(".word.current");
  const words = document.getElementById("words");

  if (!currentWord || !words) return;

  const currentMargin = parseInt(words.style.marginTop || "0px");
  const wordTop = currentWord.getBoundingClientRect().top;

  if (wordTop > 250) {
    words.style.marginTop = currentMargin - 35 + "px";
  } else if (wordTop < 200 && currentMargin < 0) {
    words.style.marginTop = Math.min(0, currentMargin + 35) + "px";
  }
}

function adjustCursorPosition() {
  const nextLetter = document.querySelector(".letter.current");
  const nextWord = document.querySelector(".word.current");
  const cursor = document.querySelector("#cursor");

  if (cursor && (nextLetter || nextWord)) {
    cursor.style.top =
      (nextLetter || nextWord).getBoundingClientRect().top + 2 + "px";
    cursor.style.left =
      (nextLetter || nextWord).getBoundingClientRect()[
        nextLetter ? "left" : "right"
      ] + "px";
  }
}

// new game button
function newGame() {
  const wordsEl = document.getElementById("words");
  const infoEl = document.getElementById("info");
  const gameEl = document.getElementById("game");

  if (!wordsEl || !infoEl || !gameEl) {
    console.error("Required game elements not found");
    return;
  }

  let wordsHTML = "";
  for (let i = 0; i < 200; i++) {
    wordsHTML += formatWord(randomWord());
  }
  wordsEl.innerHTML = wordsHTML;

  const firstWord = document.querySelector(".word");
  const firstLetter = document.querySelector(".letter");

  if (firstWord) addClass(firstWord, "current");
  if (firstLetter) addClass(firstLetter, "current");

  infoEl.innerHTML = gameTime / 1000 + "s";

  // reset game
  removeClass(gameEl, "over");
  wordsEl.style = "";
  window.removeEventListener("click", positionCursor);
  window.addEventListener("click", positionCursor);
  window.timer = null;
  window.gameStart = null;
}

function getWpm() {
  const words = [...document.querySelectorAll(".word")];
  const lastTypedWord = document.querySelector(".word.current");
  const lastTypedWordIndex = words.indexOf(lastTypedWord) + 1;
  const typeWords = words.slice(0, lastTypedWordIndex);

  const correctWords = typeWords.filter((word) => {
    const letters = [...word.children];

    const incorrectLetters = letters.filter((letter) =>
      letter.className.includes("incorrect")
    );

    const correctLetters = letters.filter((letter) =>
      letter.className.includes("correct")
    );
    return (
      incorrectLetters.length === 0 && correctLetters.length === letters.length
    );
  });

  // console.log(lastTypedWordIndex);
  console.log("typeWords", typeWords);
  console.log("correctWords", correctWords.length);

  const actualTimeElapsed = window.gameStart
    ? new Date().getTime() - window.gameStart
    : gameTime;
  return Math.round((correctWords.length / actualTimeElapsed) * 60000);
}

function gameOver() {
  clearInterval(window.timer);
  const gameEl = document.getElementById("game");
  const infoEl = document.getElementById("info");

  if (!gameEl.className.includes("over")) {
    addClass(gameEl, "over");
  }
  infoEl.innerHTML = `WPM: ${getWpm()}`;
}

document.getElementById("game").addEventListener("keyup", (e) => {
  const key = e.key;
  const currentWord = document.querySelector(".word.current");
  const currentLetter = document.querySelector(".letter.current");

  if (!currentWord) {
    return;
  }

  const expected = currentLetter?.innerHTML || " ";
  const isLetter = key.length === 1 && key !== " ";
  const isSpace = key === " ";
  const isBackspace = key === "Backspace";
  const isFirstLetter = currentLetter === currentWord.firstChild;

  if (document.querySelector("#game.over")) {
    return;
  }

  if (!window.timer && (isLetter || isSpace)) {
    window.timer = setInterval(() => {
      if (!window.gameStart) {
        window.gameStart = new Date().getTime();
      }
      const currentTime = new Date().getTime();
      const msPassed = currentTime - window.gameStart;
      const sPassed = Math.round(msPassed / 1000);
      const sLeft = gameTime / 1000 - sPassed;
      if (sLeft <= 0) {
        gameOver(); // game over
        return;
      }
      document.getElementById("info").innerHTML = sLeft + "s";
    }, 1000);
  }

  if (isLetter) {
    if (currentLetter) {
      addClass(currentLetter, key === expected ? "correct" : "incorrect");
      removeClass(currentLetter, "current");
      if (currentLetter.nextSibling) {
        addClass(currentLetter.nextSibling, "current");
      }
    } else {
      const incorrectLetter = document.createElement("span");
      incorrectLetter.innerHTML = key;
      incorrectLetter.className = "letter incorrect extra";
      currentWord.appendChild(incorrectLetter);
    }
  }

  // character is space
  if (isSpace) {
    if (expected !== " ") {
      const letterToInvalidate = [
        ...document.querySelectorAll(".word.current .letter:not(.correct)"),
      ];

      letterToInvalidate.forEach((letter) => {
        addClass(letter, "incorrect");
      });
    }
    if (currentLetter) removeClass(currentLetter, "current");
    if (currentWord.nextSibling) {
      removeClass(currentWord, "current");
      addClass(currentWord.nextSibling, "current");
      addClass(currentWord.nextSibling.firstChild, "current");
    }
  }

  // character is backspace
  if (isBackspace) {
    if (currentLetter && isFirstLetter) {
      // console.log("execute first");

      if (currentWord.previousSibling) {
        removeClass(currentWord, "current");
        removeClass(currentLetter, "current");
        addClass(currentWord.previousSibling, "current");

        // Check if previous word has extra letters
        if (
          currentWord.previousSibling.lastChild &&
          currentWord.previousSibling.lastChild.className.includes("extra")
        ) {
          currentWord.previousSibling.lastChild.remove();
        } else if (currentWord.previousSibling.lastChild) {
          addClass(currentWord.previousSibling.lastChild, "current");
          removeClass(currentWord.previousSibling.lastChild, "incorrect");
          removeClass(currentWord.previousSibling.lastChild, "correct");
        }
      }
    } else if (currentLetter && !isFirstLetter) {
      // console.log("execute second");
      removeClass(currentLetter, "current");

      if (currentLetter.previousSibling) {
        addClass(currentLetter.previousSibling, "current");
        removeClass(currentLetter.previousSibling, "incorrect");
        removeClass(currentLetter.previousSibling, "correct");
      }
    } else if (!currentLetter && currentWord.lastChild) {
      // console.log("execute third");

      // Check if last child exists and has extra class
      if (currentWord.lastChild.className.includes("extra")) {
        currentWord.lastChild.remove();
      } else {
        addClass(currentWord.lastChild, "current");
        removeClass(currentWord.lastChild, "incorrect");
        removeClass(currentWord.lastChild, "correct");
      }
    }
  }

  // move lines forward / backward words
  adjustLinePosition();

  // move cursor
  adjustCursorPosition();
});

// new-game event listener
document.getElementById("newGameBtn").addEventListener("click", function () {
  gameOver();
  newGame();
});

// start game
newGame();
