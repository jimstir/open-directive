// loading.js
// Sidebar navigation logic for loading.html

document.addEventListener('DOMContentLoaded', () => {
  const homeBtn = document.getElementById('homeBtn');
  const reportsBtn = document.getElementById('reportsBtn');
  const validatorBtn = document.getElementById('validatorBtn');
  const aboutBtn = document.getElementById('aboutBtn');

  function setActiveNav(activeBtn) {
    document.querySelectorAll('.nav-button').forEach(btn => {
      btn.classList.remove('active');
    });
    activeBtn?.classList.add('active');
  }

  homeBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    setActiveNav(null);
    window.location.href = 'report.html';
  });

  reportsBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    setActiveNav(reportsBtn);
    window.location.href = 'report.html';
  });

  validatorBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    setActiveNav(validatorBtn);
    // For now, go to report.html (update for validator page later)
    window.location.href = 'report.html';
  });

  aboutBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    setActiveNav(aboutBtn);
    // For now, go to report.html (update for about page later)
    window.location.href = 'report.html';
  });
});
