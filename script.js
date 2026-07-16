const boardSize=8;
let board=[];
let currentPlayer="黒";
let humanColor="黒";
let savedBoard=null;
let savedPlayer=null;
let isGameOver=false;
let endgameMode=false;
let loseMode=false;
let cpuLevel="";
let secretUnlocked=false;
let typedKeys="";
let moveCount=0;
let secretUsed=false;
let dotTimer=null;
let gameMode="single";
let roomCode="";
let isHost=false;
let leavingSelf=false;
const bgm=new Audio("sounds/BGM.wav");
const seGameStart=new Audio("sounds/gameStart.wav");
const sePlaceStone=new Audio("sounds/placeStone.wav");
const sePass=new Audio("sounds/pass.wav");

bgm.loop=true;
bgm.volume=0.9;

function initBoard(){
    for(let row=0;row<boardSize;row++){
     board[row]=[];
        for(let col=0;col<boardSize;col++){
         board[row][col]="空";
        }
    }
    board[3][3]="白";
    board[3][4]="黒";
    board[4][3]="黒";
    board[4][4]="白";
    currentPlayer="黒";
    moveCount=0;
}

const directions=[
    [-1,-1],[-1,0],[-1,1],
    [0,-1],[0,1],
    [1,-1],[1,0],[1,1]
];

const cellValues=[
    [ 120, -20,  20,   5,   5,  20, -20, 120],
    [ -20, -40,  -5,  -5,  -5,  -5, -40, -20],
    [  20,  -5,  15,   3,   3,  15,  -5,  20],
    [   5,  -5,   3,   3,   3,   3,  -5,   5],
    [   5,  -5,   3,   3,   3,   3,  -5,   5],
    [  20,  -5,  15,   3,   3,  15,  -5,  20],
    [ -20, -40,  -5,  -5,  -5,  -5, -40, -20],
    [ 120, -20,  20,   5,   5,  20, -20, 120]
];

function canFlipDirection(row,col,myColor,dr,dc){
    const enemyColor=myColor==="黒"?"白":"黒";
    let r=row+dr;
    let c=col+dc;
    if(r<0||r>=boardSize||c<0||c>=boardSize||board[r][c]!==enemyColor){
        return false;
    }
    while(r>=0&&r<boardSize&&c>=0&&c<boardSize&&board[r][c]===enemyColor){
        r=r+dr;
        c=c+dc;
    }
    if(r>=0&&r<boardSize&&c>=0&&c<boardSize&&board[r][c]===myColor){
        return true;
    }
    return false;
}

function canPlace(row,col,myColor){
    if(board[row][col]!=="空"){
        return false;
    }
    for(let i=0;i<directions.length;i++){
        const dr=directions[i][0];
        const dc=directions[i][1];
        if(canFlipDirection(row,col,myColor,dr,dc)){
            return true;
        }
    }
    return false;
}

function flipDirection(row,col,myColor,dr,dc){
    const enemyColor=myColor==="黒"?"白":"黒";
    if(!canFlipDirection(row,col,myColor,dr,dc)){
        return;
    }
    let r=row+dr;
    let c=col+dc;
    while(board[r][c]===enemyColor){
        board[r][c]=myColor;
        r=r+dr;
        c=c+dc;
    }
}

function placeStone(row,col,myColor){
    board[row][col]=myColor;
    for(let i=0;i<directions.length;i++){
        const dr=directions[i][0];
        const dc=directions[i][1];
        flipDirection(row,col,myColor,dr,dc);
    }
}

function countStones(color){
    let count=0;
    for(let row=0;row<boardSize;row++){
        for(let col=0;col<boardSize;col++){
            if(board[row][col]===color){
                count=count+1;
            }
        }
    }
    return count;
}

