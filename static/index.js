/*******************************/
/* Project images height setup */
/*******************************/

document.addEventListener('DOMContentLoaded', setupImageHeights);
window.addEventListener('resize', setupImageHeights);

function setupImageHeights() {
  const projects = Array.from(document.querySelectorAll('.project'));
  projects.forEach((project) => {
    const images = Array.from(
      project.querySelector('.project__images').querySelectorAll('img, video'),
    );

    if (images[0].complete) {
      inferHeightFromFirstImage(images);
    } else {
      images[0].addEventListener('load', () => {
        inferHeightFromFirstImage(images);
      });
    }
  });
}

async function inferHeightFromFirstImage(images) {
  let tries = 0;
  let height = 0;
  while (true) {
    height = images[0].clientHeight;
    if (height > 0) {
      break;
    }

    if (tries++ >= 10) {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  if (height === 0) {
    console.warn('Could not set image heights correctly.');
    height = 500;
    debugger;
  }
  images.slice(1).forEach((img) => {
    img.style.height = `${height}px`;
  });
}

/********************/
/* Navbar indicator */
/********************/

const ANCHORS_ID = ['accueil', 'a-propos', 'projets', 'contact'];

document.addEventListener('DOMContentLoaded', setupNavbarIndicator);

function setupNavbarIndicator() {
  const indicator = document.querySelector('.navbar__indicator');
  const links = Array.from(document.querySelectorAll('.navbar a'));
  const anchors = ANCHORS_ID.map((id) => document.getElementById(id));
  const baseWidth = parseFloat(window.getComputedStyle(indicator).width);

  let animation;
  let targetIndex = null;

  function updateIndicator(initial = false) {
    const scrollY = window.scrollY;
    let newIndex = 0;
    for (let i = 0; i < anchors.length; i++) {
      if (scrollY >= anchors[i].offsetTop - 300) {
        newIndex = i;
      } else {
        break;
      }
    }

    if (newIndex === targetIndex) {
      return;
    }

    targetIndex = newIndex;

    const currentLink = links[newIndex];
    const width = currentLink.clientWidth;

    const targetLeft = currentLink.offsetLeft + width / 2;

    if (initial === true) {
      indicator.style.left = `${targetLeft}px`;
      return;
    }

    const initialLeft = parseFloat(indicator.style.left);

    animation?.cancel();
    animation = animate(
      {
        duration: 300,
      },
      (f) => {
        indicator.style.left = `${lerp(f, initialLeft, targetLeft)}px`;
        /* Animate witdth to be wider at the mid-point */
        const midPoint = 0.5;
        const maxWidthFactor = 8;
        let widthFactor;
        if (f < midPoint) {
          widthFactor = lerp(f / midPoint, 1, maxWidthFactor);
        } else {
          widthFactor = lerp((f - midPoint) / midPoint, maxWidthFactor, 1);
        }
        indicator.style.width = `${baseWidth * widthFactor}px`;
      },
    );
  }

  window.addEventListener('scroll', updateIndicator);
  window.addEventListener('resize', updateIndicator);

  updateIndicator(true);
}

const easing = (t) => t * t * (3 - 2 * t);
/**
 * Animate a value using `requestAnimationFrame()`. This function does not
 * call `options.onChange` in the current event loop cycle. It is not guaranteed
 * to stop exactly after `options.duration`, but it does guarantee that it will
 * never call `options.onChange` with a value outside `options.to`.
 */
function animate(options, onChange) {
  const { from = 0, to = 1, duration = 250, delay = 0 } = options;
  const start = performance.now();
  let id = 0;

  let resolve;
  const promise = new Promise((_resolve) => {
    resolve = _resolve;
  });

  const step = (timestamp) => {
    const elapsed = timestamp - start - delay;

    if (elapsed < 0) {
      id = requestAnimationFrame(step);
    } else if (elapsed >= duration) {
      onChange(to, true);
      resolve();
    } else {
      onChange(lerp(easing(elapsed / duration), from, to), false);
      id = requestAnimationFrame(step);
    }
  };

  promise.cancel = () => {
    cancelAnimationFrame(id);
  };

  id = requestAnimationFrame(step);

  return promise;
}

function lerp(factor, a, b) {
  return a * (1 - factor) + b * factor;
}
