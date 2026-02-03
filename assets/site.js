(function(){
  const path = location.pathname.replace(/index\.html$/, '');
  document.querySelectorAll('nav a, .mobile-nav a').forEach(a=>{
    const href = a.getAttribute('href');
    if(!href) return;
    const normalized = href.replace(/index\.html$/, '');
    if(normalized === path || (normalized !== '/' && path.startsWith(normalized))) a.classList.add('active');
  });

  const btn = document.getElementById('menuBtn');
  const mobile = document.getElementById('mobileNav');
  if(btn && mobile){
    btn.addEventListener('click', ()=> mobile.classList.toggle('open'));
  }
})();

async function loadJobs(){
  const res = await fetch('/data/jobs.json', {cache:'no-store'});
  if(!res.ok) throw new Error('Failed to load jobs.json');
  return await res.json();
}

function el(tag, attrs={}, children=[]){
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k,v])=>{
    if(k === 'class') e.className = v;
    else if(k === 'html') e.innerHTML = v;
    else e.setAttribute(k, v);
  });
  children.forEach(c=> e.appendChild(c));
  return e;
}

async function renderJobsList(targetId){
  const target = document.getElementById(targetId);
  if(!target) return;
  try{
    const jobs = await loadJobs();
    jobs.sort((a,b)=> (b.posted||'').localeCompare(a.posted||''));
    if(jobs.length === 0){
      target.appendChild(el('div', {class:'card card-pad'}, [document.createTextNode('No roles are live right now. Please check back soon.')]));
      return;
    }
    const list = el('div', {class:'job-list'});
    jobs.forEach(j=>{
      const href = `/jobs/job.html?ref=${encodeURIComponent(j.ref)}`;
      const card = el('div', {class:'card card-pad job-card'});
      const title = el('h3', {}, [document.createTextNode(j.title)]);
      const meta = el('div', {class:'job-meta', html:
        `${escapeHtml(j.location || 'UK')} • ${escapeHtml(j.type || 'Contract')} • ${escapeHtml(j.salary || '')}`.replace(/\s•\s$/, '')
      });
      const tags = el('div', {class:'pill'});
      (j.tags||[]).slice(0,4).forEach(t=> tags.appendChild(el('span', {class:'tag'}, [document.createTextNode(t)])));
      const link = el('a', {href});
      link.appendChild(title);
      link.appendChild(meta);
      link.appendChild(tags);
      card.appendChild(link);
      list.appendChild(card);
    });
    target.appendChild(list);
  }catch(err){
    target.appendChild(el('div', {class:'card card-pad'}, [document.createTextNode('Could not load jobs at this time.')]));
  }
}

function makeChip(label, count, active, onClick){
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `chip${active ? ' is-active' : ''}`;
  btn.innerHTML = `<span>${escapeHtml(label)}</span><span class="count">${count}</span>`;
  btn.addEventListener('click', onClick);
  return btn;
}

function uniq(arr){
  return Array.from(new Set(arr));
}

function countBy(items, getter){
  const map = new Map();
  items.forEach(i => {
    const v = getter(i);
    if(v === undefined || v === null || v === '') return;
    map.set(v, (map.get(v) || 0) + 1);
  });
  return map;
}

