document.addEventListener('DOMContentLoaded', () => {
  hideLoader();
  setupNavbarScrollLink();

  const setupLayout = async () => {
    await setupImageDimensions();
    await setupImageTextReveal();
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
