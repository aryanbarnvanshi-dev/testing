(function(){
  window.SITE_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTeZtJOP880SPiIbYiyTgabu7rO1SK_etVByXLa2x8LFL9tqluOjIF25FlrOVI4aJuZn1CVLpp8Msmr/pub?output=csv";

  const gidMap = {
    'Latest_Notices': '0',
    'Homepage_Hero': '1138185747',
    'Upcoming_Events': '626556615',
    'School_Programs': '1741484813',
    'Fee_Structure': '229418024',
    'Management_Messages': '153222206',
    'School_Contact_Info': '1257749711', 
    'Gallery_Data': '1867332244'
  };

  window.fetchSheetTab = async function(tabName) {
    const url = window.SITE_SHEET_URL;
    if (!url || url.includes("YOUR_SHEET_ID_HERE")) {
      console.warn(`Sheet URL configuration missing for tab: ${tabName}`);
      return [];
    }
    const baseUrl = url.split('&gid=')[0].split('?')[0];
    const finalURL = `${baseUrl}?gid=${gidMap[tabName]}&output=csv`;
    try {
      const res = await fetch(finalURL);
      if (!res.ok) throw new Error("Network error");
      const text = await res.text();
      return parseCSV(text);
    } catch (err) {
      console.error(`Error fetching tab ${tabName}:`, err);
      return [];
    }
  };

  function getCurrentLang() {
    return document.documentElement.lang === 'hi' ? 'hi' : 'en';
  }

  function parseCSV(text) {
    const lines = text.split(/\r?\n/);
    if (lines.length < 2) return [];
    const headers = lines[0].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(h => h.trim().replace(/^"|"$/g, ''));
    const records = [];
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const fields = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(f => f.trim().replace(/^"|"$/g, ''));
        const item = {};
        headers.forEach((header, index) => { item[header] = fields[index] || ''; });
        records.push(item);
    }
    return records;
  }

  async function initLiveDynamicData() {
    const isHi = getCurrentLang() === 'hi';

    const notices = await window.fetchSheetTab('Latest_Notices');
    const noticeTrack = document.querySelector('.notice-track');
    if (noticeTrack && notices.length > 0) {
      noticeTrack.innerHTML = '';
      notices.forEach(n => {
        const span = document.createElement('span');
        span.textContent = isHi ? (n.Notice_HI || n.Notice_EN) : n.Notice_EN;
        noticeTrack.appendChild(span);
      });
    }

    if (document.querySelector('.hero')) {
      const heroData = await window.fetchSheetTab('Homepage_Hero');
      if (heroData.length > 0) {
        const h = heroData[0];
        const titleEl = document.querySelector('.hero h1');
        const descEl = document.querySelector('.hero .lead');
        const imgEl = document.querySelector('.hero-card img');
        
        if (titleEl) titleEl.textContent = isHi ? (h.Title_HI || h.Title_EN) : h.Title_EN;
        if (descEl) descEl.textContent = isHi ? (h.Lead_HI || h.Lead_EN) : h.Lead_EN;
        if (imgEl && h.Hero_Image_URL) imgEl.src = h.Hero_Image_URL;
      }

      const events = await window.fetchSheetTab('Upcoming_Events');
      const eventList = document.querySelector('.events');
      if (eventList && events.length > 0) {
        eventList.innerHTML = '';
        events.forEach(e => {
          const li = document.createElement('li');
          const title = isHi ? (e.Event_HI || e.Event_EN) : e.Event_EN;
          const date = isHi ? (e.Date_HI || e.Date_EN) : e.Date_EN;
          li.innerHTML = `<strong>${title}</strong> — <span>${date}</span>`;
          eventList.appendChild(li);
        });
      }
    }

    if (document.querySelector('.fee-table') || document.querySelector('main .container .cards')) {
      const programs = await window.fetchSheetTab('School_Programs');
      const programCardsContainer = document.querySelector('main .container .cards');
      if (programCardsContainer && programs.length > 0) {
        programCardsContainer.innerHTML = '';
        programs.forEach(p => {
          const art = document.createElement('article');
          art.className = 'card';
          const title = isHi ? (p.Group_HI || p.Group_EN) : p.Group_EN;
          const desc = isHi ? (p.Desc_HI || p.Desc_EN) : p.Desc_EN;
          art.innerHTML = `<h3>${title}</h3><p>${desc}</p>`;
          programCardsContainer.appendChild(art);
        });
      }

      const fees = await window.fetchSheetTab('Fee_Structure');
      const tbody = document.querySelector('.fee-table tbody');
      if (tbody && fees.length > 0) {
        tbody.innerHTML = '';
        fees.forEach(f => {
          const tr = document.createElement('tr');
          const cat = isHi ? (f.Category_HI || f.Category_EN) : f.Category_EN;
          tr.innerHTML = `<td style="padding:8px;border-bottom:1px solid #fafafa">${cat}</td>
                          <td style="padding:8px;text-align:right;border-bottom:1px solid #fafafa">${f.Fee_Amount}</td>`;
          tbody.appendChild(tr);
        });
      }
    }

    if (document.getElementById('principal-text') || document.getElementById('director-text')) {
      const messages = await window.fetchSheetTab('Management_Messages');
      messages.forEach(m => {
        const role = m.Role ? m.Role.trim().toLowerCase() : '';
        const textContent = isHi ? (m.Message_HI || m.Message_EN) : m.Message_EN;
        const nameContent = m.Name || '';
        const imgUrl = m.Photo_URL ? m.Photo_URL.trim() : '';

        if (role === 'principal') {
          const txt = document.getElementById('principal-text');
          const nm = document.getElementById('principal-name');
          const img = document.getElementById('principal-img');
          if (txt && textContent) txt.textContent = textContent;
          if (nm && nameContent) nm.textContent = `— ${nameContent}, Principal`;
          if (img && imgUrl) img.src = imgUrl;
        }
        
        if (role === 'director') {
          const txt = document.getElementById('director-text');
          const nm = document.getElementById('director-name');
          const img = document.getElementById('director-img');
          if (txt && textContent) txt.textContent = textContent;
          if (nm && nameContent) nm.textContent = `— ${nameContent}, Director`;
          if (img && imgUrl) img.src = imgUrl;
        }
      });
    }

    const contactContainer = document.querySelector('.contact-info-list') || document.getElementById('school-contact');
    if (contactContainer) {
      const contacts = await window.fetchSheetTab('School_Contact_Info');
      if (contacts.length > 0) {
        contactContainer.innerHTML = '';
        contacts.forEach(c => {
          if (c.Key && c.Value) {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${c.Key}:</strong> <span>${c.Value}</span>`;
            contactContainer.appendChild(li);
          }
        });
      }
    }

    const galleryContainer = document.querySelector('.gallery-grid') || document.getElementById('gallery-view');
    if (galleryContainer) {
      const galleryItems = await window.fetchSheetTab('Gallery_Data');
      if (galleryItems.length > 0) {
        galleryContainer.innerHTML = '';
        galleryItems.forEach(g => {
          const title = isHi ? (g['इवेंट का नाम (Hindi)'] || g['Event Title (English)']) : g['Event Title (English)'];
          const desc = isHi ? (g['विवरण (Hindi)'] || g['Description (English)']) : g['Description (English)'];
          const imgUrl = g['Image URL'] ? g['Image URL'].trim() : '';

          if (imgUrl) {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            item.innerHTML = `
              <img src="${imgUrl}" alt="${title}" loading="lazy">
              <div class="gallery-info">
                <h4>${title}</h4>
                <p>${desc}</p>
                ${g.Timestamp ? `<small>${g.Timestamp}</small>` : ''}
              </div>
            `;
            galleryContainer.appendChild(item);
          }
        });
      }
    }
  }

  function ensureToastContainer(){
    let c = document.querySelector('.toast-container');
    if(!c){
      c = document.createElement('div');
      c.className = 'toast-container';
      document.body.appendChild(c);
    }
    return c;
  }

  window.showToast = function(message, type = 'info', duration = 3000){
    const container = ensureToastContainer();
    const t = document.createElement('div');
    t.className = 'toast ' + (type === 'success' ? 'success' : (type === 'error' ? 'error' : ''));
    t.textContent = message;
    const close = document.createElement('button');
    close.className = 'close';
    close.type = 'button';
    close.innerText = '✕';
    close.addEventListener('click', () => remove());
    t.appendChild(close);
    container.appendChild(t);
    requestAnimationFrame(()=> t.classList.add('show'));
    const timer = setTimeout(remove, duration);
    function remove(){
      clearTimeout(timer);
      t.classList.remove('show');
      t.addEventListener('transitionend', ()=> t.remove(), { once: true });
      setTimeout(()=> t.remove(), 500);
    }
    return remove;
  }

  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('main-nav');
  if(toggle && nav){
    toggle.addEventListener('click', ()=> {
      nav.classList.toggle('open');
      const expanded = nav.classList.contains('open');
      toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    });
    nav.addEventListener('click', (e) => {
      const a = e.target.closest && e.target.closest('a');
      if(a) nav.classList.remove('open');
    }, { passive: true });
  }

  const y = document.getElementById('year');
  if(y) y.textContent = new Date().getFullYear();

  document.addEventListener('pointerdown', (e) => {
    const b = e.target.closest && e.target.closest('.btn');
    if(!b) return;
    b.classList.add('pressed');
    const cleanup = () => b.classList.remove('pressed');
    window.addEventListener('pointerup', cleanup, { once: true, passive: true });
    window.addEventListener('pointercancel', cleanup, { once: true, passive: true });
  }, { passive: true });

  const langBtn = document.getElementById('lang-btn');
  const userLang = localStorage.getItem('rkm_lang') || 'en';
  
  function applyLang(lang){
    document.documentElement.lang = lang;
    
    document.querySelectorAll('[data-en]').forEach(el=>{
      if(el.classList.contains('notice-track') || el.closest('.events') || el.closest('.fee-table') || el.closest('.principal') || el.closest('.director') || el.closest('.contact-info-list') || el.closest('#school-contact') || el.closest('.gallery-grid') || el.closest('#gallery-view')) return;
      const en = el.getAttribute('data-en');
      const hi = el.getAttribute('data-hi') || en;
      el.textContent = (lang === 'hi') ? hi : en;
    });
    if(langBtn) {
      langBtn.textContent = (lang === 'hi') ? 'English' : 'हिंदी';
      langBtn.setAttribute('aria-pressed', (lang === 'hi') ? 'true' : 'false');
    }
    localStorage.setItem('rkm_lang', lang);
    
    initLiveDynamicData();
    window.dispatchEvent(new CustomEvent('languageChanged'));
  }
  
  if(langBtn){
    langBtn.addEventListener('click', ()=> {
      const next = (localStorage.getItem('rkm_lang') === 'hi') ? 'en' : 'hi';
      applyLang(next);
    }, { passive: true });
  }
  
  applyLang(userLang);
  initLiveDynamicData();

})();