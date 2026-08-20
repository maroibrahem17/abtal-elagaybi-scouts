import { firebaseAuthMessage, getAdminProfile, signInAdmin, signOutAdmin, watchAuthState } from "./services/firebase/auth.js";
import { firebaseConfigured } from "./services/firebase/config.js";
import { getProducts, createProduct, updateProduct, deleteProduct } from "./services/firestore/products.js";
import { getChants, createChant, updateChant, deleteChant } from "./services/firestore/chants.js";
import { getGallery, createGalleryItem, updateGalleryItem, deleteGalleryItem } from "./services/firestore/gallery.js";
import { getGeneralSettings, updateGeneralSettings } from "./services/firestore/settings.js";

const APP_BASE = import.meta.env.BASE_URL;
const appPath = (path = "/") => `${APP_BASE}${path.replace(/^\/+/, "")}`;
const route = () => {
  const path = window.location.pathname;
  const normalized = APP_BASE !== "/" && path.startsWith(APP_BASE) ? path.slice(APP_BASE.length - 1) : path;
  return normalized.replace(/\/$/, "") || "/admin";
};
const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
const numberValue = (value) => Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : 0;

function setAdminShell() {
  document.body.classList.add("admin-shell");
  document.querySelector(".site-header")?.setAttribute("hidden", "");
  document.querySelector(".site-footer")?.setAttribute("hidden", "");
  document.querySelector("#mobileNav")?.setAttribute("hidden", "");
}

function frame(content) {
  document.querySelector("#main").innerHTML = `<main class="admin-page"><div class="admin-container">${content}</div></main>`;
}

function notify(message, type = "success") {
  const node = document.querySelector("#adminNotice");
  if (!node) return;
  node.textContent = message;
  node.className = `admin-notice admin-notice--${type}`;
  node.hidden = false;
  window.setTimeout(() => { node.hidden = true; }, 3200);
}

function loginView() {
  frame(`<section class="admin-panel admin-panel--narrow"><p class="admin-kicker">كشافة أبطال العجايبي</p><h1>دخول الإدارة</h1><p class="admin-lead">مساحة مخصصة لإدارة محتوى الموقع.</p><form id="adminLoginForm" class="admin-form"><label>البريد الإلكتروني<input name="email" type="email" autocomplete="username" required /></label><label>كلمة المرور<input name="password" type="password" autocomplete="current-password" required /></label><p id="adminLoginError" class="admin-error" role="alert" hidden></p><button class="btn btn-gold" type="submit">تسجيل الدخول</button></form><a class="admin-back" href="${appPath()}">العودة إلى الموقع</a></section>`);
  document.querySelector("#adminLoginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector("button");
    const error = document.querySelector("#adminLoginError");
    const data = new FormData(form);
    button.disabled = true;
    button.textContent = "جارٍ الدخول...";
    error.hidden = true;
    try {
      await signInAdmin(String(data.get("email")).trim(), String(data.get("password")));
      window.location.assign(appPath("/admin"));
    } catch (authError) {
      error.textContent = authError.message === "firebase-not-configured" ? "إعداد Firebase غير مكتمل بعد." : firebaseAuthMessage(authError);
      error.hidden = false;
      button.disabled = false;
      button.textContent = "تسجيل الدخول";
    }
  });
}

function loadingView() {
  frame(`<section class="admin-panel admin-panel--center"><p class="admin-kicker">مساحة آمنة</p><h1>جارٍ التحقق من الدخول</h1><p>نجهز لوحة التحكم...</p><span class="admin-spinner" aria-label="جارٍ التحميل"></span></section>`);
}

function configView() {
  frame(`<section class="admin-panel admin-panel--center"><p class="admin-kicker">إعداد Firebase مطلوب</p><h1>لوحة التحكم</h1><p>أضف قيم Firebase إلى <code>.env.local</code> قبل استخدام إدارة المحتوى.</p><a class="btn btn-gold" href="${appPath()}">العودة إلى الموقع</a></section>`);
}

function deniedView() {
  frame(`<section class="admin-panel admin-panel--center"><p class="admin-kicker">Access denied</p><h1>ليس لديك صلاحية الإدارة</h1><p>هذا الحساب ليس ضمن مستخدمي الإدارة المعتمدين.</p><button id="deniedLogout" class="btn btn-outline" type="button">تسجيل الخروج</button></section>`);
  document.querySelector("#deniedLogout").addEventListener("click", async () => { await signOutAdmin(); window.location.assign(appPath("/admin/login")); });
}

