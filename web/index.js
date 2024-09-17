// Configuration
SERIAL_BAUD_RATE = 115200;
const CONFIG = {
  PX_RATIO: 2, // Pixel to millimeter conversion ratio
  PAGE: {
    WIDTH_MM: 210,
    HEIGHT_MM: 297,
  },
  MOTOR: {
    PULLEY_RADIUS_MM: 8.5,
    PULSES_PER_REVOLUTION: 4095,
  },
  IDLER: {
    RADIUS_MM: 3,
  },
};

// Utility functions
const mmToPx = (mm) => mm * CONFIG.PX_RATIO;
const pxToMm = (px) => px / CONFIG.PX_RATIO;

class Page {
  constructor() {
    this.width = mmToPx(CONFIG.PAGE.WIDTH_MM);
    this.height = mmToPx(CONFIG.PAGE.HEIGHT_MM);
    this.position = createVector(width / 2, height / 2 + 50);
  }

  show() {
    push();
    drawingContext.setLineDash([5, 10]);
    stroke(0);
    noFill();
    rect(this.position.x, this.position.y, this.width, this.height);
    drawingContext.setLineDash([]);
    pop();
  }
}

class Motor {
  static DIRECTION = {
    CLOCKWISE: -1,
    COUNTERCLOCKWISE: 1,
  };

  constructor(x, y, direction, idler) {
    this.placement = createVector(x, y);
    this.idler = idler;
    this.pulses = 0;
    this.pulseOffset = 0;
    this.direction = direction;
    this.pulleyRadius = mmToPx(CONFIG.MOTOR.PULLEY_RADIUS_MM);
    this.stepSize = (2 * Math.PI) / CONFIG.MOTOR.PULSES_PER_REVOLUTION;
  }

  penPosToPulses(penPosition) {
    return this.direction *
      Math.round(
        this.idler.distToPen(penPosition) /
        (this.stepSize * this.pulleyRadius),
      ) -
      this.pulseOffset;
  }

  reset(penPosition) {
    this.pulseOffset += this.penPosToPulses(penPosition)
    this.pulses = 0;
  }

  getAngle() {
    return (this.pulses * this.stepSize) % (2 * Math.PI);
  }

  show() {
    this.drawMotorBody();
    this.drawIndicator();
    this.drawLabel();
    this.idler.draw();
    this.displayInfo();
  }

  drawMotorBody() {
    push();
    fill(220);
    stroke(0);
    circle(this.placement.x, this.placement.y, this.pulleyRadius * 4);
    fill(150);
    circle(this.placement.x, this.placement.y, this.pulleyRadius * 2);
    pop();
  }

  drawIndicator() {
    push();
    noFill();
    stroke(0);
    const angle = this.getAngle();
    circle(
      this.placement.x + this.pulleyRadius * 1.5 * cos(angle),
      this.placement.y + this.pulleyRadius * 1.5 * sin(angle),
      this.pulleyRadius / 2,
    );
    pop();
  }

  drawLabel() {
    push();
    textFont("monospace");
    textAlign(CENTER, CENTER);
    fill(0);
    noStroke();
    textSize(pxToMm(this.pulleyRadius));
    text(
      `R${CONFIG.MOTOR.PULLEY_RADIUS_MM}`,
      this.placement.x,
      this.placement.y,
    );
    pop();
  }

  displayInfo() {
    push();
    textFont("monospace");
    fill(0);
    noStroke();
    textSize(12);
    textAlign(this.direction === Motor.DIRECTION.CLOCKWISE ? LEFT : RIGHT);
    const xOffset =
      this.direction === Motor.DIRECTION.CLOCKWISE
        ? this.pulleyRadius * 3
        : -this.pulleyRadius * 3;
    text(
      `θ: ${degrees(this.getAngle()).toFixed(1)}°`,
      this.placement.x + xOffset,
      this.placement.y - this.pulleyRadius + 15,
    );
    text(
      `Pulses: ${this.pulses}`,
      this.placement.x + xOffset,
      this.placement.y - this.pulleyRadius + 30,
    );
    pop();
  }
}

class Idler {
  constructor(x, y) {
    this.position = createVector(x, y);
    this.radius = mmToPx(CONFIG.IDLER.RADIUS_MM);
  }

  distToPen(penPosition) {
    return p5.Vector.dist(this.position, penPosition);
  }

  draw() {
    this.drawString();
    this.drawLengthLabel();
    this.drawIdler();
  }

  drawString() {
    push();
    stroke(180);
    line(
      this.position.x,
      this.position.y,
      plotter.pen.position.x,
      plotter.pen.position.y,
    );
    pop();
  }

  drawLengthLabel() {
    push();
    textFont("monospace");
    fill(0);
    noStroke();
    textSize(12);
    const midpoint = p5.Vector.add(this.position, plotter.pen.position).div(2);
    textAlign(CENTER, CENTER);
    text(
      `${pxToMm(this.distToPen(plotter.pen.position)).toFixed(1)} mm`,
      midpoint.x,
      midpoint.y,
    );
    pop();
  }

  drawIdler() {
    push();
    stroke(0);
    fill(220);
    circle(this.position.x, this.position.y, this.radius * 2);
    pop();
  }
}

class Pen {
  constructor(x, y, page) {
    this.position = createVector(x, y);
    this.page = page;
  }

