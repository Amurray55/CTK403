// //detect if game is played on mobile or not
let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) {
    // This is an iPad running iPadOS 13+
    isMobile = true;
}

let collectibles = [];
let numCollectibles = 15;
let numCollected = 0;
let playerPos;
let playerSize = 30;
let playerSpeed = 3;
let playerLoop = true; // true=loops around edges of canvas, false=stops
let song1, song2, song3, song4, song5;
let sumo1, sumo2, sumo3, sumo4, sushi, menu, winner, loser, gameScreen;
let currentSong = null;
//creating buttons
let startButton;
let pauseButton;
let gamePaused = false;//adding a game pause button
let soundButton;
let soundOn = false; // Main menu sound button
let loseMusicStopped = false;
//adding touch for mobile devices
let touchStartX, touchStartY;
let upButton, downButton, leftButton, rightButton;

// Device orientation variables
let tiltX = 0;
let tiltY = 0;

//fonts
let f1, f2;
//game management( levels and timer)
let timeLimit = 25;
let timer = 0;
let state = 0; // 0 = menu, 1= game, 2= level complete, 3=lose, 4 =final win
let level = 1; // each time the player wins, make it harder!

function preload() {
    //load font
    f1 = loadFont('assets/SuperFolks.ttf');
    f2 = loadFont('assets/LovelyFace.otf');

    //load songs
    song1 = loadSound('assets/cozycoffeehouse.mp3');
    song2 = loadSound('assets/pianomoment.mp3');
    song3 = loadSound('assets/dance.mp3');
    song4 = loadSound('assets/dubstep.mp3');
    song5 = loadSound('assets/theduel.mp3');

    sumo1 = loadImage('assets/sumo1v2.png');
    sumo2 = loadImage('assets/Sumo2v2.png');
    sumo3 = loadImage('assets/Sumo3v2.png');
    sumo4 = loadImage('assets/SumoWinv2.png');
    sushi = loadImage('assets/sushiv2.png');
    winner = loadImage('assets/Winner.jpeg');
    loser = loadImage('assets/loser.jpeg');
    gameScreen = loadImage('assets/gamescreen.jpeg');
    menu = loadImage('assets/Menuscreen.jpeg');

}

function setup() {


    let cnv = createCanvas(500, 300);
    cnv.id('canvas1');
    textSize(25);
    playerPos = createVector(200, 200);



    // Device orientation event listener only on mobile
    if (isMobile) {
        window.addEventListener('deviceorientation', (event) => {
            // event.beta is front-back tilt (x-axis), event.gamma is left-right tilt (y-axis)
            tiltX = event.gamma || 0;  // left-right tilt [-90,90]
            tiltY = event.beta || 0;   // front-back tilt [-180,180]
        });
    }

    soundButton = createButton("🔇");
    soundButton.position(20, height - 40);
    soundButton.mousePressed(toggleSound);

    pauseButton = createButton("⏸ Pause");
    pauseButton.position(width - 90, 10);
    pauseButton.mousePressed(togglePause);
    pauseButton.hide();

    //startButton = createButton("Click to EAT!");
    //startButton.position(width / 3, 250);
    //startButton.mousePressed(() => {
    //level = 1;
    //resetGame();
    //state = 1;
    //startButton.hide();
    //soundButton.hide();
    //});

    startButton = createButton("Click to EAT!");
    startButton.position(width / 3, 250);
    startButton.mousePressed(() => {
        state = 6; // go to instructions screen first
        startButton.hide();
        soundButton.hide();
    });



}

function resetGame() {
    collectibles = []; // clear any remaining collectibles (enemies too if implemented)

    // Adjust difficulty based on level
    if (level === 1) {
        numCollectibles = 15;
        playerSize = 30;
        playerSpeed = 3;
        timeLimit = 30;
    } else if (level === 2) {
        numCollectibles = 20;
        playerSize = 50;
        playerSpeed = 2;
        timeLimit = 25;
    } else if (level === 3) {
        numCollectibles = 25;
        playerSize = 70;
        playerSpeed = 1.5;
        timeLimit = 25;
    }

    for (let i = 0; i < numCollectibles; i++) {
        collectibles.push(new collectible());
    }
    numCollected = 0;
    timer = 0;
    // spawn player in middle
    playerPos.x = width / 2;
    playerPos.y = height / 2;

    stopAllSongs(); // stop any other songs before playing a new one

    if (level === 1) {
        song2.loop();
        currentSong = song2;
    } else if (level === 2) {
        song3.loop();
        currentSong = song3;
    } else if (level === 3) {
        song4.loop();
        currentSong = song4;
    }
}

