document.addEventListener('DOMContentLoaded', () => {
  hideLoader();
  setupNavbarScrollLink();

  const setupLayout = async () => {
    await setupImageDimensions();
    await setupImageTextReveal();
    await setupTitleColorFromImage();
  };

  setupLayout();
  window.addEventListener('resize', setupLayout);
});

/*******************************/
/* Page loader */
/*******************************/

async function hideLoader() {
  const loader = document.getElementById('loader');
  if (!loader) return;

  // Wait for fonts
  await document.fonts.ready;

  // Wait for logo images
  const images = Array.from(document.querySelectorAll('[data-wait-until-loaded]'));
  await Promise.all(
    images.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.addEventListener('load', resolve);
        img.addEventListener('error', resolve);
      });
    }),
  );

  // Reveal the page
  document.body.classList.remove('loading');

  // Remove from DOM after transition
  loader.addEventListener('transitionend', () => {
    loader.remove();
  });
}

/*******************************/
/* Project images height setup */
/*******************************/

function setupImageDimensions() {
  const projects = Array.from(document.querySelectorAll('.project'));
  return Promise.all(
    projects.map((project) => {
      const images = Array.from(
        project.querySelector('.project__images').querySelectorAll('img, video'),
      );
      return setupProjectImages(project, images);
    }),
  );
}

async function setupProjectImages(project, images) {
  /* Setup heights */
  await waitUntilLoaded(images[0]);
  let height = images[0].clientHeight;
  if (height === 0) {
    console.warn('PROJECT IMAGES: Could not set image heights correctly.');
    height = 500;
  }
  images.slice(1).forEach((img) => {
    img.style.height = `${height}px`;
  });

  /* Setup end padding */
  await waitUntilLoaded(images[images.length - 1]);
  let lastImageWidth = images[images.length - 1].clientWidth;
  if (lastImageWidth === 0) {
    console.warn('PROJECT IMAGES: Could not set image end padding correctly.');
    return;
  }

  const projectWidth = project.clientWidth;
  const imagesContainer = project.querySelector('.project__images > div');
  imagesContainer.style.paddingRight = `calc(var(--page-padding) - (${lastImageWidth}px - (${projectWidth}px - 2 * var(--page-padding))))`;
}

function waitUntilLoaded(image) {
  return new Promise((resolve) => {
    if (image.complete) {
      resolve();
    } else {
      image.addEventListener('load', resolve);
      image.addEventListener('error', resolve);
      setTimeout(resolve, 5000); // Fallback timeout
    }
  });
}

/*********************************/
/* Image-triggered text reveal */
/*********************************/