function updateInfo(){
    const blackCount=countStones("黒");
    const whiteCount=countStones("白");
    let turnText;
    const opponentLabel=gameMode==="multi"?"あいて":"わたし";
    if(currentPlayer===humanColor){
        turnText="あなたの番です";
    }else{
        turnText=opponentLabel+"の番です";
    }
    const humanCount=humanColor==="黒"?blackCount:whiteCount;
    const cpuCount=humanColor==="黒"?whiteCount:blackCount;
    const humanClass=humanColor==="黒"?"label-black":"label-white";
    const cpuClass=humanColor==="黒"?"label-white":"label-black";
    const infoElement=document.getElementById("info");
    infoElement.innerHTML=turnText+"<br><span class='"+humanClass+"'>あなた</span>："+humanCount+"個 <span class='"+cpuClass+"'>"+opponentLabel+"</span>："+cpuCount+"個";
}

function hasValidMove(color){
    for(let row=0;row<boardSize;row++){
        for(let col=0;col<boardSize;col++){
            if(canPlace(row,col,color)){
                return true;
            }
        }
    }
    return false;
}

function judgeWinner(){
    const blackCount=countStones("黒");
    const whiteCount=countStones("白");
    const humanCount=humanColor==="黒"?blackCount:whiteCount;
    const cpuCount=humanColor==="黒"?whiteCount:blackCount;
    const scoreText="<br>あなた"+humanCount+"個 vs わたし"+cpuCount+"個";
    if(blackCount===whiteCount){
        return "ひきわけです"+scoreText;
    }
    const winnerColor=blackCount>whiteCount?"黒":"白";
    if(winnerColor===humanColor){
        return "あなたの勝ちです"+scoreText;
    }else{
        return "わたしの勝ちです"+scoreText;
    }
}

function showPopup(message){
    isGameOver=false;
    const popupOkButton=document.getElementById("popup-ok");
    popupOkButton.textContent="OK";    
    const popup=document.getElementById("popup");
    const popupMessage=document.getElementById("popup-message");
    popupMessage.innerHTML=message;
    popup.className="";
}

function showResultPopup(message){
    showPopup(message);
    isGameOver=true;
    const popupOkButton=document.getElementById("popup-ok");
    popupOkButton.textContent="もどる"
}

function hidePopup(){
    const popup=document.getElementById("popup");
    popup.className="hidden";
    if(isGameOver){
        const popupOkButton=document.getElementById("popup-ok");
        popupOkButton.textContent="OK";
        resetGame();
    }
}

function startGame(chosenColor){
    humanColor=chosenColor;
    initBoard();
    const startScreen=document.getElementById("start-screen");
    startScreen.className="hidden";
    playSound(seGameStart);
    if(cpuLevel!=="しってるよ"){
        bgm.play();
    }
    drawBoard();
    if(currentPlayer!==humanColor){
        setTimeout(cpuMove,450);
    }
}

function getValidMoves(color){
    const moves=[];
    for(let row=0;row<boardSize;row++){
        for(let col=0;col<boardSize;col++){
            if(canPlace(row,col,color)){
                moves.push([row,col]);
            }
        }
    }
    return moves;
}

function cpuMove(){
    showThinking();
    setTimeout(function(){
        const move=cpuChooseMove(currentPlayer);
        hideThinking();
        if(move===null){
        return;
        }
        const row=move[0];
        const col=move[1];
        placeStone(row,col,currentPlayer);
        playSound(sePlaceStone);
        afterMove();
    },50);
}

function afterMove(){
    moveCount=moveCount+1;
    currentPlayer=currentPlayer==="黒"?"白":"黒";
    if(!hasValidMove(currentPlayer)){
        const otherPlayer=currentPlayer==="黒"?"白":"黒";
        if(hasValidMove(otherPlayer)){
            const passLabel=currentPlayer===humanColor?"あなた":"わたし";
            playSound(sePass);
            showPopup(passLabel+"は置けないからパスだよ")
            currentPlayer=otherPlayer;
        }else{
            drawBoard();
            showResultPopup(judgeWinner());
            if(gameMode==="multi"){
                pushToFirebase();
            }
            return;
        }
    }
    drawBoard();
    if(gameMode==="multi"){
        pushToFirebase();
        return;
    }
    if(currentPlayer!==humanColor){
        setTimeout(cpuMove,500);
    }
}

