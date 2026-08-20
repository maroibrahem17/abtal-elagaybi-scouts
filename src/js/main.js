import { images, photoAlbum, heroScoutImage, heroChurchImage, heroAdventureImage } from "./config/images.js";
import { chants } from "./config/chants.js";
import { products } from "./config/products.js";
import { site } from "./config/site.js";

const CART_KEY = "abtal-cart";
const FAV_KEY = "abtal-favorites";

let cart = loadJson(CART_KEY, []);
let favorites = loadJson(FAV_KEY, []);
let activeChantId = null;
let audioEl = null;
let audioAvailable = false;
let usingSpeech = false;
let scrollBusy = false;
let scrollOpen = false;
let firstUnroll = true;
let albumIndex = 0;
let albumLightboxOpen = false;
let albumTouchStartX = null;
let albumSwipeDetected = false;
let currentProducts = products;
let currentChants = chants;
let currentAlbum = photoAlbum;
let publicAuthUser = null;
let publicProfile = null;
let publicAuthApi = null;
let publicAuthResolved = false;
let publicProfileError = null;
let pendingSignupProfile = null;
let profileEditMode = false;
const allowedStages = ["أشبال", "زهرات", "كشافة", "مرشدات", "متقدم", "رائدات", "جوالة"];

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function qs(id) {
  return document.getElementById(id);
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

function resolveImageUrl(value = "") {
  if (!value.startsWith("/images/")) return value;
  return `${import.meta.env.BASE_URL}${value.slice(1)}`;
}

const THEME_KEY = "scouts-theme";
const APP_BASE = import.meta.env.BASE_URL;

function appPath(path = "/") {
  return `${APP_BASE}${path.replace(/^\/+/, "")}`;
}

function currentPath() {
  const path = window.location.pathname;
  const normalized = APP_BASE !== "/" && path.startsWith(APP_BASE) ? path.slice(APP_BASE.length - 1) : path;
  return normalized.replace(/\/$/, "") || "/";
}

function getStoredTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
  const resolved = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = resolved;
  const toggle = qs("themeToggle");
  if (toggle) {
    toggle.innerHTML = resolved === "dark" ? "☀️" : "🌙";
    toggle.setAttribute("aria-label", resolved === "dark" ? "تبديل إلى الوضع الفاتح" : "تبديل إلى الوضع الداكن");
    toggle.title = resolved === "dark" ? "الوضع الفاتح" : "الوضع الداكن";
  }
  localStorage.setItem(THEME_KEY, resolved);
}

