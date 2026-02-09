
import { World, Time } from './jael-lite.js';

let world;
let gameLoopId;
let canvas;
let ctx;
let isActive = false;
let uiContainer;

// Assets (Generated SVGs)
const ASSETS = {
    marine: new Image(),
    squad: new Image(),
    enemy: new Image(),
    boss: new Image()
};

// Generate Assets
function generateAssets() {
    // Player Marine (Blue)
    const marineSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
        <defs>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="2" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.5"/>
            </filter>
        </defs>
        <g filter="url(#shadow)">
            <rect x="12" y="10" width="40" height="16" rx="5" fill="#1e3a8a" />
            <circle cx="32" cy="32" r="12" fill="#2563eb" stroke="#1e3a8a" stroke-width="2"/>
            <rect x="38" y="20" width="12" height="24" fill="#333" />
            <rect x="38" y="20" width="12" height="24" fill="#60a5fa" opacity="0.5"/>
        </g>
    </svg>`;
    ASSETS.marine.src = 'data:image/svg+xml;base64,' + btoa(marineSvg);

    // Squad Marine (Greenish/Different Blue)
    const squadSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
        <defs>
            <filter id="shadow2" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="2" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.5"/>
            </filter>
        </defs>
        <g filter="url(#shadow2)">
            <rect x="12" y="10" width="40" height="16" rx="5" fill="#14532d" />
            <circle cx="32" cy="32" r="12" fill="#16a34a" stroke="#14532d" stroke-width="2"/>
            <rect x="38" y="20" width="12" height="24" fill="#333" />
        </g>
    </svg>`;
    ASSETS.squad.src = 'data:image/svg+xml;base64,' + btoa(squadSvg);

    // Tyranid
    const enemySvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
        <g transform="rotate(180, 32, 32)">
            <path d="M10,10 Q20,30 10,50" stroke="#9f1239" stroke-width="4" fill="none" />
            <path d="M54,10 Q44,30 54,50" stroke="#9f1239" stroke-width="4" fill="none" />
            <ellipse cx="32" cy="32" rx="15" ry="20" fill="#4c1d95" />
            <path d="M22,20 Q32,10 42,20 L42,40 Q32,50 22,40 Z" fill="#6d28d9" />
            <path d="M28,45 L32,50 L36,45" fill="#fff" />
        </g>
    </svg>`;
    ASSETS.enemy.src = 'data:image/svg+xml;base64,' + btoa(enemySvg);

    // Boss Tyranid (Bigger, Darker, More Spikes)
    const bossSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 64 64">
        <g transform="rotate(180, 32, 32)">
            <!-- Extra Spikes -->
            <path d="M5,5 L15,25" stroke="#000" stroke-width="3" />
            <path d="M59,5 L49,25" stroke="#000" stroke-width="3" />
            
            <path d="M8,8 Q20,30 8,60" stroke="#7f1d1d" stroke-width="6" fill="none" />
            <path d="M56,8 Q44,30 56,60" stroke="#7f1d1d" stroke-width="6" fill="none" />
            
            <ellipse cx="32" cy="32" rx="20" ry="25" fill="#312e81" />
            <path d="M18,15 Q32,0 46,15 L46,45 Q32,60 18,45 Z" fill="#4338ca" />
            
            <!-- Big Teeth -->
            <path d="M24,50 L32,60 L40,50" fill="#fca5a5" />
            <circle cx="25" cy="40" r="3" fill="#ef4444" />
            <circle cx="39" cy="40" r="3" fill="#ef4444" />
        </g>
    </svg>`;
    ASSETS.boss.src = 'data:image/svg+xml;base64,' + btoa(bossSvg);
}

// Game State
const STATE = {
    kills: 0,
    wave: 1,
    gameOver: false,
    camera: { x: 0, y: 0, shake: 0 },
    squadCount: 0
};

// Components
const Position = "position";
const Velocity = "velocity";
const Size = "size";
const Sprite = "sprite";
const Rotation = "rotation";
const Player = "player";
const SquadMember = "squadMember"; // Tag for AI marines
const Enemy = "enemy";
const Bullet = "bullet";
const Collider = "collider";
const Particle = "particle";
const Health = "health"; // { current, max }

