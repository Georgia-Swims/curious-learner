let agentX, agentY;
let heading = 0;

// Core psychological variables
let confidence = 0.5;
let prevConfidence = 0.5;
let learningProgress = 0.0;
let curiosity = 0.3;
let feedback = 0.0;
let feedbackType = "neutral";

// UI
let confidenceSlider;
let feedbackSelect;

// Visuals
let sparkles = [];

const PANEL_WIDTH = 200;
const WORLD_WIDTH = 400;

const TOP_BUFFER = 20;
const BOTTOM_BUFFER = 380;

// ------------------------------------------------------
// SETUP
// ------------------------------------------------------
function setup() {
  createCanvas(600, 400);

  agentX = PANEL_WIDTH + 50;
  agentY = height / 2;

  confidenceSlider = createSlider(0, 1, 0.5, 0.01);
  confidenceSlider.position(20, 60);

  feedbackSelect = createSelect();
  feedbackSelect.position(20, 140);
  feedbackSelect.option('supportive');
  feedbackSelect.option('neutral');
  feedbackSelect.option('critical');

  let zoneWidth = WORLD_WIDTH / 3;
  for (let i = 0; i < 120; i++) {
    sparkles.push({
      x: random(PANEL_WIDTH + zoneWidth * 2, PANEL_WIDTH + WORLD_WIDTH),
      y: random(0, height)
    });
  }
}

// ------------------------------------------------------
// DRAW LOOP
// ------------------------------------------------------
function draw() {
  background(255);

  confidence = confidenceSlider.value();
  feedbackType = feedbackSelect.value();

  drawControlPanel();
  drawZones();
  drawZoneLabels();
  drawSparkles();

  applyFeedback();
  updateCuriosity();
  moveAgent();
  drawAgent();
  drawCuriosityMeter();
}

// ------------------------------------------------------
// CONTROL PANEL
// ------------------------------------------------------
function drawControlPanel() {
  fill(240);
  noStroke();
  rect(0, 0, PANEL_WIDTH, height);

  fill(0);
  textSize(14);
  text("Confidence Level", 70, 45);
  text("Feedback Type", 60, 125);
  text("Curiosity Meter", 60, 205);
}

// ------------------------------------------------------
// ZONES
// ------------------------------------------------------
function drawZones() {
  let zoneWidth = WORLD_WIDTH / 3;

  noStroke();
  fill('#EDE7F6');
  rect(PANEL_WIDTH, 0, zoneWidth, height);

  fill('#9575CD');
  rect(PANEL_WIDTH + zoneWidth, 0, zoneWidth, height);

  fill('#7E57C2');
  rect(PANEL_WIDTH + zoneWidth * 2, 0, zoneWidth, height);
}

// ------------------------------------------------------
// ZONE LABELS
// ------------------------------------------------------
function drawZoneLabels() {
  let zoneWidth = WORLD_WIDTH / 3;

  textAlign(CENTER);
  textSize(16);
  fill(0);

  text("Comfort Zone", PANEL_WIDTH + zoneWidth / 2, 25);
  text("Stretch Zone", PANEL_WIDTH + zoneWidth * 1.5, 25);
  text("Growth Zone", PANEL_WIDTH + zoneWidth * 2.5, 25);
}

// ------------------------------------------------------
// SPARKLES
// ------------------------------------------------------
function drawSparkles() {
  push();
  stroke(255, 245, 255, 200);
  strokeWeight(2);
  for (let s of sparkles) point(s.x, s.y);
  pop();
}

// ------------------------------------------------------
// FEEDBACK → CONFIDENCE → LEARNING PROGRESS
// ------------------------------------------------------
function applyFeedback() {
  if (frameCount % 60 === 0) {

    if (feedbackType === "supportive") feedback = 0.5;
    else if (feedbackType === "neutral") feedback = 0.0;
    else if (feedbackType === "critical") feedback = -1.0;

    // confidence grows faster now
    confidence += 0.05 * feedback;
    confidence = constrain(confidence, 0, 1);
    confidenceSlider.value(confidence);

    learningProgress = confidence - prevConfidence;
    prevConfidence = confidence;
  }
}

// ------------------------------------------------------
// CURIOSITY: tied to confidence + LP, never rises under critical
// ------------------------------------------------------
function updateCuriosity() {

  // If feedback is critical → nothing increases
  if (feedbackType === "critical") {
    curiosity -= 0.01;
    curiosity = constrain(curiosity, 0, 1);
    return;
  }

  // If feedback is neutral → everything stays stable
  if (feedbackType === "neutral") {
    curiosity -= 0.0005; // tiny natural drift
    curiosity = constrain(curiosity, 0, 1);
    return;
  }

  // SUPPORTIVE FEEDBACK ONLY BELOW

  let lp = learningProgress;

  // curiosity rises slowly with learning progress
  if (lp > 0) {
    curiosity += lp * 0.02;
  }

  // curiosity also depends on confidence
  curiosity += confidence * 0.002;

  // if confidence drops suddenly (slider moved), curiosity resets downward
  if (lp < 0) {
    curiosity -= 0.01;
  }

  curiosity = constrain(curiosity, 0, 1);
}

// ------------------------------------------------------
// MOVEMENT WITH SMOOTH ZONE TRANSITIONS + HIGH-CONFIDENCE LOCK
// ------------------------------------------------------
function moveAgent() {
  let zoneWidth = WORLD_WIDTH / 3;

  let comfortMin = PANEL_WIDTH;
  let comfortMax = PANEL_WIDTH + zoneWidth;

  let stretchMin = comfortMax;
  let stretchMax = PANEL_WIDTH + zoneWidth * 2;

  let rightBuffer = 20;
  let growthMax = PANEL_WIDTH + WORLD_WIDTH - rightBuffer;

  let t = confidence;

  // smooth sliding boundaries
  let allowedMinX = lerp(comfortMin, stretchMin, t * 1.2);
  let allowedMaxX = lerp(comfortMax, growthMax, t);

  // lockout: once confident, never return to comfort
  if (confidence > 0.5) {
    allowedMinX = stretchMin;
  }
  if (confidence > 0.7) {
    allowedMinX = stretchMin;
    allowedMaxX = growthMax;
  }

  let speed = map(curiosity, 0, 1, 0.4, 4.0);
  let rightBias = map(curiosity, 0, 1, 0, 0.08);

  heading += random(-0.15, 0.15) + rightBias;

  if (random() < 0.02) {
    heading += random(-PI, PI);
  }

  let jitterX = random(-0.6, 0.6);
  let jitterY = random(-0.6, 0.6);

  let newX = agentX + cos(heading) * speed + jitterX;
  let newY = agentY + sin(heading) * speed + jitterY;

  agentX = constrain(newX, allowedMinX, allowedMaxX);
  agentY = constrain(newY, TOP_BUFFER, BOTTOM_BUFFER);
}

// ------------------------------------------------------
// AGENT
// ------------------------------------------------------
function drawAgent() {
  push();
  translate(agentX, agentY);
  noStroke();
  fill(60);
  ellipse(0, 6, 16, 18);
  ellipse(0, -4, 12, 12);
  pop();
}

// ------------------------------------------------------
// CURIOSITY METER
// ------------------------------------------------------
function drawCuriosityMeter() {
  stroke(0);
  fill(255, 200, 120);
  rect(10, 215, 150, 12);

  let w = map(curiosity, 0, 1, 0, 150);
  fill(255, 140, 0);
  rect(10, 215, w, 12);
}