function initThemeToggle() {
  const toggle = qs("themeToggle");
  if (!toggle) return;
  applyTheme(getStoredTheme());
  toggle.addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
  });
}
function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function formatPrice(value) {
  return `${value} ج.م`;
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function chantLyrics(chant) {
  if (typeof chant.text === "string") return chant.text.split("\n");
  return chant.lyrics || chant.lines || [];
}

function chantAudio(chant) {
  return chant.audioUrl || chant.audioSrc || "";
}

function applyImages() {
  document.querySelectorAll("[data-logo='scout']").forEach((img) => {
    img.src = images.logos.scout;
  });
  document.querySelectorAll("[data-logo='church']").forEach((img) => {
    img.src = images.logos.church;
  });

  const scout = qs("heroScoutImage");
  const church = qs("heroChurchImage");
  const adventure = qs("heroAdventureImage");
  if (scout) scout.src = heroScoutImage;
  if (church) church.src = heroChurchImage;
  if (adventure) adventure.src = heroAdventureImage;

  const map = qs("fayoumMap");
  if (map) map.src = images.footer.fayoumMap;

  qs("aboutImage1") && (qs("aboutImage1").src = images.gallery.courtyardFormation);
  qs("aboutImage2") && (qs("aboutImage2").src = images.gallery.scoutCircle);
}

function applyPublicSettings(settings = {}) {
  const address = settings.address || site.address;
  const phone = settings.phone || site.phoneDisplay;
  const email = settings.email || site.email;
  const instagram = settings.instagramUrl || site.instagram;
  const facebook = settings.facebookUrl || site.facebook;
  const addressNodes = document.querySelectorAll("[data-site-address]");
  addressNodes.forEach((node) => { node.textContent = address; });
  const phoneLink = document.querySelector(".site-footer a[href^='tel:']");
  if (phoneLink) { phoneLink.textContent = phone; phoneLink.href = `tel:${phone.replace(/\D/g, "")}`; }
  const emailLink = document.querySelector(".site-footer a[href^='mailto:']");
  if (emailLink) { emailLink.textContent = email; emailLink.href = `mailto:${email}`; }
  const socialLinks = document.querySelectorAll(".site-footer .socials a");
  socialLinks[0] && (socialLinks[0].href = facebook);
  socialLinks[1] && (socialLinks[1].href = instagram);
}

function publicAuthError(error) {
  if (error?.message === "firebase-not-configured") return "إعداد Firebase غير مكتمل بعد.";
  return publicAuthApi?.firebaseAuthMessage(error) || "تعذر تنفيذ العملية حاليًا.";
}

function renderAuthControls() {
  const controls = qs("authControls");
  if (!controls) return;

  if (!publicAuthResolved) {
    controls.innerHTML = `<span class="auth-greeting auth-greeting--loading">جارٍ التحقق...</span>`;
    return;
  }

  if (publicAuthUser && !publicProfile) {
    controls.innerHTML = `<span class="auth-greeting auth-greeting--error">${escapeHtml(publicProfileError ? publicAuthError(publicProfileError) : "تعذر تحميل بيانات الحساب")}</span><button id="logoutBtn" class="auth-link auth-link--muted" type="button">تسجيل الخروج</button>`;
    qs("logoutBtn")?.addEventListener("click", logoutPublicUser);
    return;
  }

  if (!publicAuthUser || !publicProfile) {
    controls.innerHTML = `<button id="accountBtn" class="auth-link" type="button">تسجيل الدخول</button><a class="auth-link auth-link--gold" href="${appPath("/signup")}">إنشاء حساب</a>`;
  } else {
    const firstName = (publicProfile.name || publicAuthUser.email || "مستخدم").trim().split(/\s+/)[0];
    controls.innerHTML = `<span class="auth-greeting">أهلاً، ${escapeHtml(firstName)}</span><button id="accountBtn" class="auth-link" type="button">حسابي</button><button id="logoutBtn" class="auth-link auth-link--muted" type="button">تسجيل الخروج</button>`;
  }

  const accountButton = qs("accountBtn");
  if (accountButton) {
    accountButton.onclick = () => {
      renderAccountModal();
      openModal("accountModal");
    };
  }
  qs("logoutBtn")?.addEventListener("click", logoutPublicUser);
}

function renderAccountModal(message = "") {
  const body = qs("accountModalBody");
  if (!body) return;
  if (!publicAuthUser || !publicProfile) {
    profileEditMode = false;
    body.innerHTML = `<form id="publicLoginForm" class="account-form"><label>البريد الإلكتروني<input name="email" type="email" autocomplete="email" required /></label><label>كلمة المرور<input name="password" type="password" autocomplete="current-password" required /></label><p id="publicAuthError" class="admin-error" role="alert" ${message ? "" : "hidden"}>${escapeHtml(message)}</p><button class="btn btn-gold" type="submit">تسجيل الدخول</button><a class="auth-form-link" href="${appPath("/signup")}">ليس لديك حساب؟ إنشاء حساب</a></form>`;
    qs("publicLoginForm").addEventListener("submit", submitPublicLogin);
    return;
  }
  const profileFields = [
    ["name", "الاسم الكامل", publicProfile.name, "♙"],
    ["email", "البريد الإلكتروني", publicProfile.email || publicAuthUser.email, "✉"],
    ["phone", "رقم الموبايل", publicProfile.phone, "⌕"],
    ["address", "العنوان", publicProfile.address, "⌂"],
    ["team", "الفريق", publicProfile.team, "✦"],
    ["stage", "المرحلة", publicProfile.stage, "◇"],
  ];
  const profileContent = profileEditMode
    ? `<form id="profileForm" class="account-form account-form--profile"><div class="profile-edit-grid"><label>الاسم الكامل<input name="name" value="${escapeHtml(publicProfile.name)}" required /></label><label>البريد الإلكتروني<input value="${escapeHtml(publicProfile.email || publicAuthUser.email || "")}" disabled /></label><label>رقم الموبايل<input name="phone" value="${escapeHtml(publicProfile.phone)}" required /></label><label>العنوان<input name="address" value="${escapeHtml(publicProfile.address)}" required /></label><label>الفريق<input name="team" value="${escapeHtml(publicProfile.team)}" required /></label><label>المرحلة<select name="stage" required>${allowedStages.map((stage) => `<option value="${stage}" ${stage === publicProfile.stage ? "selected" : ""}>${stage}</option>`).join("")}</select></label></div><p id="publicAuthError" class="admin-error" role="alert" hidden></p><div class="profile-actions"><button class="btn btn-gold" type="submit"><span aria-hidden="true">✓</span> حفظ التعديلات</button><button class="btn profile-cancel" type="button" data-profile-cancel>إلغاء</button></div></form>`
    : `<div class="profile-list">${profileFields.map(([key, label, value, icon]) => `<div class="profile-row"><span class="profile-row__icon" aria-hidden="true">${icon}</span><div><span class="profile-row__label">${label}</span><strong>${escapeHtml(value || "غير مضاف")}</strong></div></div>`).join("")}</div><p id="publicAuthError" class="admin-error profile-message" role="alert" ${message ? "" : "hidden"}>${escapeHtml(message)}</p><div class="profile-actions"><button class="btn btn-gold" type="button" data-profile-edit><span aria-hidden="true">✎</span> تعديل البيانات</button><button class="btn profile-logout" type="button" id="profileLogout">تسجيل الخروج</button></div>`;
  body.innerHTML = `<div class="profile-header"><div class="profile-avatar" aria-hidden="true">♙</div><div><p class="profile-eyebrow">حسابي</p><h3>أهلاً، ${escapeHtml(publicProfile.name || "مستخدم")}</h3></div></div><div class="profile-divider" aria-hidden="true"></div>${profileContent}`;
  qs("profileForm")?.addEventListener("submit", submitProfileUpdate);
  qs("profileLogout")?.addEventListener("click", logoutPublicUser);
  qs("[data-profile-edit]")?.addEventListener("click", () => { profileEditMode = true; renderAccountModal(); });
  qs("[data-profile-cancel]")?.addEventListener("click", () => { profileEditMode = false; renderAccountModal(); });
}

async function submitPublicLogin(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector("button[type=submit]");
  const error = qs("publicAuthError");
  const data = new FormData(form);
  button.disabled = true;
  try {
    const credential = await publicAuthApi.signInUser(String(data.get("email")).trim(), String(data.get("password")));
    const profile = await publicAuthApi.getUserProfile(credential.user.uid);
    if (!profile) throw new Error("profile-missing");
    if (profile.role === "admin") { window.location.assign(appPath("/admin")); return; }
    publicAuthUser = credential.user;
    publicProfile = profile;
    closeOverlays();
    renderAuthControls();
  } catch (authError) {
    error.textContent = authError.message === "profile-missing" ? "تعذر تحميل بيانات الحساب." : publicAuthError(authError);
    error.hidden = false;
    button.disabled = false;
  }
}

async function submitProfileUpdate(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const profile = { name: String(data.get("name")).trim(), phone: String(data.get("phone")).trim(), address: String(data.get("address")).trim(), team: String(data.get("team")).trim(), stage: String(data.get("stage")) };
  const error = qs("publicAuthError");
  if (!profile.name || !profile.phone || !profile.address || !profile.team || !allowedStages.includes(profile.stage)) { error.textContent = "تحقق من جميع البيانات المطلوبة."; error.hidden = false; return; }
  const button = form.querySelector("button[type=submit]");
  button.disabled = true;
  try { await publicAuthApi.updateUserProfile(publicAuthUser.uid, profile); publicProfile = { ...publicProfile, ...profile }; profileEditMode = false; renderAuthControls(); renderAccountModal("تم حفظ البيانات بنجاح."); } catch (updateError) { error.textContent = publicAuthError(updateError); error.hidden = false; } finally { button.disabled = false; }
}

async function logoutPublicUser() {
  await publicAuthApi.signOutAdmin();
  publicAuthUser = null;
  publicProfile = null;
  renderAuthControls();
  window.location.assign(appPath());
}

function renderSignupPage() {
  if (currentPath() !== "/signup") return;
  qs("main").innerHTML = `<section class="section signup-section"><div class="container"><div class="signup-panel"><p class="admin-kicker">كشافة أبطال العجايبي</p><h1>إنشاء حساب</h1><p class="admin-lead">انضم إلى مجتمعنا الكشفي.</p><form id="signupForm" class="admin-form signup-form"><label>الاسم الكامل<input name="name" minlength="2" required /></label><div class="admin-form-grid"><label>البريد الإلكتروني<input name="email" type="email" required /></label><label>رقم الموبايل<input name="phone" inputmode="tel" required /></label></div><div class="admin-form-grid"><label>كلمة المرور<input name="password" type="password" minlength="6" required /></label><label>تأكيد كلمة المرور<input name="confirmPassword" type="password" minlength="6" required /></label></div><label>العنوان<input name="address" required /></label><div class="admin-form-grid"><label>الفريق<input name="team" required /></label><label>المرحلة<select name="stage" required><option value="">اختر المرحلة</option>${allowedStages.map((stage) => `<option value="${stage}">${stage}</option>`).join("")}</select></label></div><p id="signupError" class="admin-error" role="alert" hidden></p><button class="btn btn-gold" type="submit">إنشاء الحساب</button><a class="auth-form-link" href="/">لديك حساب؟ تسجيل الدخول من الموقع</a></form></div></div></section>`;
  qs("signupForm").addEventListener("submit", submitSignup);
}

async function submitSignup(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const error = qs("signupError");
  const values = Object.fromEntries(data);
  const phonePattern = /^(?:\+20|0020|0)?1[0125]\d{8}$/;
  if (String(values.name).trim().length < 2) { error.textContent = "أدخل الاسم الكامل."; error.hidden = false; return; }
  if (values.password !== values.confirmPassword) { error.textContent = "تأكيد كلمة المرور غير مطابق."; error.hidden = false; return; }
  if (!phonePattern.test(String(values.phone).replace(/[\s-]/g, ""))) { error.textContent = "أدخل رقم موبايل مصري صحيح."; error.hidden = false; return; }
  if (!values.address || !values.team || !allowedStages.includes(values.stage)) { error.textContent = "أكمل جميع البيانات المطلوبة."; error.hidden = false; return; }
  const button = form.querySelector("button[type=submit]");
  button.disabled = true;
  try {
    const credential = await publicAuthApi.signUpUser(String(values.email).trim(), String(values.password));
    const profileData = { name: String(values.name).trim(), email: credential.user.email, phone: String(values.phone).trim(), address: String(values.address).trim(), team: String(values.team).trim(), stage: String(values.stage) };
    const profilePromise = publicAuthApi.createUserProfile(credential.user.uid, profileData);
    pendingSignupProfile = { uid: credential.user.uid, promise: profilePromise };
    await profilePromise;
    pendingSignupProfile = null;
    window.location.assign(appPath());
  } catch (signupError) {
    if (pendingSignupProfile?.uid === publicAuthUser?.uid) pendingSignupProfile = null;
    error.textContent = signupError.message === "firebase-not-configured" ? "إعداد Firebase غير مكتمل بعد." : publicAuthError(signupError);
    error.hidden = false;
    button.disabled = false;
  }
}

async function initPublicAuth() {
  try {
    const [authModule, usersModule] = await Promise.all([import("./services/firebase/auth.js"), import("./services/firestore/users.js")]);
    publicAuthApi = { ...authModule, ...usersModule };
    if (!import.meta.env.VITE_FIREBASE_PROJECT_ID) {
      publicAuthResolved = true;
      renderAuthControls();
      return;
    }
    publicAuthApi.watchAuthState(async (user) => {
      publicAuthUser = user;
      publicProfileError = null;
      if (user && pendingSignupProfile?.uid === user.uid) {
        try {
          await pendingSignupProfile.promise;
        } catch (profileError) {
          publicProfileError = profileError;
          publicAuthResolved = true;
          renderAuthControls();
          return;
        }
      }
      if (user) {
        try {
          publicProfile = await publicAuthApi.getUserProfile(user.uid);
        } catch (profileError) {
          publicProfile = null;
          publicProfileError = profileError;
        }
      } else {
        publicProfile = null;
      }
      publicAuthResolved = true;
      renderAuthControls();
      if (currentPath() === "/signup" && user && publicProfile) window.location.assign(appPath());
    });
  } catch {
    publicAuthResolved = true;
    renderAuthControls();
  }
}

async function loadPublicFirestoreContent() {
  if (!import.meta.env.VITE_FIREBASE_PROJECT_ID) return;
  try {
    const { loadPublicFirestoreContent: load } = await import("./services/firestore/public.js");
    const remote = await load();
    if (!remote) return;
    if (remote.products.length) {
      currentProducts = remote.products.map((item) => ({ ...item, image: resolveImageUrl(item.imageUrl || item.image || "") }));
      renderProducts(currentPath() === "/shop" ? currentProducts : undefined);
      renderCart();
    }
    if (remote.chants.length) {
      currentChants = remote.chants.filter((item) => item.visible !== false).map((item) => ({ ...item, lyrics: typeof item.text === "string" ? item.text.split("\n") : [] }));
      renderChantTabs();
    }
    if (remote.gallery.length) {
      currentAlbum = remote.gallery.filter((item) => item.visible !== false).map((item) => ({ ...item, src: resolveImageUrl(item.imageUrl || ""), alt: item.alt || item.title || "صورة من ألبوم الكشافة" }));
      albumIndex = 0;
      renderAlbum();
    }
    applyPublicSettings(remote.settings);
  } catch {
    // Local data remains the public fallback when Firestore is empty or unavailable.
  }
}

function currentAlbumPhoto() {
  return currentAlbum[albumIndex];
}

function renderAlbum() {
  const album = qs("photoAlbum");
  if (!album || currentAlbum.length === 0) return;

  const photo = currentAlbumPhoto();
  const image = qs("albumImage");
  const lightboxImage = qs("albumLightboxImage");
  if (image) {
    image.src = photo.src;
    image.alt = photo.alt;
  }
  if (lightboxImage) {
    lightboxImage.src = photo.src;
    lightboxImage.alt = photo.alt;
  }
  document.querySelectorAll("#albumCounter, #albumLightboxCounter").forEach((counter) => {
    counter.textContent = `الصورة ${albumIndex + 1} من ${currentAlbum.length}`;
  });

  const dots = qs("albumDots");
  if (dots) {
    dots.innerHTML = currentAlbum
      .map((item, index) => `<button class="album-dot ${index === albumIndex ? "is-active" : ""}" type="button" data-album-index="${index}" aria-label="الصورة ${index + 1}" aria-pressed="${index === albumIndex}"></button>`)
      .join("");
  }

  const thumbs = qs("albumThumbs");
  if (thumbs) {
    thumbs.innerHTML = currentAlbum
      .slice(0, 8)
      .map((item, index) => `<button class="album-thumb ${index === albumIndex ? "is-active" : ""}" type="button" data-album-index="${index}" aria-label="عرض ${item.alt}"><img src="${item.src}" alt="" loading="lazy" width="120" height="72"></button>`)
      .join("");
  }
}

function changeAlbumPhoto(step) {
  if (currentAlbum.length < 2) return;
  albumIndex = (albumIndex + step + currentAlbum.length) % currentAlbum.length;
  const album = qs("photoAlbum");
  album?.classList.remove("is-changing");
  void album?.offsetWidth;
  album?.classList.add("is-changing");
  renderAlbum();
  window.setTimeout(() => album?.classList.remove("is-changing"), prefersReducedMotion() ? 0 : 320);
}

function selectAlbumPhoto(index) {
  if (!Number.isInteger(index) || index < 0 || index >= currentAlbum.length) return;
  albumIndex = index;
  renderAlbum();
}

function openAlbumLightbox() {
  const lightbox = qs("albumLightbox");
  if (!lightbox) return;
  albumLightboxOpen = true;
  renderAlbum();
  lightbox.hidden = false;
  qs("backdrop").hidden = false;
  document.body.classList.add("is-locked");
  lightbox.querySelector("[data-album-close]")?.focus();
}

function closeAlbumLightbox() {
  albumLightboxOpen = false;
  const lightbox = qs("albumLightbox");
  if (lightbox) lightbox.hidden = true;
  if (!document.querySelector(".drawer.is-open, .modal.is-open, .mobile-nav.is-open")) {
    qs("backdrop").hidden = true;
    document.body.classList.remove("is-locked");
  }
}

function productCard(product) {
  const fav = favorites.includes(product.id);
  return `
    <article class="product-card" data-product="${product.id}">
      <div class="product-card__media">
        <img src="${product.image}" alt="${product.name}" loading="lazy" width="640" height="480">
        <button class="icon-btn icon-btn--heart ${fav ? "is-active" : ""}" type="button" data-fav="${product.id}" aria-label="إضافة إلى المفضلة" aria-pressed="${fav}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.4-4.35-9.33-8.12C.7 10.4 1.1 6.9 3.7 5.2c2.1-1.4 4.8-.7 6.3 1.3 1.5-2 4.2-2.7 6.3-1.3 2.6 1.7 3 5.2 1.03 7.68C18.4 16.65 12 21 12 21z"/></svg>
        </button>
      </div>
      <div class="product-card__body">
        <span class="product-category">${product.category || "منتجات كشفية"}</span>
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <div class="product-card__row">
          <span class="price">${formatPrice(product.price)}</span>
          <button class="btn btn-gold btn-sm" type="button" data-add="${product.id}">أضف للسلة</button>
        </div>
      </div>
    </article>
  `;
}

function renderProducts(list = currentProducts.filter((product) => product.featured)) {
  const grid = qs("productGrid");
  if (!grid) return;
  grid.innerHTML = list.length ? list.map(productCard).join("") : `<p class="empty-shop">لا توجد منتجات مطابقة لبحثك</p>`;
}

function renderShopPage() {
  if (currentPath() !== "/shop") return;
  qs("main").innerHTML = `
    <section class="section shop-page" aria-labelledby="shopPageTitle">
      <div class="container">
        <header class="shop-page__head section-head">
          <div class="ornament" aria-hidden="true"></div>
          <p class="eyebrow">كشافة أبطال العجايبي</p>
          <h1 id="shopPageTitle">المتجر الكشفي</h1>
          <p>اكتشف منتجات كشافة أبطال العجايبي</p>
        </header>
        <div class="shop-tools">
          <label class="shop-search"><span class="sr-only">ابحث في المتجر</span><input id="shopSearch" type="search" placeholder="ابحث في المتجر..." /></label>
          <div class="category-list" role="group" aria-label="تصنيفات المنتجات">
            ${["الكل", "الزي الكشفي", "الإكسسوارات", "الشارات", "الأدوات", "الهدايا"].map((category, index) => `<button class="category-btn ${index === 0 ? "is-active" : ""}" type="button" data-category="${category}">${category}</button>`).join("")}
          </div>
        </div>
        <div id="productGrid" class="product-grid shop-page__grid"></div>
      </div>
    </section>`;
  document.querySelectorAll(".brand").forEach((link) => (link.href = appPath()));
  document.querySelectorAll(".primary-nav a, .mobile-nav a").forEach((link) => {
    if (link.textContent.includes("المتجر")) link.href = appPath("/shop");
    else if (link.hash) link.href = `${appPath()}${link.hash}`;
  });
  document.querySelectorAll(".footer-links a").forEach((link) => {
    if (link.textContent.includes("المتجر")) link.href = appPath("/shop");
    else if (link.hash) link.href = `${appPath()}${link.hash}`;
  });
  renderProducts(currentProducts);
  const filter = () => {
    const query = qs("shopSearch").value.trim().toLowerCase();
    const category = document.querySelector(".category-btn.is-active")?.dataset.category;
    renderProducts(currentProducts.filter((product) => {
      const matchesCategory = category === "الكل" || product.category === category;
      const haystack = `${product.name} ${product.description} ${product.category}`.toLowerCase();
      return matchesCategory && haystack.includes(query);
    }));
  };
  qs("shopSearch").addEventListener("input", filter);
  document.querySelector(".category-list").addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    document.querySelectorAll(".category-btn").forEach((item) => item.classList.toggle("is-active", item === button));
    filter();
  });
}

