const apiBase = "/api";
//notyf
const notyf = new Notyf({ position: { x: "left", y: "top" }, duration: 3500 });

const token = localStorage.getItem("adminToken");
if (!token) {
  notyf.success("لطفاً ابتدا وارد پنل شوید.");
  window.location.href = "./admin.html";
}

const urlParams = new URLSearchParams(window.location.search);
const itemId = urlParams.get("id");
const isEdit = !!itemId;

const pageTitle = document.getElementById("pageTitle");
pageTitle.textContent = isEdit ? "ویرایش آیتم" : "افزودن آیتم جدید";

// المان‌های فرم
const itemForm = document.getElementById("itemForm");
const itemName = document.getElementById("itemName");
const itemDesc = document.getElementById("itemDesc");
const itemPrice = document.getElementById("itemPrice");
const itemCategory = document.getElementById("itemCategory");
const itemAddonGroup = document.getElementById("itemAddonGroup");
const orderMin = document.getElementById("orderMin");
const orderMax = document.getElementById("orderMax");
const imagesGrid = document.getElementById("imagesGrid");
const itemImagesInput = document.getElementById("itemImages");

// توابع کمکی
function authHeaders() {
  return { Authorization: `Bearer ${token}` };
}

async function loadCategories() {
  const res = await fetch(`${apiBase}/categories`);
  const cats = await res.json();
  itemCategory.innerHTML = cats
    .map((c) => `<option value="${c.id}">${c.name}</option>`)
    .join("");
}

// بارگذاری اطلاعات آیتم در صورت ویرایش
async function loadItem() {
  if (!isEdit) return;
  try {
    const res = await fetch(`${apiBase}/items`);
    const items = await res.json();
    const item = items.find((i) => i.id === itemId);
    if (!item) {
      notyf.error("آیتم یافت نشد");
      window.location.href = "./admin.html";
      return;
    }
    itemName.value = item.name;
    itemDesc.value = item.desc;
    itemPrice.value = item.price;
    itemCategory.value = item.categoryId;
    itemAddonGroup.value = item.addonGroup || "";
    orderMin.value = item.orderMin || 0;
    orderMax.value = item.orderMax || 0;

    // نمایش گالری عکس‌های فعلی
    renderCurrentImages(item.images || []);
  } catch (err) {
    console.error(err);
  }
}

function renderCurrentImages(images) {
  imagesGrid.innerHTML = "";
  images.forEach((imgUrl) => {
    const thumb = document.createElement("div");
    thumb.className = "image-thumb";
    thumb.innerHTML = `
      <img src="${imgUrl}" alt="preview" 
           onerror="this.style.display='none'; this.parentElement.classList.add('broken'); this.parentElement.innerHTML='<span>عدم دسترسی</span>'; return true;"
           onload="this.parentElement.classList.remove('broken')">
      <span class="delete-badge" data-img="${imgUrl}">×</span>
    `;
    const deleteBtn = thumb.querySelector(".delete-badge");
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      thumb.classList.add("deleted");
      thumb.dataset.deleted = "true";
    });
    imagesGrid.appendChild(thumb);
  });
}

// جمع‌آوری عکس‌های نگه‌داشته‌شده
function getKeepImages() {
  const keep = [];
  imagesGrid.querySelectorAll(".image-thumb").forEach((thumb) => {
    if (thumb.dataset.deleted !== "true") {
      const badge = thumb.querySelector(".delete-badge");
      if (badge && badge.dataset.img) keep.push(badge.dataset.img);
    }
  });
  return keep;
}

// ارسال فرم
itemForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData();
  formData.append("name", itemName.value);
  formData.append("desc", itemDesc.value);
  formData.append("price", itemPrice.value);
  formData.append("categoryId", itemCategory.value);
  formData.append("addonGroup", itemAddonGroup.value);
  formData.append("orderMin", orderMin.value);
  formData.append("orderMax", orderMax.value);

  // عکس‌های باقی‌مانده
  const keepImages = getKeepImages();
  formData.append("keepImages", JSON.stringify(keepImages));

  // عکس‌های جدید
  const files = itemImagesInput.files;
  for (let i = 0; i < files.length; i++) {
    formData.append("images", files[i]);
  }

  const url = isEdit ? `${apiBase}/items/${itemId}` : `${apiBase}/items`;
  const method = isEdit ? "PUT" : "POST";

  try {
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) {
      const errData = await res.json();
      notyf.error("خطا: " + (errData.error || "مشکل در ذخیره‌سازی"));
      return;
    }
    notyf.success("ذخیره شد ✅");
    window.location.href = "./admin.html"; // بازگشت به داشبورد
  } catch (err) {
    console.error(err);
    notyf.error("خطای شبکه");
  }
});

