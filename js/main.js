(function () {
  "use strict";

  const CONTENT_URL = "content/site-content.json";
  const $app = document.getElementById("app");

  document.getElementById("footerYear").textContent = new Date().getFullYear();

  // Mobile nav toggle
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");
  navToggle.addEventListener("click", () => navLinks.classList.toggle("open"));
  navLinks.addEventListener("click", (e) => {
    if (e.target.tagName === "A") navLinks.classList.remove("open");
  });

  // Lightbox
  const lightbox = document.getElementById("lightbox");
  const lightboxContent = document.getElementById("lightboxContent");
  const lightboxPrev = document.getElementById("lightboxPrev");
  const lightboxNext = document.getElementById("lightboxNext");
  const lightboxCaption = document.getElementById("lightboxCaption");
  document.getElementById("lightboxClose").addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") lightboxPrev.click();
    if (e.key === "ArrowRight") lightboxNext.click();
  });

  let lightboxGallery = null; // { items, index } when browsing a photo set

  function openLightboxVideo(src) {
    lightboxGallery = null;
    lightboxPrev.style.display = "none";
    lightboxNext.style.display = "none";
    lightboxCaption.textContent = "";
    lightboxContent.innerHTML = "";
    const v = document.createElement("video");
    v.src = src; v.controls = true; v.autoplay = true; v.playsInline = true;
    lightboxContent.appendChild(v);
    lightbox.classList.add("open");
  }

  function openLightboxImage(src, alt) {
    lightboxGallery = null;
    lightboxPrev.style.display = "none";
    lightboxNext.style.display = "none";
    lightboxCaption.textContent = "";
    lightboxContent.innerHTML = "";
    const img = document.createElement("img");
    img.src = src; img.alt = alt || "";
    lightboxContent.appendChild(img);
    lightbox.classList.add("open");
  }

  // Opens the lightbox in gallery mode: items is an array of {image, title, description},
  // startIndex is which one to show first. Adds working prev/next + swipe + captions.
  function openLightboxGallery(items, startIndex) {
    lightboxGallery = { items, index: startIndex };
    lightboxPrev.style.display = "flex";
    lightboxNext.style.display = "flex";

    function renderCurrent() {
      const item = lightboxGallery.items[lightboxGallery.index];
      lightboxContent.innerHTML = "";
      const img = document.createElement("img");
      img.src = item.image; img.alt = item.title || "";
      lightboxContent.appendChild(img);
      lightboxCaption.textContent = [item.title, item.description].filter(Boolean).join(" — ");
    }
    renderCurrent();
    lightbox.classList.add("open");

    lightboxPrev.onclick = () => {
      lightboxGallery.index = (lightboxGallery.index - 1 + lightboxGallery.items.length) % lightboxGallery.items.length;
      renderCurrent();
    };
    lightboxNext.onclick = () => {
      lightboxGallery.index = (lightboxGallery.index + 1) % lightboxGallery.items.length;
      renderCurrent();
    };
  }

  function closeLightbox() {
    lightbox.classList.remove("open");
    lightboxContent.innerHTML = "";
    lightboxCaption.textContent = "";
    lightboxPrev.onclick = null;
    lightboxNext.onclick = null;
    lightboxGallery = null;
  }

  // Swipe support inside the lightbox (works for gallery mode)
  (function () {
    let touchStartX = null;
    lightboxContent.addEventListener("touchstart", (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
    lightboxContent.addEventListener("touchend", (e) => {
      if (touchStartX == null || !lightboxGallery) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 40) (dx < 0 ? lightboxNext : lightboxPrev).click();
      touchStartX = null;
    });
  })();

  function esc(str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, (c) => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
    ));
  }

  const ICONS = {
    phone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
    email: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/></svg>`,
    whatsapp: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.6 6.32A8.86 8.86 0 0 0 12.02 3a8.94 8.94 0 0 0-7.7 13.42L3 21l4.7-1.23a8.94 8.94 0 0 0 4.33 1.1h0a8.94 8.94 0 0 0 8.9-8.94 8.87 8.87 0 0 0-3.33-6.6zm-5.58 13.74h0a7.4 7.4 0 0 1-3.78-1.04l-.27-.16-2.8.73.75-2.73-.18-.28a7.42 7.42 0 0 1 11.7-9.14 7.36 7.36 0 0 1 2.18 5.25 7.42 7.42 0 0 1-7.6 7.37zm4.07-5.56c-.22-.11-1.3-.64-1.5-.72-.2-.07-.35-.11-.5.11-.15.22-.57.72-.7.87-.13.15-.26.16-.48.05a6.06 6.06 0 0 1-1.78-1.1 6.68 6.68 0 0 1-1.23-1.53c-.13-.22 0-.34.1-.45.1-.1.22-.26.33-.39.11-.13.15-.22.22-.37.07-.15.04-.28-.02-.39-.06-.11-.5-1.2-.68-1.65-.18-.43-.36-.37-.5-.38h-.43c-.15 0-.39.06-.6.28-.2.22-.79.77-.79 1.87s.81 2.17.92 2.32c.11.15 1.6 2.44 3.87 3.42a13 13 0 0 0 1.29.48c.54.17 1.03.15 1.42.09.43-.06 1.3-.53 1.49-1.04.18-.51.18-.95.13-1.04-.05-.1-.2-.15-.42-.26z"/></svg>`,
    instagram: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2.5" y="2.5" width="19" height="19" rx="5"/><circle cx="12" cy="12" r="4.5"/><circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" stroke="none"/></svg>`
  };
  function icon(name) {
    return ICONS[name] || "";
  }

  function isDirectVideo(url) {
    return /\.(mp4|webm|mov)$/i.test(url || "");
  }
  function isEmbeddable(url) {
    return /youtube\.com|youtu\.be|vimeo\.com/i.test(url || "");
  }
  function embedUrl(url) {
    if (/youtu\.be\//.test(url)) {
      const id = url.split("youtu.be/")[1].split(/[?&]/)[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    if (/youtube\.com\/watch/.test(url)) {
      const id = new URL(url).searchParams.get("v");
      return `https://www.youtube.com/embed/${id}`;
    }
    if (/vimeo\.com\//.test(url)) {
      const id = url.split("vimeo.com/")[1].split(/[?&]/)[0];
      return `https://player.vimeo.com/video/${id}`;
    }
    return url;
  }

  function videoEmbedHtml(src) {
    if (isEmbeddable(src)) {
      return `<div class="embed-wrap"><iframe src="${esc(embedUrl(src))}" allow="autoplay; fullscreen" allowfullscreen loading="lazy"></iframe></div>`;
    }
    // Direct uploaded file (mp4/webm/mov)
    return `<video src="${esc(src)}" controls playsinline style="width:100%;border-radius:8px;border:1px solid var(--line)"></video>`;
  }

  function lazyImg(src, alt, cls) {
    return `<img data-lazy="${esc(src)}" alt="${esc(alt || "")}" class="skeleton ${cls || ""}" loading="lazy">`;
  }

  function applyLazyLoading(root) {
    const imgs = root.querySelectorAll("img[data-lazy]");
    if (!("IntersectionObserver" in window)) {
      imgs.forEach((img) => { img.src = img.dataset.lazy; img.classList.remove("skeleton"); });
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.lazy;
          img.addEventListener("load", () => img.classList.remove("skeleton"), { once: true });
          io.unobserve(img);
        }
      });
    }, { rootMargin: "200px" });
    imgs.forEach((img) => io.observe(img));
  }

  function applyFadeIn(root) {
    const els = root.querySelectorAll(".lazy-fade");
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("visible"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    els.forEach((el) => io.observe(el));
  }

  // ---- Section renderers ----

  function renderHome(d) {
    return `
    <section id="home" class="hero">
      <div class="hero-bg"></div>
      <div class="container">
        <div>
          <div class="eyebrow">Portfolio</div>
          <h1>${esc(d.name)}</h1>
          <div class="headline">${esc(d.headline)}</div>
          <p class="tagline">${esc(d.tagline)}</p>
          <div class="btn-row">
            <a href="#" class="btn btn-primary" id="watchShowreelBtn">${esc(d.ctaWatchText || "Watch Showreel")}</a>
            <a href="#contact" class="btn btn-outline">${esc(d.ctaContactText || "Contact for Projects")}</a>
          </div>
        </div>
        <div class="hero-portrait-wrap lazy-fade">
          ${lazyImg(d.portraitImage, d.name)}
        </div>
      </div>
    </section>`;
  }

  function renderAbout(d) {
    const langs = (d.languages || []).map((l) => `<span class="fact-pill">${esc(l)}</span>`).join("");
    return `
    <section id="about">
      <div class="container about-grid">
        <div class="about-photo lazy-fade">${lazyImg(d.profileImage, "About Rahul")}</div>
        <div>
          <div class="eyebrow">About</div>
          <h2>${esc(d.heading)}</h2>
          <p>${esc(d.bio)}</p>
          <div class="about-facts">
            <span class="fact-pill">Age ${esc(d.age)}</span>
            <span class="fact-pill">${esc(d.location)}</span>
            <span class="fact-pill">${esc(d.education)}</span>
            ${langs}
          </div>
        </div>
      </div>
    </section>`;
  }

  function renderJourney(d) {
    const items = (d.milestones || []).map((m) => `
      <div class="timeline-item lazy-fade">
        <div class="timeline-year">${esc(m.year)}</div>
        <h3>${esc(m.title)}</h3>
        <p>${esc(m.description)}</p>
      </div>`).join("");
    return `
    <section id="journey">
      <div class="container">
        <div class="section-head">
          <div class="eyebrow">Journey</div>
          <h2>${esc(d.heading)}</h2>
        </div>
        <div class="timeline">${items}</div>
      </div>
    </section>`;
  }

  function renderPortfolio(d) {
    const cards = (d.projects || []).map((p) => `
      <div class="card lazy-fade">
        <div class="card-media">${lazyImg(p.coverImage, p.title)}</div>
        <div class="card-body">
          <h3>${esc(p.title)}</h3>
          <div class="card-meta">${esc(p.role)}${p.year ? " · " + esc(p.year) : ""}</div>
          <p>${esc(p.description)}</p>
        </div>
      </div>`).join("");
    return `
    <section id="portfolio">
      <div class="container">
        <div class="section-head">
          <div class="eyebrow">Portfolio</div>
          <h2>${esc(d.heading)}</h2>
          <p>${esc(d.subheading)}</p>
        </div>
        <div class="card-grid">${cards || emptyState("Projects coming soon.")}</div>
      </div>
    </section>`;
  }

  function emptyState(text) {
    return `<div style="color:var(--text-dim);padding:20px 0">${esc(text)}</div>`;
  }

  function renderVideos(d) {
    const items = (d.items || []).map((v, i) => `
      <div class="card video-card lazy-fade" data-video-src="${esc(v.videoUrl)}" data-index="${i}">
        <div class="card-media">
          ${lazyImg(v.thumbnail, v.title)}
          <div class="play-badge"><span>&#9658;</span></div>
        </div>
        <div class="card-body">
          <h3>${esc(v.title)}</h3>
          ${v.description ? `<p>${esc(v.description)}</p>` : ""}
        </div>
      </div>`).join("");
    return `
    <section id="videos">
      <div class="container">
        <div class="section-head">
          <div class="eyebrow">Videos</div>
          <h2>${esc(d.heading)}</h2>
          <p>${esc(d.subheading)}</p>
        </div>
        <div class="card-grid">${items || emptyState("Videos coming soon.")}</div>
      </div>
    </section>`;
  }

  function renderCurrentProject(d) {
    const cards = (d.items || []).map((p, i) => {
      const photos = (p.photos || []).map((src) => `
        <div class="gallery-thumb lazy-fade" data-lightbox-img="${esc(src)}">${lazyImg(src, p.title)}</div>
      `).join("");
      const photosBlock = photos
        ? `<div class="project-subsection">
             <h4>Photos</h4>
             <div class="gallery-grid">${photos}</div>
           </div>`
        : "";
      const videoBlock = p.youtubeLink
        ? `<div class="project-subsection">
             <h4>Video</h4>
             <div class="project-video-embed">${videoEmbedHtml(p.youtubeLink)}</div>
           </div>`
        : "";
      return `
      <div class="project-feature lazy-fade" style="grid-template-columns:1fr;padding:32px">
        <div>
          <span class="status-badge">${esc(p.status)}</span>
          <h2>${esc(p.title)}</h2>
          <div class="card-meta">${esc(p.language)}${p.type ? " · " + esc(p.type) : ""}</div>
          <p>${esc(p.description)}</p>
          ${photosBlock}
          ${videoBlock}
        </div>
      </div>`;
    }).join("");
    return `
    <section id="currentProject">
      <div class="container">
        <div class="section-head">
          <div class="eyebrow">Current Projects</div>
          <h2>${esc(d.heading)}</h2>
          <p>${esc(d.subheading || "")}</p>
        </div>
        <div style="display:flex;flex-direction:column;gap:24px">${cards || emptyState("No current projects yet.")}</div>
      </div>
    </section>`;
  }

  function renderSkills(d) {
    const skills = (d.items || []).map((s) => `<li>${esc(s)}</li>`).join("");
    const openTo = (d.openTo || []).map((s) => `<li>${esc(s)}</li>`).join("");
    return `
    <section id="skills">
      <div class="container">
        <div class="section-head">
          <div class="eyebrow">Skills</div>
          <h2>${esc(d.heading)}</h2>
        </div>
        <div class="skills-cols">
          <div><h3>Skills</h3><ul class="tag-list">${skills}</ul></div>
          <div><h3>Open To</h3><ul class="tag-list">${openTo}</ul></div>
        </div>
      </div>
    </section>`;
  }

  function renderContact(d) {
    return `
    <section id="contact">
      <div class="container">
        <div class="section-head center">
          <div class="eyebrow">Contact</div>
          <h2>${esc(d.heading)}</h2>
          <p>${esc(d.subheading)}</p>
        </div>
        <div class="contact-grid">
          <a class="contact-card" href="tel:${esc(d.phone)}">
            <div class="icon">${icon("phone")}</div>
            <div class="label">Phone</div>
            <div class="value">${esc(d.phone)}</div>
          </a>
          <a class="contact-card" href="${esc(d.whatsapp)}" target="_blank" rel="noopener">
            <div class="icon">${icon("whatsapp")}</div>
            <div class="label">WhatsApp</div>
            <div class="value">Message on WhatsApp</div>
          </a>
          <a class="contact-card" href="mailto:${esc(d.email)}">
            <div class="icon">${icon("email")}</div>
            <div class="label">Email</div>
            <div class="value">${esc(d.email)}</div>
          </a>
          <a class="contact-card" href="${esc(d.instagram)}" target="_blank" rel="noopener">
            <div class="icon">${icon("instagram")}</div>
            <div class="label">Instagram</div>
            <div class="value">@thangu____</div>
          </a>
        </div>
      </div>
    </section>`;
  }

  function renderShortFilm(d) {
    const cards = (d.items || []).map((p) => {
      const photos = (p.photos || []).map((src) => `
        <div class="gallery-thumb lazy-fade" data-lightbox-img="${esc(src)}">${lazyImg(src, p.title)}</div>
      `).join("");
      const photosBlock = photos
        ? `<div class="project-subsection"><h4>Photos</h4><div class="gallery-grid">${photos}</div></div>`
        : "";
      const videoBlock = p.videoLink
        ? `<div class="project-subsection">
             <h4>Video</h4>
             <div class="project-video-embed">${videoEmbedHtml(p.videoLink)}</div>
           </div>`
        : "";
      return `
      <div class="project-feature lazy-fade" style="grid-template-columns:1fr;padding:32px">
        <div>
          <h2>${esc(p.title)}</h2>
          <div class="card-meta">${esc(p.role || "")}${p.year ? " · " + esc(p.year) : ""}</div>
          <p>${esc(p.description)}</p>
          ${photosBlock}
          ${videoBlock}
        </div>
      </div>`;
    }).join("");
    return `
    <section id="shortFilm">
      <div class="container">
        <div class="section-head">
          <div class="eyebrow">Short Films</div>
          <h2>${esc(d.heading)}</h2>
          <p>${esc(d.subheading || "")}</p>
        </div>
        <div style="display:flex;flex-direction:column;gap:24px">${cards || emptyState("Short films coming soon.")}</div>
      </div>
    </section>`;
  }

  function renderGallery(d) {
    const items = d.items || [];
    if (!items.length) {
      return `
      <section id="gallery">
        <div class="container">
          <div class="section-head">
            <div class="eyebrow">Gallery</div>
            <h2>${esc(d.heading)}</h2>
            <p>${esc(d.subheading || "")}</p>
          </div>
          ${emptyState("Gallery coming soon.")}
        </div>
      </section>`;
    }
    const dots = items.map((_, i) => `<button class="carousel-dot" data-dot="${i}" aria-label="Go to photo ${i + 1}"></button>`).join("");
    return `
    <section id="gallery">
      <div class="container">
        <div class="section-head">
          <div class="eyebrow">Gallery</div>
          <h2>${esc(d.heading)}</h2>
          <p>${esc(d.subheading || "")}</p>
        </div>
        <div class="gallery-carousel" id="galleryCarousel" data-index="0">
          <div class="gallery-carousel-row">
            <button class="carousel-btn prev" id="galleryPrev" aria-label="Previous photo">&#10094;</button>
            <div class="gallery-carousel-stage">
              <img id="galleryStageImg" src="" alt="" loading="lazy">
            </div>
            <button class="carousel-btn next" id="galleryNext" aria-label="Next photo">&#10095;</button>
          </div>
          <div class="gallery-caption" id="galleryCaption"></div>
          <div class="carousel-dots">${dots}</div>
        </div>
      </div>
    </section>`;
  }

  const RENDERERS = {
    home: renderHome, about: renderAbout, journey: renderJourney,
    portfolio: renderPortfolio, videos: renderVideos, shortFilm: renderShortFilm, gallery: renderGallery,
    currentProject: renderCurrentProject, skills: renderSkills, contact: renderContact
  };

  function render(content) {
    document.title = content.meta.siteTitle || document.title;
    const descTag = document.querySelector('meta[name="description"]');
    if (descTag) descTag.setAttribute("content", content.meta.seoDescription || "");
    const favicon = document.getElementById("favicon-link");
    if (favicon && content.meta.favicon) favicon.setAttribute("href", content.meta.favicon);

    // Small header icons next to the name, built from the Contact section's info
    const navSocial = document.getElementById("navSocial");
    if (navSocial && content.contact) {
      const c = content.contact;
      let icons = "";
      if (c.instagram) icons += `<a href="${esc(c.instagram)}" target="_blank" rel="noopener" aria-label="Instagram">${icon("instagram")}</a>`;
      if (c.whatsapp) icons += `<a href="${esc(c.whatsapp)}" target="_blank" rel="noopener" aria-label="WhatsApp">${icon("whatsapp")}</a>`;
      if (c.email) icons += `<a href="mailto:${esc(c.email)}" aria-label="Email">${icon("email")}</a>`;
      if (c.phone) icons += `<a href="tel:${esc(c.phone)}" aria-label="Call">${icon("phone")}</a>`;
      navSocial.innerHTML = icons;
    }

    const order = content.sectionOrder || Object.keys(RENDERERS);
    const visibility = content.sectionVisibility || {};
    let html = "";
    order.forEach((key) => {
      if (visibility[key] === false) return;
      const renderer = RENDERERS[key];
      if (renderer && content[key]) html += renderer(content[key]);
    });
    $app.innerHTML = html;

    applyLazyLoading($app);
    applyFadeIn($app);

    // Showreel button
    const watchBtn = document.getElementById("watchShowreelBtn");
    if (watchBtn) {
      watchBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const src = content.home.showreelVideo;
        if (!src) { window.location.hash = "#videos"; return; }
        isEmbeddable(src) ? openEmbed(src) : openLightboxVideo(src);
      });
    }

    // Video card clicks
    $app.querySelectorAll(".video-card").forEach((card) => {
      card.addEventListener("click", () => {
        const src = card.dataset.videoSrc;
        if (!src) return;
        isEmbeddable(src) ? openEmbed(src) : openLightboxVideo(src);
      });
    });

    // Current-project / short-film gallery photo clicks (with prev/next through that project's photos)
    $app.querySelectorAll("[data-lightbox-img]").forEach((el) => {
      el.addEventListener("click", () => {
        const group = el.closest(".gallery-grid");
        if (group) {
          const thumbs = Array.from(group.querySelectorAll("[data-lightbox-img]"));
          const items = thumbs.map((t) => ({ image: t.dataset.lightboxImg, title: "", description: "" }));
          openLightboxGallery(items, thumbs.indexOf(el));
        } else {
          const img = el.querySelector("img");
          openLightboxImage(el.dataset.lightboxImg, img ? img.alt : "");
        }
      });
    });

    // Gallery carousel
    const galleryCarousel = document.getElementById("galleryCarousel");
    if (galleryCarousel && content.gallery && content.gallery.items && content.gallery.items.length) {
      const items = content.gallery.items;
      const stageImg = document.getElementById("galleryStageImg");
      const caption = document.getElementById("galleryCaption");
      const dots = galleryCarousel.querySelectorAll(".carousel-dot");
      let index = 0;

      function show(i) {
        index = (i + items.length) % items.length;
        const item = items[index];
        stageImg.src = item.image;
        stageImg.alt = item.title || "";
        const text = [item.title, item.description].filter(Boolean).join(" — ");
        caption.textContent = text;
        caption.style.display = text ? "block" : "none";
        dots.forEach((dot, di) => dot.classList.toggle("active", di === index));
        galleryCarousel.dataset.index = index;
      }

      document.getElementById("galleryPrev").addEventListener("click", () => show(index - 1));
      document.getElementById("galleryNext").addEventListener("click", () => show(index + 1));
      dots.forEach((dot) => dot.addEventListener("click", () => show(parseInt(dot.dataset.dot, 10))));
      stageImg.style.cursor = "zoom-in";
      stageImg.addEventListener("click", () => openLightboxGallery(items, index));

      // Swipe support on mobile
      let touchStartX = null;
      const stage = galleryCarousel.querySelector(".gallery-carousel-stage");
      stage.addEventListener("touchstart", (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
      stage.addEventListener("touchend", (e) => {
        if (touchStartX == null) return;
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) > 40) show(index + (dx < 0 ? 1 : -1));
        touchStartX = null;
      });

      show(0);
    }

    function openEmbed(url) {
      lightboxContent.innerHTML = `<div style="position:relative;padding-top:56.25%">
        <iframe src="${esc(embedUrl(url))}" allow="autoplay; fullscreen" allowfullscreen
          style="position:absolute;inset:0;width:100%;height:100%;border:0;border-radius:8px"></iframe>
      </div>`;
      lightbox.classList.add("open");
    }
  }

  const isPreview = new URLSearchParams(window.location.search).get("preview") === "1";

  if (isPreview) {
    // Draft preview mode: read content written by the admin dashboard instead of fetching the file.
    try {
      const draft = JSON.parse(window.localStorage.getItem("siteContentDraft") || "null");
      if (draft) {
        render(draft);
      } else {
        $app.innerHTML = `<div class="container" style="padding-top:140px;text-align:center;color:#b7b5ad">No draft found.</div>`;
      }
    } catch (err) {
      $app.innerHTML = `<div class="container" style="padding-top:140px;text-align:center;color:#b7b5ad">Could not read draft.</div>`;
    }
  } else {
    fetch(CONTENT_URL + "?v=" + Date.now(), { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load content");
        return r.json();
      })
      .then(render)
      .catch((err) => {
        $app.innerHTML = `<div class="container" style="padding-top:140px;text-align:center;color:#b7b5ad">
          Content could not be loaded. Please try again shortly.</div>`;
        console.error(err);
      });
  }
})();