async function setupImageTextReveal() {
  const MOBILE_BREAKPOINT = 1300;
  const projects = document.querySelectorAll('.project');

  const vwToPx = (vw) => (vw / 100) * window.innerWidth;
  const isMobile = () => window.innerWidth <= MOBILE_BREAKPOINT;

  // Wait for all images to load
  const allImages = Array.from(document.images);
  await Promise.all(
    allImages.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.addEventListener('load', resolve);
        img.addEventListener('error', resolve);
      });
    }),
  );

  projects.forEach((project) => {
    const elements = Array.from(
      project.querySelectorAll('.project__text [data-image-for]'),
    );
    if (elements.length === 0) return;

    const imagesContainer = project.querySelector('.project__images');
    const images = project.querySelectorAll(
      '.project__images img, .project__images video',
    );

    let currentVisible = null;
    let isAnimating = false;
    let lastIsMobile = isMobile();

    const wrapper = elements[0].parentNode;

    function setupLayout() {
      const mobile = isMobile();

      // Measure all element heights
      elements.forEach((element) => {
        element.style.position = '';
        element.style.height = 'auto';
        element.style.opacity = '';
      });
      const heights = elements.map((el) => el.scrollHeight);

      if (mobile) {
        // Mobile: wrapper height = tallest element
        wrapper.style.height = `${Math.max(...heights)}px`;
      } else {
        // Desktop: wrapper height = first element (will animate)
        wrapper.style.height = `${heights[0]}px`;
      }

      // Reset state when layout changes
      if (mobile !== lastIsMobile) {
        currentVisible = null;
        isAnimating = false;
        lastIsMobile = mobile;
      }
    }

    function transitionTo(fromElement, toElement) {
      // Fade out current element
      if (fromElement) {
        fromElement.style.opacity = '0';
      }

      // Fade in new element and animate wrapper height
      if (toElement) {
        toElement.offsetHeight; // Trigger reflow
        toElement.style.opacity = '1';

        // Animate wrapper height (desktop only, mobile has fixed height)
        if (!isMobile()) {
          const targetHeight = toElement.scrollHeight;
          wrapper.style.height = `${targetHeight}px`;
        }
      }

      // Wait for transition to complete
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        isAnimating = false;
      };

      const transitionElement = toElement || fromElement;
      if (transitionElement) {
        transitionElement.addEventListener('transitionend', finish, { once: true });
      }
      // Fallback timeout in case transitionend doesn't fire
      setTimeout(finish, 450);
    }

    function checkVisibility() {
      if (isAnimating) return;

      const containerRect = imagesContainer.getBoundingClientRect();
      const pagePaddingValue = getComputedStyle(document.body).getPropertyValue(
        '--page-padding',
      );
      const pagePaddingVw = parseFloat(pagePaddingValue);
      const pagePaddingPx = vwToPx(pagePaddingVw);

      const visibleLeft = containerRect.left + pagePaddingPx;
      const visibleRight = containerRect.right - pagePaddingPx;

      let newVisible = null;
      elements.forEach((element) => {
        const imageIndex = parseInt(element.dataset.imageFor, 10) - 1;
        const targetImage = images[imageIndex];
        if (!targetImage) return;

        const imageRect = targetImage.getBoundingClientRect();
        const isVisible =
          imageRect.left < visibleRight - vwToPx(5) && imageRect.right > visibleLeft;

        if (isVisible) {
          newVisible = element;
        }
      });

      if (newVisible === currentVisible) return;

      isAnimating = true;
      transitionTo(currentVisible, newVisible);
      currentVisible = newVisible;
    }

    function handleResize() {
      setupLayout();
      checkVisibility();
    }

    // Initial setup
    setupLayout();

    imagesContainer.addEventListener('scroll', checkVisibility);
    window.addEventListener('resize', handleResize);

    // Initial check
    checkVisibility();
  });
}

/*********************************/
/* Title color from image */
/*********************************/

async function setupTitleColorFromImage() {
  const projects = document.querySelectorAll('.project');

  projects.forEach(async (project) => {
    const title = project.querySelector('.project__text h3');
    if (!title) return;

    const firstImage = project.querySelector(
      '.project__images img, .project__images video',
    );
    if (!firstImage) return;

    const color = await extractDominantSaturatedColor(firstImage);
    if (color) {
      title.style.color = adjustColor(color, 0.7, 0.8, 0.5);
    }
  });
}

/**
 * Extract the dominant saturated color from an image
 * @param {HTMLImageElement|HTMLVideoElement} media
 * @returns {Promise<string|null>} CSS color string or null
 */
