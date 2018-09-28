export function shuffle(arr) {
  arr = arr.slice();
  for (let i = 0; i < arr.length; i++) {
    const randomI = getRandomInt(arr.length);
    [arr[i], arr[randomI]] = [arr[randomI], arr[i]];
  }
  return arr;
}

export function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

export function getFromStorage(key) {
  return JSON.parse(localStorage.getItem(key));
}

export function saveToStorage(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}
