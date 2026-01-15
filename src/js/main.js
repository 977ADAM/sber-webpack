class Timer {
  constructor(root) {
    this.root = root;
    this.duration = Number(root.dataset.duration) || 0;

    this.timeEl = root.querySelector('.timer__value');
    this.progressCircle = root.querySelector('.timer__ring-progress');

    if (!this.timeEl || !this.progressCircle || !this.duration) {
      console.warn('Timer: invalid markup', root);
      return;
    }

    this.radius = this.progressCircle.r.baseVal.value;
    this.circumference = 2 * Math.PI * this.radius;

    this.progressCircle.style.strokeDasharray = this.circumference;
    this.progressCircle.style.strokeDashoffset = this.circumference;

    this.start();
  }

  start() {
    if (this.interval) {
      clearInterval(this.interval);
    }

    this.endTime = Date.now() + this.duration * 1000;
    this.update();

    this.interval = setInterval(() => this.update(), 1000);
  }

  update() {
    const timeLeft = Math.max(
      0,
      Math.ceil((this.endTime - Date.now()) / 1000)
    );

    this.render(timeLeft);

    if (timeLeft <= 0) {
      this.stop();
      this.emit('timer:end');
    }
  }

  render(secondsLeft) {
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;

    this.timeEl.textContent =
      `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    const progress = secondsLeft / this.duration;
    this.progressCircle.style.strokeDashoffset =
      this.circumference * progress;
  }

  stop() {
    clearInterval(this.interval);
    this.root.classList.add('is-finished');
  }

  emit(name) {
    this.root.dispatchEvent(
      new CustomEvent(name, { bubbles: true })
    );
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document
    .querySelectorAll('[data-timer]')
    .forEach(el => new Timer(el));
});
