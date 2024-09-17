let port;
let commandInput;
let sendButton;
let telemetryCheckbox;
let outputDiv;

function setup() {
  createCanvas(400, 600);

  // Create serial port object
  port = createSerial();

  // Create UI elements
  commandInput = createInput('M 100 -100');
  commandInput.position(20, 20);
  commandInput.size(100);

  sendButton = createButton('Send Command');
  sendButton.position(135, 20);
  sendButton.mousePressed(sendCommand);

  telemetryCheckbox = createCheckbox('Request Telemetry', false);
  telemetryCheckbox.position(20, 50);

  outputDiv = createDiv('Serial Output:');
  outputDiv.position(20, 80);
  outputDiv.style('white-space', 'pre-wrap');
  outputDiv.style('font-family', 'monospace');

  // Create connect button
  let connectButton = createButton('Connect to Serial');
  connectButton.position(250, 20);
  connectButton.mousePressed(connectToSerial);
}

let data = [];
let lastTelemetryTime = 0;
const telemetryRequestInterval = 1000;

function connectToSerial() {
  if (!port.opened()) {
    port.open(115200);
  }
}

function draw() {
  background(220);

  // Check for incoming serial data
  if (port.opened()) {
    let newData = port.readUntil("\n");
    if (newData) {
      data.push(newData);
      if (data.length > 10) { data.shift(); }
      outputDiv.html('Serial Output:\n' + data.join(''));
    }
  }

  // Request telemetry if checkbox is checked
  if (telemetryCheckbox.checked() && port.opened() && millis() - lastTelemetryTime > telemetryRequestInterval) {
    port.write('T');
    lastTelemetryTime = millis();
  }
}

function sendCommand() {
  if (port.opened()) {
    let command = commandInput.value();
    port.write(command + '\n');
    console.log('Sent:', command);
  } else {
    console.log('Serial port not open');
  }
}

function keyPressed() {
  if (keyCode === ENTER) {
    sendCommand();
  }
}