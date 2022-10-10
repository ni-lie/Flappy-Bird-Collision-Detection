"use strict";
// TYPES
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// VIEW
class FlappyBirdBrowserView {
    // Constructor is private to force use of `create` for instantiation
    constructor(canvas, ctx, groundHeight, groundVx, pipeImg, backgroundImg, groundImg, birdImg, debug) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.groundHeight = groundHeight;
        this.groundVx = groundVx;
        this.pipeImg = pipeImg;
        this.backgroundImg = backgroundImg;
        this.groundImg = groundImg;
        this.birdImg = birdImg;
        this.debug = debug;
        this.tickHandlers = [];
        this.jumpHandlers = [];
        this.isTickingPaused = false;
        this.BIRD_SPRITE_STEPS = 3;
        this.BIRD_SPRITE_TICK_DIVISOR = 3;
        this.SINGLE_BIRD_SPRITE_WIDTH = 92;
        this.CANVAS_TEXT_STYLING = "56pt flappyfont";
        this.redraw = (tickCount, pipePairs, bird, score) => {
            this.drawWorld(tickCount);
            this.drawPipePairs(pipePairs);
            this.drawBird(tickCount, bird);
            this.drawScore(score);
        };
        this.pauseTicking = () => {
            this.isTickingPaused = true;
        };
        this.unpauseTicking = () => {
            if (this.isTickingPaused) {
                this.isTickingPaused = false;
                window.requestAnimationFrame(this.tickHandler);
            }
        };
        this.tickHandler = () => {
            this.tickHandlers.forEach((f) => f(this));
            if (!this.isTickingPaused) {
                window.requestAnimationFrame(this.tickHandler);
            }
        };
        this.jumpHandler = () => {
            this.jumpHandlers.forEach((f) => f(this));
        };
        this.drawWorld = (tickCount) => {
            this.ctx.drawImage(this.backgroundImg, 0, 0, this.canvas.width, this.canvas.height - this.groundHeight);
            // Width must still be even for ground images with odd widths
            const groundWidth = Math.floor((this.groundImg.width + 1) / 2) * 2;
            // Illusion of movement needs one extra ground image at right end
            const groundTileCount = Math.ceil(this.canvas.width / groundWidth) + 1;
            const stepsPerFullGroundMovement = Math.ceil(Math.abs(this.groundImg.width / this.groundVx));
            const groundMovementStep = tickCount % stepsPerFullGroundMovement;
            Array(groundTileCount)
                .fill(0)
                .map((_, idx) => idx * groundWidth)
                .forEach((x) => this.ctx.drawImage(this.groundImg, x + groundMovementStep * this.groundVx, this.canvas.height - this.groundHeight, groundWidth, this.groundImg.height));
        };
        this.drawPipePairs = (pairs) => {
            pairs.forEach(this.drawPipePair);
        };
        this.drawPipePair = (pair) => {
            this.drawTopPipe(pair);
            this.drawBottomPipe(pair);
        };
        this.drawTopPipe = (pair) => {
            // Assumes pipe image is inverted
            this.ctx.save();
            this.ctx.translate(pair.width, pair.topHeight);
            this.ctx.scale(-1, 1);
            this.ctx.rotate((Math.PI / 180) * 180);
            this.ctx.drawImage(this.pipeImg, 0, 0, pair.width, pair.topHeight, -pair.width + pair.x, 0, pair.width, pair.topHeight);
            this.ctx.restore();
        };
        this.drawBottomPipe = (pair) => {
            const bottomPipeY = this.canvas.height - this.groundHeight - pair.bottomHeight;
            this.ctx.drawImage(this.pipeImg, 0, 0, pair.width, pair.bottomHeight, pair.x, bottomPipeY, pair.width, pair.bottomHeight);
        };
        this.drawBird = (tickCount, bird) => {
            const currentBirdStage = Math.floor(tickCount / this.BIRD_SPRITE_TICK_DIVISOR) %
                this.BIRD_SPRITE_STEPS;
            const birdTopLeftX = bird.x - this.SINGLE_BIRD_SPRITE_WIDTH / 2;
            const birdTopLeftY = bird.y - this.birdImg.height / 2;
            if (this.debug) {
                this.ctx.beginPath();
                this.ctx.arc(bird.x, bird.y, 35, 0, 2 * Math.PI);
                this.ctx.fill();
            }
            this.ctx.drawImage(this.birdImg, currentBirdStage * this.SINGLE_BIRD_SPRITE_WIDTH, 0, this.SINGLE_BIRD_SPRITE_WIDTH, this.birdImg.height, birdTopLeftX, birdTopLeftY, this.SINGLE_BIRD_SPRITE_WIDTH, this.birdImg.height);
        };
        this.drawScore = (score) => {
            const x = this.canvas.width / 2;
            const y = this.canvas.height / 6;
            const text = score.toString();
            this.ctx.textBaseline = "middle";
            this.ctx.textAlign = "center";
            this.ctx.fillStyle = "white";
            this.ctx.strokeStyle = "black";
            this.ctx.lineWidth = 5;
            this.ctx.fillText(text, x, y);
            this.ctx.strokeText(text, x, y);
        };
    }
    // Constructors cannot be async, so a static factory method must be used
    static create(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const { canvasId, groundHeight, groundVx, pipeSrc = "pipe.png", backgroundSrc = "background.png", groundSrc = "ground.png", birdSrc = "bird.png", fontSrc = "font.woff", debug = false, } = opts;
            const canvas = document.getElementById(canvasId);
            const ctx = canvas === null || canvas === void 0 ? void 0 : canvas.getContext("2d");
            if (canvas == null || ctx == null) {
                throw new Error(`Cannot get context of canvas element ${canvasId}`);
            }
            // Callback hell avoided using await; need to be in async function
            const backgroundImg = yield this.loadImage(backgroundSrc);
            const pipeImg = yield this.loadImage(pipeSrc);
            const groundImg = yield this.loadImage(groundSrc);
            const birdImg = yield this.loadImage(birdSrc);
            const view = new FlappyBirdBrowserView(canvas, ctx, groundHeight, groundVx, pipeImg, backgroundImg, groundImg, birdImg, debug);
            const font = yield new FontFace("flappyfont", `url(${fontSrc})`).load();
            document.fonts.add(font);
            ctx.font = view.CANVAS_TEXT_STYLING;
            canvas.addEventListener("click", view.jumpHandler);
            window.addEventListener("keypress", (ev) => {
                if (ev.key === " ")
                    view.jumpHandler();
            });
            window.requestAnimationFrame(view.tickHandler);
            return view;
        });
    }
    // Callback is wrapped in a Promise to avoid callback hell
    static loadImage(url) {
        const img = new Image();
        img.src = url;
        return new Promise((resolve) => {
            img.addEventListener("load", () => {
                return resolve(img);
            });
        });
    }
    addTickHandler(callback) {
        this.tickHandlers.push(callback);
    }
    addJumpHandler(callback) {
        this.jumpHandlers.push(callback);
    }
}
class PipeDeleter {
    deleteOutOfBoundPipes(pairs) {
        return pairs.filter((pair) => pair.x + pair.width >= 0);
    }
}
class MovementHandler {
    moveGameObjects(gameState) {
        const bird = gameState.bird;
        const pairs = gameState.pipePairs;
        return Object.assign(Object.assign({}, gameState), { bird: Object.assign(Object.assign({}, bird), { y: bird.y + bird.vy + bird.ay, vy: bird.vy + bird.ay }), pipePairs: pairs.map((pair) => (Object.assign(Object.assign({}, pair), { x: pair.x + pair.vx }))) });
    }
}
class CollisionDetector {
    isGameOver(gameState) {
        return this.hasCollidedWithAny(gameState.bird, gameState.pipePairs, gameState.screenHeight, gameState.groundHeight);
    }
    hasCollidedWithAny(bird, pairs, screenHeight, groundHeight) {
        // FIXME: Implement this
        for (var i = 0; i < pairs.length; i++) {
            // top pipe
            if (this.hasCollidedWith(bird, pairs[i].x + (pairs[i].width / 2), pairs[i].topHeight / 2, pairs[i].width, pairs[i].topHeight)) {
                return true;
            }
            // bottom pipe
            if (this.hasCollidedWith(bird, pairs[i].x + (pairs[i].width / 2), (screenHeight - groundHeight) - pairs[i].bottomHeight / 2, pairs[i].width, pairs[i].bottomHeight)) {
                return true;
            }
        }
        return false;
    }
    hasCollidedWith(bird, pipeX, pipeY, pipeWidth, pipeHeight) {
        // FIXME: Implement this
        const birdDistanceX = Math.abs(bird.x - pipeX);
        const birdDistanceY = Math.abs(bird.y - pipeY);
        const radiusBird = 35;
        if (birdDistanceX > (pipeWidth / 2 + radiusBird)) {
            return false;
        }
        if (birdDistanceY > (pipeHeight / 2 + radiusBird)) {
            return false;
        }
        if (birdDistanceX <= (pipeWidth / 2)) {
            return true;
        }
        if (birdDistanceY <= (pipeHeight / 2)) {
            return true;
        }
        const cornerDistance_sq = Math.pow(birdDistanceX - pipeWidth / 2, 2) +
            Math.pow(birdDistanceY - pipeHeight / 2, 2);
        return (cornerDistance_sq <= Math.pow(radiusBird, 2));
        //return false;
    }
}
class OutOfBoundsDetector {
    isGameOver(gameState) {
        return this.isOutOfBounds(gameState.bird, gameState.screenHeight, gameState.groundHeight);
    }
    isOutOfBounds(bird, screenHeight, groundHeight) {
        const birdBottom = bird.y + bird.height / 2;
        const maxBirdBottom = screenHeight - groundHeight;
        return birdBottom > maxBirdBottom;
    }
}
class GameOverDecider {
    constructor(detectors) {
        this.detectors = [...detectors];
    }
    static createDefault() {
        return new GameOverDecider([
            new CollisionDetector(),
            new OutOfBoundsDetector(),
        ]);
    }
    isGameOver(gameState) {
        return this.detectors.some((detector) => detector.isGameOver(gameState));
    }
}
class ScoreManager {
    constructor() {
        this._score = 0;
    }
    get score() {
        // FIXME: Implement this
        // should return the stored score field
        return this._score;
        // return 0;
    }
    updateScoreIfNeeded(previousGameState, currentGameState) {
        // FIXME: Implement this
        // should call shouldUpdateScore and increment the stored score field by 1 if it returns true
        if (this.shouldUpdateScore(previousGameState, currentGameState)) {
            this._score++;
        }
    }
    shouldUpdateScore(previousGameState, currentGameState) {
        // FIXME: Implement this
        // should return a boolean indicating whether the 
        // bird passed through the center of a pipe pair between the previous 
        // and current states of the game
        for (var i = 0; i < previousGameState.pipePairs.length; i++) {
            const centerpipe_prev = previousGameState.pipePairs[i].x + previousGameState.pipePairs[i].width / 2;
            const centerpipe_curr = currentGameState.pipePairs[i].x + currentGameState.pipePairs[i].width / 2;
            if (previousGameState.bird.x < centerpipe_prev && centerpipe_curr <= currentGameState.bird.x) {
                return true;
            }
        }
        return false;
    }
    reset() {
        this._score = 0;
    }
}
class PipeGenerator {
    constructor(ticksPerGeneration, holeHeight, minPipeHeight) {
        this.ticksPerGeneration = ticksPerGeneration;
        this.holeHeight = holeHeight;
        this.minPipeHeight = minPipeHeight;
    }
    gameTick(tickCount, gameState) {
        return tickCount % this.ticksPerGeneration === 0
            ? this.generatePipePair(gameState)
            : null;
    }
    generatePipePair(gameState) {
        const heightFromTopToGround = gameState.screenHeight - gameState.groundHeight;
        const totalPipeHeight = heightFromTopToGround - this.holeHeight;
        const maxSinglePipeHeight = totalPipeHeight - this.minPipeHeight;
        const topPipeHeight = this.randomInt(this.minPipeHeight, maxSinglePipeHeight);
        const bottomPipeHeight = totalPipeHeight - topPipeHeight;
        return {
            x: gameState.screenWidth,
            width: gameState.pipeWidth,
            topHeight: topPipeHeight,
            bottomHeight: bottomPipeHeight,
            vx: gameState.pipeVx,
        };
    }
    randomInt(min, max) {
        const range = max - min + 1;
        return Math.floor(Math.random() * range) + min;
    }
}
class FlappyBirdModel {
    constructor(opts) {
        this.opts = Object.assign({}, opts);
        this._gameState = this.makeGameState(opts);
        this._previousGameState = this._gameState;
    }
    makeGameState(opts) {
        return {
            tickCount: 0,
            screenWidth: opts.screenWidth,
            screenHeight: opts.screenHeight,
            groundHeight: opts.groundHeight,
            pipeWidth: opts.pipeWidth,
            pipeVx: opts.pipeVx,
            pipePairs: [],
            score: 0,
            bird: {
                x: opts.screenWidth / 2,
                y: opts.screenHeight / 2,
                width: opts.birdWidth,
                height: opts.birdHeight,
                vy: 0,
                ay: opts.birdAy,
            },
        };
    }
    static createDefault() {
        const FPS = 60;
        const secondsPerGeneration = 2;
        const ticksPerGeneration = FPS * secondsPerGeneration;
        const holeHeight = 230;
        const minPipeHeight = 100;
        const opts = {
            screenWidth: 600,
            screenHeight: 800,
            groundHeight: 128,
            birdWidth: 92,
            birdHeight: 64,
            pipeWidth: 138,
            pipeVx: -3,
            birdAy: 0.5,
            gameOverDecider: GameOverDecider.createDefault(),
            movementHandler: new MovementHandler(),
            scoreManager: new ScoreManager(),
            pipeGenerator: new PipeGenerator(ticksPerGeneration, holeHeight, minPipeHeight),
            pipeDeleter: new PipeDeleter(),
        };
        return new FlappyBirdModel(opts);
    }
    gameTick() {
        if (!this.isGameOver()) {
            const newPipePair = this.opts.pipeGenerator.gameTick(this.gameState.tickCount, this._gameState);
            if (newPipePair !== null) {
                this._gameState.pipePairs.push(newPipePair);
            }
            const newGameState = this.opts.movementHandler.moveGameObjects(this.gameState);
            this.opts.scoreManager.updateScoreIfNeeded(this._previousGameState, newGameState);
            this._gameState = Object.assign(Object.assign({}, newGameState), { pipePairs: this.opts.pipeDeleter.deleteOutOfBoundPipes(newGameState.pipePairs), score: this.opts.scoreManager.score });
        }
        this._previousGameState = this._gameState;
        this._gameState = Object.assign(Object.assign({}, this.gameState), { tickCount: this._gameState.tickCount + 1 });
    }
    triggerJump() {
        this._gameState.bird.vy = -12;
    }
    reset() {
        this._gameState = this.makeGameState(this.opts);
        this._previousGameState = this._gameState;
        this.opts.scoreManager.reset();
    }
    isGameOver() {
        return this.opts.gameOverDecider.isGameOver(this.gameState);
    }
    get gameState() {
        // Defensive copy; expensive
        return JSON.parse(JSON.stringify(this._gameState));
    }
}
class FlappyBirdPresenter {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.handleTick = () => {
            if (this.model.isGameOver()) {
                this.view.pauseTicking();
            }
            else {
                this.model.gameTick();
                const gameState = this.model.gameState;
                this.view.redraw(gameState.tickCount, gameState.pipePairs, gameState.bird, gameState.score);
            }
        };
        this.handleJump = () => {
            if (this.model.isGameOver()) {
                this.model.reset();
                this.view.unpauseTicking();
            }
            else {
                this.model.triggerJump();
            }
        };
        this.view.addTickHandler(this.handleTick);
        this.view.addJumpHandler(this.handleJump);
    }
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const model = FlappyBirdModel.createDefault();
        const view = yield FlappyBirdBrowserView.create({
            canvasId: "flappy-canvas",
            groundHeight: 128,
            groundVx: -3,
            //debug: true,
        });
        new FlappyBirdPresenter(model, view);
    });
}
main();
