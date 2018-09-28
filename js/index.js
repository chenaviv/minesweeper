import buildBoard from './buildBoard.js';
import { getFromStorage, saveToStorage } from './utils.js';

var state;
var timerInterval;
const LEVELS = {
  custom: { rows: 5, cols: 5, mines: 5 },
	easy: { rows: 9, cols: 9, mines: 10 },
	medium: { rows: 16, cols: 16, mines: 40 },
	hard: { rows: 16, cols: 30, mines: 99 }
}
const MINE = '💣';
const FLAG = '🚩';
const SMILEY = {
  inPlay: '🙂',
  lose: '🤕',
  win: '😎',
  click: '😮',
}
const BEST_TIMES = getFromStorage('best-times') || { easy: null, medium: null, hard: null };

window.addEventListener('load', init);

function init() {
  const elBtns = document.querySelectorAll('.game-btns button');
  for (let elBtn of elBtns) {
    let level = elBtn.dataset.level;
    elBtn.addEventListener('click', level !== 'custom' ?
      () => restartGame(level) :
      () => toggleModal())
  }
  setCustomizeModal();
  renderBestTimes();
  const elSmiley = document.querySelector('.game-smiley');
  elSmiley.addEventListener('click', () => restartGame());
  restartGame('easy');
  document.body.classList.remove('pre-load');
}

function restartGame(levelKey) {
  clearInterval(timerInterval);
  state = getInitialState(levelKey);
  resetElStatus(state.level.mines)
  renderGame(state.level);
}

function getInitialState(levelKey) {
  return {
		isGameOn: true,
		secsPassed: 0,
    shownCount: 0,
    markedCount: 0,
    board: null,
    levelKey: levelKey || state.levelKey,
    level: levelKey ? LEVELS[levelKey] : state.level,
  }
}

function setCustomizeModal() {
  const elCustomize = document.querySelector('.customize-level');
  const elForm = elCustomize.querySelector('form');
  elCustomize.querySelector('.close').addEventListener('click', toggleModal);
  elForm.addEventListener('submit', (ev) => {
    ev.preventDefault();
    setCustomLevel(elForm.elements);
    restartGame('custom');
    toggleModal()
  })
}

function setCustomLevel(elInputs) {
  const level = LEVELS.custom;
  level.rows = +elInputs.rows.value;
  level.cols = +elInputs.cols.value;
  const SIZE = level.rows * level.cols;
  level.mines = +elInputs.mines.value ||
    Math.round(SIZE * 0.15);
  if (level.mines >= SIZE) level.mines = Math.floor(SIZE * 0.9);
}

function resetElStatus(mineCount) {
  const elStatus = document.querySelector('.game-status');
  const elCounter = elStatus.querySelector('.mine-counter');
  const elTimer = elStatus.querySelector('.game-timer');
  const elSmiley = elStatus.querySelector('.game-smiley');
  elCounter.innerText = getDigits(mineCount);
  elTimer.innerText = '000';
  elSmiley.innerText = SMILEY.inPlay;
}

function renderBestTimes() {
  const elSocreboard = document.querySelector('.scoreboard');
  let levelKeys = Object.keys(BEST_TIMES);
  levelKeys.forEach(key => {
    if (BEST_TIMES[key]) {
      let elBestTime = elSocreboard.querySelector(`.${key}`);
      elBestTime.querySelector('.player').innerText = BEST_TIMES[key].player;
      elBestTime.querySelector('.time').innerText = BEST_TIMES[key].time;
      elBestTime.hidden = false;
      elSocreboard.hidden = false;
    }
  })
}

function toggleModal() {
  const elModal = document.querySelector('.modal');
  if (elModal.hidden) {
    elModal.hidden = false;
    setTimeout(() => {
      elModal.querySelector('form input:first-of-type').focus();
      elModal.classList.add('shown');
    }, 10);
  } else {
    elModal.classList.remove('shown');
    setTimeout(() => elModal.hidden = true, 400);
  }
}

function renderGame(level) {
  const elBoard = document.querySelector('.game-board');
  elBoard.parentElement.classList[level.cols > 16 ? 'add' : 'remove']('sm-cells');
  elBoard.innerHTML = '';
  for (let i = 0; i < level.rows; i++) {
    var elRow = elBoard.insertRow();
    for (let j = 0; j < level.cols; j++) {
      let classes = ['cell', `cell-${i}-${j}`];
      let elCell = elRow.insertCell();
      elCell.classList.add(...classes);
      elCell.addEventListener('click', () => cellClicked(elCell, i, j));
      elCell.addEventListener('contextmenu', (ev) => {
        cellMarked(elCell, i, j)
        ev.preventDefault();
      });
    }
  }
}

