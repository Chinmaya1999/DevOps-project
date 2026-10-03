// Runs before first paint (external file so the CSP can stay script-src 'self'): prevents a light/dark flash.
(function () {
  try {
    var saved = localStorage.getItem('theme');
    var dark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  } catch (e) { document.documentElement.classList.add('dark'); }
})();
