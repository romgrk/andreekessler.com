document.addEventListener('DOMContentLoaded', () => {
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
});

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
  images.forEach((img) => {
    img.style.height = `${height}px`;
  });
}
