console.log("✅ admin.js بارگذاری شد");
const apiBase = "/api";
// تنظیم Notyf
const notyf = new Notyf({
  position: { x: "left", y: "top" },
  duration: 3500,
  types: [{ type: "warning", background: "#fdcb6e", icon: false }],
});

let token = localStorage.getItem("adminToken") || "";

// ---------- لاگین ----------
const loginScreen = document.getElementById("loginScreen");
const dashboard = document.getElementById("dashboard");
const passInput = document.getElementById("passInput");
const loginBtn = document.getElementById("loginBtn");
const loginMsg = document.getElementById("loginMsg");
const logoutBtn = document.getElementById("logoutBtn");

if (token) {
  showDashboard();
} else {
  loginScreen.style.display = "flex";
  dashboard.style.display = "none";
}

loginBtn.addEventListener("click", async () => {
  const password = passInput.value;
  if (!password) return;
  try {
    const res = await fetch(`${apiBase}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (res.ok) {
      token = data.token;
      localStorage.setItem("adminToken", token);
      showDashboard();
    } else {
      loginMsg.textContent = data.error || "خطا در ورود";
    }
  } catch (err) {
    loginMsg.textContent = "خطای شبکه";
  }
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("adminToken");
  token = "";
  loginScreen.style.display = "flex";
  dashboard.style.display = "none";
});

function showDashboard() {
  loginScreen.style.display = "none";
  dashboard.style.display = "block";
  loadCategories();
  loadItems();
  loadAddons();
}

// ---------- تب‌ها ----------
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document
      .querySelectorAll(".tab")
      .forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    document
      .querySelectorAll(".tab-content")
      .forEach((c) => c.classList.remove("active"));
    const activeContent = document.getElementById(`tab-${tab.dataset.tab}`);
    activeContent.classList.add("active");
    if (tab.dataset.tab === "media") loadMedia();
  });
});

// ---------- هدر Authorization ----------
function authHeaders() {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

// ========== دسته‌بندی‌ها ==========
const catForm = document.getElementById("catForm");
const catList = document.getElementById("catList");
const catName = document.getElementById("catName");
const catIconType = document.getElementById("catIconType");
const catIconValue = document.getElementById("catIconValue");
const iconPreview = document.getElementById("iconPreview");
const openIconPickerBtn = document.getElementById("openIconPicker");
const removeIconBtn = document.getElementById("removeIcon");

document
  .getElementById("cancelCat")
  .addEventListener("click", () => catForm.reset());

// به‌روزرسانی پیش‌نمایش آیکون
function updateIconPreview(type, value) {
  iconPreview.innerHTML = "";
  if (type === "fontawesome" && value) {
    iconPreview.innerHTML = `<i class="${value}"></i>`;
    removeIconBtn.style.display = "inline-flex";
  } else if (type === "svg" && value) {
    iconPreview.innerHTML = `<img src="${value}" alt="icon">`;
    removeIconBtn.style.display = "inline-flex";
  } else {
    iconPreview.innerHTML = '<i class="fas fa-question-circle"></i>';
    removeIconBtn.style.display = "none";
  }
}

// حذف آیکون (بازگشت به پیش‌فرض)
removeIconBtn.addEventListener("click", () => {
  catIconType.value = "default";
  catIconValue.value = "";
  updateIconPreview("default", "");
});

// بارگذاری لیست دسته‌بندی‌ها
async function loadCategories() {
  const res = await fetch(`${apiBase}/categories`);
  const cats = await res.json();
  catList.innerHTML = cats
    .map((c) => {
      let iconDisplay = "";
      if (c.iconType === "fontawesome") {
        iconDisplay = `<i class="${c.iconValue}"></i>`;
      } else if (c.iconType === "svg") {
        iconDisplay = `<img src="${c.iconValue}" style="height:20px;vertical-align:middle;">`;
      } else {
        iconDisplay = "(پیش‌فرض)";
      }
      return `<li>
      <span>${c.name} ${iconDisplay}</span>
      <div>
      <a href="./admin-edit-category.html?id=${c.id}" class="btn-outline" style="text-decoration:none;">ویرایش</a>
        <button onclick="deleteCategory('${c.id}')" class="btn-outline">حذف</button>
      </div>
    </li>`;
    })
    .join("");
}

// حذف دسته بندی
async function deleteCategory(id) {
  if (!confirm("مطمئنی؟")) return;
  await fetch(`${apiBase}/categories/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  loadCategories();
  notyf.success("دسته‌بندی حذف شد");
}

// ارسال فرم دسته‌بندی
catForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData();
  formData.append("name", catName.value);
  formData.append("iconType", catIconType.value);
  formData.append("iconValue", catIconValue.value);
  // دیگر فیلد image وجود ندارد

  const url = `${apiBase}/categories`;
  const method = "POST";
  try {
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (res.ok) {
      notyf.success("دسته‌بندی اضافه شد");
      catForm.reset();
      updateIconPreview("default", "");
      loadCategories();
    } else {
      const err = await res.json();
      notyf.error(err.error || "خطا در ذخیره‌سازی");
    }
  } catch (err) {
    notyf.error("ارتباط با سرور برقرار نشد");
  }
});

// ================= انتخاب آیکون (مودال) =================
const iconPickerModal = document.getElementById("iconPickerModal");
const closeIconPickerModal = document.getElementById("closeIconPickerModal");
const confirmIconBtn = document.getElementById("confirmIconBtn");

// تب‌های داخل مودال
document.querySelectorAll(".icon-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document
      .querySelectorAll(".icon-tab")
      .forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    document
      .querySelectorAll(".icon-tab-content")
      .forEach((c) => c.classList.remove("active"));
    document.getElementById(`tab-${tab.dataset.tab}`).classList.add("active");
    if (tab.dataset.tab === "media-svg") loadMediaSvgs();
  });
});

