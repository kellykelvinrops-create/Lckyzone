// LuckyZone: Lucky Spin, Lucky Target, Lucky Cards
// Each game starts on its own, so one missing element can't break the others.

document.addEventListener("DOMContentLoaded", () => {
  const START_COINS = 1000;
  const STORAGE_KEY = "luckyzone-coins";
  const $ = (id) => document.getElementById(id);

  // ===== SHARED COINS =====
  let coins = START_COINS;
  try {
    const saved = parseInt(localStorage.getItem(STORAGE_KEY), 10);
    if (!isNaN(saved)) coins = saved;
  } catch (e) {}

  function setCoins(amount) {
    coins = amount;
    try { localStorage.setItem(STORAGE_KEY, coins); } catch (e) {}
    // works with the old id="coins" and the new class="coin-count"
    document.querySelectorAll(".coin-count, #coins").forEach((el) => {
      el.textContent = coins;
    });
  }

  function canAfford(cost, messageEl) {
    if (coins >= cost) return true;
    if (messageEl) messageEl.textContent = "Not enough coins. Reset them in the footer.";
    return false;
  }

  function pickWeighted(items) {
    let roll = Math.random() * items.reduce((s, i) => s + i.weight, 0);
    for (const item of items) {
      roll -= item.weight;
      if (roll < 0) return item;
    }
    return items[items.length - 1];
  }

  setCoins(coins);

  const resetBtn = $("reset-coins");
  if (resetBtn) resetBtn.addEventListener("click", () => setCoins(START_COINS));

  // ===== LUCKY SPIN =====
  function initSpin() {
    const btn = $("spin-btn");
    const wheel = $("spin-wheel") || document.querySelector(".spin-wheel");
    const result = $("result");
    if (!btn || !wheel || !result) return;

    const COST = 100;
    const PRIZES = [
      { win: 0, weight: 50 },
      { win: 100, weight: 30 },
      { win: 200, weight: 14 },
      { win: 500, weight: 5 },
      { win: 2000, weight: 1 },
    ];
    const SYMBOLS = ["🍒", "🍋", "7️⃣", "💎", "⭐", "🎰"];

    btn.addEventListener("click", () => {
      if (!canAfford(COST, result)) return;
      setCoins(coins - COST);
      btn.disabled = true;
      result.textContent = "";
      wheel.classList.add("spinning");

      const shuffle = setInterval(() => {
        wheel.textContent = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      }, 80);

      setTimeout(() => {
        clearInterval(shuffle);
        wheel.classList.remove("spinning");
        wheel.textContent = "🎰";
        const prize = pickWeighted(PRIZES);
        setCoins(coins + prize.win);
        result.textContent = prize.win === 0
          ? "No win this time. Try again!"
          : "You won " + prize.win + " coins! 🎉";
        btn.disabled = false;
      }, 1000);
    });
  }

  // ===== LUCKY TARGET =====
  function initTarget() {
    const startBtn = $("target-start");
    const arena = $("target-arena");
    const target = $("target-btn");
    const result = $("target-result");
    const hitsEl = $("target-hits");
    const timeEl = $("target-time");
    if (!startBtn || !arena || !target || !result || !hitsEl || !timeEl) return;

    const COST = 50, REWARD = 20, SECONDS = 15;
    let running = false, hits = 0, timeLeft = 0, clock = null, mover = null;

    function moveTarget() {
      const maxX = Math.max(0, arena.clientWidth - target.offsetWidth);
      const maxY = Math.max(0, arena.clientHeight - target.offsetHeight);
      target.style.left = Math.random() * maxX + "px";
      target.style.top = Math.random() * maxY + "px";
    }

    function startMover() {
      clearInterval(mover);
      mover = setInterval(moveTarget, 800);
    }

    function end() {
      clearInterval(clock);
      clearInterval(mover);
      running = false;
      target.hidden = true;
      startBtn.disabled = false;
      const reward = hits * REWARD;
      setCoins(coins + reward);
      result.textContent = "Time's up! " + hits + " hits = " + reward + " coins.";
    }

    startBtn.addEventListener("click", () => {
      if (running || !canAfford(COST, result)) return;
      setCoins(coins - COST);
      running = true;
      startBtn.disabled = true;
      hits = 0;
      timeLeft = SECONDS;
      hitsEl.textContent = hits;
      timeEl.textContent = timeLeft;
      result.textContent = "";
      target.hidden = false;
      moveTarget();
      startMover();
      clock = setInterval(() => {
        timeLeft--;
        timeEl.textContent = timeLeft;
        if (timeLeft <= 0) end();
      }, 1000);
    });

    target.addEventListener("click", () => {
      if (!running) return;
      hits++;
      hitsEl.textContent = hits;
      moveTarget();
      startMover();
    });
  }

  // ===== LUCKY CARDS =====
  function initCards() {
    const cards = document.querySelectorAll(".play-card");
    const result = $("cards-result");
    const again = $("cards-reset");
    if (!cards.length || !result || !again) return;

    const COST = 50;
    const PRIZES = [200, 75, 0];
    let locked = false;

    function reset() {
      locked = false;
      cards.forEach((c) => {
        c.classList.remove("revealed", "picked");
        c.textContent = "❓";
      });
      result.textContent = "Pick a card. Each round costs " + COST + " coins.";
      again.hidden = true;
    }

    cards.forEach((card, index) => {
      card.addEventListener("click", () => {
        if (locked || !canAfford(COST, result)) return;
        locked = true;
        setCoins(coins - COST);

        const prizes = [...PRIZES].sort(() => Math.random() - 0.5);
        cards.forEach((c, i) => {
          c.classList.add("revealed");
          c.textContent = prizes[i] === 0 ? "💀" : "🪙 " + prizes[i];
        });
        card.classList.add("picked");

        const won = prizes[index];
        setCoins(coins + won);
        result.textContent = won === 0
          ? "Bust! You lost the " + COST + " coin entry."
          : "You won " + won + " coins! 🎉";
        again.hidden = false;
      });
    });

    again.addEventListener("click", reset);
    reset();
  }

  initSpin();
  initTarget();
  initCards();
});