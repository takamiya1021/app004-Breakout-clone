// ゲーム設定
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');

// ゲーム状態
let gameRunning = false;
let gamePaused = false;
let score = 0;
let lives = 3;
let animationId = null;

// ボール設定
const ball = {
    x: canvas.width / 2,
    y: canvas.height - 100,
    radius: 8,
    dx: 4,
    dy: -4,
    speed: 4,
    color: '#ffd700'
};

// パドル設定
const paddle = {
    width: 100,
    height: 15,
    x: canvas.width / 2 - 50,
    y: canvas.height - 30,
    speed: 8,
    color: '#4ecdc4'
};

// ブロック設定
const brickRowCount = 6;
const brickColumnCount = 10;
const brickWidth = 70;
const brickHeight = 20;
const brickPadding = 5;
const brickOffsetTop = 60;
const brickOffsetLeft = 35;

// ブロックの配列
let bricks = [];

// ブロックの色（行ごとに異なる色）
const brickColors = [
    '#ff6b6b',
    '#4ecdc4',
    '#45b7d1',
    '#f7b731',
    '#5f27cd',
    '#00d2d3'
];

// パーティクル効果用配列
let particles = [];

// パーティクルクラス
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.size = Math.random() * 3 + 1;
        this.color = color;
        this.alpha = 1;
        this.decay = 0.02;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= this.decay;
        this.size *= 0.98;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.restore();
    }

    isDead() {
        return this.alpha <= 0;
    }
}

// ブロックの初期化
function initBricks() {
    bricks = [];
    for (let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickRowCount; r++) {
            bricks[c][r] = {
                x: 0,
                y: 0,
                status: 1,
                color: brickColors[r]
            };
        }
    }
}

// キーボード入力処理
let rightPressed = false;
let leftPressed = false;

document.addEventListener('keydown', keyDownHandler, false);
document.addEventListener('keyup', keyUpHandler, false);
document.addEventListener('mousemove', mouseMoveHandler, false);

function keyDownHandler(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight') {
        rightPressed = true;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
        leftPressed = true;
    } else if (e.key === ' ' || e.key === 'Space') {
        if (!gameRunning) {
            startGame();
        }
    } else if (e.key === 'p' || e.key === 'P') {
        togglePause();
    }
}

function keyUpHandler(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight') {
        rightPressed = false;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
        leftPressed = false;
    }
}

function mouseMoveHandler(e) {
    if (!gameRunning || gamePaused) return;
    
    const relativeX = e.clientX - canvas.offsetLeft;
    if (relativeX > paddle.width / 2 && relativeX < canvas.width - paddle.width / 2) {
        paddle.x = relativeX - paddle.width / 2;
    }
}

// ボールの描画
function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.closePath();
    
    // ボールの光彩効果
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius + 2, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();
}

// パドルの描画
function drawPaddle() {
    ctx.fillStyle = paddle.color;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    
    // パドルのハイライト効果
    const gradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height / 2);
}

// ブロックの描画
function drawBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status === 1) {
                const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
                const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
                bricks[c][r].x = brickX;
                bricks[c][r].y = brickY;
                
                ctx.fillStyle = bricks[c][r].color;
                ctx.fillRect(brickX, brickY, brickWidth, brickHeight);
                
                // ブロックのハイライト効果
                const gradient = ctx.createLinearGradient(brickX, brickY, brickX, brickY + brickHeight);
                gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ctx.fillStyle = gradient;
                ctx.fillRect(brickX, brickY, brickWidth, brickHeight / 2);
            }
        }
    }
}

// パーティクル効果の描画
function drawParticles() {
    particles = particles.filter(particle => !particle.isDead());
    particles.forEach(particle => {
        particle.update();
        particle.draw();
    });
}

