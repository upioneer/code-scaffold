function setup() {
  createCanvas(windowWidth, windowHeight);
  // Color setup
  background(220);
}

function draw() {
  // Your animation logic here
  if (mouseIsPressed) {
    fill(0);
  } else {
    fill(255);
  }
  ellipse(mouseX, mouseY, 80, 80);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
