import {shuffle} from './utils.js';

function buildBoard(level, loc) {
	var cells = getInitialCells(level.mines, level.rows * level.cols - 1)
	var board = []
	for (let i = 0; i < level.rows; i++) {
    let row = []
		for (let j = 0; j < level.cols; j++) {
      if (loc.i === i && loc.j === j) row.push(getInitialCell())
			else row.push(cells.pop());
    }
    board.push(row);
  }

  addMinesAround(board);
	return board
}

function addMinesAround(board) {
  board.forEach((row, i) => {
    row.forEach((cell, j) => {
      if (!cell.isMine) cell.minesAround = getMineCount({i, j}, board);
    })
  })
}

function getMineCount(cellLoc, board) {
  let mineCount = 0;
  for (let i = cellLoc.i - 1; i <= cellLoc.i + 1; i++) {
    if (i < 0 || i >= board.length) continue;
    for (let j = cellLoc.j - 1; j <= cellLoc.j + 1; j++) {
      if (j < 0 || j >= board[i].length) continue;
      if (board[i][j].isMine) mineCount++
    }
  }
  return mineCount;
}

function getInitialCells(mineCount, cellCount) {
	var mines = Array(mineCount).fill(null).map(_ => getInitialCell(true));
  var nonMines = Array(cellCount - mineCount).fill(null)
                .map(_ => getInitialCell());
  var cells = mines.concat(nonMines);
  return shuffle(cells);
}

function getInitialCell(isMine) {
	return {
		isShown: false,
		isMarked: false,
		isMine: isMine || false,
		minesAround: 0
	}
}

export default buildBoard;