// 衝突検出
function collisionDetection() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const b = bricks[c][r];
            if (b.status === 1) {
                if (ball.x + ball.radius > b.x &&
                    ball.x - ball.radius < b.x + brickWidth &&
                    ball.y + ball.radius > b.y &&
                    ball.y - ball.radius < b.y + brickHeight) {
                    
                    ball.dy = -ball.dy;
                    b.status = 0;
                    score += 10;
                    scoreElement.textContent = score;
                    
                    // パーティクル効果を生成
                    for (let i = 0; i < 10; i++) {
                        particles.push(new Particle(b.x + brickWidth / 2, b.y + brickHeight / 2, b.color));
                    }
                    
                    // 全ブロック破壊チェック
                    if (checkWin()) {
                        gameWin();
                    }
                    
                    // スピードアップ（スコアに応じて）
                    if (score % 50 === 0) {
                        ball.speed *= 1.1;
                        ball.dx = ball.dx > 0 ? ball.speed : -ball.speed;
                        ball.dy = ball.dy > 0 ? ball.speed : -ball.speed;
                    }
                }
            }
        }
    }
}

// 勝利判定
function checkWin() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status === 1) {
                return false;
            }
        }
    }
    return true;
}

// パドル移動
function movePaddle() {
    if (rightPressed && paddle.x < canvas.width - paddle.width) {
        paddle.x += paddle.speed;
    } else if (leftPressed && paddle.x > 0) {
        paddle.x -= paddle.speed;
    }
}

// ボール移動と壁との衝突
function moveBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;
    
    // 左右の壁との衝突
    if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
        ball.dx = -ball.dx;
    }
    
    // 上の壁との衝突
    if (ball.y - ball.radius < 0) {
        ball.dy = -ball.dy;
    }
    
    // パドルとの衝突
    if (ball.y + ball.radius > paddle.y &&
        ball.y - ball.radius < paddle.y + paddle.height &&
        ball.x > paddle.x &&
        ball.x < paddle.x + paddle.width) {
        
        // ボールがパドルのどこに当たったかで角度を変える
        const hitPos = (ball.x - paddle.x) / paddle.width;
        const angle = Math.PI * (0.25 + 0.5 * hitPos);
        ball.dx = ball.speed * Math.cos(angle);
        ball.dy = -Math.abs(ball.speed * Math.sin(angle));
    }
    
    // 下に落ちた場合
    if (ball.y - ball.radius > canvas.height) {
        lives--;
        livesElement.textContent = lives;
        
        if (lives <= 0) {
            gameOver();
        } else {
            resetBall();
        }
    }
}

// ボールリセット
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height - 100;
    ball.dx = 4;
    ball.dy = -4;
    paddle.x = canvas.width / 2 - paddle.width / 2;
}

// ゲーム描画
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBricks();
    drawBall();
    drawPaddle();
    drawParticles();
    collisionDetection();
    
    if (gameRunning && !gamePaused) {
        moveBall();
        movePaddle();
    }
    
    if (gameRunning) {
        animationId = requestAnimationFrame(draw);
    }
}

// ゲーム開始
function startGame() {
    if (gameRunning) return;
    
    gameRunning = true;
    gamePaused = false;
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    resetBtn.disabled = false;
    
    draw();
}

// ゲーム一時停止
function togglePause() {
    if (!gameRunning) return;
    
    gamePaused = !gamePaused;
    pauseBtn.textContent = gamePaused ? '再開' : '一時停止';
}

// ゲームリセット
function resetGame() {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    
    gameRunning = false;
    gamePaused = false;
    score = 0;
    lives = 3;
    particles = [];
    
    scoreElement.textContent = score;
    livesElement.textContent = lives;
    
    initBricks();
    resetBall();
    
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    pauseBtn.textContent = '一時停止';
    resetBtn.disabled = false;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBricks();
    drawBall();
    drawPaddle();
}

// ゲームオーバー
function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 30);
    
    ctx.font = '24px Arial';
    ctx.fillText(`最終スコア: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
    
    startBtn.disabled = false;
    pauseBtn.disabled = true;
}

// ゲーム勝利
function gameWin() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('YOU WIN!', canvas.width / 2, canvas.height / 2 - 30);
    
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.fillText(`最終スコア: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
    
    startBtn.disabled = false;
    pauseBtn.disabled = true;
}

// イベントリスナー
startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', togglePause);
resetBtn.addEventListener('click', resetGame);

// 初期化
initBricks();
drawBricks();
drawBall();
drawPaddle();