function cellClicked(elCell, i, j) {
  if (!state.isGameOn) return;
  if (!state.board) handleFirstClick({i, j});
  const cell = state.board[i][j];
  if (cell.isShown || cell.isMarked) return;
  cell.isShown = true;
  state.shownCount++;
  revealElCell(elCell, cell);
  if (cell.isMine) {
    elCell.classList.add('boom');
    handleGameOver();
    return;
  }
  if (checkWin()) handleGameOver(true);
  if (!cell.minesAround) expandShown({i, j})
  // elCell.addEventListener('dblclick', () => {
  elCell.onclick = () => {
    if (!state.isGameOn) return;
    if (markedEqaulMinesAround({i, j})) expandShown({i, j})
  };
}

function cellMarked(elCell, i, j, forceMark) {
  if (!state.isGameOn) return;
  if (!state.board) handleFirstClick({i, j});
  const cell = state.board[i][j];
  if (cell.isShown) return;
  cell.isMarked = forceMark || !cell.isMarked;
  elCell.classList[cell.isMarked ? 'add' : 'remove']('marked');
  elCell.innerText = cell.isMarked ? FLAG : '';
  state.markedCount += cell.isMarked ? 1 : -1;
  updateCounter();
}

function revealElCell(elCell, cell) {
  let innerText = cell.isMine ? MINE : cell.minesAround || '';
  const classes = ['revealed', `count-${cell.minesAround}`];
  if (cell.isMine) classes.push('mine');
  elCell.classList.add(...classes);
  elCell.innerText = innerText;
}

function expandShown(loc) {
  for (let i = loc.i - 1; i <= loc.i + 1; i++) {
    if (i < 0 || i >= state.board.length) continue;
    for (let j = loc.j - 1; j <= loc.j + 1; j++) {
      if (j < 0 || j >= state.board[i].length) continue;
      if (i === loc.i && j === loc.j) continue;
      const elCell = document.querySelector(getCellSelector(i, j));
      cellClicked(elCell, i, j)
    }
  }
}

function markedEqaulMinesAround(loc) {
  const cell = state.board[loc.i][loc.j];
  let markedCount = 0;
  for (let i = loc.i - 1; i <= loc.i + 1; i++) {
    if (i < 0 || i >= state.board.length) continue;
    for (let j = loc.j - 1; j <= loc.j + 1; j++) {
      if (j < 0 || j >= state.board[i].length) continue;
      if (i === loc.i && j === loc.j) continue;
      if (state.board[i][j].isMarked) markedCount++
    }
  }
  return markedCount === cell.minesAround;
}

function checkWin() {
  const size = state.level.rows * state.level.cols;
  return state.shownCount + state.level.mines === size;
}

function handleGameOver(isWon) {
  clearInterval(timerInterval);
  const elSmiley = document.querySelector('.game-smiley');
  elSmiley.innerText = isWon ? SMILEY.win : SMILEY.lose;
  for (let i = 0; i < state.board.length; i++) {
    for (let j = 0; j < state.board[i].length; j++) {
      const cell = state.board[i][j];
      if (!cell.isMine) continue;
      const elMine = document.querySelector(getCellSelector(i, j));
      isWon ? cellMarked(elMine, i, j, true) : revealElCell(elMine, cell);
    }
  }
  state.isGameOn = false;
  if (isWon) {
    state.markedCount = state.level.mines;
    updateCounter();
    if (checkBestTime()) handleBestTime();
  }
}

function checkBestTime() {
  return state.levelKey in BEST_TIMES 
    && (!BEST_TIMES[state.levelKey] || state.secsPassed < BEST_TIMES[state.levelKey].time);
}

function handleBestTime() {
  BEST_TIMES[state.levelKey] = {
    time: state.secsPassed,
    player: prompt('Great job! You\'ve set a record!\nWhat\'s your name?') || 'annonymous'
  }
  saveToStorage('best-times', BEST_TIMES);
  renderBestTimes();
}

function handleFirstClick(loc) {
  state.board = buildBoard(state.level, loc);
  const elTimer = document.querySelector('.game-timer');
  timerInterval = setInterval(function() {
    setTimer(elTimer);
  }, 1000)
}

function setTimer(elTimer) {
  state.secsPassed++;
  elTimer.innerText = getDigits(state.secsPassed);
}

function updateCounter() {
  const elCounter = document.querySelector('.mine-counter');
  elCounter.innerText = getDigits(state.level.mines - state.markedCount);
}

function getCellSelector(i, j) {
  return `.cell-${i}-${j}`;
}

function getDigits(num) {
  let digits = num < 0 
    ? num < -9 ? `-${-num}` : `-0${-num}`
    : num < 10 ? `00${num}` 
    : num < 100 ? `0${num}` : `${num}`;
  return digits;
}