function nav(active) {
  const links = [
    ["/admin", "الرئيسية", "01"],
    ["/admin/products", "المنتجات", "02"],
    ["/admin/chants", "الصيحات", "03"],
    ["/admin/gallery", "ألبوم الصور", "04"],
    ["/admin/settings", "الإعدادات", "05"],
  ];
  return `<aside class="admin-sidebar"><a class="admin-brand" href="${appPath("/admin")}"><span>✦</span><strong>أبطال العجايبي</strong><small>لوحة التحكم</small></a><nav>${links.map(([href, label, number]) => `<a class="${active === href ? "is-active" : ""}" href="${appPath(href)}"><span>${number}</span>${label}</a>`).join("")}<span class="admin-nav-disabled"><span>06</span>الطلبات <em>لاحقًا</em></span></nav><button id="adminLogout" class="admin-logout" type="button">تسجيل الخروج</button></aside>`;
}

function dashboardFrame(active, content, user) {
  frame(`<div class="admin-layout">${nav(active)}<section class="admin-workspace"><div class="admin-mobile-head"><strong>لوحة التحكم</strong><button id="adminLogoutMobile" class="admin-logout" type="button">خروج</button></div><div class="admin-workspace__top"><div><p class="admin-kicker">مساحة آمنة</p><h1>${active === "/admin" ? "لوحة التحكم" : active.split("/").pop()}</h1><p>${escapeHtml(user.email || "مشرف الإدارة")}</p></div></div><div id="adminNotice" class="admin-notice" hidden></div>${content}</section></div>`);
  const logout = async () => { await signOutAdmin(); window.location.assign(appPath()); };
  document.querySelector("#adminLogout")?.addEventListener("click", logout);
  document.querySelector("#adminLogoutMobile")?.addEventListener("click", logout);
}

function errorBlock(message) { return `<div class="admin-empty admin-empty--error"><strong>تعذر تحميل البيانات</strong><p>${escapeHtml(message || "حاول مرة أخرى.")}</p></div>`; }
function emptyBlock(message) { return `<div class="admin-empty"><strong>${message}</strong><p>أضف أول عنصر من الزر أعلاه.</p></div>`; }
function boolLabel(value) { return value ? "نعم" : "لا"; }

async function dashboardHome(user) {
  try {
    const [products, chants, gallery] = await Promise.all([getProducts(), getChants(), getGallery()]);
    const featured = products.filter((item) => item.featured).length;
    dashboardFrame("/admin", `<div class="admin-stat-grid"><article><span>المنتجات</span><strong>${products.length}</strong></article><article><span>الصيحات</span><strong>${chants.length}</strong></article><article><span>صور الألبوم</span><strong>${gallery.length}</strong></article><article><span>المنتجات المميزة</span><strong>${featured}</strong></article></div><section class="admin-welcome"><h2>مركز إدارة المحتوى</h2><p>اختر قسمًا من القائمة لإدارة بيانات الموقع المخزنة في Firestore.</p><div class="admin-quick-links"><a href="${appPath("/admin/products")}">إدارة المنتجات</a><a href="${appPath("/admin/chants")}">إدارة الصيحات</a><a href="${appPath("/admin/gallery")}">إدارة الألبوم</a></div></section>`, user);
  } catch (error) { dashboardFrame("/admin", errorBlock(error.message), user); }
}

const formFields = {
  products: `<label>اسم المنتج<input name="name" required /></label><label>الوصف<textarea name="description" rows="3"></textarea></label><div class="admin-form-grid"><label>السعر<input name="price" type="number" min="0" step="0.01" required /></label><label>ترتيب العرض<input name="order" type="number" min="0" step="1" value="0" required /></label></div><label>مسار/رابط الصورة<input name="imageUrl" placeholder="/products/example.webp" /></label><label class="admin-check"><input name="available" type="checkbox" checked /> متاح</label><label class="admin-check"><input name="featured" type="checkbox" /> منتج مميز</label>`,
  chants: `<label>عنوان الصيحة<input name="title" required /></label><label>النص الكامل<textarea name="text" rows="12" dir="auto" required></textarea></label><label>رابط الصوت<input name="audioUrl" placeholder="رابط Google Drive لاحقًا" /></label><div class="admin-form-grid"><label>ترتيب العرض<input name="order" type="number" min="0" step="1" value="0" required /></label><label class="admin-check"><input name="visible" type="checkbox" checked /> ظاهرة للعامة</label></div>`,
  gallery: `<label>رابط/مسار الصورة<input name="imageUrl" placeholder="رابط Google Drive لاحقًا" required /></label><label>العنوان<input name="title" /></label><label>النص البديل<input name="alt" required /></label><div class="admin-form-grid"><label>ترتيب العرض<input name="order" type="number" min="0" step="1" value="0" required /></label><label class="admin-check"><input name="visible" type="checkbox" checked /> ظاهرة للعامة</label></div>`,
};