function draw() {
    switch (state) {
        case 0:
            soundButton.show();
            pauseButton.hide();
            startButton.show();
            mainMenu();
            break;
        case 6:
            showInstructions();
            break;
        case 1:
            soundButton.hide();
            pauseButton.show();
            startButton.hide();
            game();
            break;
        case 2:
            levelCompleteScreen(); // Shows message, music has stopped
            handleMovementInput();
            break;
        case 3:
            if (!loseMusicStopped) {
                stopAllSongs();
                loseMusicStopped = true;
            }
            loseScreen();
            break;
        case 4:
            winScreen();
            break;
        case 5:
            soundButton.hide();
            pauseButton.hide();
            startButton.hide();
            break;


    }
}

function mainMenu() {
    background(menu);

    // Play menu music ONLY if sound is toggled on
    if (soundOn && (!song1.isPlaying())) {
        stopAllSongs(); // stop any other songs first
        song1.loop();
        currentSong = song1;
    }

    textFont(f1);
    textAlign(LEFT);
    textWrap(WORD);
    textSize(25);
    stroke(0);
    strokeWeight(5);
    fill('purple');
    text("Main Menu \n \n Tim is a new Sumo wrestler. \nHe needs to gain weight \nto get ready for his next Sumo Match. \nHelp Tim eat!", 20, 50);

    startButton.show();

}

function game() {
    background(gameScreen);

    let currentSumo = sumo1;
    if (level === 2) currentSumo = sumo2;
    if (level === 3) currentSumo = sumo3;

    image(currentSumo, playerPos.x, playerPos.y, playerSize + 20, playerSize + 20);

    if (!gamePaused) {
        // On mobile, move player based on tilt
        if (isMobile) {
            if (isMobile) {
                handleMovementInput(); // handle touch zones
            }

            // Map tiltX [-30,30] roughly to player speed in x
            let mappedX = map(tiltX, -30, 30, -playerSpeed, playerSpeed);
            let mappedY = map(tiltY, 30, -30, -playerSpeed, playerSpeed); // invert Y so tilting forward moves up

            playerPos.x += mappedX;
            playerPos.y += mappedY;

            // Wrap or stop at edges
            if (playerPos.x < 0) playerLoop ? (playerPos.x = width) : (playerPos.x = 0);
            if (playerPos.x > width) playerLoop ? (playerPos.x = 0) : (playerPos.x = width);
            if (playerPos.y < 0) playerLoop ? (playerPos.y = height) : (playerPos.y = 0);
            if (playerPos.y > height) playerLoop ? (playerPos.y = 0) : (playerPos.y = height);
        } else {
            // Desktop keyboard controls
            checkForKeys();
        }

        for (let i = collectibles.length - 1; i >= 0; i--) {
            collectibles[i].display();
            collectibles[i].move();

            if (collectibles[i].pos.dist(playerPos) < playerSize) {
                collectibles.splice(i, 1);
                numCollected++;
                if (collectibles.length == 0) {
                    if (level < 3) {
                        stopAllSongs(); // Stop music only on level complete screen
                        state = 2;       // Go to level complete screen
                    } else {
                        state = 4;       // Final win screen (skip levelComplete)
                    }
                }
            }
        }
        timer++;
    } else {
        // Draw collectibles without updating
        for (let i = 0; i < collectibles.length; i++) {
            collectibles[i].display();
        }

        // Dim screen and show "PAUSED"
        push();
        fill(0, 0, 0, 150); // pause overlay
        rect(0, 0, width, height);

        textFont(f2);
        textAlign(CENTER, CENTER);
        fill('white');
        textSize(48);
        text("PAUSED", width / 2, height / 2);
        pop();
    }


    // Display info even if paused
    push();
    textFont(f1);
    stroke(0);
    strokeWeight(5);
    fill('purple');
    text(numCollected, 200, 50);
    text(int(timer / 60), 50, 50);
    pop();

    if (timer > timeLimit * 60) {
        state = 3;
    }
}

function levelCompleteScreen() {
    background(255);
    textFont(f2);
    fill('green');
    textSize(32);
    textAlign(CENTER, CENTER);
    text("Level " + level + " Complete!", width / 2, height / 2 - 20);
    textSize(20);
    text("Click to continue to Level " + (level + 1), width / 2, height / 2 + 30);
}