function resetGame(){
    if(gameMode==="multi"){
        leavingSelf=true;
        fbRemove(fbRef(fbDb,"rooms/"+roomCode));
        leaveRoom();
        return;
    }
    cpuLevel="";
    initBoard();
    savedBoard=null;
    savedPlayer=null;
    bgm.pause();
    bgm.currentTime=0;
    drawBoard();
    showLevelScreen();
}

function showConfirm(){
    const confirmBox=document.getElementById("confirm");
    const msg=confirmBox.querySelector(".popup-body p");
    if(gameMode==="multi"){
        msg.textContent="へやからでますか？";
    }else{
        msg.textContent="リセットしますか？";
    }
    confirmBox.className="";
}

function hideConfirm(){
    const confirmBox=document.getElementById("confirm");
    confirmBox.className="hidden";
}

function copyBoard(source){
    const newBoard=[];
    for(let row=0;row<boardSize;row++){
        newBoard[row]=[];
        for(let col=0;col<boardSize;col++){
            newBoard[row][col]=source[row][col];
        }
    }
    return newBoard;
}

function saveState(){
    savedBoard=copyBoard(board);
    savedPlayer=currentPlayer;
}

function undoMove(){
    if(gameMode==="multi"){
        showPopup("ふたりのときは戻せないよ");
        return;
    }
    if(savedBoard===null){
        showPopup("戻せません");
        return;
    }
    board=copyBoard(savedBoard);
    currentPlayer=savedPlayer;
    savedBoard=null;
    savedPlayer=null;
    drawBoard();
}

function closePopupOnly(){
    const popup=document.getElementById("popup");
    popup.className="hidden";
    isGameOver=false;
    const popupOkButton=document.getElementById("popup-ok");
    popupOkButton.textContent="OK";
}

function countFlips(row,col,myColor){
    const enemyColor=myColor==="黒"?"白":"黒";
    let total=0;
    for(let i=0;i<directions.length;i++){
        const dr=directions[i][0];
        const dc=directions[i][1];
        if(!canFlipDirection(row,col,myColor,dr,dc)){
            continue;
        }
        let r=row+dr;
        let c=col+dc;
        while(board[r][c]===enemyColor){
            total=total+1;
            r=r+dr;
            c=c+dc;
        }
    }
    return total;
}

function playSound(sound){
    sound.currentTime=0;
    sound.play();
}

function cpuChooseMove(color){
    if(cpuLevel==="しってるよ"){
        return chooseMoveMinimax(color,false);
    }
    if(cpuLevel==="勝つよ"){
        return chooseMoveMinimax(color,false);
    }
    if(cpuLevel==="負けてあげるよ"){
        return chooseMoveMinimax(color,true);
    }
    if(cpuLevel==="むずかしい"){
        return chooseMovePositional(color);
    }
    if(cpuLevel==="ふつう"){
        return chooseMoveGreedy(color);
    }
    return chooseMoveRandom(color);
}

function chooseMoveRandom(color){
    const moves=getValidMoves(color);
    if(moves.length===0){
        return null;
    }
    const index=Math.floor(Math.random()*moves.length);
    return moves[index];
}

function chooseMoveGreedy(color){
    const moves=getValidMoves(color);
    if(moves.length===0){
        return null;
    }
    let bestMove=moves[0];
    let bestCount=-1;
    for(let i=0;i<moves.length;i++){
        const row=moves[i][0];
        const col=moves[i][1];
        const count=countFlips(row,col,color);
        if(count>bestCount){
            bestCount=count;
            bestMove=moves[i];
        }
    }
    return bestMove;
}