const managerConfig = {
  products: { title: "المنتجات", empty: "لا توجد منتجات حتى الآن", fields: formFields.products, get: getProducts, create: createProduct, update: updateProduct, remove: deleteProduct, columns: ["المنتج", "السعر", "الحالة", "مميز", "الترتيب"] },
  chants: { title: "الصيحات", empty: "لا توجد صيحات حتى الآن", fields: formFields.chants, get: getChants, create: createChant, update: updateChant, remove: deleteChant, columns: ["العنوان", "الحالة", "الترتيب"] },
  gallery: { title: "ألبوم الصور", empty: "لا توجد صور في الألبوم حتى الآن", fields: formFields.gallery, get: getGallery, create: createGalleryItem, update: updateGalleryItem, remove: deleteGalleryItem, columns: ["العنوان", "النص البديل", "الحالة", "الترتيب"] },
};

function itemCells(kind, item) {
  if (kind === "products") return `<td>${escapeHtml(item.name)}</td><td>${numberValue(item.price)} ج.م</td><td>${boolLabel(item.available !== false)}</td><td>${boolLabel(item.featured)}</td><td>${numberValue(item.order)}</td>`;
  if (kind === "chants") return `<td>${escapeHtml(item.title)}</td><td>${boolLabel(item.visible !== false)}</td><td>${numberValue(item.order)}</td>`;
  return `<td>${escapeHtml(item.title || "بدون عنوان")}</td><td>${escapeHtml(item.alt)}</td><td>${boolLabel(item.visible !== false)}</td><td>${numberValue(item.order)}</td>`;
}

function defaultFormValue(kind, item = {}) {
  if (kind === "products") return { ...item, available: item.available !== false, featured: Boolean(item.featured) };
  return { ...item, visible: item.visible !== false };
}

async function managerPage(kind, user, editId = null) {
  const config = managerConfig[kind];
  let items;
  try { items = await config.get(); } catch (error) { dashboardFrame(`/admin/${kind}`, `<div class="admin-section-head"><h2>${config.title}</h2></div>${errorBlock(error.message)}`, user); return; }
  const editing = items.find((item) => item.id === editId);
  const values = defaultFormValue(kind, editing);
  const form = `<section class="admin-form-panel"><div class="admin-section-head"><div><h2>${editing ? "تعديل" : "إضافة"} ${config.title.slice(0, -1)}</h2><p>البيانات تحفظ مباشرة في Firestore.</p></div><a class="btn btn-outline" href="${appPath(`/admin/${kind}`)}">إلغاء</a></div><form id="contentForm" class="admin-form admin-form--wide">${config.fields}<p id="contentError" class="admin-error" hidden></p><button class="btn btn-gold" type="submit">${editing ? "حفظ التعديلات" : "إضافة"}</button></form></section>`;
  const list = items.length ? `<div class="admin-table-wrap"><table class="admin-table"><thead><tr>${config.columns.map((column) => `<th>${column}</th>`).join("")}<th>الإجراءات</th></tr></thead><tbody>${items.map((item) => `<tr>${itemCells(kind, item)}<td class="admin-actions"><a href="${appPath(`/admin/${kind}?edit=${encodeURIComponent(item.id)}`)}">تعديل</a><button type="button" data-delete-id="${item.id}">حذف</button></td></tr>`).join("")}</tbody></table></div>` : emptyBlock(config.empty);
  dashboardFrame(`/admin/${kind}`, `<div class="admin-section-head"><div><h2>${config.title}</h2><p>${items.length} عنصر</p></div><a class="btn btn-gold" href="${appPath(`/admin/${kind}?new=1`)}">إضافة جديد</a></div>${editing || window.location.search.includes("new=1") ? form : list}`, user);
  document.querySelectorAll("[data-delete-id]").forEach((button) => button.addEventListener("click", async () => {
    if (!window.confirm("هل أنت متأكد من حذف هذا العنصر؟")) return;
    button.disabled = true;
    try { await config.remove(button.dataset.deleteId); notify("تم الحذف بنجاح"); window.setTimeout(() => window.location.assign(appPath(`/admin/${kind}`)), 450); } catch (error) { notify("تعذر الحذف. حاول مرة أخرى.", "error"); button.disabled = false; }
  }));
  const contentForm = document.querySelector("#contentForm");
  if (contentForm) {
    for (const [name, value] of Object.entries(values)) { const input = contentForm.elements[name]; if (!input) continue; if (input.type === "checkbox") input.checked = Boolean(value); else input.value = value ?? ""; }
    contentForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = new FormData(contentForm);
      const payload = kind === "products" ? { name: String(data.get("name")).trim(), description: String(data.get("description") || "").trim(), price: numberValue(data.get("price")), available: data.has("available"), featured: data.has("featured"), order: numberValue(data.get("order")), imageUrl: String(data.get("imageUrl") || "").trim() } : kind === "chants" ? { title: String(data.get("title")).trim(), text: String(data.get("text") || ""), audioUrl: String(data.get("audioUrl") || "").trim(), visible: data.has("visible"), order: numberValue(data.get("order")) } : { imageUrl: String(data.get("imageUrl") || "").trim(), title: String(data.get("title") || "").trim(), alt: String(data.get("alt") || "").trim(), visible: data.has("visible"), order: numberValue(data.get("order")) };
      if ((kind === "products" && (!payload.name || payload.price < 0)) || (kind === "chants" && (!payload.title || !payload.text)) || (kind === "gallery" && (!payload.imageUrl || !payload.alt))) { notify("تحقق من الحقول المطلوبة.", "error"); return; }
      const submit = contentForm.querySelector("button[type=submit]"); submit.disabled = true;
      try { if (editing) await config.update(editing.id, payload); else await config.create(payload); notify("تم الحفظ بنجاح"); window.setTimeout(() => window.location.assign(appPath(`/admin/${kind}`)), 450); } catch (error) { notify("تعذر الحفظ. تحقق من صلاحيات Firebase.", "error"); submit.disabled = false; }
    });
  }
}