function winScreen() {
    background(winner);

    push();
    imageMode(CENTER);
    let imgWidth = sumo4.width * 0.7;
    let imgHeight = sumo4.height * 0.7;
    image(sumo4, width / 2, height / 2 - 35, imgWidth, imgHeight);
    pop();

    push();
    textFont(f2);
    fill('purple');
    textSize(30);
    stroke(0);
    textAlign(CENTER);
    textWrap(WORD);
    text("Winner! Tim made weight!", 50, 250, width - 75);
    textSize(15);
    text("Click to restart", width / 2 - 175, height / 2 - 65);
    pop();

    if (level === 3 && state === 4) {
        currentSong.stop();
    }
}

function loseScreen() {
    stopAllSongs();
    background(255);
    fill(0);

    push();
    imageMode(CENTER);
    scale(0.125);
    image(loser, (width / 2) / 0.125, 200 / 0.125);
    pop();

    push();
    textFont(f2);
    fill('purple');
    textSize(30);
    stroke(0);
    textAlign(CENTER, CENTER);
    text("Lose! Tim didn't eat enough!", width / 2, height / 2 - 100);
    text("Click to restart", width / 2, height / 2 + 100);
    pop();


}

//function to toggle sound on and off with button
function toggleSound() {
    if (!soundOn) {
        // Turn sound ON: resume current song from pause
        if (currentSong && !currentSong.isPlaying()) {
            currentSong.play();
        }
        soundButton.html("🔊");
        soundOn = true;
    } else {
        // Turn sound OFF: pause any currently playing song
        if (currentSong && currentSong.isPlaying()) {
            currentSong.pause();
        }
        soundButton.html("🔇");
        soundOn = false;
    }
}

//toggle the game for play and pause
function togglePause() {
    gamePaused = !gamePaused;
    pauseButton.html(gamePaused ? "▶" : "⏸ Pause");
    print("Paused:", gamePaused, "CurrentSong:", currentSong ? "yes" : "no");
    if (currentSong) {
        if (gamePaused && currentSong.isPlaying()) {
            currentSong.pause();
        } else if (!gamePaused && !currentSong.isPlaying()) {
            currentSong.play();
        }
    }
}

function checkForKeys() {
    if (isMobile) {
        handleMovementInput(); // Allow finger-movement regions
    }
    if (keyIsDown(LEFT_ARROW)) {
        playerPos.x -= playerSpeed;
        if (playerPos.x < 0) {
            playerLoop ? (playerPos.x = width) : (playerPos.x = 0);
        }
    }
    if (keyIsDown(RIGHT_ARROW)) {
        playerPos.x += playerSpeed;
        if (playerPos.x > width) {
            playerLoop ? (playerPos.x = 0) : (playerPos.x = width);
        }
    }
    if (keyIsDown(UP_ARROW)) {
        playerPos.y -= playerSpeed;
        if (playerPos.y < 0) {
            playerLoop ? (playerPos.y = height) : (playerPos.y = 0);
        }
    }
    if (keyIsDown(DOWN_ARROW)) {
        playerPos.y += playerSpeed;
        if (playerPos.y > height) {
            playerLoop ? (playerPos.y = 0) : (playerPos.y = height);
        }
    }
}

class collectible {
    // The class's constructor and attributes
    constructor() {
        this.pos = createVector(100, random(50, height - 50));
        this.size = 25;
        this.r = 255;
        this.g = 0;
        this.b = 0;
        this.o = 100;

        this.xSpeed = random(-5, 5) * level;
        this.ySpeed = random(-5, 5) * level;
    }

    // methods - these get called with a dot after the variable

    display() {
        image(sushi, this.pos.x, this.pos.y, this.size * 1.5, this.size);
    }

    move() {
        this.pos.x = this.pos.x + this.xSpeed;
        this.pos.y = this.pos.y + this.ySpeed;
        if (this.pos.x > width) this.pos.x = 0;
        if (this.pos.x < 0) this.pos.x = width;
        if (this.pos.y > height) this.pos.y = 0;
        if (this.pos.y < 0) this.pos.y = height;
    }

}

function mousePressed() {
    userStartAudio(); // REQUIRED for sound
    if (state === 2) {
        level++;
        resetGame();
        state = 1;
    } else if (state === 3 || state === 4) {
        stopAllSongs();
        state = 0;
        level = 1;
    } else if (state === 6) {
        level = 1;
        resetGame();
        state = 1;
        return false;
    }
}

