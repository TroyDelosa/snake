const canvas = document.querySelector('#sprites');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 800;

let score = 0;
let segments = [];
let currentFrame = 0;
let lastKey;
let gameOver = false;

const spriteSize = 8;
const cellSize = 40;
const refreshRate = 200;

const bgCanvas = document.createElement('canvas');
const bgCtx = bgCanvas.getContext('2d');
bgCanvas.width = cellSize;
bgCanvas.height = cellSize;
const sprites = new Image();
sprites.src = './Sprites.png';
let bgPattern;


sprites.onload = () => {
  bgCtx.imageSmoothingEnabled = false;
  bgCtx.drawImage(sprites, 0, 6*spriteSize, spriteSize, spriteSize, 0, 0, cellSize, cellSize);
  bgPattern = ctx.createPattern(bgCanvas, "repeat");

  ctx.fillStyle = bgPattern;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  animate();
}

class Sprite {
  constructor({ position, spritePosition }) {
    this.position = position;
    this.spritePosition = spritePosition;
  }

  draw() {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      sprites,
      0,
      this.spritePosition*spriteSize,
      spriteSize,
      spriteSize,
      this.position.x, 
      this.position.y, 
      cellSize, 
      cellSize
    )
  }
}

class Food extends Sprite {
  generate() {
    let positions = segments.map(segment => {
      return segment.position;
    })

    let availablePositions = grid.filter(gridPosition => {
      return positions.find(position => {
        return position.x == gridPosition.x && position.y == gridPosition.y;
      }) === undefined;
    })

    this.position = availablePositions[Math.floor(Math.random() * availablePositions.length)];
    this.draw();
  }
}

class Segment extends Sprite {
  constructor ({ position, spritePosition, rotation, lastRotation, lastPosition, scale = {x: 1, y: 1 }}) {
    super({ position, spritePosition });
    this.rotation = rotation;
    this.lastRotation = lastRotation;
    this.lastPosition = lastPosition;
    this.scale = scale;
  }

  // rotateImage(degrees) {
  //   rotation = degrees*Math.PI/180;
  //   ctx.setTransform(scale, 0, 0, scale, x+w/2, y+h/2);
  //   ctx.rotate(rotation);
    
  //   ctx.fillRect(-w/2, -h/2, w, h);

  //   ctx.drawImage()
  //   ctx.drawImage(
  //     sprites,
  //     0+(spriteSize*currentFrame),
  //     this.spritePosition,
  //     -spriteSize/2,
  //     -spriteSize/2,
  //     this.position.x, 
  //     this.position.y, 
  //     cellSize, 
  //     cellSize
  //   )
  //   //ctx.drawImage(image, -image.width / 2, -image.height / 2);
  // }

  draw() {
    ctx.imageSmoothingEnabled = false;
    ctx.scale(this.scale.x, this.scale.y);
    ctx.translate(this.position.x+cellSize/2, this.position.y+cellSize/2);
    ctx.rotate(this.rotation*Math.PI/180);
    ctx.translate(-this.position.x-cellSize/2, -this.position.y-cellSize/2);
    ctx.drawImage(
      sprites,
      0+(spriteSize*currentFrame),
      this.spritePosition*spriteSize,
      spriteSize,
      spriteSize,
      this.position.x, 
      this.position.y, 
      cellSize, 
      cellSize
    )
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  update (before) {
    this.lastPosition = {...this.position};
    this.position = {...before.lastPosition};
    this.lastRotation = this.rotation;
    this.rotation = before.lastRotation;


    if(before.position.x != this.lastPosition.x && before.position.y != this.lastPosition.y ) {
      if(
        this.lastRotation - this.rotation == -90
        || this.lastRotation - this.rotation == 270
      ) {
        this.spritePosition = 1;
      }
      else if(
        this.lastRotation - this.rotation == 90
        || this.lastRotation - this.rotation == -270
      ) {
        this.spritePosition = 8;
      }
    }
    else {
      this.spritePosition = 2;
    }

    if(segments.findIndex(segment => segment === this) == segments.length-1) {
      this.spritePosition = 3;
    }
    this.draw();
  }
}

class Head extends Segment {
  constructor ({ position, spritePosition, rotation, lastRotation, lastPosition, scale, velocity }) {
    super({ position, spritePosition, rotation, lastRotation, lastPosition, scale });
    this.velocity = velocity;

    let xPos = Math.floor(Math.random() * canvas.width);
    let yPos = Math.floor(Math.random() * canvas.height)
    this.position = {
      x: xPos - xPos % cellSize,
      y: yPos - yPos % cellSize
    }
  }

