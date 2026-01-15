class Timer {
  constructor(root) {
    this.isValid = false;

    this.root = root;
    this.duration = Number(root.dataset.duration) || 0;

    this.timeEl = root.querySelector('.timer__value');
    this.progressCircle = root.querySelector('.timer__ring-progress');

    if (!this.timeEl || !this.progressCircle || !Number.isFinite(this.duration) || this.duration <= 0) {
      console.warn('Timer: invalid markup or duration', root);
      return;
    }

    this.isValid = true;

    this.radius = this.progressCircle.r.baseVal.value;
    this.circumference = 2 * Math.PI * this.radius;
    this.interval = null;
    this.endTime = null;
    this.isPaused = false;
    this.pausedTimeLeft = null;

    this.progressCircle.style.strokeDasharray = this.circumference;
    this.progressCircle.style.strokeDashoffset = this.circumference;

    // Обработка видимости страницы
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    // Обработка фокуса окна (для надежности)
    this.handleFocus = this.handleFocus.bind(this);
    window.addEventListener('focus', this.handleFocus);

    this.start();
  }

  start({ secondsLeft = null, emitStart = true } = {}) {
    if (this.interval) {
      clearInterval(this.interval);
    }


    const seconds = secondsLeft ?? this.duration;
    this.endTime = Date.now() + seconds * 1000;
    this.isPaused = false;
    this.pausedTimeLeft = null;

    this.update();
    if (emitStart) {
      this.emit('timer:start');
    }

    this.interval = setInterval(() => this.update(), 1000);
  }

  pause() {
    if (this.isPaused || !this.interval) return;

    const timeLeft = Math.max(0, Math.ceil((this.endTime - Date.now()) / 1000));
    this.pausedTimeLeft = timeLeft;
    this.isPaused = true;
    clearInterval(this.interval);
    this.interval = null;
    this.emit('timer:pause');
  }

  resume() {
    if (!this.isPaused || this.pausedTimeLeft === null) return;

    const secondsLeft = this.pausedTimeLeft;
    this.start({ secondsLeft, emitStart: false });
    this.emit('timer:resume');
  }

  handleVisibilityChange() {
    if (document.hidden) {
      // Страница скрыта - паузим таймер
      if (!this.isPaused && this.interval) {
        this.pause();
      }
    } else {
      // Страница видима - возобновляем
      if (this.isPaused) {
        this.resume();
      } else if (this.interval) {
        // Обновляем время сразу при возврате
        this.update();
      }
    }
  }

  handleFocus() {
    // При возврате фокуса обновляем таймер
    if (!this.isPaused && this.interval) {
      this.update();
    }
  }

  update() {
    const timeLeft = Math.max(
      0,
      Math.ceil((this.endTime - Date.now()) / 1000)
    );

    this.render(timeLeft);
    this.emit('timer:tick', { timeLeft, progress: timeLeft / this.duration });

    if (timeLeft <= 0) {
      this.stop();
      this.emit('timer:end');
    }
  }

  render(secondsLeft) {
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;
    const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    // Обновляем текстовое содержимое
    this.timeEl.textContent = formattedTime;

    // Обновляем datetime атрибут для accessibility
    if (this.timeEl.tagName === 'TIME') {
      this.timeEl.setAttribute('datetime', `PT${secondsLeft}S`);
    }

    // Обновляем прогресс кольца (движение по часовой стрелке)
    const progress = Math.max(0, Math.min(1, secondsLeft / this.duration));
    this.progressCircle.style.strokeDashoffset = -this.circumference * (1 - progress);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.root.classList.add('is-finished');
    this.emit('timer:stop');
  }

  destroy() {
    this.stop();
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('focus', this.handleFocus);
    this.root.classList.remove('is-finished');
  }

  emit(name, detail = {}) {
    this.root.dispatchEvent(
      new CustomEvent(name, { 
        bubbles: true,
        detail
      })
    );
  }
}

// Хранилище экземпляров таймеров для возможного управления извне
const timerInstances = new WeakMap();

function initTimers() {
  document
    .querySelectorAll('[data-timer]')
    .forEach(el => {
      // Пропускаем уже инициализированные таймеры
      if (timerInstances.has(el)) return;
      
      try {
        const timer = new Timer(el);
        // Сохраняем экземпляр только если он успешно провалидировался
        if (timer.isValid) {
          timerInstances.set(el, timer);
        }
      } catch (error) {
        console.error('Timer initialization error:', error, el);
      }
    });
}

// Инициализация при загрузке DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTimers);
} else {
  initTimers();
}

// Экспорт для возможного использования извне
if (typeof window !== 'undefined') {
  window.Timer = Timer;
  window.getTimerInstance = (element) => timerInstances.get(element);
}
