/* ═══════════════════════════════════════════════════════════
   RANDIKA PRABASHWARA PORTFOLIO — APPLICATION ENGINE
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ── DATA LOADER ─────────────────────────────────────────── */
const DataLoader = {
  cache: {},

  async fetch(path) {
    if (this.cache[path]) return this.cache[path];
    const r = await fetch(path);
    if (!r.ok) throw new Error(`Failed to load ${path}: ${r.status}`);
    this.cache[path] = await r.json();
    return this.cache[path];
  },

  async loadAll() {
    const [profile, manifest] = await Promise.all([
      this.fetch('data/profile.json'),
      this.fetch('data/projects/manifest.json'),
    ]);
    const projects = await Promise.all(
      manifest.map(entry => this.fetch(entry.file))
    );
    return { profile, projects };
  }
};

/* ── PARTICLE BACKGROUND ─────────────────────────────────── */
const Particles = {
  canvas: null,
  ctx: null,
  particles: [],
  symbols: ['</>', '{...}', '∑', '∂', '∇', 'λ', 'f(x)', '01', 'ML', 'AI', '⊕', '∈', '≈', 'Δ'],
  raf: null,

  init() {
    this.canvas = document.getElementById('particles-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    this.create();
    this.animate();
    window.addEventListener('resize', () => { this.resize(); this.create(); });
  },

  resize() {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
  },

  create() {
    const count = Math.floor((window.innerWidth * window.innerHeight) / 20000);
    this.particles = Array.from({ length: Math.max(count, 12) }, () => this.makeParticle());
  },

  makeParticle() {
    return {
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -Math.random() * 0.4 - 0.1,
      alpha: Math.random() * 0.4 + 0.1,
      symbol: this.symbols[Math.floor(Math.random() * this.symbols.length)],
      size: Math.random() * 4 + 9,
    };
  },

  animate() {
    this.raf = requestAnimationFrame(() => this.animate());
    const { ctx, canvas, particles } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const baseColor = isDark ? '0, 200, 255' : '0, 100, 200';

    particles.forEach((p, i) => {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha += (Math.random() - 0.5) * 0.01;
      p.alpha = Math.max(0.05, Math.min(0.45, p.alpha));

      if (p.y < -20 || p.x < -50 || p.x > canvas.width + 50) {
        particles[i] = { ...this.makeParticle(), y: canvas.height + 20 };
        return;
      }

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.font = `${p.size}px 'Fira Code', monospace`;
      ctx.fillStyle = `rgba(${baseColor}, 1)`;
      ctx.fillText(p.symbol, p.x, p.y);
      ctx.restore();
    });
  }
};

/* ── THEME ───────────────────────────────────────────────── */
const Theme = {
  current: 'dark',

  init() {
    this.current = localStorage.getItem('rp-theme') || 'dark';
    this.apply(this.current, false);

    document.getElementById('theme-toggle')?.addEventListener('click', () => {
      this.toggle();
    });
  },

  toggle() {
    this.apply(this.current === 'dark' ? 'light' : 'dark', true);
  },

  apply(theme, save = true) {
    this.current = theme;
    document.documentElement.setAttribute('data-theme', theme);
    if (save) localStorage.setItem('rp-theme', theme);

    const btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.innerHTML = theme === 'dark'
        ? '<i class="fas fa-sun"></i><span>Light</span>'
        : '<i class="fas fa-moon"></i><span>Dark</span>';
    }
  }
};

/* ── NAV ─────────────────────────────────────────────────── */
const Nav = {
  init() {
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('nav-mobile');

    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
      // Active section
      this.updateActive();
    });

    hamburger?.addEventListener('click', () => {
      mobileMenu?.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (!navbar.contains(e.target)) mobileMenu?.classList.remove('open');
    });

    // Close mobile menu on link click
    mobileMenu?.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => mobileMenu.classList.remove('open'));
    });

    // Scroll to top
    const scrollBtn = document.getElementById('scroll-top');
    window.addEventListener('scroll', () => {
      scrollBtn?.classList.toggle('visible', window.scrollY > 400);
    });
    scrollBtn?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  },

  updateActive() {
    const sections = document.querySelectorAll('section[id]');
    let current = '';
    sections.forEach(s => {
      if (window.scrollY >= s.offsetTop - 100) current = s.id;
    });
    document.querySelectorAll('.nav-link').forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === `#${current}`);
    });
  }
};

/* ── SCROLL REVEAL ───────────────────────────────────────── */
const ScrollReveal = {
  observer: null,

  init() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          this.observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

    document.querySelectorAll('.reveal').forEach(el => this.observer.observe(el));
  },

  observe(el) { this.observer?.observe(el); }
};

