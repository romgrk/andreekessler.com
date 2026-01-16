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
  loader.classList.add('loader--hidden');

  // Remove from DOM after transition
  loader.addEventListener('transitionend', () => {
    loader.remove();
  });
}

document.addEventListener('DOMContentLoaded', hideLoader);

/*******************************/
/* Project images height setup */
/*******************************/

document.addEventListener('DOMContentLoaded', setupImageDimensions);
window.addEventListener('resize', setupImageDimensions);

function setupImageDimensions() {
  const projects = Array.from(document.querySelectorAll('.project'));
  projects.forEach((project) => {
    const images = Array.from(
      project.querySelector('.project__images').querySelectorAll('img, video'),
    );

    if (images[0].complete) {
      setupProjectImages(project, images);
    } else {
      images[0].addEventListener('load', () => {
        setupProjectImages(project, images);
      });
    }
  });
}

async function setupProjectImages(project, images) {
  let tries = 0;

  /* Setup heights */
  let height = 0;
  while (true) {
    height = images[0].clientHeight;
    if (height > 0) {
      break;
    }
    if (tries++ >= 40) {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  if (height === 0) {
    console.warn('Could not set image heights correctly.');
    height = 500;
  }
  images.slice(1).forEach((img) => {
    img.style.height = `${height}px`;
  });

  /* Setup end padding */
  tries = 0;
  let lastImageWidth = 0;
  while (true) {
    lastImageWidth = images[images.length - 1].clientWidth;
    if (height > 0) {
      break;
    }
    if (tries++ >= 40) {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  if (lastImageWidth === 0) {
    console.warn('Could not set image end padding correctly.');
    return;
  }

  const projectWidth = project.clientWidth;
  const imagesContainer = project.querySelector('.project__images > div');
  imagesContainer.style.paddingRight = `calc(var(--page-padding) - (${lastImageWidth}px - (${projectWidth}px - 2 * var(--page-padding))))`;
}

/*********************************/
/* Image-triggered text reveal */
/*********************************/

document.addEventListener('DOMContentLoaded', setupImageTextReveal);

async function setupImageTextReveal() {
  const projects = document.querySelectorAll('.project');

  const vwToPx = (vw) => (vw / 100) * window.innerWidth;

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
    const elements = project.querySelectorAll('.project__text [data-image-for]');
    if (elements.length === 0) return;

    const imagesContainer = project.querySelector('.project__images');
    const images = project.querySelectorAll(
      '.project__images img, .project__images video',
    );

    let currentVisible = null;
    let isAnimating = false;

    // Set initial height to 0 for all elements
    elements.forEach((element) => {
      element.style.height = '0';
      element.style.overflow = 'hidden';
    });

    function showElement(element) {
      // Measure the natural height
      element.style.height = 'auto';
      const naturalHeight = element.scrollHeight;
      element.style.height = '0';

      // Trigger reflow
      element.offsetHeight;

      // Animate to natural height
      element.style.height = `${naturalHeight}px`;

      // Clean up after transition
      element.addEventListener(
        'transitionend',
        () => {
          if (element.style.height !== '0px') {
            element.style.height = 'auto';
          }
          isAnimating = false;
        },
        { once: true },
      );
    }

    function checkVisibility() {
      if (isAnimating) return;

      const containerRect = imagesContainer.getBoundingClientRect();

      // Get the page padding (in vw units) to account for masked areas
      const pagePaddingValue = getComputedStyle(document.body).getPropertyValue(
        '--page-padding',
      );
      const pagePaddingVw = parseFloat(pagePaddingValue); // e.g. "30vw" -> 30
      const pagePaddingPx = vwToPx(pagePaddingVw);

      const visibleLeft = containerRect.left + pagePaddingPx;
      const visibleRight = containerRect.right - pagePaddingPx;

      // Find which element should be visible (last one whose image is in view)
      let newVisible = null;
      elements.forEach((element) => {
        const imageIndex = parseInt(element.dataset.imageFor, 10) - 1; // 1-indexed
        const targetImage = images[imageIndex];
        if (!targetImage) return;

        const imageRect = targetImage.getBoundingClientRect();
        const isVisible =
          imageRect.left < visibleRight - vwToPx(5) && imageRect.right > visibleLeft;

        if (isVisible) {
          newVisible = element;
        }
      });

      // No change needed
      if (newVisible === currentVisible) return;

      isAnimating = true;

      // Hide the previously visible element, then show the new one
      if (currentVisible && currentVisible !== newVisible) {
        // Get current computed height and set it explicitly (transitions don't work from 'auto')
        const currentHeight = currentVisible.scrollHeight;
        currentVisible.style.height = `${currentHeight}px`;
        // Trigger reflow
        currentVisible.offsetHeight;
        // Now animate to 0
        currentVisible.style.height = '0';
        currentVisible.addEventListener(
          'transitionend',
          () => {
            if (newVisible) {
              showElement(newVisible);
            } else {
              isAnimating = false;
            }
          },
          { once: true },
        );
      } else if (newVisible) {
        // No previous element, just show the new one
        showElement(newVisible);
      }

      currentVisible = newVisible;
    }

    imagesContainer.addEventListener('scroll', checkVisibility);
    window.addEventListener('resize', checkVisibility);

    // Initial check
    checkVisibility();
  });
}

/********************/
/* Navbar indicator */
/********************/

const ANCHORS_ID = ['accueil', 'a-propos', 'projets', 'contact'];

document.addEventListener('DOMContentLoaded', setupNavbarScrollLink);

function setupNavbarScrollLink() {
  const links = Array.from(document.querySelectorAll('.navbar a'));
  const anchors = ANCHORS_ID.map((id) => document.getElementById(id));

  let targetIndex = null;

  function updateActive(initial = false) {
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