function movePlayer(direction) {
    switch (direction) {
        case "LEFT":
            playerPos.x -= playerSpeed;
            if (playerPos.x < 0) playerLoop ? (playerPos.x = width) : (playerPos.x = 0);
            break;
        case "RIGHT":
            playerPos.x += playerSpeed;
            if (playerPos.x > width) playerLoop ? (playerPos.x = 0) : (playerPos.x = width);
            break;
        case "UP":
            playerPos.y -= playerSpeed;
            if (playerPos.y < 0) playerLoop ? (playerPos.y = height) : (playerPos.y = 0);
            break;
        case "DOWN":
            playerPos.y += playerSpeed;
            if (playerPos.y > height) playerLoop ? (playerPos.y = 0) : (playerPos.y = height);
            break;
    }
}

//stop all songs playing
function stopAllSongs() {
    let songs = [song1, song2, song3, song4, song5];
    for (let s of songs) {
        if (s.isPlaying()) s.stop();
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function handleMovementInput() {
    if (!playerPos) return;

    // Only if mouse is pressed or touchscreen has touches
    if (mouseIsPressed || touches.length > 0) {
        let px = mouseX;
        let py = mouseY;

        // For touch devices, use touches[0]
        if (touches.length > 0) {
            px = touches[0].x;
            py = touches[0].y;
        }

        // Split screen regions
        if (py < height / 2 && px > width / 4 && px < width * 3 / 4) {
            // Top middle = UP
            playerPos.y -= playerSpeed;
        } else if (py > height / 2 && px > width / 4 && px < width * 3 / 4) {
            // Bottom middle = DOWN
            playerPos.y += playerSpeed;
        } else if (px < width / 2 && py > height / 4 && py < height * 3 / 4) {
            // Left middle = LEFT
            playerPos.x -= playerSpeed;
        } else if (px > width / 2 && py > height / 4 && py < height * 3 / 4) {
            // Right middle = RIGHT
            playerPos.x += playerSpeed;
        }

    }

    // Optional: Draw transparent overlay zones
    noStroke();
    fill(255, 255, 255, 30); // white transparent

    rect(width / 4, 0, width / 2, height / 2); // UP
    rect(width / 4, height / 2, width / 2, height / 2); // DOWN
    rect(0, height / 4, width / 2, height / 2); // LEFT
    rect(width / 2, height / 4, width / 2, height / 2); // RIGHT
    console.log("Touches:", touches);
}
function touchStarted() {

    if (state === 6) {
        level = 1;
        resetGame();
        state = 1;
        return false;
    }

    if (touches.length > 0) {
        let tx = touches[0].x;
        let ty = touches[0].y;

        // Toggle sound (bottom left)
        if (dist(tx, ty, 50, height - 50) < 25) {
            // use your existing soundOn & currentSong
            soundOn = !soundOn;
            if (soundOn) {
                if (currentSong && !currentSong.isPlaying()) currentSong.loop();
                soundButton.html("🔊");
            } else {
                if (currentSong && currentSong.isPlaying()) currentSong.pause();
                soundButton.html("🔇");
            }

        }

        // Toggle pause (top right)
        if (dist(tx, ty, width - 50, 50) < 25) {
            gamePaused = !gamePaused;
            // update your pause button text
            pauseButton.html(gamePaused ? "▶" : "⏸ Pause");
            // pause or resume the music
            if (currentSong) {
                if (gamePaused && currentSong.isPlaying()) currentSong.pause();
                else if (!gamePaused && !currentSong.isPlaying()) currentSong.play();
            }
        }
    }
    // Return false so P5 doesn’t also fire mousePressed
    return false;
}

function showInstructions() {
    console.log("Showing instructions screen");
    background(50);
    fill(255);
    textAlign(CENTER);
    textFont(f1);
    textSize(28);
    text("How to Play", width / 2, 50);
    textSize(18);

    if (isMobile) {
        text("Mobile Controls:\nTilt your device or tap on the screen\nTop = Up, Bottom = Down\nLeft = Left, Right = Right", width / 2, 120);
    } else {
        text("Desktop Controls:\nUse Arrow Keys to move\nCollect all the sushi before time runs out!", width / 2, 120);
    }

    text("\nPress anywhere to start!", width / 2, height - 50);
}