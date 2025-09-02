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

    // New: Share/Load buttons
    let shareBtn = document.getElementById('share-btn');
    let loadBtn = document.getElementById('load-btn');
    if (!shareBtn) {
        shareBtn = document.createElement('button');
        shareBtn.id = 'share-btn';
        shareBtn.textContent = 'Share';
        inputSection.appendChild(shareBtn);
    }
    if (!loadBtn) {
        loadBtn = document.createElement('button');
        loadBtn.id = 'load-btn';
        loadBtn.textContent = 'Load from URL';
        inputSection.appendChild(loadBtn);
    }

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

    // --- Serialization/Deserialization ---

    // Allowed: A-Z, a-z, 0-9, space, ., ,, ?, !, -, _
    // We escape | and ~ (used as separators) with backslash
    function escapeText(str) {
        return str.replace(/([|~\\])/g, '\\$1');
    }
    function unescapeText(str) {
        return str.replace(/\\([|~\\])/g, '$1');
    }

    function serialize(cards) {
        // word~definition|word~definition|...
        return cards.map(card =>
            `${escapeText(card.word)}~${escapeText(card.definition)}`
        ).join('|');
    }

    function deserialize(str) {
        if (!str) return [];
        let result = [];
        let pair = '';
        let inEscape = false;
        let items = [];
        // Split on |, but handle escapes
        for (let i = 0; i < str.length; i++) {
            let c = str[i];
            if (inEscape) {
                pair += c;
                inEscape = false;
            } else if (c === '\\') {
                inEscape = true;
            } else if (c === '|') {
                items.push(pair);
                pair = '';
            } else {
                pair += c;
            }
        }
        if (pair) items.push(pair);
        for (let item of items) {
            let parts = [];
            let part = '';
            inEscape = false;
            for (let i = 0; i < item.length; i++) {
                let c = item[i];
                if (inEscape) {
                    part += c;
                    inEscape = false;
                } else if (c === '\\') {
                    inEscape = true;
                } else if (c === '~') {
                    parts.push(part);
                    part = '';
                } else {
                    part += c;
                }
            }
            parts.push(part);
            if (parts.length === 2) {
                result.push({ word: parts[0], definition: parts[1] });
            }
        }
        return result;
    }

    // --- Share/Load functionality ---

    shareBtn.onclick = () => {
        const data = serialize(cards);
        const url = `${location.origin}${location.pathname}#data=${encodeURIComponent(data)}`;
        prompt('Share this URL:', url);
    };

    loadBtn.onclick = () => {
        const hash = location.hash;
        if (hash.startsWith('#data=')) {
            const data = decodeURIComponent(hash.slice(6));
            cards = deserialize(data);
            updateWordList();
            alert('Loaded flashcards from URL!');
        } else {
            alert('No flashcard data found in URL.');
        }
    };

    // Auto-load if URL has data
    if (location.hash.startsWith('#data=')) {
        const data = decodeURIComponent(location.hash.slice(6));
        cards = deserialize(data);
        updateWordList();
    }
});