// 隣接関係のマップ
const neighbors = {
    0: [1, 3], // 位置0は1,3と隣接
    1: [0, 2, 4], // 位置1は0,2,4と隣接
    2: [1, 5],
    3: [0, 4, 6],
    4: [1, 3, 5, 7],
    5: [2, 4, 8],
    6: [3, 7],
    7: [6, 4, 8],
    8: [5, 7]
};

const EMPTY = null;

// 現在の状態（どの位置にどのタイルがあるか）
let currentState = [1, 3, 2, 4, 7, 5, EMPTY, 8, 6];
let emptyPosition = currentState.indexOf(EMPTY);
// 初期状態を保存
let initialState = currentState.slice();


// ----------------- 描画関連 -----------------
function renderTile(pos) {
    const tiles = document.querySelectorAll('.player-tile');
    if (!tiles) {
        return;
    }
    const el = tiles[pos];
    el.innerHTML = '';
    const val = currentState[pos];
    if (val !== EMPTY) {
        const num = document.createElement('div');
        num.className = 'tile-number';
        num.textContent = String(val);
        const img = document.createElement('img');
        img.src = `./img/tile_${val}.png`;
        img.alt = `タイル${val}`;
        el.appendChild(num);
        el.appendChild(img);
    }
}

function renderAll() {
    for (let i = 0; i < 9; i++) renderTile(i);
}

// ----------------- ユーティリティ / UI -----------------
// 逆順数で解可能性を判定（3x3 の場合）
function isSolvable(state) {
    const arr = state.filter(v => v !== EMPTY);
    let inv = 0;
    for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
            if (arr[i] > arr[j]) inv++;
        }
    }
    // 偶数なら解ける
    return inv % 2 === 0;
}

function showMessage(msg) {
    const controls = document.querySelector('.controls');
    if (!controls) return;
    let el = document.getElementById('message');
    if (!el) {
        el = document.createElement('div');
        el.id = 'message';
        el.style.color = 'crimson';
        el.style.marginTop = '8px';
        controls.appendChild(el);
    }
    el.textContent = msg;
}

function clearMessage() {
    const el = document.getElementById('message');
    if (el) el.remove();
}

function updateUIState() {
    const solvable = isSolvable(currentState);
    const btnHint = document.getElementById('hint');
    if (btnHint) btnHint.disabled = !solvable;
    
    if (!solvable) {
        showMessage('この盤面は解けません（逆順数が奇数）。並べ替え直すかシャッフルしてください。');
    } else {
        clearMessage();
    }
}

// プレイヤー盤のぼかし制御
function setPlayerBlur(enable) {
    const playerBoard = document.querySelector('.board.player');
    if (!playerBoard) return;
    if (enable) {
        playerBoard.classList.add('blurred');
    } else {
        playerBoard.classList.remove('blurred');
    }
}

// ----------------- 移動関連 -----------------
function canMove(clickedPosition) {
    return neighbors[emptyPosition].includes(clickedPosition);
}

function moveTile(from, to) {
    // fromのタイルをto(空)に移し、fromを空にする）
    currentState[to] = currentState[from];
    currentState[from] = EMPTY;
    // 再描画
    renderTile(from);
    renderTile(to);
    // 空位置を更新
    emptyPosition = from;
}

function onTileClick(position) {
    if (canMove(position)) {
        moveTile(position, emptyPosition);
        clearHint();
        if (currentState.join(',') === '1,2,3,4,5,6,7,8,') {
            const elapsed = startTime ? (Date.now() - startTime) : 0;
            const timeStr = formatTime(elapsed);
            // DOM描画よりも先にアラートを表示(確実性は保障されない)
            setTimeout(() => alert(`クリア！ 経過時間: ${timeStr} ヒント使用: ${hintCount} 回`), 50);
        }
    }
}

function resetGame() {
    currentState = initialState.slice();
    emptyPosition = currentState.indexOf(EMPTY);
    renderAll();
    updateUIState();
    
    clearHint();
}

function shuffleMoves(times = 100) {
    for (let i = 0; i < times; i++) {
        const options = neighbors[emptyPosition];
        const choice = options[Math.floor(Math.random() * options.length)];
        moveTile(choice, emptyPosition);
    }
    
    // やり直し時に新しい盤面で再開できるように更新しておく
    initialState = currentState.slice();
    
    updateUIState();
    resetTimer();
    setPlayerBlur(true);
    clearHint();
    
    const btnStart = document.getElementById('start');
    if (btnStart) btnStart.disabled = false;
    const btnHint = document.getElementById('hint');
    if (btnHint) btnHint.disabled = true;
}


// ----------------- ヒント機能 -----------------
function clearHint() {
    document.querySelectorAll('.hint-arrow').forEach(e => e.remove());
}