  update () {
    player.lastRotation = player.rotation;
    this.lastPosition.x = this.position.x;
    this.lastPosition.y = this.position.y;
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    //Wrap Screen
    if(this.position.x < 0 && this.velocity.x < 0) {
      this.position.x = canvas.width - cellSize;
    }
    if(this.position.x > canvas.width - cellSize && this.velocity.x > 0) {
      this.position.x = 0;
    }
    if(this.position.y < 0 && this.velocity.y < 0) {
      this.position.y = canvas.height - cellSize;
    }
    if(this.position.y > canvas.height - cellSize && this.velocity.y > 0) {
      this.position.y = 0;
    }

    if(segments.length < 2) {
      this.spritePosition = 4;
    }
    else {
      this.spritePosition = 0;
    }

    this.draw();
  }
}

const player = new Head({
  position: {
    x: cellSize,
    y: cellSize
  },
  spritePosition: 0,
  rotation: 0,
  lastRotation: 0,
  lastPosition: {
    x: 0,
    y: 0
  },
  velocity: {
    x: 0,
    y: 0
  }
});

segments.push(player);

const grid = [];

for (let y = 0; cellSize * y < canvas.height; y++) {
  for (let x = 0; cellSize * x < canvas.width; x++) {
    grid.push({x: cellSize * x, y: cellSize * y})
  }
}

const food = new Food({
  position: {
    x: 0,
    y: 0
  },
  spritePosition: 5
})

player.draw();
food.generate();

function animate() {
  setTimeout(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = bgPattern;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    //Score
    ctx.font = "40px Arial";
    ctx.fillStyle = 'black';
    ctx.fillText(score, canvas.width-50, 50);

    window.requestAnimationFrame(animate);

    if(gameOver) {
      ctx.font = "100px Arial";
      ctx.fillStyle = 'black';
      ctx.fillText('DEAD', canvas.width/2-100, canvas.height/2);
    }
    else {
      //Keys Pressed
      if(lastKey === 'a' && player.velocity.x == 0) {
        player.velocity = {x: -cellSize, y: 0};
        player.rotation = 270;
      }

      if(lastKey === 'd' && player.velocity.x == 0) {
          player.velocity = {x: cellSize, y: 0};
          player.rotation = 90;
      }

      if(lastKey === 's' && player.velocity.y == 0) {
          player.velocity = {x: 0, y: cellSize};
          player.rotation = 180;
      }

      if(lastKey === 'w' && player.velocity.y == 0) {
          player.velocity = {x: 0, y: -cellSize};
          player.rotation = 0;
      }

      //Eating food
      if(player.position.x == food.position.x && player.position.y == food.position.y) {
        score++;
        food.generate();
        const newSegment = new Segment({
          position: {
            x: segments.at(-1).position.x,
            y: segments.at(-1).position.y
          },
          lastPosition: {
            x: segments.at(-1).position.x,
            y: segments.at(-1).position.y
          },
          spritePosition: 3,
          rotation: segments.at(-1).rotation,
          lastRotation: segments.at(-1).lastRotation
        });
        newSegment.draw();
        segments.push(newSegment);
      }

      food.draw();

      // Segment movement
      segments.forEach((segment, index) => {
        if(index > 1 && player.position.x == segment.position.x && player.position.y == segment.position.y) {
          gameOver = true;
        }
        
        if(index != 0) {
          segment.update(segments.at(index-1));
        }
        else {
          segment.update();
        }
      })


    }

    
    currentFrame = currentFrame == 0 ? 1 : 0;
    
  }, refreshRate);
}

window.addEventListener('keydown', (event) => {
  switch (event.key) {
    case 'd':
    case 'ArrowRight':
      lastKey = 'd';
    break;
    case 'a':
    case 'ArrowLeft':
      lastKey = 'a';
    break;
    case 's':
    case 'ArrowDown':
      lastKey = 's';
    break;
    case 'w':
    case 'ArrowUp':
      lastKey = 'w';
    break;
  }
})