// ==================== مودال کتابخانه رسانه (Infinite Scroll + کش) ====================
const openMediaBtn = document.getElementById("openMediaLibrary");
const mediaModal = document.getElementById("mediaLibraryModal");
const closeMediaModal = document.getElementById("closeMediaModal");
const mediaLibraryGrid = document.getElementById("mediaLibraryGrid");
const mediaLibrarySentinel = document.getElementById("mediaLibrarySentinel");
const mediaLibraryUpload = document.getElementById("mediaLibraryUpload");
const uploadToLibraryBtn = document.getElementById("uploadToLibraryBtn");
const insertSelectedBtn = document.getElementById("insertSelectedMedia");

let selectedMediaUrls = new Set();

// کش و Infinite Scroll مخصوص مودال
let libraryCache = {
  files: [],
  total: 0,
  offset: 0,
  isLoading: false,
  hasMore: true,
};
let libraryObserver = null;

function resetLibraryCache() {
  libraryCache = {
    files: [],
    total: 0,
    offset: 0,
    isLoading: false,
    hasMore: true,
  };
  mediaLibraryGrid.innerHTML = "";
}

async function loadMediaLibrary(reset = true) {
  if (reset) {
    resetLibraryCache();
    setupLibraryObserver();
  }

  if (libraryCache.isLoading || !libraryCache.hasMore) return;

  libraryCache.isLoading = true;
  try {
    const res = await fetch(
      `${apiBase}/media?limit=20&offset=${libraryCache.offset}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const data = await res.json();
    const { files, total } = data;

    libraryCache.files.push(...files);
    libraryCache.total = total;
    libraryCache.offset += files.length;
    libraryCache.hasMore = libraryCache.files.length < total;

    renderLibraryGrid();
  } catch (err) {
    console.error("خطا در بارگذاری کتابخانه:", err);
  } finally {
    libraryCache.isLoading = false;
  }
}

function renderLibraryGrid() {
  mediaLibraryGrid.innerHTML = "";
  libraryCache.files.forEach((f) => {
    const card = document.createElement("div");
    card.className = "media-card";
    card.dataset.url = f.url;
    card.dataset.filename = f.filename;
    if (selectedMediaUrls.has(f.url)) {
      card.classList.add("selected");
    }
    card.innerHTML = `
      <img src="${f.thumbnailUrl || f.url}" alt="${f.filename}" loading="lazy" />
      <div class="media-info">
        <span>${f.filename}</span>
      </div>
    `;
    card.addEventListener("click", () => {
      const url = card.dataset.url;
      if (selectedMediaUrls.has(url)) {
        selectedMediaUrls.delete(url);
        card.classList.remove("selected");
      } else {
        selectedMediaUrls.add(url);
        card.classList.add("selected");
      }
    });
    mediaLibraryGrid.appendChild(card);
  });
}

function setupLibraryObserver() {
  if (libraryObserver) libraryObserver.disconnect();

  libraryObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (
          entry.isIntersecting &&
          libraryCache.hasMore &&
          !libraryCache.isLoading
        ) {
          loadMediaLibrary(false);
        }
      });
    },
    {
      root: mediaModal.querySelector(".media-library-body"),
      rootMargin: "0px",
      threshold: 0.1,
    },
  );

  if (mediaLibrarySentinel) libraryObserver.observe(mediaLibrarySentinel);
}

// باز کردن مودال
openMediaBtn.addEventListener("click", async () => {
  selectedMediaUrls.clear();
  await loadMediaLibrary(true); // بارگذاری اولیه
  mediaModal.style.display = "flex";
});

closeMediaModal.addEventListener("click", () => {
  mediaModal.style.display = "none";
});

// آپلود داخل مودال
uploadToLibraryBtn.addEventListener("click", async () => {
  const files = mediaLibraryUpload.files;
  if (files.length === 0) return;
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
      mediaLibraryUpload.value = "";
      await loadMediaLibrary(true); // ریست و بارگذاری مجدد
    } else {
      notyf.error("خطا در بارگذاری");
    }
  } catch (err) {
    console.error(err);
  }
});

// افزودن انتخاب‌شده‌ها به گالری آیتم
insertSelectedBtn.addEventListener("click", () => {
  selectedMediaUrls.forEach((url) => {
    const thumb = document.createElement("div");
    thumb.className = "image-thumb";
    thumb.innerHTML = `
      <img src="${url}" alt="preview" 
           onerror="this.style.display='none'; this.parentElement.classList.add('broken'); this.parentElement.innerHTML='<span>عدم دسترسی</span>'; return true;"
           onload="this.parentElement.classList.remove('broken')">
      <span class="delete-badge" data-img="${url}">×</span>
    `;
    thumb.querySelector(".delete-badge").addEventListener("click", (e) => {
      e.stopPropagation();
      thumb.classList.add("deleted");
      thumb.dataset.deleted = "true";
    });
    imagesGrid.appendChild(thumb);
  });
  mediaModal.style.display = "none";
});

// راه‌اندازی صفحه
loadCategories();
if (isEdit) loadItem();
