(function () {
  "use strict";

  const API_BASE = (window.SITE_CONFIG && window.SITE_CONFIG.API_BASE_URL) || "";
  const GITHUB_REPO = (window.SITE_CONFIG && window.SITE_CONFIG.GITHUB_REPO) || "";
  const CONTENT_URL = "../content/site-content.json";

  // Raw GitHub content shows up within seconds of a commit — much faster than waiting
  // for the site itself to rebuild — so admin previews use this instead of relative paths.
  function rawUrl(path) {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `https://raw.githubusercontent.com/${GITHUB_REPO}/main/${path}`;
  }

  const loginView = document.getElementById("loginView");
  const dashboardView = document.getElementById("dashboardView");
  const loginError = document.getElementById("loginError");
  const userLabel = document.getElementById("userLabel");
  const sectionNav = document.getElementById("sectionNav");
  const sectionContent = document.getElementById("sectionContent");
  const publishStatus = document.getElementById("publishStatus");

  const SECTION_LABELS = {
    home: "Home", about: "About", journey: "Journey", portfolio: "Portfolio",
    videos: "Videos", shortFilm: "Short Films", gallery: "Gallery",
    currentProject: "Current Projects", skills: "Skills", contact: "Contact"
  };

  let draft = null;        // working copy of content
  let activeSection = "home";

  // ---------------------------------------------------------------------
  // Auth
  // ---------------------------------------------------------------------

  function api(path, opts) {
    opts = opts || {};
    opts.credentials = "include";
    return fetch(API_BASE + path, opts);
  }

  async function checkSession() {
    try {
      const res = await api("/api/auth/session");
      if (res.status === 200) {
        const data = await res.json();
        return !!data.authenticated;
      }
    } catch (err) { /* network / not configured yet */ }
    return false;
  }

  document.getElementById("pinForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    loginError.textContent = "";
    if (!API_BASE || API_BASE.includes("YOUR-API-DEPLOYMENT")) {
      loginError.textContent = "The admin API is not configured yet. See README setup instructions.";
      return;
    }
    const pin = document.getElementById("pinInput").value;
    if (!pin) return;
    try {
      const res = await api("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        loginError.textContent = data.error || "Login failed.";
        return;
      }
      window.location.reload();
    } catch (err) {
      loginError.textContent = "Could not reach the admin API. Check your internet connection or the API deployment.";
    }
  });

  document.getElementById("logoutBtn").addEventListener("click", async () => {
    await api("/api/auth/logout", { method: "POST" });
    window.location.reload();
  });

  // ---------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------

  (async function boot() {
    const authenticated = await checkSession();
    if (!authenticated) {
      loginView.classList.remove("hidden");
      dashboardView.classList.add("hidden");
      return;
    }
    userLabel.textContent = "Signed in";
    loginView.classList.add("hidden");
    dashboardView.classList.remove("hidden");
    await loadContent();
  })();

  async function loadContent() {
    sectionContent.innerHTML = `<div class="empty-note">Loading content…</div>`;
    try {
      const res = await fetch(CONTENT_URL + "?v=" + Date.now(), { cache: "no-store" });
      draft = await res.json();
    } catch (err) {
      sectionContent.innerHTML = `<div class="empty-note">Could not load content/site-content.json.</div>`;
      return;
    }
    renderSidebar();
    renderSection(activeSection);
  }

  // ---------------------------------------------------------------------
  // Sidebar: section list, reorder, visibility
  // ---------------------------------------------------------------------

  function renderSidebar() {
    const order = draft.sectionOrder;
    sectionNav.innerHTML = order.map((key, idx) => {
      const visible = draft.sectionVisibility[key] !== false;
      return `
      <div class="nav-item ${key === activeSection ? "active" : ""}" data-key="${key}">
        <span class="nav-label" data-select="${key}">${SECTION_LABELS[key] || key}</span>
        <span class="order-btns">
          <button data-move="up" data-key="${key}" ${idx === 0 ? "disabled" : ""}>&#8593;</button>
          <button data-move="down" data-key="${key}" ${idx === order.length - 1 ? "disabled" : ""}>&#8595;</button>
        </span>
        <span class="vis-toggle ${visible ? "" : "off"}" data-toggle-vis="${key}">${visible ? "Shown" : "Hidden"}</span>
      </div>`;
    }).join("") + `
      <div class="nav-item ${activeSection === "__media__" ? "active" : ""}" style="margin-top:14px;border-top:1px solid var(--line);padding-top:16px">
        <span class="nav-label" data-select="__media__">🗑 Media Library</span>
      </div>`;

    sectionNav.querySelectorAll("[data-select]").forEach((el) => {
      el.addEventListener("click", () => {
        activeSection = el.dataset.select;
        renderSidebar();
        activeSection === "__media__" ? renderMediaLibrary() : renderSection(activeSection);
      });
    });
    sectionNav.querySelectorAll("[data-move]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.dataset.key;
        const dir = btn.dataset.move;
        const i = draft.sectionOrder.indexOf(key);
        const j = dir === "up" ? i - 1 : i + 1;
        if (j < 0 || j >= draft.sectionOrder.length) return;
        [draft.sectionOrder[i], draft.sectionOrder[j]] = [draft.sectionOrder[j], draft.sectionOrder[i]];
        renderSidebar();
      });
    });
    sectionNav.querySelectorAll("[data-toggle-vis]").forEach((el) => {
      el.addEventListener("click", () => {
        const key = el.dataset.toggleVis;
        draft.sectionVisibility[key] = draft.sectionVisibility[key] === false ? true : false;
        renderSidebar();
      });
    });
  }

  // ---------------------------------------------------------------------
  // Field helpers
  // ---------------------------------------------------------------------

  function field(label, value, onChange, type) {
    type = type || "text";
    const id = "f_" + Math.random().toString(36).slice(2);
    const wrap = document.createElement("div");
    wrap.className = "field-group";
    const tag = type === "textarea" ? "textarea" : "input";
    wrap.innerHTML = `<label for="${id}">${label}</label>` +
      (type === "textarea"
        ? `<textarea id="${id}"></textarea>`
        : `<input id="${id}" type="${type}">`);
    const input = wrap.querySelector("#" + id);
    input.value = value == null ? "" : value;
    input.addEventListener("input", () => onChange(input.value));
    return wrap;
  }

  function mediaField(label, value, onChange, kind) {
    const wrap = document.createElement("div");
    wrap.className = "field-group";
    const id = "u_" + Math.random().toString(36).slice(2);
    const isVideoFile = kind === "video" && value && !value.startsWith("http");
    let previewHtml = "";
    if (value && kind !== "video") {
      previewHtml = `<img class="media-preview" src="${rawUrl(value)}" onerror="this.style.display='none'">`;
    } else if (isVideoFile) {
      previewHtml = `<video class="media-preview" src="${rawUrl(value)}" controls></video>`;
    } else if (value && value.startsWith("http")) {
      previewHtml = `<div class="muted" style="margin-bottom:8px">Linked: ${value}</div>`;
    }
    wrap.innerHTML = `
      <label>${label}</label>
      ${previewHtml}
      <div class="media-uploader" id="${id}">Click to upload ${kind === "video" ? "video" : "image"} (or paste an external URL below)</div>
      <input type="file" accept="${kind === "video" ? "video/*" : "image/*"}" style="display:none" id="${id}_file">
      <div class="upload-progress" id="${id}_status"></div>
      <input type="text" placeholder="or paste external URL (e.g. YouTube/Vimeo link)" value="${value && value.startsWith("http") ? value : ""}" id="${id}_url" style="margin-top:8px">
    `;
    const uploader = wrap.querySelector("#" + id);
    const fileInput = wrap.querySelector("#" + id + "_file");
    const statusEl = wrap.querySelector("#" + id + "_status");
    const urlInput = wrap.querySelector("#" + id + "_url");
    uploader.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", async () => {
      const file = fileInput.files[0];
      if (!file) return;
      statusEl.textContent = "Uploading…";
      try {
        const path = await uploadFile(file, kind);
        onChange(path);
        statusEl.textContent = "Uploaded ✓";
        renderSection(activeSection);
      } catch (err) {
        statusEl.textContent = "Upload failed: " + err.message;
      }
    });
    urlInput.addEventListener("change", () => {
      if (urlInput.value.trim()) onChange(urlInput.value.trim());
    });
    return wrap;
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function uploadFile(file, kind) {
    const MAX_MB = kind === "video" ? 50 : 8;
    if (file.size > MAX_MB * 1024 * 1024) {
      throw new Error(`File exceeds ${MAX_MB}MB. Use an external URL (e.g. YouTube/Vimeo) for large videos instead.`);
    }
    const base64 = await fileToBase64(file);
    const folder = kind === "video" ? "media/videos" : "media/images";
    const safeName = Date.now() + "-" + file.name.replace(/[^a-zA-Z0-9.\-_]/g, "");
    const path = `${folder}/${safeName}`;
    const res = await api("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, contentType: file.type, dataBase64: base64 })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "upload failed");
    }
    const data = await res.json();
    return data.path || path;
  }

  function galleryField(label, photos, onChange) {
    const wrap = document.createElement("div");
    wrap.className = "field-group";
    const id = "g_" + Math.random().toString(36).slice(2);
    wrap.innerHTML = `<label>${label}</label>
      <div class="gallery-editor-grid" id="${id}_grid"></div>
      <div class="media-uploader" id="${id}_add">+ Add Photos (you can select multiple at once)</div>
      <input type="file" accept="image/*" multiple style="display:none" id="${id}_file">
      <div class="upload-progress" id="${id}_status"></div>`;
    const grid = wrap.querySelector(`#${id}_grid`);
    const addBtn = wrap.querySelector(`#${id}_add`);
    const fileInput = wrap.querySelector(`#${id}_file`);
    const statusEl = wrap.querySelector(`#${id}_status`);

    function draw() {
      grid.innerHTML = "";
      photos.forEach((src, i) => {
        const item = document.createElement("div");
        item.className = "gallery-editor-item";
        item.innerHTML = `<img src="${rawUrl(src)}"><button data-i="${i}">✕</button>`;
        item.querySelector("button").addEventListener("click", () => {
          photos.splice(i, 1);
          onChange(photos);
          draw();
        });
        grid.appendChild(item);
      });
    }
    draw();

    addBtn.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", async () => {
      const files = Array.from(fileInput.files || []);
      if (!files.length) return;
      for (let i = 0; i < files.length; i++) {
        statusEl.textContent = `Uploading ${i + 1} of ${files.length}…`;
        try {
          const path = await uploadFile(files[i], "image");
          photos.push(path);
          onChange(photos);
          draw();
        } catch (err) {
          statusEl.textContent = `Upload failed on "${files[i].name}": ${err.message}`;
          return;
        }
      }
      statusEl.textContent = `Uploaded ${files.length} photo${files.length > 1 ? "s" : ""} ✓`;
      fileInput.value = "";
    });
    return wrap;
  }

  function sectionCard(title, ...children) {
    const card = document.createElement("div");
    card.className = "section-card";
    card.innerHTML = `<h2>${title}</h2>`;
    children.forEach((c) => card.appendChild(c));
    return card;
  }

  function listEditor(label, items, onChange) {
    const wrap = document.createElement("div");
    wrap.className = "field-group";
    wrap.innerHTML = `<label>${label}</label>`;
    const ul = document.createElement("ul");
    ul.className = "list-editor";
    function draw() {
      ul.innerHTML = "";
      items.forEach((val, i) => {
        const li = document.createElement("li");
        const inp = document.createElement("input");
        inp.type = "text"; inp.value = val;
        inp.addEventListener("input", () => { items[i] = inp.value; onChange(items); });
        const rm = document.createElement("button");
        rm.textContent = "✕";
        rm.addEventListener("click", () => { items.splice(i, 1); onChange(items); draw(); });
        li.appendChild(inp); li.appendChild(rm);
        ul.appendChild(li);
      });
    }
    draw();
    const addBtn = document.createElement("button");
    addBtn.className = "btn btn-outline btn-sm add-item-btn";
    addBtn.textContent = "+ Add";
    addBtn.addEventListener("click", () => { items.push(""); onChange(items); draw(); });
    wrap.appendChild(ul);
    wrap.appendChild(addBtn);
    return wrap;
  }

  // ---------------------------------------------------------------------
  // Section editors
  // ---------------------------------------------------------------------

  const EDITORS = {
    home(d) {
      const c = sectionCard("Home / Hero");
      c.appendChild(field("Name", d.name, (v) => d.name = v));
      c.appendChild(field("Headline", d.headline, (v) => d.headline = v));
      c.appendChild(field("Tagline", d.tagline, (v) => d.tagline = v, "textarea"));
      c.appendChild(mediaField("Portrait Image", d.portraitImage, (v) => d.portraitImage = v, "image"));
      c.appendChild(mediaField("Showreel Video", d.showreelVideo, (v) => d.showreelVideo = v, "video"));
      c.appendChild(mediaField("Showreel Thumbnail", d.showreelThumbnail, (v) => d.showreelThumbnail = v, "image"));
      c.appendChild(field("Watch Button Text", d.ctaWatchText, (v) => d.ctaWatchText = v));
      c.appendChild(field("Contact Button Text", d.ctaContactText, (v) => d.ctaContactText = v));
      return [c];
    },
    about(d) {
      const c = sectionCard("About");
      c.appendChild(field("Heading", d.heading, (v) => d.heading = v));
      c.appendChild(field("Bio", d.bio, (v) => d.bio = v, "textarea"));
      c.appendChild(field("Age", d.age, (v) => d.age = v, "number"));
      c.appendChild(field("Location", d.location, (v) => d.location = v));
      c.appendChild(field("Education", d.education, (v) => d.education = v));
      c.appendChild(listEditor("Languages", d.languages, (v) => d.languages = v));
      c.appendChild(mediaField("Profile Photo", d.profileImage, (v) => d.profileImage = v, "image"));
      return [c];
    },
    journey(d) {
      const c = sectionCard("Journey");
      c.appendChild(field("Heading", d.heading, (v) => d.heading = v));
      const list = document.createElement("div");
      function draw() {
        list.innerHTML = "";
        d.milestones.forEach((m, i) => {
          const item = document.createElement("div");
          item.className = "repeatable-item";
          item.innerHTML = `<button class="remove-btn" data-i="${i}">✕</button>`;
          item.appendChild(field("Year", m.year, (v) => m.year = v));
          item.appendChild(field("Title", m.title, (v) => m.title = v));
          item.appendChild(field("Description", m.description, (v) => m.description = v, "textarea"));
          item.querySelector(".remove-btn").addEventListener("click", () => { d.milestones.splice(i, 1); draw(); });
          list.appendChild(item);
        });
      }
      draw();
      const addBtn = document.createElement("button");
      addBtn.className = "btn btn-outline btn-sm add-item-btn";
      addBtn.textContent = "+ Add Milestone";
      addBtn.addEventListener("click", () => { d.milestones.push({ year: "", title: "", description: "" }); draw(); });
      c.appendChild(list); c.appendChild(addBtn);
      return [c];
    },
    portfolio(d) {
      const c = sectionCard("Acting Portfolio");
      c.appendChild(field("Heading", d.heading, (v) => d.heading = v));
      c.appendChild(field("Subheading", d.subheading, (v) => d.subheading = v));
      const list = document.createElement("div");
      function draw() {
        list.innerHTML = "";
        d.projects.forEach((p, i) => {
          const item = document.createElement("div");
          item.className = "repeatable-item";
          item.innerHTML = `<button class="remove-btn" data-i="${i}">✕</button>`;
          item.appendChild(field("Title", p.title, (v) => p.title = v));
          const row = document.createElement("div"); row.className = "field-row";
          row.appendChild(field("Role", p.role, (v) => p.role = v));
          row.appendChild(field("Year", p.year, (v) => p.year = v));
          item.appendChild(row);
          item.appendChild(field("Description", p.description, (v) => p.description = v, "textarea"));
          item.appendChild(field("Credits", p.credits, (v) => p.credits = v));
          item.appendChild(mediaField("Cover Image", p.coverImage, (v) => p.coverImage = v, "image"));
          item.querySelector(".remove-btn").addEventListener("click", () => { d.projects.splice(i, 1); draw(); });
          list.appendChild(item);
        });
      }
      draw();
      const addBtn = document.createElement("button");
      addBtn.className = "btn btn-outline btn-sm add-item-btn";
      addBtn.textContent = "+ Add Project";
      addBtn.addEventListener("click", () => {
        d.projects.push({ id: "project-" + Date.now(), title: "", role: "", year: "", description: "", credits: "", coverImage: "", images: [], videos: [] });
        draw();
      });
      c.appendChild(list); c.appendChild(addBtn);
      return [c];
    },
    videos(d) {
      const c = sectionCard("Videos & Reels");
      c.appendChild(field("Heading", d.heading, (v) => d.heading = v));
      c.appendChild(field("Subheading", d.subheading, (v) => d.subheading = v));
      const list = document.createElement("div");
      function draw() {
        list.innerHTML = "";
        d.items.forEach((v, i) => {
          const item = document.createElement("div");
          item.className = "repeatable-item";
          item.innerHTML = `<button class="remove-btn" data-i="${i}">✕</button>`;
          item.appendChild(field("Title", v.title, (val) => v.title = val));
          item.appendChild(field("Description", v.description, (val) => v.description = val, "textarea"));
          item.appendChild(mediaField("Thumbnail", v.thumbnail, (val) => v.thumbnail = val, "image"));
          item.appendChild(mediaField("Video (upload or paste YouTube/Vimeo URL)", v.videoUrl, (val) => v.videoUrl = val, "video"));
          item.querySelector(".remove-btn").addEventListener("click", () => { d.items.splice(i, 1); draw(); });
          list.appendChild(item);
        });
      }
      draw();
      const addBtn = document.createElement("button");
      addBtn.className = "btn btn-outline btn-sm add-item-btn";
      addBtn.textContent = "+ Add Video";
      addBtn.addEventListener("click", () => { d.items.push({ title: "", description: "", thumbnail: "", videoUrl: "" }); draw(); });
      c.appendChild(list); c.appendChild(addBtn);
      return [c];
    },
    shortFilm(d) {
      const c = sectionCard("Short Films");
      c.appendChild(field("Heading", d.heading, (v) => d.heading = v));
      c.appendChild(field("Subheading", d.subheading, (v) => d.subheading = v));
      const list = document.createElement("div");
      function draw() {
        list.innerHTML = "";
        d.items.forEach((p, i) => {
          const item = document.createElement("div");
          item.className = "repeatable-item";
          item.innerHTML = `<button class="remove-btn" data-i="${i}">✕</button>`;
          item.appendChild(field("Title", p.title, (v) => p.title = v));
          const row = document.createElement("div"); row.className = "field-row";
          row.appendChild(field("Role (e.g. Lead, Supporting)", p.role, (v) => p.role = v));
          row.appendChild(field("Year", p.year, (v) => p.year = v));
          item.appendChild(row);
          item.appendChild(field("Description", p.description, (v) => p.description = v, "textarea"));
          item.appendChild(galleryField("Photos", p.photos || (p.photos = []), (v) => p.photos = v));
          item.appendChild(mediaField("Video (upload a file, or paste a YouTube/Vimeo link below)", p.videoLink, (v) => p.videoLink = v, "video"));
          item.querySelector(".remove-btn").addEventListener("click", () => { d.items.splice(i, 1); draw(); });
          list.appendChild(item);
        });
      }
      draw();
      const addBtn = document.createElement("button");
      addBtn.className = "btn btn-outline btn-sm add-item-btn";
      addBtn.textContent = "+ Add Short Film";
      addBtn.addEventListener("click", () => {
        d.items.push({ title: "", role: "", year: "", description: "", photos: [], videoLink: "" });
        draw();
      });
      c.appendChild(list); c.appendChild(addBtn);
      return [c];
    },
    gallery(d) {
      const c = sectionCard("Gallery");
      c.appendChild(field("Heading", d.heading, (v) => d.heading = v));
      c.appendChild(field("Subheading", d.subheading, (v) => d.subheading = v));
      const list = document.createElement("div");
      function draw() {
        list.innerHTML = "";
        d.items.forEach((g, i) => {
          const item = document.createElement("div");
          item.className = "repeatable-item";
          item.innerHTML = `<button class="remove-btn" data-i="${i}">✕</button>`;
          item.appendChild(mediaField("Image", g.image, (v) => g.image = v, "image"));
          item.appendChild(field("Title (optional)", g.title, (v) => g.title = v));
          item.appendChild(field("Caption (optional)", g.description, (v) => g.description = v, "textarea"));
          item.querySelector(".remove-btn").addEventListener("click", () => { d.items.splice(i, 1); draw(); });
          list.appendChild(item);
        });
      }
      draw();
      const addBtn = document.createElement("button");
      addBtn.className = "btn btn-outline btn-sm add-item-btn";
      addBtn.textContent = "+ Add Photo";
      addBtn.addEventListener("click", () => { d.items.push({ image: "", title: "", description: "" }); draw(); });
      c.appendChild(list); c.appendChild(addBtn);
      return [c];
    },
    currentProject(d) {
      const c = sectionCard("Current Projects");
      c.appendChild(field("Heading", d.heading, (v) => d.heading = v));
      c.appendChild(field("Subheading", d.subheading, (v) => d.subheading = v));
      const list = document.createElement("div");
      function draw() {
        list.innerHTML = "";
        d.items.forEach((p, i) => {
          const item = document.createElement("div");
          item.className = "repeatable-item";
          item.innerHTML = `<button class="remove-btn" data-i="${i}">✕</button>`;
          item.appendChild(field("Title", p.title, (v) => p.title = v));
          const row = document.createElement("div"); row.className = "field-row";
          row.appendChild(field("Status (e.g. Upcoming)", p.status, (v) => p.status = v));
          row.appendChild(field("Language", p.language, (v) => p.language = v));
          item.appendChild(row);
          item.appendChild(field("Type (e.g. Feature Film)", p.type, (v) => p.type = v));
          item.appendChild(field("Description", p.description, (v) => p.description = v, "textarea"));
          item.appendChild(galleryField("Photos", p.photos || (p.photos = []), (v) => p.photos = v));
          item.appendChild(mediaField("Video (upload a file, or paste a YouTube/Vimeo link below)", p.youtubeLink, (v) => p.youtubeLink = v, "video"));
          item.querySelector(".remove-btn").addEventListener("click", () => { d.items.splice(i, 1); draw(); });
          list.appendChild(item);
        });
      }
      draw();
      const addBtn = document.createElement("button");
      addBtn.className = "btn btn-outline btn-sm add-item-btn";
      addBtn.textContent = "+ Add Project";
      addBtn.addEventListener("click", () => {
        d.items.push({ id: "project-" + Date.now(), title: "", status: "Upcoming", language: "", type: "", description: "", photos: [], youtubeLink: "" });
        draw();
      });
      c.appendChild(list); c.appendChild(addBtn);
      return [c];
    },
    skills(d) {
      const c = sectionCard("Skills");
      c.appendChild(field("Heading", d.heading, (v) => d.heading = v));
      c.appendChild(listEditor("Skills", d.items, (v) => d.items = v));
      c.appendChild(listEditor("Open To", d.openTo, (v) => d.openTo = v));
      return [c];
    },
    contact(d) {
      const c = sectionCard("Contact");
      c.appendChild(field("Heading", d.heading, (v) => d.heading = v));
      c.appendChild(field("Subheading", d.subheading, (v) => d.subheading = v, "textarea"));
      c.appendChild(field("Phone", d.phone, (v) => d.phone = v, "tel"));
      c.appendChild(field("WhatsApp Link", d.whatsapp, (v) => d.whatsapp = v, "url"));
      c.appendChild(field("Email", d.email, (v) => d.email = v, "email"));
      c.appendChild(field("Instagram Link", d.instagram, (v) => d.instagram = v, "url"));
      return [c];
    }
  };

  function formatBytes(n) {
    if (n < 1024) return n + " B";
    if (n < 1024 * 1024) return (n / 1024).toFixed(0) + " KB";
    return (n / 1024 / 1024).toFixed(1) + " MB";
  }

  async function renderMediaLibrary() {
    sectionContent.innerHTML = `<div class="empty-note">Loading media…</div>`;
    let files;
    try {
      const res = await api("/api/media-list");
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Could not load media");
      files = (await res.json()).files || [];
    } catch (err) {
      sectionContent.innerHTML = `<div class="empty-note">Could not load media library: ${err.message}</div>`;
      return;
    }

    const card = sectionCard("Media Library");
    const note = document.createElement("p");
    note.className = "muted";
    note.style.marginTop = "-8px";
    note.textContent = "Only delete photos or videos that are no longer used anywhere on the site — deleting one still in use will leave a broken image there.";
    card.appendChild(note);

    if (!files.length) {
      const empty = document.createElement("div");
      empty.className = "empty-note";
      empty.textContent = "No uploaded media yet.";
      card.appendChild(empty);
    } else {
      const grid = document.createElement("div");
      grid.className = "gallery-editor-grid";
      grid.style.gridTemplateColumns = "repeat(auto-fill, minmax(120px, 1fr))";
      files.forEach((f) => {
        const isVideo = f.path.startsWith("media/videos/");
        const item = document.createElement("div");
        item.className = "gallery-editor-item";
        item.style.aspectRatio = "1/1";
        item.innerHTML = isVideo
          ? `<video src="${rawUrl(f.path)}" muted></video><button data-path="${f.path}">✕</button>`
          : `<img src="${rawUrl(f.path)}"><button data-path="${f.path}">✕</button>`;
        const label = document.createElement("div");
        label.className = "muted";
        label.style.fontSize = ".7rem";
        label.style.marginTop = "2px";
        label.style.wordBreak = "break-all";
        label.textContent = `${f.name} (${formatBytes(f.size)})`;
        const wrap = document.createElement("div");
        wrap.appendChild(item);
        wrap.appendChild(label);
        grid.appendChild(wrap);

        item.querySelector("button").addEventListener("click", async () => {
          if (!confirm(`Delete ${f.name}? This can't be undone.`)) return;
          try {
            const res = await api("/api/media-delete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ path: f.path })
            });
            if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Delete failed");
            renderMediaLibrary();
          } catch (err) {
            alert("Could not delete: " + err.message);
          }
        });
      });
      card.appendChild(grid);
    }

    sectionContent.innerHTML = "";
    sectionContent.appendChild(card);
  }

  function renderSection(key) {
    sectionContent.innerHTML = "";
    const editor = EDITORS[key];
    if (!editor || !draft[key]) {
      sectionContent.innerHTML = `<div class="empty-note">Nothing to edit here yet.</div>`;
      return;
    }
    editor(draft[key]).forEach((el) => sectionContent.appendChild(el));

    // SEO card only shown on the Home tab, edits meta.*
    if (key === "home") {
      const seo = sectionCard("SEO");
      seo.appendChild(field("Site Title", draft.meta.siteTitle, (v) => draft.meta.siteTitle = v));
      seo.appendChild(field("Meta Description", draft.meta.seoDescription, (v) => draft.meta.seoDescription = v, "textarea"));
      seo.appendChild(field("Keywords", draft.meta.seoKeywords, (v) => draft.meta.seoKeywords = v));
      sectionContent.appendChild(seo);
    }
  }

  // ---------------------------------------------------------------------
  // Preview
  // ---------------------------------------------------------------------

  document.getElementById("previewBtn").addEventListener("click", () => {
    window.localStorage.setItem("siteContentDraft", JSON.stringify(draft));
    document.getElementById("previewFrame").src = "../index.html?preview=1&t=" + Date.now();
    document.getElementById("previewModal").classList.remove("hidden");
  });
  document.getElementById("closePreviewBtn").addEventListener("click", () => {
    document.getElementById("previewModal").classList.add("hidden");
  });

  // ---------------------------------------------------------------------
  // Publish
  // ---------------------------------------------------------------------

  document.getElementById("publishBtn").addEventListener("click", async () => {
    publishStatus.textContent = "Publishing…";
    publishStatus.className = "publish-status";
    try {
      const res = await api("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: draft })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Publish failed");
      }
      publishStatus.textContent = "Published! GitHub Actions is deploying your changes — this usually takes 1-2 minutes.";
      publishStatus.className = "publish-status success";
    } catch (err) {
      publishStatus.textContent = "Error: " + err.message;
      publishStatus.className = "publish-status error";
    }
  });
})();