function bfsFindFirstMove(startState, goalState, maxNodes = 100000) {
    
    const startKey = startState.join(',');
    const goalKey = goalState.join(',');
    if (startKey === goalKey) return null;

    const manhattan = (state) => {
        let h = 0;
        for (let i = 0; i < state.length; i++) {
            const v = state[i];
            if (v === EMPTY) continue;
            const goalIdx = v - 1;
            const r1 = Math.floor(i / 3), c1 = i % 3;
            const r2 = Math.floor(goalIdx / 3), c2 = goalIdx % 3;
            h += Math.abs(r1 - r2) + Math.abs(c1 - c2);
        }
        return h;
    };

    const open = [];
    const gScore = new Map();
    const parent = new Map(); 
    const startH = manhattan(startState);
    open.push({ key: startKey, state: startState.slice(), f: startH, g: 0 });
    gScore.set(startKey, 0);
    parent.set(startKey, { prevKey: null, movedFrom: null });

    const closed = new Set();
    let explored = 0;

    while (open.length && explored < maxNodes) {
        
        let bestIdx = 0;
        for (let i = 1; i < open.length; i++) if (open[i].f < open[bestIdx].f) bestIdx = i;
        const node = open.splice(bestIdx, 1)[0];
        const { key, state, g } = node;
        explored++;
        if (key === goalKey) {
            
            let curKey = key;
            let info = parent.get(curKey);
            let firstMove = info.movedFrom;
            while (parent.get(curKey) && parent.get(curKey).prevKey !== startKey) {
                curKey = parent.get(curKey).prevKey;
                info = parent.get(curKey);
                firstMove = info.movedFrom;
            }
            return firstMove;
        }

        closed.add(key);

        const emptyIdx = state.indexOf(EMPTY);
        const options = neighbors[emptyIdx] || [];
        for (const n of options) {
            const next = state.slice();
            next[emptyIdx] = next[n];
            next[n] = EMPTY;
            const k = next.join(',');
            if (closed.has(k)) continue;
            const tentativeG = g + 1;
            const prevG = gScore.get(k);
            if (prevG === undefined || tentativeG < prevG) {
                gScore.set(k, tentativeG);
                parent.set(k, { prevKey: key, movedFrom: n });
                const f = tentativeG + manhattan(next);
                open.push({ key: k, state: next, f, g: tentativeG });
            }
        }
    }

    console.warn('A* not found (explored:', explored, 'limit:', maxNodes, ')');
    return null;
}

function showHint() {
    clearHint();
    const goal = [1,2,3,4,5,6,7,8,EMPTY];
    const fromIndex = bfsFindFirstMove(currentState, goal);
    if (fromIndex === null) return;
    const tiles = document.querySelectorAll('.player-tile');
    const fromEl = tiles[fromIndex];
    const toEl = tiles[emptyPosition];
    if (!fromEl || !toEl) return;

    // 矢印文字の決定
    const delta = emptyPosition - fromIndex;
    let arrow = '→';
    if (delta === 1) arrow = '→';
    else if (delta === -1) arrow = '←';
    else if (delta === 3) arrow = '↓';
    else if (delta === -3) arrow = '↑';

    // 矢印を boards コンテナに配置して、両タイル間の境に表示する
    const container = document.querySelector('.boards') || document.body;
    const cRect = container.getBoundingClientRect();
    const r1 = fromEl.getBoundingClientRect();
    const r2 = toEl.getBoundingClientRect();
    const cx = (r1.left + r1.right + r2.left + r2.right) / 4 - cRect.left;
    const cy = (r1.top + r1.bottom + r2.top + r2.bottom) / 4 - cRect.top;

    const a = document.createElement('div');
    a.className = 'hint-arrow';
    a.textContent = arrow;
    // 絶対位置を直接指定（container を基準に）
    a.style.position = 'absolute';
    a.style.left = `${cx}px`;
    a.style.top = `${cy}px`;
    a.style.transform = 'translate(-50%,-50%)';
    container.appendChild(a);

    hintCount++;
}

// ----------------- タイマー関連 ----------------------------

let startTime = null;
let hintCount = 0;

function formatTime(ms) {
    const total = Math.max(0, Math.floor(ms));
    const minutes = Math.floor(total / 60000);
    const seconds = Math.floor((total % 60000) / 1000);
    const tenths = Math.floor((total % 1000) / 100);
    return `${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}.${tenths}`;
}

function startTimer() {
    startTime = Date.now();
}

function resetTimer() {
    startTime = null;
}


// ----------------- ボタン処理まとめ -----------------
function onStartClick() {
    setPlayerBlur(false);
    if (!startTime) startTimer();
    
    hintCount = 0;
    
    const btnStart = document.getElementById('start');
    const btnHint = document.getElementById('hint');
    if (btnStart) btnStart.disabled = true;
    if (btnHint) btnHint.disabled = false;
}

function onShuffleClick() {
    shuffleMoves(100);
}

function onResetClick() {
    resetGame();
}

function onHintClick() {
    showHint();
}

// ----------------- ページ読み込み後の初期化 -----------------
document.addEventListener('DOMContentLoaded', function() {
    // タイルクリックイベント登録
    const tiles = document.querySelectorAll('.player-tile');
    tiles.forEach((tile, index) => {
        tile.addEventListener('click', () => onTileClick(index));
    });

    // ボタンイベント登録
    const btnStart = document.getElementById('start');
    const btnShuffle = document.getElementById('shuffle');
    const btnReset = document.getElementById('reset');
    const btnHint = document.getElementById('hint');

    if (btnStart) btnStart.addEventListener('click', onStartClick);
    if (btnShuffle) btnShuffle.addEventListener('click', onShuffleClick);
    if (btnReset) btnReset.addEventListener('click', onResetClick);
    if (btnHint) {
        btnHint.disabled = true; // 初期は無効
        btnHint.addEventListener('click', onHintClick);
    }

    updateUIState();
});