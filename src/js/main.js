const TOTAL_TIME = 5 * 60; // 5 минут
let timeLeft = TOTAL_TIME;

const timeEl = document.getElementById("time");
const progressCircle = document.querySelector(".ring-progress");

const radius = 70;
const circumference = 2 * Math.PI * radius;

progressCircle.style.strokeDasharray = circumference;
progressCircle.style.strokeDashoffset = 0;

function updateTimer() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  timeEl.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const progress = timeLeft / TOTAL_TIME;
  progressCircle.style.strokeDashoffset = circumference * (1 - progress);

  if (timeLeft > 0) {
    timeLeft--;
  } else {
    clearInterval(timer);
  }
}

updateTimer();
const timer = setInterval(updateTimer, 1000);