// UNICORN PNGs, cupcake, diamond from pixabay
const unicorns = [
  "https://cdn.pixabay.com/photo/2017/12/29/00/37/unicorn-3045794_1280.png",
  "https://cdn.pixabay.com/photo/2017/12/29/00/38/unicorn-3045798_1280.png",
  "https://cdn.pixabay.com/photo/2017/12/29/00/37/unicorn-3045797_1280.png",
  "https://cdn.pixabay.com/photo/2017/12/29/00/37/unicorn-3045796_1280.png"
];
//const centerDiamond = "https://cdn.pixabay.com/photo/2018/01/15/07/51/diamond-3080696_1280.png";
const centerDiamond = "https://cdn-icons-png.flaticon.com/512/1946/1946436.png";

// Main setup
const colors = ["pink", "blue", "yellow", "teal"];
const homes = [
  [0, 0],        // pink (top-left)
  [0, 14],       // blue (bottom-left)
  [14, 14],      // yellow (bottom-right)
  [14, 0]        // teal (top-right)
];
// 2x2 grid home circles per color (order: pink, blue, yellow, teal)
const homeOffsets = [
  [2,2],[2,4],[4,2],[4,4],
  [2,10],[2,12],[4,10],[4,12],
  [10,10],[10,12],[12,10],[12,12],
  [10,2],[10,4],[12,2],[12,4]
];

// Board "stretches" toward the center for each color, classic Ludo home lanes
function pathHomeClass(x, y) {
  if      ((x>=1 && x<=5)&&y==6)  return "path-pink";
  else if ((y>=1 && y<=5)&&x==8)  return "path-teal";
  else if ((x>=9 && x<=13)&&y==8) return "path-yellow";
  else if ((y>=9 && y<=13)&&x==6) return "path-blue";
  return "";
}
// Safe and cupcake cell positions
const starCoords = [
  [1,6],[6,1],[8,1],[13,6],[13,8],[8,13],[6,13],[1,8]
];
const cupcakeCoords = [
  [3,6],[6,3],[8,3],[11,8],[8,11],[3,8],[11,6],[6,11]
];

// --------- GAME LOGIC MODEL --------- //
const boardEl = document.getElementById('ludo-board');
const rollBtn = document.getElementById('rollBtn');
const diceResultEl = document.getElementById('diceResult');
const turnDisplay = document.getElementById('turnDisplay');
const infoBox = document.getElementById('info');
const SIZE = 15;

const playerDefs = [
  {
    name: 'Pink',   color: 'pink',   home: [2,2],  unicorn: unicorns[0], 
    yard: [[2,2],[4,2],[2,4],[4,4]], 
    path: [[1,6],[2,6],[3,6],[4,6],[5,6],
           [6,5],[6,4],[6,3],[6,2],[6,1],
           [7,1],[8,1],[8,2],[8,3],[8,4],[8,5],
           [9,6],[10,6],[11,6],[12,6],[13,6],
           [13,7],[13,8],[12,8],[11,8],[10,8],[9,8],
           [8,9],[8,10],[8,11],[8,12],[8,13],[7,13],
           [6,13],[6,12],[6,11],[6,10],[6,9], // home stretch
           [6,8],[6,7],[6,6]] // ends in center
  },
  {
    name: 'Blue',   color: 'blue',   home: [2,10], unicorn: unicorns[1],
    yard: [[2,10],[2,12],[4,10],[4,12]],
    path: [[6,13],[6,12],[6,11],[6,10],[6,9],
           [5,8],[4,8],[3,8],[2,8],[1,8],
           [1,7],[1,6],[2,6],[3,6],[4,6],[5,6],
           [6,5],[6,4],[6,3],[6,2],[6,1],
           [7,1],[8,1],[8,2],[8,3],[8,4],[8,5],
           [9,6],[10,6],[11,6],[12,6],[13,6],[13,7],
           [13,8],[12,8],[11,8],[10,8],[9,8], // home stretch
           [8,8],[7,8],[6,8]] // to center
  },
  {
    name: 'Yellow', color: 'yellow', home: [10,10], unicorn: unicorns[2],
    yard: [[10,10],[10,12],[12,10],[12,12]],
    path: [[13,8],[12,8],[11,8],[10,8],[9,8],
           [8,9],[8,10],[8,11],[8,12],[8,13],
           [7,13],[6,13],[6,12],[6,11],[6,10],[6,9],
           [5,8],[4,8],[3,8],[2,8],[1,8],
           [1,7],[1,6],[2,6],[3,6],[4,6],[5,6],
           [6,5],[6,4],[6,3],[6,2],[6,1],[7,1],
           [8,1],[8,2],[8,3],[8,4],[8,5], // home stretch
           [8,6],[8,7],[8,8]]
  },
  {
    name: 'Teal',   color: 'teal',   home: [10,2], unicorn: unicorns[3],
    yard: [[10,2],[10,4],[12,2],[12,4]],
    path: [[8,1],[8,2],[8,3],[8,4],[8,5],
           [9,6],[10,6],[11,6],[12,6],[13,6],
           [13,7],[13,8],[12,8],[11,8],[10,8],[9,8],
           [8,9],[8,10],[8,11],[8,12],[8,13],
           [7,13],[6,13],[6,12],[6,11],[6,10],[6,9],
           [5,8],[4,8],[3,8],[2,8],[1,8],[1,7],
           [1,6],[2,6],[3,6],[4,6],[5,6], // home stretch
           [8,6],[8,7],[8,8]]
  }
];
// Each player tokens: 4 (all at yard to start), pos: -1 = yard, then 0+ is step in path
let players, current, dice, mode, wins;

