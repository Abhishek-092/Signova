const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const output = document.getElementById("output");

canvas.width = 420;
canvas.height = 280;

// 🎥 CAMERA START
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    video.srcObject = stream;
  });

// 🧠 MEDIAPIPE SETUP
const hands = new Hands({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
  }
});

hands.setOptions({
  maxNumHands: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});

// 🎯 GESTURE DETECTION FUNCTION
function detectGesture(landmarks) {
  const thumb = landmarks[4].x < landmarks[3].x;
  const index = landmarks[8].y < landmarks[6].y;
  const middle = landmarks[12].y < landmarks[10].y;
  const ring = landmarks[16].y < landmarks[14].y;
  const pinky = landmarks[20].y < landmarks[18].y;

  // 👍 THUMBS UP
  if (thumb && !index && !middle && !ring && !pinky) {
    return "YES";
  }

  // ✊ FIST
  if (!index && !middle && !ring && !pinky) {
    return "NO";
  }

  // ✋ OPEN PALM
  if (index && middle && ring && pinky) {
    return "HELLO";
  }

  // ☝️ ONE
  if (index && !middle && !ring && !pinky) {
    return "ONE";
  }

  // ✌️ TWO
  if (index && middle && !ring && !pinky) {
    return "TWO";
  }

  return "...";
}

// 🖐️ RESULTS CALLBACK
hands.onResults((results) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (results.multiHandLandmarks.length > 0) {
    const landmarks = results.multiHandLandmarks[0];

    // Draw points
    for (let point of landmarks) {
      ctx.beginPath();
      ctx.arc(point.x * canvas.width, point.y * canvas.height, 5, 0, 2 * Math.PI);
      ctx.fillStyle = "#22c55e";
      ctx.fill();
    }

    const gesture = detectGesture(landmarks);
    output.innerText = gesture;
  }
});

// 🎥 CAMERA LOOP
const camera = new Camera(video, {
  onFrame: async () => {
    await hands.send({ image: video });
  },
  width: 420,
  height: 280
});

camera.start();

// 🔊 SPEAK
function speak() {
  const text = output.innerText;
  speechSynthesis.speak(new SpeechSynthesisUtterance(text));
}

// ⏸ PAUSE
function pauseCam() {
  video.srcObject.getTracks().forEach(track => track.stop());
}

// 🔄 RESET
function resetText() {
  output.innerText = "...";
}