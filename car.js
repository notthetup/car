let windowWidth = window.innerWidth;
let windowHeight = window.innerHeight;

const canvas = document.getElementsByTagName('canvas')[0];
const ctx = canvas.getContext('2d');

const car = document.getElementById('car');

const maxPower = 0.01;
const maxBrakingPower = 0.0375;
const powerFactor = 0.001;
const brakingFactor = 0.0005;

const drag = 0.95;
const angularDrag = 0.95;
const turnSpeed = 0.001;

let power = 0;
let brakingPower = 0;

let positionX = windowWidth / 2;
let positionY = windowHeight / 2;

let velocityX = 0;
let velocityY = 0;

let angle = 0;
let angularVelocity = 0;

const keysDown = {};

let needResize;
let resizing;

window.addEventListener('keydown', e => {
  keysDown[e.which] = true;
});

window.addEventListener('keyup', e => {
  keysDown[e.which] = false;
});

const touching = {
  up: 0,
  down: 0,
  left: 0,
  right: 0
};

window.addEventListener('touchstart', e => {
  e.preventDefault();

  if (touching.active) {
    return;
  }
  touching.active = true;

  const prevPos = {
    x: e.touches[0].pageX,
    y: e.touches[0].pageY
  };

  const touchmove = e => {
    e.preventDefault();

    const pos = {
      x: e.touches[0].pageX,
      y: e.touches[0].pageY
    };

    const diff = {
      x: pos.x - prevPos.x,
      y: pos.y - prevPos.y
    };

    prevPos.x = pos.x;
    prevPos.y = pos.y;

    touching.up -= diff.y / (windowHeight / 3);
    touching.down += diff.y / (windowHeight / 3);
    touching.left -= diff.x / (windowWidth / 3);
    touching.right += diff.x / (windowWidth / 3);

    touching.up = Math.max(0, Math.min(1, touching.up));
    touching.down = Math.max(0, Math.min(1, touching.down));
    touching.left = Math.max(0, Math.min(1, touching.left));
    touching.right = Math.max(0, Math.min(1, touching.right));
  };

  const touchend = e => {
    touching.active = false;
    touching.up = 0;
    touching.down = 0;
    touching.left = 0;
    touching.right = 0;

    window.removeEventListener('touchmove', touchmove);
    window.removeEventListener('touchend', touchend);
  };

  window.addEventListener('touchmove', touchmove);
  window.addEventListener('touchend', touchend);
});

function update () {
  if (touching.active) {
    if (touching.up) {
      power += powerFactor * touching.up;
    } else {
      power -= powerFactor;
    }
    if (touching.down) {
      brakingPower += brakingFactor;
    } else {
      brakingPower -= brakingFactor;
    }
  } else {
    if (keysDown[38]) {
      power += powerFactor;
    } else {
      power -= powerFactor;
    }
    if (keysDown[40]) {
      brakingPower += brakingFactor;
    } else {
      brakingPower -= brakingFactor;
    }
  }

  power = Math.max(0, Math.min(maxPower, power));
  brakingPower = Math.max(0, Math.min(maxBrakingPower, brakingPower));

  const direction = power > brakingPower ? 1 : -1;

  if (power > 0.0025 || brakingPower) {
    if (touching.active) {
      if (touching.left) {
        angularVelocity -= direction * turnSpeed * touching.left;
      }
      if (touching.right) {
        angularVelocity += direction * turnSpeed * touching.right;
      }
    } else {
      if (keysDown[37]) {
        angularVelocity -= direction * turnSpeed;
      }
      if (keysDown[39]) {
        angularVelocity += direction * turnSpeed;
      }
    }
  }

  velocityX += Math.sin(angle) * (power - brakingPower);
  velocityY += Math.cos(angle) * (power - brakingPower);

  positionX += velocityX;
  positionY -= velocityY;
  velocityX *= drag;
  velocityY *= drag;
  angle += angularVelocity;
  angularVelocity *= angularDrag;

  if (positionX > windowWidth) {
    positionX -= windowWidth;
  } else if (positionX < 0) {
    positionX += windowWidth;
  }

  if (positionY > windowHeight) {
    positionY -= windowHeight;
  } else if (positionY < 0) {
    positionY += windowHeight;
  }
}

let lastTime;
let acc = 0;
const step = 1 / 120;

function render (ms) {
  if (lastTime) {
    acc += (ms - lastTime) / 1000;

    while (acc > step) {
      update();

      acc -= step;
    }
  }

  lastTime = ms;
  requestAnimationFrame(render);

  if (needResize || resizing) {
    needResize = false;
    resizing = true;

    const prevImage = new Image();
    prevImage.src = canvas.toDataURL();

    prevImage.onload = () => {
      resizing = false;

      canvas.width = windowWidth;
      canvas.height = windowHeight;

      ctx.fillStyle = 'rgba(64, 64, 64, 0.25)';

      ctx.drawImage(prevImage, 0, 0);
    };
  }

  car.style.transform = `translate(${positionX}px, ${positionY}px) rotate(${angle * 180 / Math.PI}deg)`;

  if ((power > 0.0025) || brakingPower) {
    if (((maxBrakingPower === brakingPower) || (maxPower === power)) && Math.abs(angularVelocity) < 0.002) {
      return;
    }
    ctx.save();
    ctx.translate(positionX - Math.cos(angle) * 4, positionY - Math.sin(angle) * 4);
    ctx.rotate(angle);
    ctx.translate(-positionX, -positionY);
    ctx.fillRect(
      positionX,
      positionY,
      1,
      1
    );
    ctx.restore();

    ctx.save();
    ctx.translate(positionX - Math.cos(Math.PI + angle) * 4, positionY - Math.sin(Math.PI + angle) * 4);
    ctx.rotate(angle);
    ctx.translate(-positionX, -positionY);
    ctx.fillRect(
      positionX,
      positionY,
      1,
      1
    );
    ctx.restore();
  }
}

requestAnimationFrame(render);

function resize () {
  windowWidth = window.innerWidth;
  windowHeight = window.innerHeight;

  needResize = true;
}

resize();

window.addEventListener('resize', resize);