function resetGame() {
  // Define player tokens, all at -1 (yard); not finished
  players = playerDefs.map(def => ({
    ...def,
    tokens:[{pos:-1},{pos:-1},{pos:-1},{pos:-1}],
    finished: 0
  }));
  current = 0; dice = null; mode = false; wins = 0;
  drawBoard(); present();
}
function canTokenMove(p, tok, dice) {
  if(tok.pos === -1) return (dice === 6); // only enter on 6
  // Can't move past final
  if(tok.pos+dice >= p.path.length) return false;
  // additional logic for blockades, captures etc can be added here
  return true;
}
function anyMovable(player, dice) {
  return player.tokens.some(tok=>canTokenMove(player, tok, dice));
}
function drawBoard() {
  boardEl.innerHTML = '';
  for(let y=0; y<SIZE; y++) for(let x=0; x<SIZE; x++){
    const cell = document.createElement('div'); cell.className = 'cell';
    // Corners
    if(x<6&&y<6)        cell.classList.add('corner','pink');
    else if(x<6&&y>8)   cell.classList.add('corner','blue');
    else if(x>8&&y>8)   cell.classList.add('corner','yellow');
    else if(x>8&&y<6)   cell.classList.add('corner','teal');
    // Unicorn images in each home base (centered on [1,1], etc)
    homes.forEach((b,i)=>{ if(x===b[0]+1&&y===b[1]+1){ cell.classList.add('unicorn'); let img=document.createElement("img"); img.src=unicorns[i]; img.className="unicorn-img"; cell.appendChild(img);}});
    // Home circles
    homeOffsets.forEach((o, idx)=>{
      let col=colors[Math.floor(idx/4)];
      if(x===o[0]&&y===o[1]){ let hc=document.createElement("div"); hc.className = "home-circle "+col; cell.appendChild(hc);}
    });
    // Cross home paths
    let path = pathHomeClass(x,y); if(path) cell.classList.add(path);
    // Safe/cupcake spots
    if(starCoords.some(([cx,cy])=>x===cx&&y===cy))        cell.classList.add("safe-spot");
    if(cupcakeCoords.some(([cx,cy])=>x===cx&&y===cy))     cell.classList.add("safe-cupcake");
    // Center home diamond
    if(x===7&&y===7){ cell.classList.add("central-goal"); let img=document.createElement("img"); img.src=centerDiamond; cell.appendChild(img);}
    boardEl.appendChild(cell);
  }
  drawTokens();
}
function drawTokens() {
  // Remove all tokens
  document.querySelectorAll('.token').forEach(t=>t.remove());
  // For each player, each token
  players.forEach((player,pi)=>{
    player.tokens.forEach((tok,ti)=>{
      let xy; let onYard = (tok.pos === -1);
      if(onYard){ xy = player.yard[ti]; }
      else if(tok.pos >= 0 && tok.pos < player.path.length){
        xy = player.path[tok.pos];
      } else return;
      if(!xy) return;
      let idx = xy[1]*SIZE + xy[0];
      let div = document.createElement('div');
      div.className = `token ${player.color}` + (pi===current && dice !== null && canTokenMove(player,tok,dice) ? " selected": "");
      div.innerHTML = pi==0?"🌸":pi==1?"💙":pi==2?"💛":"🦄";
      if(pi===current && dice!==null && canTokenMove(player,tok,dice) && mode){
        div.onclick = ()=>moveToken(pi, ti);
        div.title = "Click to move";
      }
      boardEl.children[idx].appendChild(div);
    });
  });
}
function present() {
  rollBtn.disabled = !!dice || mode;
  diceResultEl.textContent = dice||"-";
  turnDisplay.textContent = `${players[current].name}'s turn`;
}
function showInfo(msg) { infoBox.textContent = msg; }

rollBtn.onclick = function(){
  if(mode || dice) return;
  dice = Math.floor(Math.random()*6)+1;
  diceResultEl.textContent = dice;
  let player = players[current];
  if(!anyMovable(player, dice)){
    showInfo(`${player.name} rolled a ${dice}—no move, skipping!`);
    setTimeout(()=>{
      nextPlayer();
    },1300);
    return;
  }
  showInfo(`${player.name} rolled a ${dice}. Select a token to move!`);
  mode = true;
  drawBoard(); present();
};
// On click token
function moveToken(pi, ti){
  let player = players[pi];
  let tok = player.tokens[ti];
  // Move from yard to starting path
  if(tok.pos === -1 && dice===6) tok.pos = 0;
  else tok.pos += dice;
  // If at final home, "score": send to yard and increment finished
  if(tok.pos===player.path.length-1){ player.finished += 1; tok.pos=-9; showInfo(`${player.name} scored a token!`);}
  // Reset
  dice=null;mode=false;
  drawBoard();present();
  // If they rolled 6, go again
  if(dice===6 && player.tokens.filter(t=>t.pos>-2&&t.pos<player.path.length-1).length) {
    showInfo(`${player.name} scored 6—roll again!`);
    setTimeout(()=>{present();},800);
    return;
  }
  setTimeout(nextPlayer,600);
}
function nextPlayer(){
  dice=null; mode=false;
  current = (current+1)%players.length;
  present(); drawBoard();
  showInfo(`It's now ${players[current].name}'s turn!`);
}
resetGame();
