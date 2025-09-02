document.addEventListener('DOMContentLoaded', () => {
    const wordInput = document.getElementById('word');
    const defInput = document.getElementById('definition');
    const addBtn = document.getElementById('add-btn');
    const startBtn = document.getElementById('start-btn');
    const wordList = document.getElementById('word-list');
    const inputSection = document.getElementById('input-section');
    const reviewSection = document.getElementById('review-section');
    const flashcard = document.getElementById('flashcard');
    const restartBtn = document.getElementById('restart-btn');

    let cards = [];
    let reviewOrder = [];
    let currentIdx = 0;
    let showingWord = true;

    function updateWordList() {
      wordList.innerHTML = '';
      cards.forEach((c, i) => {
        const li = document.createElement('li');
        li.textContent = `${c.word} — ${c.definition}`;
        wordList.appendChild(li);
      });
    }

    addBtn.onclick = () => {
      const word = wordInput.value.trim();
      const definition = defInput.value.trim();
      if (word && definition) {
        cards.push({ word, definition });
        wordInput.value = '';
        defInput.value = '';
        updateWordList();
        wordInput.focus();
      }
    };

    startBtn.onclick = () => {
      if (cards.length === 0) return;
      inputSection.classList.add('hidden');
      reviewSection.classList.remove('hidden');
      startReview();
    };

    function startReview() {
      reviewOrder = shuffle([...Array(cards.length).keys()]);
      currentIdx = 0;
      showingWord = true;
      showCard();
    }

    function showCard() {
      if (currentIdx >= reviewOrder.length) {
        flashcard.textContent = "Review complete!";
        flashcard.style.background = "#d4ffd4";
        flashcard.onclick = null;
        return;
      }
      const idx = reviewOrder[currentIdx];
      flashcard.textContent = cards[idx].word;
      flashcard.style.background = "#e3e3ff";
      showingWord = true;
      flashcard.onclick = () => {
        if (showingWord) {
          flashcard.textContent = cards[idx].definition;
          flashcard.style.background = "#ffe3e3";
          showingWord = false;
        } else {
          currentIdx++;
          showCard();
        }
      };
    }

    restartBtn.onclick = () => {
      inputSection.classList.remove('hidden');
      reviewSection.classList.add('hidden');
    };

    function shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }
});