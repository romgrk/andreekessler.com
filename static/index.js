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

    // Create a wrapper for mobile layout to maintain consistent height
    const wrapper = document.createElement('div');
    wrapper.className = 'image-text-wrapper';
    const parent = elements[0].parentNode;
    elements.forEach((el) => wrapper.appendChild(el));
    parent.appendChild(wrapper);

    function setupLayout() {
      const mobile = isMobile();

      if (mobile) {
        // Mobile: position elements absolutely, set wrapper to tallest element height
        let maxHeight = 0;
        elements.forEach((element) => {
          // Reset styles to measure natural height
          element.style.height = 'auto';
          element.style.opacity = '';
          element.style.position = '';
          const height = element.scrollHeight;
          if (height > maxHeight) maxHeight = height;
        });

        wrapper.style.position = 'relative';
        wrapper.style.height = `${maxHeight}px`;

        elements.forEach((element) => {
          element.style.position = 'absolute';
          element.style.top = '0';
          element.style.left = '0';
          element.style.width = '100%';
          element.style.height = 'auto';
          element.style.opacity = '0';
          element.style.overflow = '';
        });
      } else {
        // Desktop: height animation
        wrapper.style.position = '';
        wrapper.style.height = '';

        elements.forEach((element) => {
          element.style.position = '';
          element.style.top = '';
          element.style.left = '';
          element.style.width = '';
          element.style.height = '0';
          element.style.opacity = '';
          element.style.overflow = 'hidden';
        });
      }

      // Reset state when layout changes
      if (mobile !== lastIsMobile) {
        currentVisible = null;
        isAnimating = false;
        lastIsMobile = mobile;
      }
    }

    function showElement(element) {
      if (isMobile()) {
        // Mobile: fade in
        // Trigger reflow to ensure transition happens
        element.offsetHeight;
        element.style.opacity = '1';

        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          isAnimating = false;
        };
        element.addEventListener('transitionend', finish, { once: true });
        // Fallback timeout in case transitionend doesn't fire
        setTimeout(finish, 450);
      } else {
        // Desktop: height animation
        element.style.height = 'auto';
        const naturalHeight = element.scrollHeight;
        element.style.height = '0';
        element.offsetHeight;
        element.style.height = `${naturalHeight}px`;

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
    }

    function hideElement(element, callback) {
      if (isMobile()) {
        // Mobile: fade out
        element.style.opacity = '0';

        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          callback();
        };
        element.addEventListener('transitionend', finish, { once: true });
        // Fallback timeout in case transitionend doesn't fire
        setTimeout(finish, 450);
      } else {
        // Desktop: height animation
        const currentHeight = element.scrollHeight;
        element.style.height = `${currentHeight}px`;
        element.offsetHeight;
        element.style.height = '0';
        element.addEventListener('transitionend', callback, { once: true });
      }
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

      if (currentVisible && currentVisible !== newVisible) {
        hideElement(currentVisible, () => {
          if (newVisible) {
            showElement(newVisible);
          } else {
            isAnimating = false;
          }
        });
      } else if (newVisible) {
        showElement(newVisible);
      }

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