function chooseMovePositional(color){
    const moves=getValidMoves(color);
    if(moves.length===0){
        return null;
    }
    let bestMove=moves[0];
    let bestValue=-999;
    for(let i=0;i<moves.length;i++){
        const row=moves[i][0];
        const col=moves[i][1];
        const value=cellValues[row][col];
        if(value>bestValue){
            bestValue=value;
            bestMove=moves[i];
        }
    }
    return bestMove;
}

function chooseMoveMinimax(color,lose){
    loseMode=lose;
    const moves=sortMoves(getValidMoves(color));
    if(moves.length===0){
        loseMode=false;
        return null;
    }
    const empty=countEmptyOn(board);
    let searchDepth=4;
    if(empty>50){
        searchDepth=2;
    }else if(empty>40){
        searchDepth=3;
    }else if(cpuLevel==="しってるよ"||cpuLevel==="負けてあげるよ"){
        searchDepth=6;
    }
    if(empty<=10){
        endgameMode=true;
        searchDepth=empty;
    }else{
        endgameMode=false;
    }
    let bestMove=moves[0];
    let bestValue=-99999;
    const enemyColor=color==="黒"?"白":"黒";
    for(let i=0;i<moves.length;i++){
        const next=copyBoard(board);
        placeStoneOn(next,moves[i][0],moves[i][1],color);
        const value=minimax(next,enemyColor,searchDepth,false,color,-99999,99999);
        if(value>bestValue){
            bestValue=value;
            bestMove=moves[i];
        }
    }
    endgameMode=false;
    loseMode=false;
    return bestMove;
}

function canFlipDirectionOn(b,row,col,myColor,dr,dc){
    const enemyColor=myColor==="黒"?"白":"黒";
    let r=row+dr;
    let c=col+dc;
    if(r<0||r>=boardSize||c<0||c>=boardSize||b[r][c]!==enemyColor){
        return false;
    }
    while(r>=0&&r<boardSize&&c>=0&&c<boardSize&&b[r][c]===enemyColor){
        r=r+dr;
        c=c+dc;
    }
    if(r>=0&&r<boardSize&&c>=0&&c<boardSize&&b[r][c]===myColor){
        return true;
    }
    return false;
}

function canPlaceOn(b,row,col,myColor){
    if(b[row][col]!=="空"){
        return false;
    }
    for(let i=0;i<directions.length;i++){
        const dr=directions[i][0];
        const dc=directions[i][1];
        if(canFlipDirectionOn(b,row,col,myColor,directions[i][0],directions[i][1])){
            return true;
        }
    }
    return false;
}

function getValidMovesOn(b,color){
    const moves=[];
    for(let row=0;row<boardSize;row++){
        for(let col=0;col<boardSize;col++){
            if(canPlaceOn(b,row,col,color)){
                moves.push([row,col]);
            }
        }
    }
    return moves;
}

function placeStoneOn(b,row,col,myColor){
    const enemyColor=myColor==="黒"?"白":"黒";
    b[row][col]=myColor;
    for(let i=0;i<directions.length;i++){
        const dr=directions[i][0];
        const dc=directions[i][1];
        if(!canFlipDirectionOn(b,row,col,myColor,dr,dc)){
            continue;
        }
        let r=row+dr;
        let c=col+dc;
        while(b[r][c]===enemyColor){
            b[r][c]=myColor;
            r=r+dr;
            c=c+dc;
        }
    }
}

function evaluateBoard(b,color){
    if(endgameMode){
        const s=evaluateStones(b,color)*100;
        return loseMode?-s:s;
    }
    const enemyColor=color==="黒"?"白":"黒";
    let score=0;
    for(let row=0;row<boardSize;row++){
        for(let col=0;col<boardSize;col++){
            if(b[row][col]===color){
            score=score+cellValues[row][col];
            }else if(b[row][col]===enemyColor){
            score=score-cellValues[row][col];
            }
        }
    }
    const myMoves=getValidMovesOn(b,color).length;
    const enemyMoves=getValidMovesOn(b,enemyColor).length;
    score=score+(myMoves-enemyMoves)*8;
    return loseMode?-score:score;
}

