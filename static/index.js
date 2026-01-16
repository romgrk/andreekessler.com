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