// باز کردن مودال
openIconPickerBtn.addEventListener("click", () => {
  iconPickerModal.style.display = "flex";
  // نمایش تب اول (Font Awesome) و جستجوی اولیه
  document.querySelector('.icon-tab[data-tab="fa-icons"]').click();
  renderFAIcons("");
});

closeIconPickerModal.addEventListener("click", () => {
  iconPickerModal.style.display = "none";
});

// ========== Font Awesome ==========
const faIconsGrid = document.getElementById("faIconsGrid");
const faSearch = document.getElementById("faSearch");

// لیست آیکون‌های معروف Font Awesome 6 (کلاس‌ها)
const faIconList = [
  "fa-solid fa-mug-hot",
  "fa-solid fa-coffee",
  "fa-solid fa-mug-saucer",
  "fa-solid fa-cup-togo",
  "fa-solid fa-glass-water",
  "fa-solid fa-wine-glass",
  "fa-solid fa-beer-mug-empty",
  "fa-solid fa-utensils",
  "fa-solid fa-pizza-slice",
  "fa-solid fa-hamburger",
  "fa-solid fa-hotdog",
  "fa-solid fa-fish",
  "fa-solid fa-shrimp",
  "fa-solid fa-bowl-food",
  "fa-solid fa-cake-candles",
  "fa-solid fa-ice-cream",
  "fa-solid fa-cookie",
  "fa-solid fa-candy-cane",
  "fa-solid fa-apple-whole",
  "fa-solid fa-lemon",
  "fa-solid fa-carrot",
  "fa-solid fa-pepper-hot",
  "fa-solid fa-cheese",
  "fa-solid fa-egg",
  "fa-solid fa-bread-slice",
  "fa-solid fa-wheat-awn",
  "fa-solid fa-seedling",
  "fa-solid fa-leaf",
  "fa-solid fa-tree",
  "fa-solid fa-campground",
  "fa-solid fa-mountain",
  "fa-solid fa-fire",
  "fa-solid fa-sun",
  "fa-solid fa-moon",
  "fa-solid fa-cloud",
  "fa-solid fa-star",
  "fa-solid fa-heart",
  "fa-solid fa-thumbs-up",
  "fa-solid fa-comment",
  "fa-solid fa-bell",
  "fa-solid fa-envelope",
  "fa-solid fa-phone",
  "fa-solid fa-location-dot",
  "fa-solid fa-calendar",
  "fa-solid fa-clock",
  "fa-solid fa-hourglass",
  "fa-solid fa-camera",
  "fa-solid fa-image",
  "fa-solid fa-video",
  "fa-solid fa-music",
  "fa-solid fa-headphones",
  "fa-solid fa-gamepad",
  "fa-solid fa-tv",
  "fa-solid fa-print",
  "fa-solid fa-paintbrush",
  "fa-solid fa-basket-shopping",
  "fa-solid fa-cart-shopping",
  "fa-solid fa-gift",
  "fa-solid fa-tag",
  "fa-solid fa-bookmark",
  "fa-solid fa-book",
  "fa-solid fa-graduation-cap",
  "fa-solid fa-pencil",
  "fa-solid fa-trash",
  "fa-solid fa-magnifying-glass",
  "fa-solid fa-wrench",
  "fa-solid fa-gear",
  "fa-solid fa-lock",
  "fa-solid fa-key",
  "fa-solid fa-shield-haltered",
  "fa-solid fa-user",
  "fa-solid fa-users",
  "fa-solid fa-address-card",
  "fa-solid fa-circle-info",
  "fa-solid fa-circle-question",
  "fa-solid fa-circle-exclamation",
  "fa-solid fa-triangle-exclamation",
  "fa-solid fa-check",
  "fa-solid fa-xmark",
  "fa-solid fa-plus",
  "fa-solid fa-minus",
  "fa-solid fa-arrow-right",
  "fa-solid fa-arrow-left",
  "fa-solid fa-arrow-up",
  "fa-solid fa-arrow-down",
  "fa-solid fa-rotate-right",
  "fa-solid fa-rotate-left",
  "fa-solid fa-download",
  "fa-solid fa-upload",
  "fa-solid fa-share",
  "fa-solid fa-expand",
  "fa-solid fa-compress",
  "fa-solid fa-bars",
  "fa-solid fa-ellipsis",
  "fa-solid fa-ellipsis-vertical",
  "fa-solid fa-grip",
  "fa-solid fa-grip-vertical",
  "fa-solid fa-folder",
  "fa-solid fa-folder-open",
  "fa-solid fa-folder-closed",
  "fa-solid fa-file",
  "fa-solid fa-file-image",
  "fa-solid fa-file-pdf",
  "fa-solid fa-file-word",
  "fa-solid fa-file-excel",
  "fa-solid fa-file-powerpoint",
  "fa-solid fa-file-audio",
  "fa-solid fa-file-video",
  "fa-solid fa-file-code",
  "fa-solid fa-file-zipper",
  "fa-solid fa-clone",
  "fa-solid fa-scissors",
  "fa-solid fa-copy",
  "fa-solid fa-paste",
  "fa-solid fa-floppy-disk",
  "fa-solid fa-paper-plane",
  "fa-solid fa-rocket",
  "fa-solid fa-bolt",
  "fa-solid fa-bomb",
  "fa-solid fa-broom",
  "fa-solid fa-brush",
  "fa-solid fa-toilet-paper",
  "fa-solid fa-soap",
  "fa-solid fa-pump-medical",
  "fa-solid fa-syringe",
  "fa-solid fa-stethoscope",
  "fa-solid fa-hospital",
  "fa-solid fa-building",
  "fa-solid fa-school",
  "fa-solid fa-church",
  "fa-solid fa-store",
  "fa-solid fa-cart-flatbed",
  "fa-solid fa-truck",
  "fa-solid fa-train",
  "fa-solid fa-bus",
  "fa-solid fa-car",
  "fa-solid fa-bicycle",
  "fa-solid fa-person-walking",
  "fa-solid fa-wheelchair",
  "fa-solid fa-eye",
  "fa-solid fa-eye-slash",
  "fa-solid fa-hand",
  "fa-solid fa-thumbs-down",
  "fa-solid fa-face-smile",
  "fa-solid fa-face-frown",
  "fa-solid fa-face-meh",
  "fa-solid fa-face-laugh",
  "fa-solid fa-face-surprise",
  "fa-solid fa-face-angry",
  "fa-solid fa-face-sad-tear",
  "fa-solid fa-face-grin-hearts",
  "fa-solid fa-face-kiss-wink-heart",
  "fa-solid fa-face-laugh-wink",
  "fa-solid fa-face-tired",
  "fa-solid fa-font",
  "fa-solid fa-bold",
  "fa-solid fa-italic",
  "fa-solid fa-underline",
  "fa-solid fa-strikethrough",
  "fa-solid fa-highlighter",
  "fa-solid fa-list",
  "fa-solid fa-list-ol",
  "fa-solid fa-list-check",
  "fa-solid fa-indent",
  "fa-solid fa-outdent",
  "fa-solid fa-code",
  "fa-solid fa-terminal",
  "fa-solid fa-microchip",
  "fa-solid fa-memory",
  "fa-solid fa-server",
  "fa-solid fa-database",
  "fa-solid fa-cloud-arrow-up",
  "fa-solid fa-cloud-arrow-down",
  "fa-solid fa-wifi",
  "fa-solid fa-bluetooth",
  "fa-solid fa-signal",
  "fa-solid fa-battery-full",
  "fa-solid fa-battery-half",
  "fa-solid fa-battery-quarter",
  "fa-solid fa-plug",
  "fa-solid fa-lightbulb",
  "fa-solid fa-compass",
  "fa-solid fa-map",
  "fa-solid fa-location-pin",
  "fa-solid fa-globe",
  "fa-solid fa-earth-americas",
  "fa-solid fa-earth-asia",
  "fa-solid fa-earth-europe",
  "fa-solid fa-flag",
  "fa-solid fa-at",
  "fa-solid fa-hashtag",
  "fa-solid fa-dollar-sign",
  "fa-solid fa-euro-sign",
  "fa-solid fa-pound-sign",
  "fa-solid fa-yen-sign",
  "fa-solid fa-rupee-sign",
  "fa-solid fa-percent",
  "fa-solid fa-circle",
  "fa-solid fa-square",
  "fa-solid fa-play",
  "fa-solid fa-pause",
  "fa-solid fa-stop",
  "fa-solid fa-forward",
  "fa-solid fa-backward",
  "fa-solid fa-shuffle",
  "fa-solid fa-repeat",
  "fa-solid fa-volume-high",
  "fa-solid fa-volume-mute",
  "fa-solid fa-microphone",
  "fa-solid fa-microphone-slash",
  "fa-solid fa-video-slash",
];