function minimax(b,color,depth,isMyTurn,rootColor,alpha,beta){
    if(depth===0){
        return evaluateBoard(b,rootColor);
    }
    const moves=sortMoves(getValidMovesOn(b,color));
    const enemyColor=color==="黒"?"白":"黒";
    if(moves.length===0){
        if(getValidMovesOn(b,enemyColor).length===0){
            return evaluateBoard(b,rootColor);
        }
        return minimax(b,enemyColor,depth-1,!isMyTurn,rootColor,alpha,beta);
    }
    let best=isMyTurn?-99999:99999;
    for(let i=0;i<moves.length;i++){
        const next=copyBoard(b);
        placeStoneOn(next,moves[i][0],moves[i][1],color);
        const value=minimax(next,enemyColor,depth-1,!isMyTurn,rootColor,alpha,beta);
        if(isMyTurn){
            if(value>best){
                best=value;
            }
            if(best>alpha){
                alpha=best;
            }
        }else{
            if(value<best){
                best=value;
            }
            if(best<beta){
                beta=best;
            }
        }
        if(beta<=alpha){
            break;
        }
    }
    return best;
}

function sortMoves(moves){
    moves.sort(function(a,b){
        return cellValues[b[0]][b[1]]-cellValues[a[0]][a[1]];
    })
    return moves;
}

function countEmptyOn(b){
    let count=0;
    for(let row=0;row<boardSize;row++){
        for(let col=0;col<boardSize;col++){
            if(b[row][col]==="空"){
                count=count+1;
            }
        }
    }
    return count;
}

function evaluateStones(b,color){
    const enemyColor=color==="黒"?"白":"黒";
    let mine=0;
    let theirs=0;
    for(let row=0;row<boardSize;row++){
        for(let col=0;col<boardSize;col++){
            if(b[row][col]===color){
                mine=mine+1;
            }else if(b[row][col]===enemyColor){
                theirs=theirs+1;
            }
        }
    }
    return mine-theirs;
}

function unlockSecret(){
    if(gameMode==="multi"){
        return;
    }
    if(secretUsed){
        return;
    }
    const levelScreen=document.getElementById("level-screen");
    const startScreen=document.getElementById("start-screen");
    const inGame=levelScreen.className==="hidden"&&startScreen.className==="hidden";
    if(inGame){
        cpuLevel="しってるよ";
        secretUsed=true;
        bgm.pause();
        bgm.currentTime=0;
        removeSecretButton();
        drawBoard();
        return;
    }
    if(secretUnlocked){
        return;
    }
    secretUnlocked=true;
    const btn=document.createElement("button");
    btn.id="level-secret";
    btn.className="pair-button";
    btn.textContent="しってるよ";
    btn.addEventListener("click",function(){
        cpuLevel="しってるよ";
        secretUsed=true;
        removeSecretButton();
        showColorScreen();
    });
    const levelBody=document.querySelector("#level-screen .popup-body");
    levelBody.appendChild(btn);
}

function removeSecretButton(){
    const btn=document.getElementById("level-secret");
    if(btn!==null){
        btn.remove();
    }
}

function updateDarkness(){
    const veil=document.getElementById("dark-veil");
    if(cpuLevel!=="しってるよ"){
        veil.style.opacity=0;
        return;
    }
    const ratio=Math.min(moveCount/60,1);
    veil.style.opacity=ratio;
}

function showThinking(){
    const el=document.getElementById("thinking");
    el.className="";
    let count=0;
    dotTimer=setInterval(function(){
        count=(count+1)%4;
        document.getElementById("dots").textContent=".".repeat(count);
    },300);
}

function hideThinking(){
    const el=document.getElementById("thinking");
    el.className="hidden";
    if(dotTimer!==null){
        clearInterval(dotTimer);
        dotTimer=null;
    }
}