/* ── TYPEWRITER ──────────────────────────────────────────── */
const Typewriter = {
  el: null,
  roles: [],
  current: 0,
  charIdx: 0,
  deleting: false,
  timer: null,

  init(el, roles) {
    this.el = el;
    this.roles = roles;
    this.tick();
  },

  tick() {
    const word = this.roles[this.current];
    if (this.deleting) {
      this.el.textContent = word.slice(0, --this.charIdx);
    } else {
      this.el.textContent = word.slice(0, ++this.charIdx);
    }

    let delay = this.deleting ? 40 : 80;
    if (!this.deleting && this.charIdx === word.length) { delay = 2000; this.deleting = true; }
    if (this.deleting && this.charIdx === 0) {
      this.deleting = false;
      this.current = (this.current + 1) % this.roles.length;
      delay = 400;
    }
    this.timer = setTimeout(() => this.tick(), delay);
  }
};

/* ── HERO RENDERER ───────────────────────────────────────── */
const HeroRenderer = {
  render(hero) {
    const el = document.getElementById('hero-root');
    if (!el) return;

    el.innerHTML = `
      <div class="hero-inner reveal">
        <div class="hero-greeting">${hero.greeting}</div>
        <h1 class="hero-name">${hero.name}</h1>
        <div class="hero-role-wrapper">
          <span class="hero-role" id="hero-role"></span>
        </div>
        <p class="hero-tagline">${hero.tagline}<br>
          <span style="color:var(--text-3);font-size:.95em">${hero.description}</span>
        </p>
        <div class="hero-ctas">
          ${hero.ctas.map(c => `
            <a href="${c.href}" class="btn btn-${c.style}">
              <i class="${c.icon}"></i>${c.label}
            </a>
          `).join('')}
        </div>
        <div class="hero-stats">
          ${hero.stats.map(s => `
            <div class="hero-stat">
              <span class="hero-stat-value">${s.value}</span>
              <span class="hero-stat-label">${s.label}</span>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="scroll-indicator">
        <span>SCROLL</span>
        <i class="fas fa-chevron-down"></i>
      </div>
    `;

    setTimeout(() => {
      Typewriter.init(document.getElementById('hero-role'), hero.roles);
      ScrollReveal.observe(el.querySelector('.reveal'));
    }, 100);
  }
};

/* ── JOURNEY RENDERER ────────────────────────────────────── */
const JourneyRenderer = {
  render(profile) {
    const { journey, meta } = profile;
    const el = document.getElementById('journey-root');
    if (!el) return;

    el.innerHTML = `
      <div class="journey-grid">
        <!-- Profile Card -->
        <div class="profile-card reveal">
          <div class="profile-photo-frame">
            <img src="${meta.photo}" alt="${meta.name}" loading="lazy">
            <div class="profile-photo-overlay"></div>
          </div>
          <div class="profile-card-body">
            <div class="profile-name-tag">${meta.name}</div>
            <div class="profile-role-tag">// ${meta.title}</div>
            <p class="profile-bio">${journey.bio}</p>
            <div class="profile-highlights">
              ${journey.highlights.map(h => `
                <div class="profile-highlight">
                  <span>${h.icon}</span>
                  <span>${h.text}</span>
                </div>
              `).join('')}
            </div>
            <div class="profile-actions">
              <a href="${meta.resume}" download class="btn btn-primary" style="justify-content:center">
                <i class="fas fa-download"></i>Download Resume
              </a>
              <a href="#contact" class="btn btn-secondary" style="justify-content:center">
                <i class="fas fa-envelope"></i>Get In Touch
              </a>
            </div>
          </div>
        </div>

        <!-- Journey Content -->
        <div class="journey-content reveal reveal-delay-1">
          <div class="journey-tabs">
            <button class="journey-tab active" data-tab="experience">
              <i class="fas fa-briefcase" style="margin-right:6px;font-size:.85em"></i>Experience
            </button>
            <button class="journey-tab" data-tab="education">
              <i class="fas fa-graduation-cap" style="margin-right:6px;font-size:.85em"></i>Education
            </button>
          </div>

          <div class="journey-panel active" id="panel-experience">
            <div class="timeline">
              ${journey.experience.map(e => {
                const isCurrent = e.period.includes('Present');
                return `
                <div class="timeline-item">
                  <div class="timeline-dot"><i class="${e.icon}"></i></div>
                  <div class="timeline-card">
                    <div class="timeline-meta">
                      <div class="timeline-role">
                        ${e.role}
                        ${isCurrent ? '<span class="timeline-current-badge">Current</span>' : ''}
                      </div>
                      <span class="timeline-period">${e.period}</span>
                    </div>
                    ${e.companyUrl
                      ? `<a href="${e.companyUrl}" target="_blank" rel="noopener" class="timeline-company" style="text-decoration:none">${e.company} <i class="fas fa-external-link-alt" style="font-size:.65em;opacity:.6"></i></a>`
                      : `<div class="timeline-company">${e.company}</div>`
                    }
                    <div class="timeline-location"><i class="fas fa-map-marker-alt" style="margin-right:5px;font-size:.75em"></i>${e.location}</div>
                    <span class="timeline-type-badge type-${e.type.toLowerCase()}">${e.type}</span>
                    <ul class="timeline-highlights">
                      ${e.highlights.map(h => `<li>${h}</li>`).join('')}
                    </ul>
                  </div>
                </div>`;
              }).join('')}
            </div>
          </div>

          <div class="journey-panel" id="panel-education">
            <div class="timeline">
              ${journey.education.map(e => `
                <div class="timeline-item">
                  <div class="timeline-dot"><i class="${e.icon}"></i></div>
                  <div class="timeline-card">
                    <div class="timeline-meta">
                      <div class="timeline-role">${e.degree}</div>
                      <span class="timeline-period">${e.period}</span>
                    </div>
                    <div class="timeline-company">${e.institution}</div>
                    <div class="timeline-location"><i class="fas fa-map-marker-alt" style="margin-right:5px;font-size:.75em"></i>${e.location}</div>
                    <p style="font-size:.85rem;color:var(--text-3);margin:6px 0 8px;font-style:italic">${e.field}</p>
                    <ul class="edu-details">
                      ${e.details.map(d => `<li>${d}</li>`).join('')}
                    </ul>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    // Tab switching
    el.querySelectorAll('.journey-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        el.querySelectorAll('.journey-tab').forEach(t => t.classList.remove('active'));
        el.querySelectorAll('.journey-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`panel-${tab.dataset.tab}`)?.classList.add('active');
      });
    });

    el.querySelectorAll('.reveal').forEach(r => ScrollReveal.observe(r));
  }
};

/* ── PUBLICATIONS RENDERER ───────────────────────────────── */
const PublicationsRenderer = {
  render(publications) {
    const el = document.getElementById('pub-root');
    if (!el) return;

    el.innerHTML = publications.map(p => `
      <div class="pub-card reveal">
        <div>
          <div class="pub-meta">
            <span class="pub-type-badge">${p.type}</span>
            <span class="pub-status">${p.status}</span>
            <span class="pub-year">${p.year}</span>
          </div>
          <h3 class="pub-title">${p.title}</h3>
          <p class="pub-authors">${p.authors.map((a, i) => i === 0 ? `<strong>${a}</strong>` : a).join(', ')}</p>
          <p class="pub-venue">${p.venue}</p>
          <p class="pub-abstract">${p.abstract}</p>
          ${p.metrics?.length ? `
            <div class="pub-metrics">
              ${p.metrics.map(m => `
                <div class="pub-metric">
                  <div class="value">${m.value}</div>
                  <div class="label">${m.label}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}
          <div class="pub-links">
            ${p.links.pdf ? `<a href="${p.links.pdf}" class="pub-link-btn"><i class="fas fa-file-pdf"></i>PDF</a>` : `<span class="pub-link-btn disabled"><i class="fas fa-file-pdf"></i>PDF</span>`}
            ${p.links.doi ? `<a href="${p.links.doi}" class="pub-link-btn"><i class="fas fa-external-link-alt"></i>DOI</a>` : `<span class="pub-link-btn disabled"><i class="fas fa-external-link-alt"></i>DOI</span>`}
            ${p.links.github ? `<a href="${p.links.github}" target="_blank" class="pub-link-btn"><i class="fab fa-github"></i>Code</a>` : ''}
          </div>
        </div>
      </div>
    `).join('');

    el.querySelectorAll('.reveal').forEach(r => ScrollReveal.observe(r));
  }
};

/* ── PROJECTS RENDERER ───────────────────────────────────── */
const ProjectsRenderer = {
  projects: [],
  active: 'all',
  query: '',
  counts: {},
  page: 1,
  perPage: 6,

  render(projects) {
    this.projects = projects;
    const el = document.getElementById('projects-root');
    if (!el) return;

    this.counts = { all: projects.length };
    projects.forEach(p => { this.counts[p.category] = (this.counts[p.category] || 0) + 1; });

    const cats = [
      ['all','All'], ['research','Research'], ['enterprise','Enterprise'],
      ['aiml','AI & ML'], ['datascience','Data Science'],
      ['academic','Academic'], ['bigdata','Big Data'],
    ];

    el.innerHTML = `
      <div class="projects-controls reveal">
        <div class="filter-tabs-wrap">
          <div class="filter-tabs" id="filter-tabs">
            ${cats.filter(([cat]) => cat === 'all' || this.counts[cat])
              .map(([cat, label]) => `
                <button class="filter-tab ${cat === 'all' ? 'active' : ''}" data-cat="${cat}">
                  ${label} <span class="filter-count">${this.counts[cat] || 0}</span>
                </button>
              `).join('')}
          </div>
        </div>
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input type="text" id="project-search" placeholder="Search by name, tech, tag…">
          <span id="search-clear" style="display:none;cursor:pointer;color:var(--text-3);font-size:.85rem;padding:0 4px">✕</span>
        </div>
      </div>
      <div class="projects-grid" id="projects-grid"></div>
      <div class="pagination-bar" id="pagination-bar"></div>
    `;

    this.renderGrid();

    el.querySelectorAll('.filter-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        el.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.active = tab.dataset.cat;
        this.page = 1;
        this.renderGrid();
      });
    });

    const searchInput = document.getElementById('project-search');
    const searchClear = document.getElementById('search-clear');
    searchInput?.addEventListener('input', (e) => {
      this.query = e.target.value.toLowerCase();
      this.page = 1;
      searchClear.style.display = this.query ? 'inline' : 'none';
      this.renderGrid();
    });
    searchClear?.addEventListener('click', () => {
      searchInput.value = '';
      this.query = '';
      this.page = 1;
      searchClear.style.display = 'none';
      this.renderGrid();
    });

    el.querySelectorAll('.reveal').forEach(r => ScrollReveal.observe(r));
  },

  filtered() {
    return this.projects.filter(p => {
      const catMatch = this.active === 'all' || p.category === this.active;
      const q = this.query;
      const qMatch = !q || [
        p.title, p.shortTitle, p.summary, p.category, p.subcategory, p.projectType,
        p.problem, p.solution,
        ...(p.tags || []),
        ...Object.values(p.techStack || {}).flat(),
        ...Object.values(p.expandable || {}).map(s => s.content || ''),
      ].some(s => s?.toLowerCase().includes(q));
      return catMatch && qMatch;
    });
  },

  sorted(list) {
    return [...list].sort((a, b) => {
      const pa = a.priority ?? 99, pb = b.priority ?? 99;
      if (pa !== pb) return pa - pb;
      if (b.featured !== a.featured) return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      const so = { 'in-progress': 0, 'ongoing': 0, 'peer-review': 1, 'completed': 2 };
      return (so[a.status] ?? 3) - (so[b.status] ?? 3);
    });
  },

  renderGrid() {
    const grid = document.getElementById('projects-grid');
    const pbar = document.getElementById('pagination-bar');
    if (!grid) return;

    const all = this.sorted(this.filtered());
    const total = all.length;
    const totalPages = Math.ceil(total / this.perPage);
    this.page = Math.min(this.page, totalPages || 1);
    const start = (this.page - 1) * this.perPage;
    const list  = all.slice(start, start + this.perPage);

    if (!total) {
      grid.innerHTML = `
        <div class="projects-empty">
          <i class="fas fa-search"></i>
          <p>No projects match <strong>"${this.query}"</strong></p>
          <p style="font-size:.8rem;margin-top:8px;color:var(--text-3)">Try: PyTorch · GAN · FastAPI · GPS · OCR</p>
        </div>`;
      if (pbar) pbar.innerHTML = '';
      return;
    }

    grid.innerHTML = list.map(p => this.makeCard(p)).join('');

    grid.querySelectorAll('.completion-ring').forEach(ring => {
      const pct = parseInt(ring.dataset.pct);
      const r = 16, circ = 2 * Math.PI * r;
      const fill = ring.querySelector('.ring-fill');
      fill.style.strokeDasharray = circ;
      fill.style.strokeDashoffset = circ;
      setTimeout(() => { fill.style.strokeDashoffset = circ - (circ * pct / 100); }, 100);
    });

    grid.querySelectorAll('.project-card').forEach(card => {
      card.addEventListener('click', () => {
        const proj = this.projects.find(p => p.id === card.dataset.id);
        if (proj) Modal.open(proj);
      });
    });

    // Pagination bar
    if (!pbar) return;
    if (totalPages <= 1) { pbar.innerHTML = ''; return; }

    const s = start + 1, e = Math.min(start + this.perPage, total);
    pbar.innerHTML = `
      <div class="pagination">
        <span class="page-info">Showing ${s}–${e} of ${total} projects</span>
        <div class="page-btns">
          <button class="page-btn" id="pg-prev" ${this.page === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i>
          </button>
          ${Array.from({ length: totalPages }, (_, i) => i + 1).map(n => `
            <button class="page-btn page-num ${n === this.page ? 'active' : ''}" data-page="${n}">${n}</button>
          `).join('')}
          <button class="page-btn" id="pg-next" ${this.page === totalPages ? 'disabled' : ''}>
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    `;
    pbar.querySelector('#pg-prev')?.addEventListener('click', () => this.goPage(this.page - 1));
    pbar.querySelector('#pg-next')?.addEventListener('click', () => this.goPage(this.page + 1));
    pbar.querySelectorAll('.page-num').forEach(btn => {
      btn.addEventListener('click', () => this.goPage(parseInt(btn.dataset.page)));
    });
  },

  goPage(n) {
    this.page = n;
    this.renderGrid();
    document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  makeCard(p) {
    const catColor = { research: '#00C8FF', enterprise: '#10B981', bigdata: '#8B5CF6' }[p.category] || '#00C8FF';
    const allTechs = Object.values(p.techStack || {}).flat();
    const preview = allTechs.slice(0, 4);
    const extra = allTechs.length - preview.length;
    const r = 16, circ = 2 * Math.PI * r;

    return `
      <div class="project-card cat-${p.category}" data-id="${p.id}">
        <div class="project-card-header">
          <div class="project-badges">
            <span class="badge badge-cat-${p.category}">${p.category === 'bigdata' ? 'Big Data' : p.category.charAt(0).toUpperCase() + p.category.slice(1)}</span>
            ${p.featured ? '<span class="badge badge-featured">⭐ Featured</span>' : ''}
          </div>
          <div class="completion-ring" data-pct="${p.completion}">
            <svg width="40" height="40" viewBox="0 0 40 40">
              <circle class="ring-track" cx="20" cy="20" r="${r}"/>
              <circle class="ring-fill" cx="20" cy="20" r="${r}"
                stroke="${catColor}"
                stroke-dasharray="${circ}"
                stroke-dashoffset="${circ}"
              />
            </svg>
            <div class="ring-text">${p.completion}%</div>
          </div>
        </div>
        <div class="project-card-body">
          <div class="project-status-row">
            <span class="status-dot status-${p.status}"></span>
            <span class="status-label">${p.statusLabel}</span>
          </div>
          <h3 class="project-title">${p.title}</h3>
          <div class="project-period">${p.period}</div>
          <p class="project-summary">${p.summary}</p>
          <div class="project-tech-preview">
            ${preview.map(t => `<span class="tech-tag">${t}</span>`).join('')}
            ${extra > 0 ? `<span class="tech-tag-more">+${extra} more</span>` : ''}
          </div>
          <div class="project-card-footer">
            <div class="team-info">
              <div class="team-avatars">
                ${(p.team?.initials || ['R']).map(i => `<div class="team-avatar">${i}</div>`).join('')}
              </div>
              <span>Team of ${p.team?.size || 1}</span>
            </div>
            <span class="view-details-btn">Details <i class="fas fa-arrow-right" style="font-size:.7em"></i></span>
          </div>
        </div>
      </div>
    `;
  }
};

/* ── PROJECT MODAL ───────────────────────────────────────── */
const Modal = {
  overlay: null,
  panel: null,

  init() {
    this.overlay = document.getElementById('modal-overlay');
    this.panel = document.getElementById('modal-panel');

    document.getElementById('modal-close')?.addEventListener('click', () => this.close());
    this.overlay?.addEventListener('click', (e) => {
      if (e.target === this.overlay || e.target.id === 'modal-backdrop') this.close();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') this.close(); });
  },

  open(proj) {
    if (!this.overlay) return;

    const gradMap = {
      research:   'linear-gradient(135deg, #00C8FF, #8B5CF6)',
      enterprise: 'linear-gradient(135deg, #10B981, #14B8A6)',
      bigdata:    'linear-gradient(135deg, #8B5CF6, #EC4899)',
    };
    const grad = gradMap[proj.category] || gradMap.research;
    document.getElementById('modal-panel').style.setProperty('--modal-gradient', grad);

    document.getElementById('modal-content').innerHTML = this.buildContent(proj);

    this.overlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Rebind close button (re-rendered inside modal-content)
    document.getElementById('modal-close')?.addEventListener('click', () => this.close());

    // Progress bar animation
    setTimeout(() => {
      const fill = document.querySelector('.modal-progress-fill');
      if (fill) fill.style.width = `${proj.completion}%`;
    }, 100);

    // Expandable toggles
    document.querySelectorAll('.expandable-trigger').forEach(btn => {
      btn.addEventListener('click', () => btn.closest('.expandable-item').classList.toggle('open'));
    });
  },

  close() {
    this.overlay?.classList.remove('open');
    document.body.style.overflow = '';
  },

  buildContent(p) {
    const allTechs = Object.entries(p.techStack || {});
    const linkIcons = { github: 'fab fa-github', demo: 'fas fa-play-circle', paper: 'fas fa-file-alt', dataset: 'fas fa-database', supplementary: 'fas fa-paperclip' };
    const metricGrads = {
      blue:   'linear-gradient(135deg, #00C8FF, #0072FF)',
      green:  'linear-gradient(135deg, #10B981, #14B8A6)',
      purple: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
      gold:   'linear-gradient(135deg, #F59E0B, #EF4444)',
      red:    'linear-gradient(135deg, #EF4444, #8B5CF6)',
      teal:   'linear-gradient(135deg, #14B8A6, #10B981)',
      cyan:   'linear-gradient(135deg, #06B6D4, #00C8FF)',
      orange: 'linear-gradient(135deg, #F59E0B, #F97316)',
      pink:   'linear-gradient(135deg, #EC4899, #8B5CF6)',
    };

    return `
      <!-- HEADER -->
      <div class="modal-header">
        <div class="modal-header-top">
          <div class="modal-badges">
            <span class="badge badge-cat-${p.category}">${p.category === 'bigdata' ? 'Big Data' : p.category.charAt(0).toUpperCase() + p.category.slice(1)}</span>
            ${p.featured ? '<span class="badge badge-featured">⭐ Featured</span>' : ''}
            <span class="badge" style="background:var(--bg-elevated);color:var(--text-3)">${p.subcategory}</span>
          </div>
          <button class="modal-close" id="modal-close"><i class="fas fa-times"></i></button>
        </div>
        <h2 class="modal-title">${p.title}</h2>
        <div class="modal-meta">
          <span class="modal-meta-item"><i class="fas fa-calendar"></i>${p.period}</span>
          <span class="modal-meta-item"><i class="fas fa-tag"></i>${p.projectType}</span>
        </div>

        <!-- Team members -->
        ${p.team?.members?.length ? `
        <div class="team-member-links" style="margin-top:12px">
          <span style="font-size:.7rem;color:var(--text-3);margin-right:4px">
            <i class="fas fa-users"></i> Team of ${p.team.size}
          </span>
          ${p.team.members.map(m => `
            <div class="team-member-chip">
              <div class="chip-avatar">${m.initial}</div>
              <div class="chip-tooltip">
                <div class="chip-tooltip-name">${m.name}</div>
                ${(m.linkedin || m.github) ? `
                  <div class="chip-social-links">
                    ${m.linkedin ? `<a href="${m.linkedin}" target="_blank" rel="noopener"><i class="fab fa-linkedin"></i> LinkedIn</a>` : ''}
                    ${m.github   ? `<a href="${m.github}"   target="_blank" rel="noopener"><i class="fab fa-github"></i> GitHub</a>`   : ''}
                  </div>` : ''}
              </div>
            </div>
          `).join('')}
        </div>` : `
        <div style="font-size:.8rem;color:var(--text-3);margin-top:8px">
          <i class="fas fa-users" style="margin-right:5px"></i>Team of ${p.team?.size || 1} · ${p.team?.role || ''}
        </div>`}
      </div>

      <div class="modal-body">
        <!-- STATUS -->
        <div class="modal-status-row">
          <div class="modal-status-item">
            <span class="label">Status</span>
            <span class="value" style="display:flex;align-items:center;gap:6px">
              <span class="status-dot status-${p.status}" style="width:9px;height:9px"></span>
              ${p.statusLabel}
            </span>
          </div>
          <div class="modal-status-item" style="flex:1">
            <span class="label">Completion</span>
            <div class="modal-progress-bar">
              <div class="modal-progress-fill" style="width:0%"></div>
            </div>
            <span class="value" style="font-size:.8rem;color:var(--text-3)">${p.completion}%</span>
          </div>
        </div>

        <!-- TAGS -->
        <div class="modal-section">
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            ${(p.tags || []).map(t => `<span class="tech-tag">${t}</span>`).join('')}
          </div>
        </div>

        <!-- SUMMARY -->
        <div class="modal-section">
          <div class="modal-section-title"><i class="fas fa-align-left"></i>Summary</div>
          <p class="modal-text">${p.summary}</p>
        </div>

        <!-- PROBLEM & SOLUTION -->
        ${p.problem ? `
        <div class="modal-section">
          <div class="modal-section-title"><i class="fas fa-exclamation-circle"></i>Problem</div>
          <div class="modal-ps-card problem">${p.problem}</div>
        </div>` : ''}
        ${p.solution ? `
        <div class="modal-section">
          <div class="modal-section-title"><i class="fas fa-lightbulb"></i>Solution</div>
          <div class="modal-ps-card solution">${p.solution}</div>
        </div>` : ''}

        <!-- METRICS -->
        ${p.metrics?.length ? `
        <div class="modal-section">
          <div class="modal-section-title"><i class="fas fa-chart-bar"></i>Key Metrics</div>
          <div class="metrics-grid">
            ${p.metrics.map(m => `
              <div class="metric-card">
                <div class="metric-icon" style="color:${(metricGrads[m.color]||'').includes('#') ? m.color : 'var(--accent-blue)'}">
                  <i class="${m.icon || 'fas fa-chart-bar'}"></i>
                </div>
                <div class="metric-value" style="--metric-gradient:${metricGrads[m.color] || metricGrads.blue}">${m.value}</div>
                <div class="metric-label">${m.label}</div>
              </div>
            `).join('')}
          </div>
        </div>` : ''}

        <!-- ACHIEVEMENTS -->
        ${p.achievements?.length ? `
        <div class="modal-section">
          <div class="modal-section-title"><i class="fas fa-star"></i>Achievements</div>
          <div class="achievements-list">
            ${p.achievements.map(a => `<div class="achievement-item">${a}</div>`).join('')}
          </div>
        </div>` : ''}

        <!-- TECH STACK -->
        ${allTechs.length ? `
        <div class="modal-section">
          <div class="modal-section-title"><i class="fas fa-layer-group"></i>Tech Stack</div>
          <div class="modal-tech-groups">
            ${allTechs.map(([group, techs]) => `
              <div class="modal-tech-group">
                <div class="modal-tech-group-label">${group}</div>
                <div class="modal-tech-tags">
                  ${techs.map(t => `<span class="modal-tech-tag">${t}</span>`).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>` : ''}

        <!-- EXPANDABLE SECTIONS -->
        ${p.expandable && Object.keys(p.expandable).length ? `
        <div class="modal-section">
          <div class="modal-section-title"><i class="fas fa-plus-circle"></i>Deep Dive</div>
          ${Object.entries(p.expandable).map(([key, sec]) => `
            <div class="expandable-item">
              <button class="expandable-trigger">
                <div class="expandable-trigger-left">
                  <i class="${sec.icon || 'fas fa-info-circle'}"></i>
                  ${sec.title}
                </div>
                <i class="fas fa-chevron-down expandable-chevron"></i>
              </button>
              <div class="expandable-content">
                <div class="expandable-body">${sec.content}</div>
              </div>
            </div>
          `).join('')}
        </div>` : ''}

        <!-- LINKS -->
        ${p.links && Object.values(p.links).some(v => v) ? `
        <div class="modal-section">
          <div class="modal-section-title"><i class="fas fa-external-link-alt"></i>Links</div>
          <div class="modal-links">
            ${Object.entries(p.links).map(([type, url]) => url ? `
              <a href="${url}" target="_blank" rel="noopener" class="modal-link-btn ${type === 'github' ? 'primary' : ''}">
                <i class="${linkIcons[type] || 'fas fa-link'}"></i>
                ${type.charAt(0).toUpperCase() + type.slice(1)}
              </a>
            ` : `
              <span class="modal-link-btn disabled">
                <i class="${linkIcons[type] || 'fas fa-link'}"></i>
                ${type.charAt(0).toUpperCase() + type.slice(1)}
              </span>
            `).join('')}
          </div>
        </div>` : ''}
      </div>
    `;
  }
};

/* ── SKILLS RENDERER ─────────────────────────────────────── */
const SkillsRenderer = {
  render(skills) {
    const el = document.getElementById('skills-root');
    if (!el) return;

    el.innerHTML = `
      <div class="skills-grid">
        ${Object.entries(skills).map(([ name, group ], i) => `
          <div class="skill-group reveal reveal-delay-${(i % 3) + 1}">
            <div class="skill-group-header">
              <div class="skill-group-icon icon-${group.color}">
                <i class="${group.icon}"></i>
              </div>
              <span class="skill-group-name">${name}</span>
            </div>
            <div class="skill-tags">
              ${group.items.map(item => `<span class="skill-tag">${item}</span>`).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;

    el.querySelectorAll('.reveal').forEach(r => ScrollReveal.observe(r));
  }
};

/* ── CONTACT RENDERER ────────────────────────────────────── */
const ContactRenderer = {
  render(contact, meta) {
    const el = document.getElementById('contact-root');
    if (!el) return;

    el.innerHTML = `
      <div class="contact-grid">
        <!-- Info -->
        <div class="contact-info reveal">
          <h3>Let's Build Something <span class="text-gradient">Amazing Together</span></h3>
          <p>I'm open to research collaborations, internship opportunities, and project discussions. Whether you want to talk AI, exchange ideas, or just say hi — my inbox is always open.</p>

          <div class="contact-items">
            <div class="contact-item">
              <div class="contact-item-icon"><i class="fas fa-envelope"></i></div>
              <a href="mailto:${contact.email}" style="color:inherit">${contact.email}</a>
            </div>
            <div class="contact-item">
              <div class="contact-item-icon"><i class="fas fa-phone"></i></div>
              <span>${contact.phone}</span>
            </div>
            <div class="contact-item">
              <div class="contact-item-icon"><i class="fas fa-map-marker-alt"></i></div>
              <span>${contact.location}</span>
            </div>
            <div class="contact-item">
              <div class="contact-item-icon"><i class="fas fa-circle" style="color:var(--accent-green);font-size:.5rem"></i></div>
              <span style="color:var(--accent-green);font-weight:600">${contact.availability}</span>
            </div>
          </div>

          <div class="social-links">
            ${contact.socials.map(s => `
              <a href="${s.url}" target="_blank" rel="noopener" class="social-link" title="${s.platform}" aria-label="${s.platform}">
                <i class="${s.icon}"></i>
              </a>
            `).join('')}
          </div>

          <div style="margin-top:24px">
            <a href="${meta.resume}" download class="btn btn-ghost">
              <i class="fas fa-file-download"></i>Download CV
            </a>
          </div>
        </div>

        <!-- Form -->
        <div class="contact-form-card reveal reveal-delay-1">
          <div class="form-title">
            <i class="fas fa-paper-plane" style="color:var(--accent-blue)"></i>
            Send a Message
          </div>
          <form id="contact-form" novalidate>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="form-name">Name</label>
                <input class="form-input" type="text" id="form-name" name="name" placeholder="Your name" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="form-email">Email</label>
                <input class="form-input" type="email" id="form-email" name="email" placeholder="your@email.com" required>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label" for="form-subject">Subject</label>
              <input class="form-input" type="text" id="form-subject" name="subject" placeholder="What's this about?">
            </div>
            <div class="form-group">
              <label class="form-label" for="form-message">Message</label>
              <textarea class="form-textarea" id="form-message" name="message" placeholder="Tell me about your project, idea, or just say hello…" required></textarea>
            </div>
            <button type="submit" class="btn btn-primary form-submit">
              <i class="fas fa-paper-plane"></i>Send Message
            </button>
            <div class="form-status" id="form-status"></div>
          </form>
        </div>
      </div>
    `;

    // Form submission (mailto fallback — connect EmailJS/Formspree for real sending)
    document.getElementById('contact-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name    = document.getElementById('form-name').value.trim();
      const email   = document.getElementById('form-email').value.trim();
      const subject = document.getElementById('form-subject').value.trim();
      const message = document.getElementById('form-message').value.trim();

      if (!name || !email || !message) {
        this.showStatus('error', 'Please fill in all required fields.');
        return;
      }

      // Mailto fallback — replace with EmailJS/Formspree for actual sending
      const mailto = `mailto:${contact.email}?subject=${encodeURIComponent(subject || 'Portfolio Contact')}&body=${encodeURIComponent(`From: ${name} (${email})\n\n${message}`)}`;
      window.location.href = mailto;
      this.showStatus('success', 'Opening your email client… If nothing opens, please email me directly.');
    });

    el.querySelectorAll('.reveal').forEach(r => ScrollReveal.observe(r));
  },

  showStatus(type, msg) {
    const el = document.getElementById('form-status');
    if (!el) return;
    el.className = `form-status ${type}`;
    el.textContent = msg;
  }
};

/* ── CERTIFICATIONS RENDERER ─────────────────────────────── */
const CertificationsRenderer = {
  render(certs) {
    const el = document.getElementById('certs-root');
    if (!el || !certs?.length) return;

    const colorMap = {
      orange: 'rgba(245,158,11,0.15)',
      green:  'rgba(16,185,129,0.15)',
      red:    'rgba(239,68,68,0.15)',
      blue:   'rgba(0,200,255,0.15)',
      purple: 'rgba(139,92,246,0.15)',
    };
    const iconColorMap = {
      orange: 'var(--accent-orange)',
      green:  'var(--accent-green)',
      red:    'var(--accent-red)',
      blue:   'var(--accent-blue)',
      purple: 'var(--accent-purple)',
    };

    el.innerHTML = `
      <div class="certs-grid">
        ${certs.map((c, i) => `
          <div class="cert-card reveal reveal-delay-${(i % 3) + 1}">
            <div class="cert-icon" style="background:${colorMap[c.color]||colorMap.blue};color:${iconColorMap[c.color]||iconColorMap.blue}">
              <i class="${c.icon}"></i>
            </div>
            <div>
              <div class="cert-title">${c.title}</div>
              <div class="cert-issuer">${c.issuer}</div>
              <span class="cert-year">${c.year}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    el.querySelectorAll('.reveal').forEach(r => ScrollReveal.observe(r));
  }
};

/* ── MAIN INIT ───────────────────────────────────────────── */
async function init() {
  Theme.init();
  Nav.init();
  Particles.init();

  try {
    const { profile, projects } = await DataLoader.loadAll();

    HeroRenderer.render(profile.hero);
    JourneyRenderer.render(profile);
    PublicationsRenderer.render(profile.publications);
    ProjectsRenderer.render(projects);
    SkillsRenderer.render(profile.skills);
    CertificationsRenderer.render(profile.certifications);
    ContactRenderer.render(profile.contact, profile.meta);

    // Page title
    document.title = `${profile.meta.name} — ${profile.meta.title}`;

    // Footer
    document.getElementById('footer-name').textContent = profile.meta.name;

    Modal.init();
    ScrollReveal.init();

  } catch (err) {
    console.error('Portfolio load error:', err);
    // Show graceful error
    document.getElementById('hero-root').innerHTML = `
      <div class="hero-inner" style="text-align:center">
        <h1 class="hero-name">Randika Prabashwara</h1>
        <p style="color:var(--text-2);margin-top:16px">Data Science Engineer & Computer Vision Specialist</p>
        <p style="color:var(--accent-red);margin-top:8px;font-size:.85rem">
          Note: For full interactive experience, run this site through a local server or GitHub Pages.<br>
          <code style="font-size:.8rem">python -m http.server 8080</code>
        </p>
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', init);