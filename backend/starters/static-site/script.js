// Show the current year in the footer
document.getElementById('year').textContent = new Date().getFullYear();

// Dark mode toggle (remembered in the browser)
const body = document.body;
if (localStorage.getItem('theme') === 'dark') body.classList.add('dark');

document.getElementById('theme').addEventListener('click', () => {
  body.classList.toggle('dark');
  localStorage.setItem('theme', body.classList.contains('dark') ? 'dark' : 'light');
});
