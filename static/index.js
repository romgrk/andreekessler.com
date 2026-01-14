document.addEventListener('DOMContentLoaded', () => {
  const projects = Array.from(document.querySelectorAll('.project'));
  projects.forEach((project) => {
    const images = Array.from(
      project.querySelector('.project__images').querySelectorAll('img, video'),
    );

    console.log(images);
    images[0].addEventListener('load', () => {
      const height = images[0].clientHeight;
      console.log({ height });
      images.forEach((img) => {
        img.style.height = `${height}px`;
      });
    });
  });
});