function renderChantTabs() {
  const list = qs("chantList");
  if (!list) return;
  list.innerHTML = currentChants
    .map(
      (item) => `
        <button
          class="chant-tab ${item.id === activeChantId && scrollOpen ? "is-active" : ""}"
          type="button"
          role="option"
          data-chant="${item.id}"
          aria-selected="${item.id === activeChantId && scrollOpen}"
        >
          ${item.title}
        </button>
      `,
    )
    .join("");
}

function fillPapyrus(chant) {
  const title = qs("chantTitle");
  const body = qs("chantBody");
  const hint = qs("papyrusHint");
  if (!chant) {
    if (title) title.textContent = "";
    if (body) body.innerHTML = "";
    if (hint) hint.hidden = false;
    return;
  }
  if (hint) hint.hidden = true;
  if (title) title.textContent = chant.title;
  if (body) {
    const lines = chantLyrics(chant);
    body.innerHTML = lines
      .map((line, index) => `<p class="${index === lines.length - 1 ? "chant-line chant-line--strong" : "chant-line"}">${line}</p>`)
      .join("");
    body.scrollTop = 0;
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function unrollDuration() {
  if (prefersReducedMotion()) return 180;
  return firstUnroll ? 1100 : 720;
}

function rollDuration() {
  return prefersReducedMotion() ? 160 : 420;
}

async function openPapyrus() {
  const el = qs("papyrus");
  if (!el) return;
  el.classList.remove("is-closed", "is-closing");
  el.classList.add("is-opening");
  requestAnimationFrame(() => el.classList.add("is-open"));
  await wait(unrollDuration());
  el.classList.remove("is-opening");
  scrollOpen = true;
  firstUnroll = false;
}

async function closePapyrus() {
  const el = qs("papyrus");
  if (!el || !scrollOpen) return;
  window.speechSynthesis?.cancel();
  if (audioEl) {
    audioEl.pause();
    setPlaying(false);
  }
  el.classList.remove("is-open", "is-opening");
  el.classList.add("is-closing");
  await wait(rollDuration());
  el.classList.add("is-closed");
  el.classList.remove("is-closing");
  const hint = qs("papyrusHint");
  if (hint) hint.hidden = false;
  scrollOpen = false;
}

async function selectChant(id) {
  if (scrollBusy) return;
  if (id === activeChantId && scrollOpen) return;
  scrollBusy = true;
  if (scrollOpen) await closePapyrus();
  activeChantId = id;
  const chant = currentChants.find((item) => item.id === id);
  fillPapyrus(chant);
  prepareAudio(chant);
  renderChantTabs();
  await openPapyrus();
  renderChantTabs();
  requestAnimationFrame(() => {
    qs("chantList")?.querySelector(`[data-chant="${id}"]`)?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "nearest" });
  });
  scrollBusy = false;
}