async function settingsPage(user) {
  let values = {};
  try { values = await getGeneralSettings(); } catch (error) { dashboardFrame("/admin/settings", errorBlock(error.message), user); return; }
  dashboardFrame("/admin/settings", `<section class="admin-form-panel"><div class="admin-section-head"><div><h2>الإعدادات العامة</h2><p>تُحفظ في settings/general.</p></div></div><form id="settingsForm" class="admin-form admin-form--wide"><label>العنوان<input name="address" value="${escapeHtml(values.address || "شارع العريان بعد فرع اورنج")}" required /></label><label>الهاتف<input name="phone" value="${escapeHtml(values.phone || "0100 123 4567")}" required /></label><label>البريد الإلكتروني<input name="email" type="email" value="${escapeHtml(values.email || "scouts@stmarkfayoum.org")}" required /></label><label>رابط Instagram<input name="instagramUrl" type="url" value="${escapeHtml(values.instagramUrl || "https://www.instagram.com/stminascouts/")}" /></label><label>رابط Facebook<input name="facebookUrl" type="url" value="${escapeHtml(values.facebookUrl || "https://www.facebook.com/abtal.3gaiby")}" /></label><p id="settingsError" class="admin-error" hidden></p><button class="btn btn-gold" type="submit">حفظ الإعدادات</button></form></section>`, user);
  document.querySelector("#settingsForm").addEventListener("submit", async (event) => { event.preventDefault(); const data = new FormData(event.currentTarget); const button = event.currentTarget.querySelector("button"); button.disabled = true; try { await updateGeneralSettings(Object.fromEntries(data)); notify("تم حفظ الإعدادات"); } catch { notify("تعذر حفظ الإعدادات.", "error"); } finally { button.disabled = false; } });
}

async function protectedContent(user) {
  const currentRoute = route();
  if (currentRoute === "/admin") return dashboardHome(user);
  if (currentRoute === "/admin/settings") return settingsPage(user);
  const kind = currentRoute.split("/")[2];
  if (managerConfig[kind]) return managerPage(kind, user, new URLSearchParams(window.location.search).get("edit"));
  window.location.assign(appPath("/admin"));
}

export function initAdminRoute() {
  setAdminShell();
  const isLogin = route() === "/admin/login";
  if (!firebaseConfigured) { configView(); return; }
  if (isLogin) { loginView(); return; }
  loadingView();
  watchAuthState(async (user) => {
    if (!user) { window.location.assign(appPath("/admin/login")); return; }
    try { const profile = await getAdminProfile(user); if (!profile) deniedView(); else await protectedContent(user); } catch { deniedView(); }
  });
}
