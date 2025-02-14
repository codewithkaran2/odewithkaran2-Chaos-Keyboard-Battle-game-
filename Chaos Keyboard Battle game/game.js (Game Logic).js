const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 400;

const gravity = 0.5;
const jumpPower = -10;

// Generate random unique keys
function getRandomUniqueKeys(existingKeys) {
    const keys = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let assignedKeys = {};
    let usedKeys = new Set(existingKeys);

    function getKey() {
        let key;
        do {
            key = keys[Math.floor(Math.random() * keys.length)];
        } while (usedKeys.has(key));
        usedKeys.add(key);
        return key;
    }

    assignedKeys.left = getKey();
    assignedKeys.right = getKey();
    assignedKeys.jump = getKey();
    assignedKeys.shoot = getKey();
    return assignedKeys;
}

// Ensure unique keys for both players
const player1Keys = getRandomUniqueKeys([]);
const player2Keys = getRandomUniqueKeys(Object.values(player1Keys));

// Display assigned keys
document.getElementById("p1Keys").textContent = `Left: ${player1Keys.left}, Right: ${player1Keys.right}, Jump: ${player1Keys.jump}, Shoot: ${player1Keys.shoot}`;
document.getElementById("p2Keys").textContent = `Left: ${player2Keys.left}, Right: ${player2Keys.right}, Jump: ${player2Keys.jump}, Shoot: ${player2Keys.shoot}`;

class Player {
    constructor(x, color, facing) {
        this.x = x;
        this.y = 300;
        this.width = 40;
        this.height = 40;
        this.color = color;
        this.speed = 5;
        this.health = 100;
        this.velY = 0;
        this.isJumping = false;
        this.facing = facing; // -1 for left, 1 for right
        this.isDead = false;
    }

    moveLeft() { if (!this.isDead) this.x = Math.max(0, this.x - this.speed); this.facing = -1; }
    moveRight() { if (!this.isDead) this.x = Math.min(canvas.width - this.width, this.x + this.speed); this.facing = 1; }
    
    jump() {
        if (!this.isJumping && !this.isDead) {
            this.velY = jumpPower;
            this.isJumping = true;
        }
    }

    updatePosition() {
        if (this.isDead) return;
        this.y += this.velY;
        this.velY += gravity;
        if (this.y >= 300) { 
            this.y = 300;
            this.isJumping = false;
        }
    }

    takeDamage(fromPlayer) {
        if (!this.isDead) {
            this.health -= 20;
            if (this.health <= 0) {
                this.health = 0;
                this.isDead = true;
                endGame(`${fromPlayer.color.toUpperCase()} Player WINS!`);
            }
        }
    }
}

class Bullet {
    constructor(x, y, direction, color, shooter) {
        this.x = x;
        this.y = y + 15;
        this.width = 10;
        this.height = 5;
        this.speed = 8 * direction;
        this.color = color;
        this.shooter = shooter;
    }

    move() {
        this.x += this.speed;
    }

    isOffScreen() {
        return this.x < 0 || this.x > canvas.width;
    }

    hasHit(target) {
        return (
            !target.isDead &&
            this.x < target.x + target.width &&
            this.x + this.width > target.x &&
            this.y < target.y + target.height &&
            this.y + this.height > target.y
        );
    }
}

// Create players
const player1 = new Player(100, "blue", 1);
const player2 = new Player(600, "red", -1);
const bullets = [];

const keysPressed = {};

window.addEventListener("keydown", (e) => { keysPressed[e.key.toUpperCase()] = true; });
window.addEventListener("keyup", (e) => { keysPressed[e.key.toUpperCase()] = false; });

function updateGame() {
    if (player1.isDead || player2.isDead) return;

    // Movement
    if (keysPressed[player1Keys.left]) player1.moveLeft();
    if (keysPressed[player1Keys.right]) player1.moveRight();
    if (keysPressed[player1Keys.jump]) player1.jump();
    if (keysPressed[player2Keys.left]) player2.moveLeft();
    if (keysPressed[player2Keys.right]) player2.moveRight();
    if (keysPressed[player2Keys.jump]) player2.jump();

    // Shooting
    if (keysPressed[player1Keys.shoot]) shootBullet(player1);
    if (keysPressed[player2Keys.shoot]) shootBullet(player2);

    player1.updatePosition();
    player2.updatePosition();

    updateBullets();
    drawGame();
    requestAnimationFrame(updateGame);
}

function shootBullet(player) {
    if (!player.isDead && (!player.lastShot || Date.now() - player.lastShot > 500)) { 
        bullets.push(new Bullet(player.x + (player.facing === 1 ? player.width : -10), player.y, player.facing, player.color, player));
        player.lastShot = Date.now();
    }
}

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].move();
        if (bullets[i].isOffScreen()) {
            bullets.splice(i, 1);
            continue;
        }
        if (bullets[i].shooter === player1 && bullets[i].hasHit(player2)) {
            player2.takeDamage(player1);
            bullets.splice(i, 1);
        } else if (bullets[i].shooter === player2 && bullets[i].hasHit(player1)) {
            player1.takeDamage(player2);
            bullets.splice(i, 1);
        }
    }
}

function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!player1.isDead) {
        ctx.fillStyle = player1.color;
        ctx.fillRect(player1.x, player1.y, player1.width, player1.height);
    }
    if (!player2.isDead) {
        ctx.fillStyle = player2.color;
        ctx.fillRect(player2.x, player2.y, player2.width, player2.height);
    }

    bullets.forEach(bullet => {
        ctx.fillStyle = bullet.color;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });

    document.getElementById("p1HealthBar").style.width = `${player1.health * 2}px`;
    document.getElementById("p2HealthBar").style.width = `${player2.health * 2}px`;
}

function endGame(winnerText) {
    document.getElementById("winner").textContent = winnerText;
}

function restartGame() {
    location.reload();
}

updateGame();