function showLevelScreen(){
    document.getElementById("mode-screen").className="hidden";
    document.getElementById("level-screen").className="";
    document.getElementById("start-screen").className="hidden";
    document.getElementById("room-screen").className="hidden";
}

function showColorScreen(){
    document.getElementById("mode-screen").className="hidden";
    document.getElementById("level-screen").className="hidden";
    document.getElementById("start-screen").className="";
    document.getElementById("room-screen").className="hidden";
}
function showModeScreen(){
    document.getElementById("mode-screen").className="";
    document.getElementById("level-screen").className="hidden";
    document.getElementById("start-screen").className="hidden";
    document.getElementById("room-screen").className="hidden";
}

function showRoomScreen(){
    document.getElementById("mode-screen").className="hidden";
    document.getElementById("room-screen").className="";
}

function makeRoomCode(){
    let code="";
    for(let i=0;i<6;i++){
        code=code+Math.floor(Math.random()*10);
    }
    return code;
}

function createRoom(){
    roomCode=makeRoomCode();
    isHost=true;
    humanColor="黒";
    gameMode="multi";

    initBoard();

    fbSet(fbRef(fbDb,"rooms/"+roomCode),{
        board:board,
        currentPlayer:"黒",
        guestJoined:false
    });
    fbOnDisconnect(fbRef(fbDb,"rooms/"+roomCode)).remove();
    document.getElementById("room-code-display").innerHTML="ばんごう："+roomCode+"<br>たいきちゅう";
    document.getElementById("room-create").disabled=true;
    document.getElementById("room-join").disabled=true;
    document.getElementById("room-code-display").textContent="ばんごう："+roomCode;
    watchRoom();
}

function joinRoom(){
    const code=document.getElementById("room-code-input").value;
    if(code.length!==6){
        showPopup("6けたのばんごうをいれてね");
        return;
    }
    fbGet(fbRef(fbDb,"rooms/"+code)).then(function(snapshot){
        if(!snapshot.exists()){
            showPopup("そのへやはないよ");
            return;
        }
        const data=snapshot.val();
        if(data.guestJoined===true){
            showPopup("そのへやはいっぱいだよ");
            return;
        }
        roomCode=code;
        isHost=false;
        humanColor="白";
        gameMode="multi";

        fbSet(fbRef(fbDb,"rooms/"+roomCode+"/guestJoined"),true);
        fbOnDisconnect(fbRef(fbDb,"rooms/"+roomCode)).remove();
        watchRoom();
    });
}

function watchRoom(){
    fbOnValue(fbRef(fbDb,"rooms/"+roomCode),function(snapshot){
        const data=snapshot.val();
        if(data===null){
            if(gameMode==="multi"&&!leavingSelf){
                leaveRoom();
                showPopup("あいてがいなくなりました");
            }
            leavingSelf=false;
            return;
        }
        if(data.guestJoined===true&&document.getElementById("room-screen").className===""){
            document.getElementById("room-screen").className="hidden";
            playSound(seGameStart);
        }
        if(data.board){
            board=data.board;
            currentPlayer=data.currentPlayer;
            drawBoard();
        }
    });
}

function pushToFirebase(){
    fbSet(fbRef(fbDb,"rooms/"+roomCode),{
        board:board,currentPlayer:currentPlayer,guestJoined:true
    });
}

function leaveRoom(){
    gameMode="single";
    roomCode="";
    isHost=false;
    cpuLevel="";
    document.getElementById("room-create").disabled=false;
    document.getElementById("room-join").disabled=false;
    document.getElementById("room-code-input").disabled=false;
    document.getElementById("room-code-display").textContent="";
    document.getElementById("room-code-input").value="";
    initBoard();
    drawBoard();
    showModeScreen();
}

function updateLevelInfo(){
    const el=document.getElementById("level-info");
    if(gameMode==="multi"){
        el.textContent="ふたりであそぶ";
        return;
    }
    if(cpuLevel===""){
        el.textContent="";
        return;
    }
    el.textContent="むずかしさ："+cpuLevel;
}