function prepareAudio(chant) {
  if (!audioEl) {
    audioEl = new Audio();
    audioEl.addEventListener("timeupdate", updatePlayerProgress);
    audioEl.addEventListener("loadedmetadata", updatePlayerProgress);
    audioEl.addEventListener("ended", () => setPlaying(false));
    audioEl.addEventListener("error", () => {
      audioAvailable = false;
    });
  }

  usingSpeech = false;
  audioEl.pause();
  audioEl.src = chantAudio(chant);
  audioAvailable = false;
  setPlaying(false);
  setProgress(0);
  qs("currentTime") && (qs("currentTime").textContent = "0:00");
  qs("durationTime") && (qs("durationTime").textContent = "0:00");
}

function setPlaying(isPlaying) {
  const btn = qs("playBtn");
  if (!btn) return;
  btn.setAttribute("aria-pressed", String(isPlaying));
  btn.querySelector(".play-label").textContent = isPlaying ? "إيقاف" : "تشغيل";
}

function setProgress(ratio) {
  const bar = qs("progressBar");
  if (bar) bar.style.transform = `scaleX(${Math.max(0, Math.min(1, ratio))})`;
}

function updatePlayerProgress() {
  if (!audioEl) return;
  qs("currentTime") && (qs("currentTime").textContent = formatTime(audioEl.currentTime || 0));
  qs("durationTime") && (qs("durationTime").textContent = formatTime(audioEl.duration || 0));
  if (!audioEl.duration) return;
  audioAvailable = true;
  setProgress(audioEl.currentTime / audioEl.duration);
}