  toPageCoords() {
    return createVector(
      pxToMm(this.position.x - (this.page.position.x - this.page.width / 2)),
      pxToMm(this.page.position.y + this.page.height / 2 - this.position.y),
    );
  }

  show() {
    fill(color("green"));
    circle(this.position.x, this.position.y, 5);
    this.displayInfo();
  }

  displayInfo() {
    push();
    textFont("monospace");
    fill(0);
    noStroke();
    textSize(12);
    const penCoords = this.toPageCoords();
    text(
      `(${penCoords.x.toFixed(0)}, ${penCoords.y.toFixed(0)})`,
      this.position.x + 10,
      this.position.y,
    );
    pop();
  }

  move(dx, dy) {
    this.position.add(createVector(dx, dy));
  }
}

class Plotter {
  constructor() {
    this.page = new Page();

    const idlerXOffset = ((this.page.width / 2) + mmToPx(120)) / 2
    const idlerYOffset = ((this.page.height / 2) + mmToPx(175)) / 2
    this.leftIdler = new Idler(
      this.page.position.x - idlerXOffset,
      this.page.position.y - idlerYOffset,
    );
    this.rightIdler = new Idler(
      this.page.position.x + idlerXOffset,
      this.page.position.y - idlerYOffset,
    );

    const motorXOffset = this.page.width / 4;
    const motorYOffset = this.page.height / 2 + 80;
    this.leftMotor = new Motor(
      this.page.position.x - motorXOffset,
      this.page.position.y - motorYOffset,
      Motor.DIRECTION.COUNTERCLOCKWISE,
      this.leftIdler,
    );
    this.rightMotor = new Motor(
      this.page.position.x + motorXOffset,
      this.page.position.y - motorYOffset,
      Motor.DIRECTION.CLOCKWISE,
      this.rightIdler,
    );

    this.pen = new Pen(this.page.position.x, this.page.position.y, this.page);

    this.leftMotor.reset(this.pen.position);
    this.rightMotor.reset(this.pen.position);

    this.port = null;
  }

  connectSerial() {
    if (!this.port) {
      this.port = createSerial();
    }

    if (!this.port.opened()) {
      this.port.open(SERIAL_BAUD_RATE);
    }
  }

  home() {
    if (this.port && this.port.opened()) {
      this.pen.position = createVector(this.page.position.x, this.page.position.y);
      this.sendMotorPositions();
    }
  }

  update() {
    this.handlePenMovement();
    this.constrainPenPosition();

    const currentTime = millis();
    if (currentTime - lastTelemetryTime >= telemetryInterval) {
      this.requestTelemetry();
      lastTelemetryTime = currentTime;
    }
    this.readSerialData();
  }

  sendMotorPositions() {
    if (this.port && this.port.opened()) {
      const leftPosition = this.leftMotor.penPosToPulses(this.pen.position);
      const rightPosition = this.rightMotor.penPosToPulses(this.pen.position);
      this.port.write(`M ${leftPosition} ${rightPosition}\n`);
    }
  }

  requestTelemetry() {
    if (this.port && this.port.opened()) {
      this.port.write('T');
    }
  }

  readSerialData() {
    if (this.port && this.port.opened()) {
      let line = this.port.readUntil("\n");
      if (line) {
        this.parseTelemetry(line.trim());
      }
    }
  }

  parseTelemetry(data) {
    const [leftPosition, rightPosition] = data.split(',').map(Number);
    if (!isNaN(leftPosition) && !isNaN(rightPosition)) {
      this.leftMotor.pulses = leftPosition;
      this.rightMotor.pulses = rightPosition;
      console.log(`M ${leftPosition} ${rightPosition}\n`);
    }
  }

  show() {
    this.page.show();
    this.leftMotor.show();
    this.rightMotor.show();
    this.pen.show();
  }

  handlePenMovement() {
    const keys = {
      left: [LEFT_ARROW, 72], // Left arrow and 'h'
      right: [RIGHT_ARROW, 76], // Right arrow and 'l'
      up: [UP_ARROW, 75], // Up arrow and 'k'
      down: [DOWN_ARROW, 74], // Down arrow and 'j'
    };

    const moveAmount = 2;

    if (keys.left.some(keyIsDown)) this.pen.move(-moveAmount, 0);
    if (keys.right.some(keyIsDown)) this.pen.move(moveAmount, 0);
    if (keys.up.some(keyIsDown)) this.pen.move(0, -moveAmount);
    if (keys.down.some(keyIsDown)) this.pen.move(0, moveAmount);

    this.sendMotorPositions();
  }

  constrainPenPosition() {
    this.pen.position.x = constrain(
      this.pen.position.x,
      this.leftIdler.position.x - this.leftIdler.radius,
      this.rightIdler.position.x + this.rightIdler.radius,
    );

    this.pen.position.y = max(
      this.pen.position.y,
      this.page.position.y - (this.page.height / 2 + 20),
    );
  }
}

let plotter;
let port;
let lastTelemetryTime = 0;
const telemetryInterval = 1000;

function setup() {
  rectMode(CENTER);
  createCanvas(
    mmToPx(CONFIG.PAGE.WIDTH_MM * 1.5),
    mmToPx(CONFIG.PAGE.HEIGHT_MM * 1.5),
  );
  plotter = new Plotter();
  createButton("Connect").mousePressed(() => plotter.connectSerial());
  createButton("Home").mousePressed(() => plotter.home());
}

function draw() {
  background(220);
  plotter.update();
  plotter.show();
}