async function extractDominantSaturatedColor(media) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Use a small sample size for performance
  const sampleSize = 100;
  canvas.width = sampleSize;
  canvas.height = sampleSize;

  try {
    if (media.tagName === 'VIDEO') {
      ctx.drawImage(media, 0, 0, sampleSize, sampleSize);
    } else {
      ctx.drawImage(media, 0, 0, sampleSize, sampleSize);
    }
  } catch (e) {
    console.warn('Could not draw image to canvas:', e);
    return null;
  }

  const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
  const pixels = imageData.data;

  // Group colors into buckets for finding dominant color
  const colorBuckets = new Map();
  const minSaturation = 0.1; // Minimum saturation to consider "saturated"
  const minLightness = 0.2; // Avoid too dark colors
  const maxLightness = 0.8; // Avoid too light colors

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const a = pixels[i + 3];

    if (a < 128) continue; // Skip transparent pixels

    const [h, s, l] = rgbToHsl(r, g, b);

    // Only consider saturated colors
    if (s < minSaturation || l < minLightness || l > maxLightness) continue;

    // Bucket by hue (36 buckets = 10 degree increments)
    const hueBucket = Math.floor(h * 12);
    const key = hueBucket;

    if (!colorBuckets.has(key)) {
      colorBuckets.set(key, { count: 0, r: 0, g: 0, b: 0, saturation: 0 });
    }

    const bucket = colorBuckets.get(key);
    bucket.count++;
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    bucket.saturation += s;
  }

  if (colorBuckets.size === 0) return null;

  // Find the bucket with most pixels, weighted by saturation
  let bestBucket = null;
  let bestScore = 0;

  colorBuckets.forEach((bucket) => {
    const avgSaturation = bucket.saturation / bucket.count;
    const score = bucket.count * avgSaturation;
    if (score > bestScore) {
      bestScore = score;
      bestBucket = bucket;
    }
  });

  if (!bestBucket) return null;

  // Get average color from best bucket
  const avgR = Math.round(bestBucket.r / bestBucket.count);
  const avgG = Math.round(bestBucket.g / bestBucket.count);
  const avgB = Math.round(bestBucket.b / bestBucket.count);

  return `rgb(${avgR}, ${avgG}, ${avgB})`;
}

/**
 * Adjust a color's lightness and saturation within specified bounds
 * @returns {string} Adjusted CSS rgb() color string
 */
function adjustColor(rgbColor, minLightness, maxLightness, maxSaturation = 1) {
  const match = rgbColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return rgbColor;

  const r = parseInt(match[1], 10);
  const g = parseInt(match[2], 10);
  const b = parseInt(match[3], 10);

  let [h, s, l] = rgbToHsl(r, g, b);

  // Clamp saturation
  if (s > maxSaturation) {
    s = maxSaturation;
  }

  // Clamp lightness
  if (l > maxLightness) {
    l = maxLightness;
  } else if (l < minLightness) {
    l = minLightness;
  }

  const [newR, newG, newB] = hslToRgb(h, s, l);
  return `rgb(${newR}, ${newG}, ${newB})`;
}

/**
 * Convert RGB to HSL
 * @returns {[number, number, number]} [h, s, l] each in range 0-1
 */
function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return [0, 0, l];
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h;
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      break;
    case g:
      h = ((b - r) / d + 2) / 6;
      break;
    case b:
      h = ((r - g) / d + 4) / 6;
      break;
  }

  return [h, s, l];
}

/**
 * Convert HSL to RGB
 * @param {number} h - Hue (0-1)
 * @param {number} s - Saturation (0-1)
 * @param {number} l - Lightness (0-1)
 * @returns {[number, number, number]} [r, g, b] each in range 0-255
 */
function hslToRgb(h, s, l) {
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/********************/
/* Navbar indicator */
/********************/

const ANCHORS_ID = ['accueil', 'a-propos', 'projets', 'contact'];

function setupNavbarScrollLink() {
  const links = Array.from(document.querySelectorAll('.navbar a'));
  const anchors = ANCHORS_ID.map((id) => document.getElementById(id));

  let targetIndex = null;

  function updateActive() {
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

    const previousLink = links[targetIndex];

    targetIndex = newIndex;

    const currentLink = links[newIndex];

    previousLink?.classList.remove('active');
    currentLink.classList.add('active');
  }

  window.addEventListener('scroll', updateActive);
  window.addEventListener('resize', updateActive);

  updateActive(true);
}