function togglePlay() {
  const chant = currentChants.find((item) => item.id === activeChantId);
  if (!chant) return;

  if (usingSpeech) {
    window.speechSynthesis.cancel();
    usingSpeech = false;
    setPlaying(false);
    return;
  }

  if (audioAvailable && audioEl && Number.isFinite(audioEl.duration)) {
    if (audioEl.paused) {
      audioEl.play().then(() => setPlaying(true)).catch(() => speakChant(chant));
    } else {
      audioEl.pause();
      setPlaying(false);
    }
    return;
  }

  if (audioEl && audioEl.paused) {
    audioEl
      .play()
      .then(() => {
        audioAvailable = true;
        setPlaying(true);
      })
      .catch(() => speakChant(chant));
    return;
  }

  speakChant(chant);
}

function speakChant(chant) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  usingSpeech = true;
  const utter = new SpeechSynthesisUtterance(chantLyrics(chant).join(". "));
  utter.lang = "ar-EG";
  utter.rate = 0.92;
  utter.onstart = () => setPlaying(true);
  utter.onend = () => {
    usingSpeech = false;
    setPlaying(false);
  };
  window.speechSynthesis.speak(utter);
}

function seekAudio(event) {
  if (!audioEl || !audioEl.duration) return;
  const track = event.currentTarget.getBoundingClientRect();
  const ratio = Math.max(0, Math.min(1, (track.right - event.clientX) / track.width));
  audioEl.currentTime = ratio * audioEl.duration;
  setProgress(ratio);
}

