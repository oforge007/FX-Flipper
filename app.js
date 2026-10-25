document.addEventListener('DOMContentLoaded', () => {
  const priceValue = document.querySelector('.value');
  const delta = document.querySelector('.delta');

  if (priceValue) {
    priceValue.textContent = '$1.000';
  }

  if (delta) {
    delta.textContent = '+0.12%';
  }
});
