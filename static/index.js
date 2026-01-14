document.addEventListener('DOMContentLoaded', () => {
  const projects = Array.from(document.querySelectorAll('.project'));
  projects.forEach((project) => {
    const images = Array.from(
      project.querySelector('.project__images').querySelectorAll('img, video'),
    );

    images[0].addEventListener('load', async () => {
      let tries = 0;
      let height = 0;
      while (true) {
        height = images[0].clientHeight;

        if (height > 0) {
          break;
        }

        tries += 1;

        if (tries >= 10) {
          console.warn('Could not set image heights correctly.');
          height = 500;
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      images.forEach((img) => {
        img.style.height = `${height}px`;
      });
    });
  });
});