const boardElement=document.getElementById("board");

function drawBoard(){
    boardElement.innerHTML="";
    for(let row=0;row<boardSize;row++){
        for(let col=0;col<boardSize;col++){
            const cell=document.createElement("div");
            cell.className="cell";
            if(board[row][col]==="黒"){
                const stone=document.createElement("div");
                stone.className="stone black";
                cell.appendChild(stone);
            }else if(board[row][col]==="白"){
                const stone=document.createElement("div");
                stone.className="stone white";
                cell.appendChild(stone);
            }
            if(board[row][col]==="空"&&canPlace(row,col,currentPlayer)){
                const hint=document.createElement("div");
                hint.className="hint";
                cell.appendChild(hint);

            }
            cell.addEventListener("click",function(){
                if(currentPlayer!==humanColor){
                    return;
                }
                if(canPlace(row,col,currentPlayer)){
                    saveState();
                    placeStone(row,col,currentPlayer);
                    playSound(sePlaceStone);
                    afterMove();
                }else{
                    playSound(sePass);
                    showPopup("ここには置けないよ")
                }
            });
            boardElement.appendChild(cell);
        }
    }
    updateInfo();
    updateLevelInfo();
    updateDarkness();
}

const popupOk=document.getElementById("popup-ok");
popupOk.addEventListener("click",hidePopup);

const popupX=document.querySelector(".popup-x");
popupX.addEventListener("click",closePopupOnly);

const chooseBlack=document.getElementById("choose-black");
chooseBlack.addEventListener("click",function(){
    startGame("黒");
});

const chooseWhite=document.getElementById("choose-white");
chooseWhite.addEventListener("click",function(){
    startGame("白");
});

const resetButton=document.getElementById("reset");
resetButton.addEventListener("click",function(){
    if(cpuLevel==="しってるよ"){
        return;
    }
    showConfirm();
});

const confirmYes=document.getElementById("confirm-yes");
confirmYes.addEventListener("click",function(){
    hideConfirm();
    resetGame();
});

const confirmNo=document.getElementById("confirm-no");
confirmNo.addEventListener("click",hideConfirm);

const undoButton=document.getElementById("undo");
undoButton.addEventListener("click",function(){
    if(cpuLevel==="しってるよ"){
        return;
    }
    undoMove();
});

const levelLose=document.getElementById("level-lose");
levelLose.addEventListener("click",function(){
    cpuLevel="負けてあげるよ";
    showColorScreen();
});

const levelEasy=document.getElementById("level-easy");
levelEasy.addEventListener("click",function(){
    cpuLevel="やさしい";
    showColorScreen();
});

const levelNormal=document.getElementById("level-normal");
levelNormal.addEventListener("click",function(){
    cpuLevel="ふつう";
    showColorScreen();
});

const levelHard=document.getElementById("level-hard");
levelHard.addEventListener("click",function(){
    cpuLevel="むずかしい";
    showColorScreen();
});

const levelWin=document.getElementById("level-win");
levelWin.addEventListener("click",function(){
    cpuLevel="勝つよ";
    showColorScreen();
});

const modeSingle=document.getElementById("mode-single");
modeSingle.addEventListener("click",function(){
    gameMode="single";
    showLevelScreen();
});

const modeMulti=document.getElementById("mode-multi");
modeMulti.addEventListener("click",function(){
    gameMode="multi";
    showRoomScreen();
});

const roomCreate=document.getElementById("room-create");
roomCreate.addEventListener("click",createRoom);

const roomJoin=document.getElementById("room-join");
roomJoin.addEventListener("click",joinRoom);

document.addEventListener("keydown",function(e){
    typedKeys=typedKeys+e.key.toLowerCase();
    if(typedKeys.length>10){
        typedKeys=typedKeys.slice(-10);
    }
    if(typedKeys.indexOf("dare")!==-1){
        typedKeys="";
        unlockSecret();
    }
});
initBoard();
drawBoard();
showModeScreen();