let selectedFAIconClass = "";

function renderFAIcons(filter = "") {
  faIconsGrid.innerHTML = "";
  const term = filter.trim().toLowerCase();
  const filtered = term
    ? faIconList.filter((cls) => cls.includes(term))
    : faIconList;
  filtered.forEach((cls) => {
    const item = document.createElement("div");
    item.className = "fa-icon-item";
    item.innerHTML = `<i class="${cls}"></i>`;
    item.addEventListener("click", () => {
      document
        .querySelectorAll(".fa-icon-item")
        .forEach((el) => el.classList.remove("selected"));
      item.classList.add("selected");
      selectedFAIconClass = cls;
    });
    faIconsGrid.appendChild(item);
  });
}

faSearch.addEventListener("input", (e) => renderFAIcons(e.target.value));

// ========== آپلود SVG ==========
const svgUpload = document.getElementById("svgUpload");
const uploadSvgBtn = document.getElementById("uploadSvgBtn");
const uploadSvgPreview = document.getElementById("uploadSvgPreview");
let uploadedSvgPath = "";

uploadSvgBtn.addEventListener("click", async () => {
  const file = svgUpload.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append("images", file);
  try {
    const res = await fetch(`${apiBase}/media/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json();
    if (res.ok && data.files.length > 0) {
      uploadedSvgPath = data.files[0].url;
      uploadSvgPreview.innerHTML = `<img src="${uploadedSvgPath}" alt="SVG">`;
      notyf.success("SVG آپلود شد");
    } else {
      notyf.error("خطا در آپلود SVG");
    }
  } catch (err) {
    notyf.error("خطای شبکه");
  }
});

// ========== کتابخانه SVG ==========
const mediaSvgGrid = document.getElementById("mediaSvgGrid");
async function loadMediaSvgs() {
  try {
    // دریافت همه رسانه‌ها (حالت صفحه‌بندی محدود، برای سادگی 100 تا اول)
    const res = await fetch(`${apiBase}/media?limit=100&offset=0`, {
      headers: authHeaders(),
    });
    const data = await res.json();
    const svgFiles = data.files.filter((f) =>
      f.filename.toLowerCase().endsWith(".svg"),
    );
    mediaSvgGrid.innerHTML = svgFiles
      .map(
        (f) => `
      <div class="media-card" data-url="${f.url}">
        <img src="${f.thumbnailUrl || f.url}" alt="${f.filename}" loading="lazy">
        <div class="media-info"><span>${f.filename}</span></div>
      </div>
    `,
      )
      .join("");
    // انتخاب کلیک
    document.querySelectorAll("#mediaSvgGrid .media-card").forEach((card) => {
      card.addEventListener("click", () => {
        document
          .querySelectorAll("#mediaSvgGrid .media-card")
          .forEach((c) => c.classList.remove("selected"));
        card.classList.add("selected");
        uploadedSvgPath = card.dataset.url;
      });
    });
  } catch (err) {
    console.error(err);
  }
}

// ========== تأیید انتخاب آیکون ==========
confirmIconBtn.addEventListener("click", () => {
  // تشخیص تب فعال
  const activeTab = document.querySelector(".icon-tab.active")?.dataset.tab;
  if (activeTab === "fa-icons") {
    if (selectedFAIconClass) {
      catIconType.value = "fontawesome";
      catIconValue.value = selectedFAIconClass;
      updateIconPreview("fontawesome", selectedFAIconClass);
    }
  } else if (activeTab === "upload-svg" || activeTab === "media-svg") {
    // هر دو از uploadedSvgPath استفاده می‌کنند (media-svg هم مقدار را در uploadedSvgPath می‌ریزد)
    if (uploadedSvgPath) {
      catIconType.value = "svg";
      catIconValue.value = uploadedSvgPath;
      updateIconPreview("svg", uploadedSvgPath);
    }
  }
  iconPickerModal.style.display = "none";
  // ریست انتخاب‌ها
  selectedFAIconClass = "";
  uploadedSvgPath = "";
  uploadSvgPreview.innerHTML = "";
  svgUpload.value = "";
  document
    .querySelectorAll(".fa-icon-item.selected")
    .forEach((el) => el.classList.remove("selected"));
  document
    .querySelectorAll("#mediaSvgGrid .media-card.selected")
    .forEach((el) => el.classList.remove("selected"));
});

// بستن مودال با کلیک خارج (اختیاری)
iconPickerModal.addEventListener("click", (e) => {
  if (e.target === iconPickerModal) iconPickerModal.style.display = "none";
});

// ========== آیتم‌ها ==========
const itemList = document.getElementById("itemList");

async function loadItems() {
  const [itemsRes, catsRes] = await Promise.all([
    fetch(`${apiBase}/items`),
    fetch(`${apiBase}/categories`),
  ]);
  const items = await itemsRes.json();
  const cats = await catsRes.json();
  itemList.innerHTML = items
    .map((item) => {
      const cat = cats.find((c) => c.id === item.categoryId);
      return `
    <li>
      <span>${item.name} - ${Number(item.price).toLocaleString("fa-IR")} تومان (${cat?.name || "بی‌دسته"})</span>
      <div>
        <a href="./admin-edit.html?id=${item.id}" class="btn-outline" style="text-decoration:none; padding:6px 12px;">ویرایش</a>
        <button onclick="deleteItem('${item.id}')" class="btn-outline">حذف</button>
      </div>
    </li>`;
    })
    .join("");
}

window.deleteItem = async function (id) {
  if (!confirm("مطمئنی؟")) return;
  await fetch(`${apiBase}/items/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  loadItems();
  notyf.success("آیتم حذف شد");
};

// ========== افزودنی‌ها ==========
async function loadAddons() {
  const res = await fetch(`${apiBase}/addons`);
  const groups = await res.json();
  if (groups.drink) {
    document.getElementById("drinkAddonList").innerHTML = groups.drink
      .map((a) => `<li>${a.name} - ${a.price} تومان</li>`)
      .join("");
  }
  if (groups.food) {
    document.getElementById("foodAddonList").innerHTML = groups.food
      .map((a) => `<li>${a.name} - ${a.price} تومان</li>`)
      .join("");
  }
}

let currentEditGroup = "";
window.editAddonGroup = async function (group) {
  currentEditGroup = group;
  const res = await fetch(`${apiBase}/addons`);
  const groups = await res.json();
  const addons = groups[group] || [];
  const container = document.getElementById("addonEditList");
  container.innerHTML = addons
    .map(
      (a, i) => `
    <div class="addon-edit-row">
      <input type="text" value="${a.name}" data-index="${i}" data-field="name" placeholder="نام" />
      <input type="number" value="${a.price}" data-index="${i}" data-field="price" placeholder="قیمت" />
      <input type="text" value="${a.image}" data-index="${i}" data-field="image" placeholder="آدرس عکس" />
    </div>
  `,
    )
    .join("");
  document.getElementById("addonModal").style.display = "flex";
};

document.getElementById("addAddonRow").addEventListener("click", () => {
  const container = document.getElementById("addonEditList");
  const index = container.children.length;
  const row = document.createElement("div");
  row.className = "addon-edit-row";
  row.innerHTML = `
    <input type="text" data-index="${index}" data-field="name" placeholder="نام" />
    <input type="number" data-index="${index}" data-field="price" placeholder="قیمت" />
    <input type="text" data-index="${index}" data-field="image" placeholder="آدرس عکس" />
  `;
  container.appendChild(row);
});

document.getElementById("saveAddons").addEventListener("click", async () => {
  const rows = document.querySelectorAll("#addonEditList .addon-edit-row");
  const addons = Array.from(rows).map((row) => ({
    name: row.querySelector('[data-field="name"]').value,
    price: Number(row.querySelector('[data-field="price"]').value),
    image: row.querySelector('[data-field="image"]').value,
  }));
  await fetch(`${apiBase}/addons/${currentEditGroup}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ addons }),
  });
  document.getElementById("addonModal").style.display = "none";
  loadAddons();
  notyf.success("افزودنی‌ها ذخیره شدند");
});

document.getElementById("closeAddonModal").addEventListener("click", () => {
  document.getElementById("addonModal").style.display = "none";
});

// ==================== رسانه‌ها (کش + Infinite Scroll + Lazy) ====================
const mediaGrid = document.getElementById("mediaGrid");
const mediaSentinel = document.getElementById("mediaSentinel");
const mediaUpload = document.getElementById("mediaUpload");
const uploadMediaBtn = document.getElementById("uploadMediaBtn");
const uploadStatus = document.getElementById("uploadStatus");

let mediaCache = {
  files: [],
  total: 0,
  offset: 0,
  isLoading: false,
  hasMore: true,
};
let mediaObserver = null;

function resetMediaCache() {
  mediaCache = {
    files: [],
    total: 0,
    offset: 0,
    isLoading: false,
    hasMore: true,
  };
  mediaGrid.innerHTML = "";
}

async function loadMedia(reset = true) {
  if (reset) {
    resetMediaCache();
    setupMediaObserver();
  }
  if (mediaCache.isLoading || !mediaCache.hasMore) return;
  mediaCache.isLoading = true;
  try {
    const res = await fetch(
      `${apiBase}/media?limit=20&offset=${mediaCache.offset}`,
      { headers: authHeaders() },
    );
    const data = await res.json();
    const { files, total } = data;
    mediaCache.files.push(...files);
    mediaCache.total = total;
    mediaCache.offset += files.length;
    mediaCache.hasMore = mediaCache.files.length < total;
    renderMediaGrid();
  } catch (err) {
    notyf.error("ارتباط با سرور برقرار نشد");
  } finally {
    mediaCache.isLoading = false;
  }
}

function renderMediaGrid() {
  mediaGrid.innerHTML = "";
  mediaCache.files.forEach((f) => {
    const card = document.createElement("div");
    card.className = "media-card";
    card.innerHTML = `
      <img src="${f.thumbnailUrl}" alt="${f.filename}" loading="lazy" />
      <div class="media-info">
        <span>${f.filename}</span>
        <button class="btn-outline" onclick="deleteMedia('${f.filename}')">حذف</button>
      </div>
    `;
    mediaGrid.appendChild(card);
  });
}

function setupMediaObserver() {
  if (mediaObserver) mediaObserver.disconnect();
  mediaObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (
          entry.isIntersecting &&
          mediaCache.hasMore &&
          !mediaCache.isLoading
        ) {
          loadMedia(false);
        }
      });
    },
    { root: null, rootMargin: "0px", threshold: 0.1 },
  );
  if (mediaSentinel) mediaObserver.observe(mediaSentinel);
}

window.deleteMedia = async function (filename) {
  if (!confirm(`حذف ${filename}؟`)) return;
  await fetch(`${apiBase}/media/${encodeURIComponent(filename)}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  resetMediaCache();
  loadMedia();
};

uploadMediaBtn.addEventListener("click", async () => {
  const files = mediaUpload.files;
  if (files.length === 0) return;
  uploadStatus.textContent = "در حال بارگذاری...";
  const formData = new FormData();
  for (const file of files) formData.append("images", file);
  try {
    const res = await fetch(`${apiBase}/media/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (res.ok) {
      uploadStatus.textContent = "با موفقیت آپلود شد.";
      notyf.success("فایل‌ها آپلود شدند");
      mediaUpload.value = "";
      resetMediaCache();
      loadMedia();
    } else {
      const err = await res.json();
      uploadStatus.textContent = "خطا: " + (err.error || "نامشخص");
    }
  } catch (err) {
    uploadStatus.textContent = "خطای شبکه";
  }
});

function initialMediaLoadIfActive() {
  const mediaTab = document.getElementById("tab-media");
  if (mediaTab && mediaTab.classList.contains("active")) loadMedia();
}

// ========== مدیریت منوی همبرگری ==========
const hamburgerBtn = document.getElementById("hamburgerBtn");
const sidebar = document.getElementById("sidebar");
const overlayDiv = document.createElement("div");
overlayDiv.className = "sidebar-overlay";
document.body.appendChild(overlayDiv);

function openSidebar() {
  sidebar.classList.add("open");
  overlayDiv.classList.add("active");
}
function closeSidebar() {
  sidebar.classList.remove("open");
  overlayDiv.classList.remove("active");
}
hamburgerBtn.addEventListener("click", () =>
  sidebar.classList.contains("open") ? closeSidebar() : openSidebar(),
);
overlayDiv.addEventListener("click", closeSidebar);
sidebar.addEventListener("click", (e) => {
  if (e.target.classList.contains("tab") || e.target.closest(".tab"))
    closeSidebar();
});

showDashboard = (function (old) {
  return function () {
    old();
    initialMediaLoadIfActive();
  };
})(showDashboard);

// استایل‌های اضافی
const mediaStyles = document.createElement("style");
mediaStyles.textContent = `.media-grid { display: flex; flex-wrap: wrap; gap: 12px; } .media-card { width: 150px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; background: white; } .media-card img { width: 100%; height: 120px; object-fit: cover; display: block; } .media-info { padding: 8px; font-size: 0.75rem; display: flex; justify-content: space-between; align-items: center; } .media-info button { padding: 2px 8px; font-size: 0.7rem; } #mediaSentinel { height: 10px; background: transparent; }`;
document.head.appendChild(mediaStyles);
