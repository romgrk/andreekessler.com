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