function cartCount() {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

function bumpCartBadge() {
  document.querySelectorAll("[data-cart-count]").forEach((el) => {
    el.textContent = String(cartCount());
    el.hidden = cartCount() === 0;
    el.classList.remove("is-bump");
    void el.offsetWidth;
    el.classList.add("is-bump");
  });
}

function updateCartBadge() {
  document.querySelectorAll("[data-cart-count]").forEach((el) => {
    el.textContent = String(cartCount());
    el.hidden = cartCount() === 0;
  });
}

function renderCart() {
  const list = qs("cartList");
  const total = qs("cartTotal");
  if (!list || !total) return;

  if (cart.length === 0) {
    list.innerHTML = `<p class="empty-note">سلتك فارغة حاليًا.</p>`;
    total.textContent = formatPrice(0);
    updateCartBadge();
    return;
  }

  list.innerHTML = cart
    .map((item) => {
      const product = currentProducts.find((p) => p.id === item.id);
      if (!product) return "";
      return `
        <div class="cart-item">
          <img src="${product.image}" alt="" width="64" height="64">
          <div>
            <strong>${product.name}</strong>
            <span>${formatPrice(product.price)} × ${item.qty}</span>
          </div>
          <button type="button" class="text-btn" data-remove="${product.id}">حذف</button>
        </div>
      `;
    })
    .join("");

  const sum = cart.reduce((acc, item) => {
    const product = currentProducts.find((p) => p.id === item.id);
    return acc + (product ? product.price * item.qty : 0);
  }, 0);
  total.textContent = formatPrice(sum);
  updateCartBadge();
}

function flyToCart(imageEl) {
  const cartBtn = qs("cartBtn");
  if (!imageEl || !cartBtn || prefersReducedMotion()) return;
  const from = imageEl.getBoundingClientRect();
  const to = cartBtn.getBoundingClientRect();
  const clone = imageEl.cloneNode(true);
  clone.className = "fly-clone";
  clone.style.left = `${from.left}px`;
  clone.style.top = `${from.top}px`;
  clone.style.transition = "transform 0.7s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.7s ease";
  document.body.appendChild(clone);
  const dx = to.left + to.width / 2 - (from.left + 23);
  const dy = to.top + to.height / 2 - (from.top + 23);
  requestAnimationFrame(() => {
    clone.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(0.2)`;
    clone.style.opacity = "0.15";
  });
  setTimeout(() => clone.remove(), 740);
}

function addToCart(id, button) {
  const existing = cart.find((item) => item.id === id);
  if (existing) existing.qty += 1;
  else cart.push({ id, qty: 1 });
  saveJson(CART_KEY, cart);
  renderCart();

  const card = button?.closest(".product-card");
  const image = card?.querySelector("img");
  flyToCart(image);

  if (button) {
    const original = button.textContent;
    button.classList.add("is-added");
    button.textContent = "تمت الإضافة ✓";
    setTimeout(() => {
      button.classList.remove("is-added");
      button.textContent = original;
    }, 900);
  }

  bumpCartBadge();
}

function removeFromCart(id) {
  cart = cart.filter((item) => item.id !== id);
  saveJson(CART_KEY, cart);
  renderCart();
}

function toggleFavorite(id, button) {
  favorites = favorites.includes(id) ? favorites.filter((item) => item !== id) : [...favorites, id];
  saveJson(FAV_KEY, favorites);
  const active = favorites.includes(id);
  button.classList.toggle("is-active", active);
  button.setAttribute("aria-pressed", String(active));
  button.classList.remove("is-pop");
  void button.offsetWidth;
  button.classList.add("is-pop");
}

function openDrawer(id) {
  const drawer = qs(id);
  const backdrop = qs("backdrop");
  if (!drawer || !backdrop) return;
  closeOverlays();
  drawer.hidden = false;
  drawer.classList.add("is-open");
  backdrop.hidden = false;
  document.body.classList.add("is-locked");
}

function openModal(id) {
  const modal = qs(id);
  const backdrop = qs("backdrop");
  if (!modal || !backdrop) return;
  closeOverlays();
  modal.hidden = false;
  modal.classList.add("is-open");
  backdrop.hidden = false;
  document.body.classList.add("is-locked");
  const focusable = modal.querySelector("input, button");
  focusable?.focus();
}

function closeOverlays() {
  closeAlbumLightbox();
  document.querySelectorAll(".drawer, .modal").forEach((el) => {
    el.classList.remove("is-open");
    el.hidden = true;
  });
  qs("mobileNav")?.classList.remove("is-open");
  qs("menuBtn")?.setAttribute("aria-expanded", "false");
  const backdrop = qs("backdrop");
  if (backdrop) backdrop.hidden = true;
  document.body.classList.remove("is-locked");
}

function initNav() {
  qs("searchBtn")?.addEventListener("click", () => openModal("searchModal"));
  qs("cartBtn")?.addEventListener("click", () => openDrawer("cartDrawer"));
  qs("menuBtn")?.addEventListener("click", () => {
    const menu = qs("mobileNav");
    const isOpen = menu?.classList.toggle("is-open") || false;
    qs("menuBtn")?.setAttribute("aria-expanded", String(isOpen));
    qs("backdrop").hidden = !isOpen;
    document.body.classList.toggle("is-locked", isOpen);
  });
  qs("backdrop")?.addEventListener("click", closeOverlays);
  document.querySelectorAll("[data-close]").forEach((btn) => btn.addEventListener("click", closeOverlays));
  document.querySelectorAll(".mobile-nav a").forEach((link) => link.addEventListener("click", closeOverlays));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeOverlays();
    if (albumLightboxOpen && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) {
      if (event.key === "ArrowLeft") changeAlbumPhoto(-1);
      if (event.key === "ArrowRight") changeAlbumPhoto(1);
    }
  });

  qs("searchForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const q = new FormData(event.currentTarget).get("q");
    closeOverlays();
    if (String(q).includes("متجر") || String(q).includes("صافرة") || String(q).includes("زي")) {
      qs("shop")?.scrollIntoView({ behavior: "smooth" });
    }
  });
}

function initHeroMotion() {
  const collage = document.querySelector(".hero-collage");
  if (!collage || prefersReducedMotion()) return;

  window.addEventListener(
    "scroll",
    () => {
      const y = Math.min(window.scrollY, 240);
      collage.style.transform = `translate3d(0, ${y * 0.12}px, 0)`;
    },
    { passive: true },
  );
}

function initShopReveal() {
  const section = qs("shop");
  if (!section) return;
  if (prefersReducedMotion()) {
    section.classList.add("is-revealed");
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        section.classList.add("is-revealed");
        observer.disconnect();
      }
    },
    { threshold: 0.16 },
  );
  observer.observe(section);
}

function bindEvents() {
  document.addEventListener("click", (event) => {
    const previous = event.target.closest("[data-album-prev]");
    const next = event.target.closest("[data-album-next]");
    const index = event.target.closest("[data-album-index]");
    if (previous) changeAlbumPhoto(-1);
    if (next) changeAlbumPhoto(1);
    if (index) selectAlbumPhoto(Number(index.dataset.albumIndex));
    if (event.target.closest("[data-album-open]") && !albumSwipeDetected) openAlbumLightbox();
    if (event.target.closest("[data-album-close]")) closeAlbumLightbox();
  });

  qs("photoAlbum")?.addEventListener("pointerdown", (event) => {
    albumTouchStartX = event.clientX;
  });
  qs("photoAlbum")?.addEventListener("pointerup", (event) => {
    if (albumTouchStartX === null) return;
    const delta = event.clientX - albumTouchStartX;
    albumTouchStartX = null;
    if (Math.abs(delta) < 45) return;
    albumSwipeDetected = true;
    changeAlbumPhoto(delta > 0 ? -1 : 1);
    window.setTimeout(() => (albumSwipeDetected = false), 350);
  });

  qs("productGrid")?.addEventListener("click", (event) => {
    const add = event.target.closest("[data-add]");
    const fav = event.target.closest("[data-fav]");
    if (add) addToCart(add.dataset.add, add);
    if (fav) toggleFavorite(fav.dataset.fav, fav);
  });

  qs("chantList")?.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-chant]");
    if (!btn) return;
    selectChant(btn.dataset.chant);
  });

  qs("papyrusClose")?.addEventListener("click", async () => {
    if (scrollBusy) return;
    scrollBusy = true;
    await closePapyrus();
    renderChantTabs();
    scrollBusy = false;
  });

  qs("playBtn")?.addEventListener("click", togglePlay);
  qs("progressTrack")?.addEventListener("click", seekAudio);
  qs("volumeSlider")?.addEventListener("input", (event) => {
    if (audioEl) audioEl.volume = Number(event.target.value);
  });

  qs("cartList")?.addEventListener("click", (event) => {
    const remove = event.target.closest("[data-remove]");
    if (remove) removeFromCart(remove.dataset.remove);
  });

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", () => {
      closeOverlays();
    });
  });
}

if (currentPath().startsWith("/admin")) {
  import("./admin.js").then(({ initAdminRoute }) => initAdminRoute());
} else {
  renderSignupPage();
  renderShopPage();
  applyImages();
  renderAlbum();
  renderProducts(currentPath() === "/shop" ? currentProducts : undefined);
  renderChantTabs();
  renderCart();
  initThemeToggle();
  initNav();
  initHeroMotion();
  initShopReveal();
  bindEvents();
  applyPublicSettings();
  renderAuthControls();
  initPublicAuth();
  loadPublicFirestoreContent();
}
