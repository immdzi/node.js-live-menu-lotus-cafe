console.log("✅ admin.js بارگذاری شد");
const apiBase = "/api"; 
// تنظیم Notyf
const notyf = new Notyf({
  position: {
    x: 'left',
    y: 'top'
  },
  duration: 3500,
  types: [
    {
      type: 'warning',
      background: '#fdcb6e',
      icon: false
    }
  ]
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
    if (tab.dataset.tab === "media") loadMedia(); // بارگذاری مجدد در صورت کلیک (کش بررسی می‌شود)
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
const catId = document.getElementById("catId");
const catName = document.getElementById("catName");
const catIcon = document.getElementById("catIcon");
const catImage = document.getElementById("catImage");

document
  .getElementById("cancelCat")
  .addEventListener("click", () => catForm.reset());

async function loadCategories() {
  const res = await fetch(`${apiBase}/categories`);
  const cats = await res.json();
  catList.innerHTML = cats
    .map(
      (c) => `
    <li>
      <span>${c.name} (${c.icon})</span>
      <div>
        <button onclick="editCategory('${c.id}')" class="btn-outline">ویرایش</button>
        <button onclick="deleteCategory('${c.id}')" class="btn-outline">حذف</button>
      </div>
    </li>`,
    )
    .join("");
}

async function editCategory(id) {
  const res = await fetch(`${apiBase}/categories`);
  const cats = await res.json();
  const cat = cats.find((c) => c.id === id);
  if (!cat) return;
  catId.value = cat.id;
  catName.value = cat.name;
  catIcon.value = cat.icon;
}

async function deleteCategory(id) {
  if (!confirm("مطمئنی؟")) return;
  await fetch(`${apiBase}/categories/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  loadCategories();
  notyf.success("دسته‌بندی حذف شد");
}

catForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData();
  formData.append("name", catName.value);
  formData.append("icon", catIcon.value);
  if (catImage.files[0]) formData.append("image", catImage.files[0]);

  const id = catId.value;
  const url = id ? `${apiBase}/categories/${id}` : `${apiBase}/categories`;
  const method = id ? "PUT" : "POST";
  await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  catForm.reset();
  loadCategories();
  notyf.error(id ? "دسته‌بندی بروز شد" : "دسته‌بندی اضافه شد");
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
  notyf.success('آیتم حذف شد');
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
  notyf.success('افزودنی‌ها ذخیره شدند');
});

document.getElementById("closeAddonModal").addEventListener("click", () => {
  document.getElementById("addonModal").style.display = "none";
});

// اضافه کردن استایل ردیف‌های افزودنی
const style = document.createElement("style");
style.textContent = `.addon-edit-row { display: flex; gap: 10px; margin-bottom: 10px; } .addon-edit-row input { flex: 1; }`;
document.head.appendChild(style);

// ==================== رسانه‌ها (کش + Infinite Scroll + Lazy) ====================
const mediaGrid = document.getElementById("mediaGrid");
const mediaSentinel = document.getElementById("mediaSentinel");
const mediaUpload = document.getElementById("mediaUpload");
const uploadMediaBtn = document.getElementById("uploadMediaBtn");
const uploadStatus = document.getElementById("uploadStatus");

// متغیرهای کش
let mediaCache = {
  files: [], // همه فایل‌هایی که تا الان دریافت شدن
  total: 0,
  offset: 0, // next offset to fetch
  isLoading: false,
  hasMore: true,
};

// observer برای sentinel
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

// بارگذاری اولیه یا صفحه بعد
async function loadMedia(reset = true) {
  if (reset) {
    resetMediaCache();
    setupMediaObserver(); // مطمئن شو observer وصل باشه
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
    loginMsg.textContent = "خطای شبکه";
    notyf.error('ارتباط با سرور برقرار نشد');
  } finally {
    mediaCache.isLoading = false;
  }
}

function renderMediaGrid() {
  // فقط فایل‌های جدید رو اضافه می‌کنیم (اما چون همه رو نگه می‌داریم، ساده‌ترین راه اینه که کل grid رو بازسازی کنیم. با توجه به تعداد محدود (۲۰ تا) و incremental, می‌تونیم فقط عناصر جدید را append کنیم)
  // ولی برای سادگی و جلوگیری از پیچیدگی، grid را خالی کرده و دوباره از mediaCache.files می‌سازیم.
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

// observer برای infinite scroll
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
          loadMedia(false); // بارگذاری بیشتر
        }
      });
    },
    { root: null, rootMargin: "0px", threshold: 0.1 },
  );

  if (mediaSentinel) mediaObserver.observe(mediaSentinel);
}

// حذف رسانه
window.deleteMedia = async function (filename) {
  if (!confirm(`حذف ${filename}؟`)) return;
  await fetch(`${apiBase}/media/${encodeURIComponent(filename)}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  // بعد از حذف، کش رو ریست کن و دوباره بارگذاری کن
  resetMediaCache();
  loadMedia();
};

// آپلود مستقیم در تب رسانه
uploadMediaBtn.addEventListener("click", async () => {
  const files = mediaUpload.files;
  if (files.length === 0) return;
  uploadStatus.textContent = "در حال بارگذاری...";
  const formData = new FormData();
  for (const file of files) {
    formData.append("images", file);
  }
  try {
    const res = await fetch(`${apiBase}/media/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (res.ok) {
      uploadStatus.textContent = "با موفقیت آپلود شد.";
      notyf.success('فایل‌ها آپلود شدند');
      mediaUpload.value = "";
      // ریست کش و لود مجدد (برای دیدن فایل‌های جدید)
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

// وقتی تب رسانه فعال می‌شود، loadMedia صدا زده می‌شود که با reset=true شروع می‌کنه.
// اما برای اولین بار که داشبورد لود می‌شود (showDashboard) هم اگر تب فعال بود loadMedia صدا زده شود؟ خیر، فقط با کلیک تب.
// در showDashboard بعد از loadAddons می‌تونیم چک کنیم اگر tab-media active بود loadMedia رو صدا بزنیم. ولی پیش‌فرض active نیست.
// برای اطمینان، این کار را می‌کنیم:
function initialMediaLoadIfActive() {
  const mediaTab = document.getElementById("tab-media");
  if (mediaTab && mediaTab.classList.contains("active")) {
    loadMedia();
  }
}

// ========== مدیریت منوی همبرگری ==========
const hamburgerBtn = document.getElementById('hamburgerBtn');
const sidebar = document.getElementById('sidebar');

// ایجاد overlay برای پس‌زمینه تاریک
const overlayDiv = document.createElement('div');
overlayDiv.className = 'sidebar-overlay';
document.body.appendChild(overlayDiv);

function openSidebar() {
  sidebar.classList.add('open');
  overlayDiv.classList.add('active');
}
function closeSidebar() {
  sidebar.classList.remove('open');
  overlayDiv.classList.remove('active');
}

hamburgerBtn.addEventListener('click', () => {
  if (sidebar.classList.contains('open')) {
    closeSidebar();
  } else {
    openSidebar();
  }
});

// بستن با کلیک روی overlay
overlayDiv.addEventListener('click', closeSidebar);

// بستن سایدبار وقتی یک تب کلیک می‌شود (اختیاری)
sidebar.addEventListener('click', (e) => {
  if (e.target.classList.contains('tab') || e.target.closest('.tab')) {
    closeSidebar();
  }
});

showDashboard = (function (oldShowDashboard) {
  return function () {
    oldShowDashboard();
    initialMediaLoadIfActive();
  };
})(showDashboard);

// اضافه کردن استایل‌های لازم (اگر در فایل CSS نباشه)
const mediaStyles = document.createElement("style");
mediaStyles.textContent = `
  .media-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }
  .media-card {
    width: 150px;
    border: 1px solid #ddd;
    border-radius: 8px;
    overflow: hidden;
    background: white;
  }
  .media-card img {
    width: 100%;
    height: 120px;
    object-fit: cover;
    display: block;
  }
  .media-info {
    padding: 8px;
    font-size: 0.75rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .media-info button {
    padding: 2px 8px;
    font-size: 0.7rem;
  }
  #mediaSentinel {
    height: 10px;
    background: transparent;
  }
`;
document.head.appendChild(mediaStyles);
