/**
 * Builds the page DOM from window.YK.data. The HTML only ships empty
 * containers; everything user-facing is rendered here from trusted local data.
 */
window.YK = window.YK || {};

(() => {
  const cardsHtml = (section) => section.cards.map((card) => `
    <a class="wander-card" href="${card.href}" target="_blank" rel="noopener" style="background-image:url('${card.image}')">
      <span class="wander-card-shade"></span>
      <span class="wander-card-body">
        <span class="wander-card-tag">${card.tag}</span>
        <span class="wander-card-name">${card.name}</span>
        <span class="wander-card-desc">${card.desc}</span>
        <span class="wander-card-go">${section.cta} <i class="${section.ctaIcon}"></i></span>
      </span>
    </a>`).join('');

  const renderSection = (key, section) => {
    document.getElementById(`${key}Title`).textContent = section.title;
    document.getElementById(`${key}Sub`).textContent = section.subtitle;
    document.getElementById(`${key}Track`).innerHTML = cardsHtml(section);
  };

  window.YK.render = (data) => {
    document.getElementById('profileAvatar').src = data.avatar;
    document.getElementById('bgm').src = data.audio;

    document.getElementById('profileInfo').innerHTML =
      data.info.map((line) => `<p>${line}</p>`).join('');

    document.getElementById('socialLinks').innerHTML = data.links.map((link) => `
      <a class="button" href="${link.href}" target="${link.target}" rel="noopener" style="--brand:${link.brand}">
        <div class="icon"><img src="${link.icon}" alt="${link.label}"></div><span>${link.label}</span>
      </a>`).join('');

    renderSection('projects', data.projects);
    renderSection('wander', data.wander);
  };
})();