function jobCardCatalogue(job){
  const href = `/jobs/job.html?ref=${encodeURIComponent(job.ref)}`;
  const a = document.createElement('a');
  a.className = 'catalogue-card';
  a.href = href;

  const tags = (job.tags || []).slice(0, 3);
  const posted = job.posted ? String(job.posted) : '';

  a.innerHTML = `
    <div class="top">
      <div>
        <h3>${escapeHtml(job.title || '')}</h3>
      </div>
      <div class="badges">
        ${job.type ? `<span class="badge">${escapeHtml(job.type)}</span>` : ''}
        ${job.location ? `<span class="badge">${escapeHtml(job.location)}</span>` : ''}
      </div>
    </div>
    <p>${escapeHtml(job.summary || '')}</p>
    <div class="footer">
      <span>${escapeHtml(posted)}</span>
      <span>${tags.map(t => `#${escapeHtml(t)}`).join(' ')}</span>
    </div>
  `;

  return a;
}

async function renderJobsCatalogue(opts){
  const {
    targetId,
    searchId,
    clearId,
    countId,
    typeChipsId,
    locationChipsId,
    tagChipsId,
    sortId
  } = opts || {};

  const target = document.getElementById(targetId);
  if(!target) return;

  const search = document.getElementById(searchId);
  const clear = document.getElementById(clearId);
  const countEl = document.getElementById(countId);
  const typeWrap = document.getElementById(typeChipsId);
  const locationWrap = document.getElementById(locationChipsId);
  const tagWrap = document.getElementById(tagChipsId);
  const sortSel = document.getElementById(sortId);

  const state = {
    q: '',
    type: null,
    location: null,
    tag: null,
    view: 'grid',
    sort: 'newest'
  };

  let jobs = [];
  try{
    jobs = await loadJobs();
  }catch(e){
    target.appendChild(el('div', {class:'card card-pad'}, [document.createTextNode('Could not load jobs at this time.')] ));
    return;
  }

  function buildChips(){
    if(!typeWrap || !locationWrap || !tagWrap) return;

    const types = uniq(jobs.map(j => j.type).filter(Boolean)).sort();
    const locations = uniq(jobs.map(j => j.location).filter(Boolean)).sort();

    const allTags = [];
    jobs.forEach(j => (j.tags || []).forEach(t => allTags.push(t)));
    const tags = uniq(allTags).sort();

    const typeCounts = countBy(jobs, j => j.type);
    const locCounts = countBy(jobs, j => j.location);
    const tagCounts = countBy(allTags.map(t => ({t})), x => x.t);

    typeWrap.innerHTML = '';
    locationWrap.innerHTML = '';
    tagWrap.innerHTML = '';

    typeWrap.appendChild(makeChip('All', jobs.length, state.type === null, () => { state.type = null; render(); }));
    types.forEach(t => typeWrap.appendChild(makeChip(
      t, typeCounts.get(t) || 0, state.type === t,
      () => { state.type = (state.type === t) ? null : t; render(); }
    )));

    locationWrap.appendChild(makeChip('All', jobs.length, state.location === null, () => { state.location = null; render(); }));
    locations.forEach(l => locationWrap.appendChild(makeChip(
      l, locCounts.get(l) || 0, state.location === l,
      () => { state.location = (state.location === l) ? null : l; render(); }
    )));

    tagWrap.appendChild(makeChip('All', jobs.length, state.tag === null, () => { state.tag = null; render(); }));
    tags.forEach(t => tagWrap.appendChild(makeChip(
      t, tagCounts.get(t) || 0, state.tag === t,
      () => { state.tag = (state.tag === t) ? null : t; render(); }
    )));
  }

  function applyFilters(items){
    const q = (state.q || '').trim().toLowerCase();
    return items.filter(j => {
      const inQ = !q
        || String(j.title || '').toLowerCase().includes(q)
        || String(j.summary || '').toLowerCase().includes(q)
        || String(j.location || '').toLowerCase().includes(q)
        || String(j.type || '').toLowerCase().includes(q)
        || (j.tags || []).some(t => String(t).toLowerCase().includes(q));

      const inType = !state.type || j.type === state.type;
      const inLoc = !state.location || j.location === state.location;
      const inTag = !state.tag || (j.tags || []).includes(state.tag);

      return inQ && inType && inLoc && inTag;
    });
  }

  function applySort(items){
    const copy = items.slice();
    switch(state.sort){
      case 'oldest':
        copy.sort((a,b)=> String(a.posted||'').localeCompare(String(b.posted||'')) || String(a.title||'').localeCompare(String(b.title||'')));
        break;
      case 'az':
        copy.sort((a,b)=> String(a.title||'').localeCompare(String(b.title||'')));
        break;
      case 'za':
        copy.sort((a,b)=> String(b.title||'').localeCompare(String(a.title||'')));
        break;
      case 'newest':
      default:
        copy.sort((a,b)=> String(b.posted||'').localeCompare(String(a.posted||'')) || String(a.title||'').localeCompare(String(b.title||'')));
        break;
    }
    return copy;
  }

  function setView(view){
    state.view = view;
    target.classList.toggle('is-list', view === 'list');
  }

  function render(){
    buildChips();
    const filtered = applyFilters(jobs);
    const sorted = applySort(filtered);

    if(countEl) countEl.textContent = String(sorted.length);

    target.innerHTML = '';
    setView(state.view);

    if(sorted.length === 0){
      target.appendChild(el('div', {class:'card card-pad'}, [document.createTextNode('No results. Try clearing filters or searching different keywords.')] ));
      return;
    }

    sorted.forEach(j => target.appendChild(jobCardCatalogue(j)));
  }

  // wiring
  if(search){
    search.addEventListener('input', (e)=>{ state.q = e.target.value; render(); });
  }
  if(clear){
    clear.addEventListener('click', ()=>{
      state.q = '';
      state.type = null;
      state.location = null;
      state.tag = null;
      if(search) search.value = '';
      render();
    });
  }
  if(sortSel){
    sortSel.addEventListener('change', (e)=>{ state.sort = e.target.value; render(); });
  }

  // view toggle buttons live in the page
  document.querySelectorAll('.seg-btn').forEach(btn => {
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      setView(btn.dataset.view);
      render();
    });
  });

  // Keyboard shortcut: '/' focuses catalogue search
  document.addEventListener('keydown', (e)=>{
    if(e.key === '/' && search && document.activeElement !== search){
      e.preventDefault();
      search.focus();
    }
  });

  render();
}

async function renderJobDetail(targetId){
  const target = document.getElementById(targetId);
  if(!target) return;

  const params = new URLSearchParams(location.search);
  const ref = params.get('ref');
  if(!ref){
    target.appendChild(el('div', {class:'card card-pad'}, [document.createTextNode('Missing job reference.')]));
    return;
  }

  try{
    const jobs = await loadJobs();
    const job = jobs.find(j => String(j.ref).toLowerCase() === String(ref).toLowerCase());
    if(!job){
      target.appendChild(el('div', {class:'card card-pad'}, [document.createTextNode('Job not found.')]));
      return;
    }

    document.title = `${job.title} | Xentri`;
    const header = el('div', {class:'card card-pad-lg'});
    header.appendChild(el('h2', {}, [document.createTextNode(job.title)]));
    header.appendChild(el('div', {class:'job-meta', html:
      `${escapeHtml(job.location || 'UK')} • ${escapeHtml(job.type || '')} • ${escapeHtml(job.salary || '')}`.replace(/\s•\s$/, '')
    }));
    const tags = el('div', {class:'pill'});
    (job.tags||[]).forEach(t=> tags.appendChild(el('span', {class:'tag'}, [document.createTextNode(t)])));
    header.appendChild(tags);

    const body = el('div', {class:'card card-pad-lg'});
    if(job.summary) body.appendChild(el('p', {class:'lead', html: escapeHtml(job.summary)}));
    if(job.description) body.appendChild(el('div', {html: markdownish(job.description)}));

    if(job.responsibilities && job.responsibilities.length){
      body.appendChild(el('hr', {class:'line'}));
      body.appendChild(el('h3', {}, [document.createTextNode('Responsibilities')]));
      body.appendChild(listify(job.responsibilities));
    }

    if(job.requirements && job.requirements.length){
      body.appendChild(el('hr', {class:'line'}));
      body.appendChild(el('h3', {}, [document.createTextNode('Requirements')]));
      body.appendChild(listify(job.requirements));
    }

    target.appendChild(header);
    target.appendChild(el('div', {style:'height:14px'}));
    target.appendChild(body);

    const jobRefField = document.querySelector('input[name="job_ref"]');
    const jobTitleField = document.querySelector('input[name="job_title"]');
    if(jobRefField) jobRefField.value = job.ref || ref;
    if(jobTitleField) jobTitleField.value = job.title || '';
  }catch(err){
    target.appendChild(el('div', {class:'card card-pad'}, [document.createTextNode('Could not load job details.')]));
  }
}

function listify(items){
  const ul = document.createElement('ul');
  ul.style.margin = '8px 0 0 18px';
  items.forEach(i=>{
    const li = document.createElement('li');
    li.textContent = i;
    ul.appendChild(li);
  });
  return ul;
}

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#039;'}[s]));
}

function markdownish(text){
  // super lightweight: paragraphs + line breaks + bullet lines starting with "- "
  const lines = String(text).split('\n');
  let html = '';
  for(const line of lines){
    if(line.startsWith('- ')){
      // build bullet list
      const bullets = [];
      let idx = lines.indexOf(line);
    }
  }
  // Keep it simple: turn blank lines into paragraph breaks
  const safe = escapeHtml(text).replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br/>');
  return `<p>${safe}</p>`;
}