export function initGame() {
    if (isActive) {
        stopGame(); // Cleanup if running
    }
    
    generateAssets();
    isActive = true;
    STATE.kills = 0;
    STATE.wave = 1;
    STATE.gameOver = false;
    STATE.camera.shake = 0;
    STATE.squadCount = 0;

    // Setup Canvas
    canvas = document.createElement('canvas');
    canvas.id = 'game-canvas';
    Object.assign(canvas.style, {
        position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
        zIndex: '9999', background: 'radial-gradient(circle, #3f1810 0%, #1a0505 100%)'
    });
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');

    // Setup UI
    setupUI();

    // Initialize World
    world = new World();
    setupWorld(world);

    // Start Loop
    let lastTime = performance.now();
    function loop(currentTime) {
        if (!isActive) return;
        const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
        lastTime = currentTime;
        
        if (!STATE.gameOver) {
            world.update(delta);
        }
        
        // Always render (so we see the game over screen over the game)
        if (STATE.gameOver) {
            renderGameOverOverlay();
        }

        gameLoopId = requestAnimationFrame(loop);
    }
    gameLoopId = requestAnimationFrame(loop);
}

function setupUI() {
    uiContainer = document.createElement('div');
    uiContainer.id = 'game-ui';
    Object.assign(uiContainer.style, {
        position: 'fixed', top: '20px', left: '20px', right: '20px',
        color: '#facc15', fontFamily: "'Russo One', sans-serif", zIndex: '10000',
        textShadow: '2px 2px 0 #000', pointerEvents: 'none' // Let clicks pass through to canvas
    });
    
    uiContainer.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:start;">
            <div>
                <h1 style="margin:0; font-size: 2rem;">LAST STAND</h1>
                <p style="margin:5px 0; font-size: 1rem; color: #94a3b8;">
                    WASD: Move | MOUSE: Shoot<br>
                    Survive waves. Every 50 kills grants a Squad Member (Max 5).
                </p>
            </div>
            <div style="text-align:right;">
                <p style="margin:0; font-size: 1.5rem;">WAVE <span id="wave-disp">1</span></p>
                <p style="margin:0; font-size: 1.2rem;">KILLS: <span id="score-disp">0</span></p>
                <p style="margin:0; font-size: 1rem; color:#4ade80;">SQUAD: <span id="squad-disp">1</span>/5</p>
            </div>
        </div>
        <button id="close-game" style="pointer-events:auto; position:absolute; bottom:-90vh; right:0; background:#9f1239; color:white; border:2px solid #fff; padding:10px 20px; cursor:pointer; font-family:'Russo One';">ABORT MISSION</button>
    `;
    document.body.appendChild(uiContainer);

    document.getElementById('close-game').addEventListener('click', stopGame);
}

export function stopGame() {
    isActive = false;
    cancelAnimationFrame(gameLoopId);
    if (canvas) canvas.remove();
    if (uiContainer) uiContainer.remove();
}

function setupWorld(world) {
    // Create Player
    const player = world.create();
    world.addComponent(player, Position, { x: canvas.width / 2, y: canvas.height / 2 });
    world.addComponent(player, Velocity, { x: 0, y: 0 });
    world.addComponent(player, Rotation, { angle: 0 });
    world.addComponent(player, Size, { radius: 20 });
    world.addComponent(player, Sprite, { image: ASSETS.marine, scale: 1.2, rotationOffset: Math.PI / 2 });
    world.addComponent(player, Collider, { radius: 15 });
    world.addComponent(player, Player, {});

    // Add Systems
    world.addSystem(new InputSystem());
    world.addSystem(new MovementSystem());
    world.addSystem(new SquadSystem());
    world.addSystem(new GameManagerSystem()); // Handles waves and spawning
    world.addSystem(new EnemySpawnSystem());
    world.addSystem(new EnemyAISystem());
    world.addSystem(new ShootingSystem());
    world.addSystem(new CollisionSystem());
    world.addSystem(new ParticleSystem());
    world.addSystem(new RenderSystem());
}

// SYSTEMS

class GameManagerSystem {
    constructor() { this.priority = 1; }
    update(world, delta) {
        // Check wave progress
        const currentWave = Math.floor(STATE.kills / 50) + 1;
        
        if (currentWave > STATE.wave) {
            STATE.wave = currentWave;
            document.getElementById('wave-disp').textContent = STATE.wave;
            
            // Try spawn squad member
            const squadMembers = world.include(SquadMember).entities.length;
            if (squadMembers < 4) { // Max 4 AI + 1 Player = 5
                this.spawnSquadMember(world);
                spawnFloatingText(world, canvas.width/2, canvas.height/2 - 50, "REINFORCEMENTS ARRIVED!", '#4ade80');
            } else {
                spawnFloatingText(world, canvas.width/2, canvas.height/2 - 50, "WAVE CLEARED!", '#facc15');
            }

            // BOSS SPAWN (Every 5 waves)
            if (STATE.wave % 5 === 0) {
                 this.spawnBoss(world);
                 spawnFloatingText(world, canvas.width/2, canvas.height/2 + 50, "⚠️ CARNIFEX DETECTED ⚠️", '#ef4444');
            }
        }
        
        // Update Squad Display
        const squadCount = 1 + world.include(SquadMember).entities.length;
        document.getElementById('squad-disp').textContent = squadCount;
    }

    spawnSquadMember(world) {
        const player = world.include(Player, Position).entities[0];
        if (!player) return;
        const pPos = player.get(Position);

        const member = world.create();
        const offsetX = (Math.random() - 0.5) * 100;
        const offsetY = (Math.random() - 0.5) * 100;
        
        world.addComponent(member, Position, { x: pPos.x + offsetX, y: pPos.y + offsetY });
        world.addComponent(member, Velocity, { x: 0, y: 0 });
        world.addComponent(member, Rotation, { angle: 0 });
        world.addComponent(member, Size, { radius: 18 });
        world.addComponent(member, Sprite, { image: ASSETS.squad, scale: 1.0, rotationOffset: Math.PI / 2 });
        world.addComponent(member, Collider, { radius: 15 });
        world.addComponent(member, SquadMember, { lastShot: 0 });
    }

    spawnBoss(world) {
        const boss = world.create();
        let x, y;
        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? -100 : canvas.width + 100;
            y = Math.random() * canvas.height;
        } else {
            x = Math.random() * canvas.width;
            y = Math.random() < 0.5 ? -100 : canvas.height + 100;
        }

        // Boss Stats scale with wave
        const bossHP = 30 + (STATE.wave * 2);

        world.addComponent(boss, Position, { x, y });
        world.addComponent(boss, Velocity, { x: 0, y: 0 });
        world.addComponent(boss, Rotation, { angle: 0 });
        world.addComponent(boss, Size, { radius: 50 });
        world.addComponent(boss, Sprite, { image: ASSETS.boss, scale: 2.0, rotationOffset: Math.PI / 2 });
        world.addComponent(boss, Collider, { radius: 45 });
        world.addComponent(boss, Enemy, { isBoss: true });
        world.addComponent(boss, Health, { current: bossHP, max: bossHP });
    }
}

class SquadSystem {
    constructor() { this.priority = 12; }
    update(world, delta) {
        const player = world.include(Player, Position).entities[0];
        if (!player) return;
        const pPos = player.get(Position);
        
        const squad = world.include(SquadMember, Position, Velocity, Rotation);
        const enemies = world.include(Enemy, Position).entities;

        squad.entities.forEach(member => {
            const pos = member.get(Position);
            const vel = member.get(Velocity);
            const rot = member.get(Rotation);
            const ai = member.get(SquadMember);

            // 1. Follow Player
            const distToPlayer = Math.hypot(pPos.x - pos.x, pPos.y - pos.y);
            const stopDist = 80;
            const moveSpeed = 280;

            if (distToPlayer > stopDist) {
                const angle = Math.atan2(pPos.y - pos.y, pPos.x - pos.x);
                vel.x = Math.cos(angle) * moveSpeed;
                vel.y = Math.sin(angle) * moveSpeed;
            } else {
                vel.x *= 0.9;
                vel.y *= 0.9;
            }

            // 2. Aim and Shoot at nearest enemy
            let nearestEnemy = null;
            let minDist = 400;

            for (const enemy of enemies) {
                const ePos = enemy.get(Position);
                const d = Math.hypot(ePos.x - pos.x, ePos.y - pos.y);
                if (d < minDist) {
                    minDist = d;
                    nearestEnemy = enemy;
                }
            }

            if (nearestEnemy) {
                const ePos = nearestEnemy.get(Position);
                rot.angle = Math.atan2(ePos.y - pos.y, ePos.x - pos.x);
                
                const now = performance.now();
                if (now - ai.lastShot > 300) { 
                    const dx = Math.cos(rot.angle);
                    const dy = Math.sin(rot.angle);
                    
                    const bullet = world.create();
                    world.addComponent(bullet, Position, { x: pos.x + dx * 20, y: pos.y + dy * 20 });
                    world.addComponent(bullet, Velocity, { x: dx * 900, y: dy * 900 });
                    world.addComponent(bullet, Size, { radius: 3 });
                    world.addComponent(bullet, Collider, { radius: 5 });
                    world.addComponent(bullet, Bullet, {}); 
                    
                    ai.lastShot = now;
                }
            } else {
                if (Math.abs(vel.x) > 1 || Math.abs(vel.y) > 1) {
                    rot.angle = Math.atan2(vel.y, vel.x);
                }
            }
        });
    }
}

class InputSystem {
    constructor() {
        this.keys = {};
        window.addEventListener('keydown', e => this.keys[e.key] = true);
        window.addEventListener('keyup', e => this.keys[e.key] = false);
        this.priority = 0;
    }

    update(world, delta) {
        const query = world.include(Player, Velocity);
        query.entities.forEach(entity => {
            const vel = entity.get(Velocity);
            const speed = 300;
            vel.x = 0;
            vel.y = 0;

            if (this.keys['w'] || this.keys['W']) vel.y = -speed;
            if (this.keys['s'] || this.keys['S']) vel.y = speed;
            if (this.keys['a'] || this.keys['A']) vel.x = -speed;
            if (this.keys['d'] || this.keys['D']) vel.x = speed;
        });
    }
}

class MovementSystem {
    constructor() { this.priority = 10; }
    update(world, delta) {
        const query = world.include(Position, Velocity);
        query.entities.forEach(entity => {
            const pos = entity.get(Position);
            const vel = entity.get(Velocity);
            
            pos.x += vel.x * delta;
            pos.y += vel.y * delta;

            if (entity.has(Enemy) && entity.has(Rotation)) {
                if (Math.abs(vel.x) > 1 || Math.abs(vel.y) > 1) {
                    entity.get(Rotation).angle = Math.atan2(vel.y, vel.x);
                }
            }

            if (entity.has(Player) || entity.has(SquadMember)) {
                pos.x = Math.max(20, Math.min(canvas.width - 20, pos.x));
                pos.y = Math.max(20, Math.min(canvas.height - 20, pos.y));
            }
        });
    }
}

class ShootingSystem {
    constructor() { 
        this.priority = 5;
        this.lastShot = 0;
        this.mouse = { x: 0, y: 0 };
        this.mouseDown = false;
        
        window.addEventListener('mousemove', e => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
        window.addEventListener('mousedown', () => this.mouseDown = true);
        window.addEventListener('mouseup', () => this.mouseDown = false);
    }

    update(world, delta) {
        const playerQuery = world.include(Player, Position, Rotation);
        playerQuery.entities.forEach(player => {
            const pPos = player.get(Position);
            const rot = player.get(Rotation);
            rot.angle = Math.atan2(this.mouse.y - pPos.y, this.mouse.x - pPos.x);
            
            if (this.mouseDown) {
                const now = performance.now();
                if (now - this.lastShot < 100) return;

                const dx = Math.cos(rot.angle);
                const dy = Math.sin(rot.angle);
                
                const bullet = world.create();
                const spawnX = pPos.x + dx * 20;
                const spawnY = pPos.y + dy * 20;

                world.addComponent(bullet, Position, { x: spawnX, y: spawnY });
                world.addComponent(bullet, Velocity, { x: dx * 1000, y: dy * 1000 });
                world.addComponent(bullet, Size, { radius: 3 });
                world.addComponent(bullet, Collider, { radius: 5 });
                world.addComponent(bullet, Bullet, {});
                
                STATE.camera.shake = 2;
                this.lastShot = now;
            }
        });
    }
}

class EnemySpawnSystem {
    constructor() {
        this.priority = 20;
        this.timer = 0;
        this.spawnRate = 0.8; 
    }

    update(world, delta) {
        this.timer += delta;
        const adjustedRate = Math.max(0.1, 0.8 - (STATE.wave * 0.05));
        
        if (this.timer > adjustedRate) {
            this.timer = 0;

            const enemy = world.create();
            let x, y;
            if (Math.random() < 0.5) {
                x = Math.random() < 0.5 ? -40 : canvas.width + 40;
                y = Math.random() * canvas.height;
            } else {
                x = Math.random() * canvas.width;
                y = Math.random() < 0.5 ? -40 : canvas.height + 40;
            }

            // Stats Scaling
            // Every 2 waves, +1 HP
            const waveHpBonus = Math.floor(STATE.wave / 2);
            const hp = 1 + waveHpBonus;

            world.addComponent(enemy, Position, { x, y });
            world.addComponent(enemy, Velocity, { x: 0, y: 0 });
            world.addComponent(enemy, Rotation, { angle: 0 });
            world.addComponent(enemy, Size, { radius: 20 });
            world.addComponent(enemy, Sprite, { image: ASSETS.enemy, scale: 1.0, rotationOffset: Math.PI / 2 });
            world.addComponent(enemy, Collider, { radius: 20 });
            world.addComponent(enemy, Enemy, { isBoss: false });
            world.addComponent(enemy, Health, { current: hp, max: hp });
        }
    }
}

class EnemyAISystem {
    constructor() { this.priority = 15; }
    update(world, delta) {
        const targets = [];
        const player = world.include(Player, Position).entities[0];
        if (player) targets.push(player);
        
        const squad = world.include(SquadMember, Position).entities;
        targets.push(...squad);

        if (targets.length === 0) return;

        const enemyQuery = world.include(Enemy, Position, Velocity);

        enemyQuery.entities.forEach(enemy => {
            const ePos = enemy.get(Position);
            const eVel = enemy.get(Velocity);
            const enemyData = enemy.get(Enemy);
            
            let target = targets[0];
            let minDist = 99999;
            
            for(const t of targets) {
                if(!t.has(Position)) continue;
                const tPos = t.get(Position);
                const dist = Math.hypot(tPos.x - ePos.x, tPos.y - ePos.y);
                if(dist < minDist) {
                    minDist = dist;
                    target = t;
                }
            }

            if(target && target.has(Position)) {
                const tPos = target.get(Position);
                const dx = tPos.x - ePos.x;
                const dy = tPos.y - ePos.y;
                const mag = Math.sqrt(dx*dx + dy*dy);
                
                let speed = 120 + (STATE.wave * 5); // Faster each wave
                if (enemyData.isBoss) speed *= 0.6; // Boss is slower

                if (mag > 0) {
                    eVel.x = (dx / mag) * speed;
                    eVel.y = (dy / mag) * speed;
                }
            }
        });
    }
}

class CollisionSystem {
    constructor() { this.priority = 30; }
    update(world, delta) {
        const bullets = world.include(Bullet, Position, Collider).entities;
        const enemies = world.include(Enemy, Position, Collider).entities;
        const squad = world.include(SquadMember, Position, Collider).entities;
        const player = world.include(Player, Position, Collider).entities[0];

        // Bullets vs Enemies
        for (let b of bullets) {
            if (!b.has(Position)) continue;
            const bPos = b.get(Position);
            const bRad = b.get(Collider).radius;
            let hit = false;

            for (let e of enemies) {
                if (!e.has(Position)) continue;
                const ePos = e.get(Position);
                const eRad = e.get(Collider).radius;
                
                if (Math.hypot(bPos.x - ePos.x, bPos.y - ePos.y) < bRad + eRad) {
                    hit = true;
                    
                    // Damage Logic
                    if (e.has(Health)) {
                        const hp = e.get(Health);
                        hp.current -= 1; // Bullet deals 1 damage
                        
                        // Hit visual
                        spawnExplosion(world, ePos.x, ePos.y, '#9f1239', 2);

                        if (hp.current <= 0) {
                            const enemyData = e.get(Enemy);
                            
                            // Death FX
                            spawnExplosion(world, ePos.x, ePos.y, '#9f1239', 8); 
                            spawnExplosion(world, ePos.x, ePos.y, '#4c1d95', 8);
                            
                            if (enemyData.isBoss) {
                                spawnExplosion(world, ePos.x, ePos.y, '#facc15', 20); // Gold explosion
                                STATE.kills += 10; // Boss gives more kills
                                STATE.camera.shake = 10;
                            } else {
                                STATE.kills += 1;
                                STATE.camera.shake = 3;
                            }
                            
                            world.destroy(e.id);
                            document.getElementById('score-disp').textContent = STATE.kills;
                        }
                    } else {
                        // Legacy support (shouldn't happen)
                        world.destroy(e.id);
                        STATE.kills += 1;
                    }
                    
                    break; // Bullet hits one enemy
                }
            }
            
            if (hit || bPos.x < 0 || bPos.x > canvas.width || bPos.y < 0 || bPos.y > canvas.height) {
                world.destroy(b.id);
            }
        }

        // Enemies vs Targets (Player & Squad)
        for (let e of enemies) {
            if (!e.has(Position)) continue;
            const ePos = e.get(Position);
            const eRad = e.get(Collider).radius;

            // Vs Squad
            for (let s of squad) {
                if (!s.has(Position)) continue;
                const sPos = s.get(Position);
                const sRad = s.get(Collider).radius;
                
                if (Math.hypot(sPos.x - ePos.x, sPos.y - ePos.y) < sRad + eRad * 0.8) {
                    spawnExplosion(world, sPos.x, sPos.y, '#16a34a', 30);
                    world.destroy(s.id);
                    
                    // Kamikaze for normal enemies, Boss survives
                    const enemyData = e.get(Enemy);
                    if (!enemyData.isBoss) {
                         spawnExplosion(world, ePos.x, ePos.y, '#9f1239');
                         world.destroy(e.id);
                    }
                   
                    spawnFloatingText(world, sPos.x, sPos.y, "MAN DOWN!", '#ef4444');
                }
            }

            // Vs Player
            if (player && player.has(Position)) {
                const pPos = player.get(Position);
                const pRad = player.get(Collider).radius;
                
                if (Math.hypot(pPos.x - ePos.x, pPos.y - ePos.y) < pRad + eRad * 0.8) {
                    STATE.gameOver = true;
                    spawnExplosion(world, pPos.x, pPos.y, '#3b82f6', 50);
                }
            }
        }
    }
}

class ParticleSystem {
    constructor() { this.priority = 40; }
    update(world, delta) {
        const query = world.include(Particle, Position, Velocity);
        query.entities.forEach(p => {
            const pos = p.get(Position);
            const vel = p.get(Velocity);
            const part = p.get(Particle);
            
            pos.x += vel.x * delta;
            pos.y += vel.y * delta;
            vel.x *= 0.95;
            vel.y *= 0.95;
            
            part.life -= delta;
            if (part.life <= 0) world.destroy(p.id);
        });
    }
}

class RenderSystem {
    constructor() { this.priority = 100; }
    update(world, delta) {
        let shakeX = 0, shakeY = 0;
        if (STATE.camera.shake > 0) {
            shakeX = (Math.random() - 0.5) * STATE.camera.shake;
            shakeY = (Math.random() - 0.5) * STATE.camera.shake;
            STATE.camera.shake *= 0.9;
            if (STATE.camera.shake < 0.5) STATE.camera.shake = 0;
        }

        ctx.save();
        ctx.translate(shakeX, shakeY);
        ctx.clearRect(-20, -20, canvas.width + 40, canvas.height + 40);
        
        // Grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for(let x=0; x<canvas.width; x+=50) { ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); }
        for(let y=0; y<canvas.height; y+=50) { ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); }
        ctx.stroke();

        // Particles
        const particles = world.include(Particle, Position);
        particles.entities.forEach(entity => {
            const pos = entity.get(Position);
            const part = entity.get(Particle);
            ctx.globalAlpha = part.life / part.maxLife;
            ctx.fillStyle = part.color;
            if (part.text) {
                ctx.font = '20px Russo One';
                ctx.fillText(part.text, pos.x, pos.y);
            } else {
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, part.size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1.0;
        });

        // Entities
        const entities = world.include(Position);
        entities.entities.forEach(entity => {
            if (entity.has(Particle)) return;
            const pos = entity.get(Position);
            
            ctx.save();
            ctx.translate(pos.x, pos.y);

            if (entity.has(Rotation)) ctx.rotate(entity.get(Rotation).angle);

            if (entity.has(Sprite)) {
                const sprite = entity.get(Sprite);
                const size = 48 * sprite.scale;
                ctx.rotate(sprite.rotationOffset || 0);
                ctx.drawImage(sprite.image, -size/2, -size/2, size, size);
            } else if (entity.has(Bullet)) {
                ctx.fillStyle = '#fbbf24';
                ctx.beginPath();
                ctx.arc(0, 0, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#f59e0b';
                ctx.fill();
                ctx.shadowBlur = 0;
            } else if (entity.has(Size) && entity.has(Color)) {
                ctx.fillStyle = entity.get(Color).fill;
                ctx.beginPath();
                ctx.arc(0, 0, entity.get(Size).radius, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        });

        ctx.restore();
    }
}

// HELPERS
function spawnExplosion(world, x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
        const p = world.create();
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 100 + 50;
        world.addComponent(p, Position, { x, y });
        world.addComponent(p, Velocity, { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed });
        world.addComponent(p, Particle, { life: 0.5 + Math.random() * 0.3, maxLife: 0.8, color: color, size: Math.random() * 4 + 2 });
    }
}

function spawnFloatingText(world, x, y, text, color) {
    const p = world.create();
    world.addComponent(p, Position, { x, y });
    world.addComponent(p, Velocity, { x: 0, y: -50 });
    world.addComponent(p, Particle, { life: 2.0, maxLife: 2.0, color: color, text: text });
}

function renderGameOverOverlay() {
    if (document.getElementById('retry-btn')) return;

    const overlay = document.createElement('div');
    overlay.id = 'retry-btn'; // Using ID as flag
    Object.assign(overlay.style, {
        position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
        background: 'rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center', zIndex: '20000'
    });
    
    overlay.innerHTML = `
        <h1 style="color:#ef4444; font-family:'Russo One'; font-size:4rem; margin-bottom:10px;">MISSION FAILED</h1>
        <h2 style="color:#fff; font-family:'Russo One'; margin-bottom:30px;">TOTAL KILLS: ${STATE.kills} | WAVES: ${STATE.wave}</h2>
        <button id="real-retry-btn" style="background:#facc15; color:#000; border:none; padding:15px 40px; font-size:2rem; font-family:'Russo One'; cursor:pointer; border-radius:8px;">RETRY DEPLOYMENT</button>
        <button id="quit-btn" style="margin-top:20px; background:transparent; color:#94a3b8; border:1px solid #94a3b8; padding:10px 20px; cursor:pointer; font-family:'Russo One';">QUIT</button>
    `;
    
    document.body.appendChild(overlay);
    
    document.getElementById('real-retry-btn').addEventListener('click', () => {
        overlay.remove();
        initGame(); // Restart
    });
    
    document.getElementById('quit-btn').addEventListener('click', () => {
        overlay.remove();
        stopGame();
    });
}
