const apiBase = "/api";
let allCategories = [];
let allItems = [];
let allAddonGroups = {};

const icons = {
  coffee:
    '<svg viewBox="0 0 24 24"><path d="M2 21h18v-2H2M20 8h-2V5h2m0-2H4v10a4 4 0 0 0 4 4h6a4 4 0 0 0 4-4v-3h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"/></svg>',
  cold: '<svg viewBox="0 0 24 24"><path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2m-7 14l-4-4h8z"/></svg>',
  breakfast:
    '<svg viewBox="0 0 24 24"><path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2m5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/></svg>',
  pizza:
    '<svg viewBox="0 0 24 24"><path d="M12 2C8.43 2 5.23 3.54 3.04 6L12 22l8.96-16C18.77 3.54 15.57 2 12 2z"/></svg>',
  burger:
    '<svg viewBox="0 0 24 24"><path d="M22 13c0-1.1-.9-2-2-2H4a2 2 0 0 0 0 4h16a2 2 0 0 0 2-2M19 3H5a2 2 0 0 0-2 2v3h18V5a2 2 0 0 0-2-2z"/></svg>',
  pasta:
    '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2m1 14h-2v-2h2zm0-4h-2V7h2z"/></svg>',
  salad:
    '<svg viewBox="0 0 24 24"><path d="M12 22A10 10 0 1 1 22 12 10 10 0 0 1 12 22m-1-7l-4-4h8z"/></svg>',
  dessert:
    '<svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>',
  shake:
    '<svg viewBox="0 0 24 24"><path d="M13 2v2h5v2h-5v2h5v2h-5v2h5v2h-5v2h5v2h-8V2z"/></svg>',
  tea: '<svg viewBox="0 0 24 24"><path d="M2 19h18v2H2zM20 3H4v10a4 4 0 0 0 4 4h6a4 4 0 0 0 4-4v-3h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"/></svg>',
};

// دریافت HTML آیکون برای یک دسته‌بندی
function getCategoryIconHTML(cat) {
  if (cat.iconType === "fontawesome" && cat.iconValue) {
    return `<i class="fa ${cat.iconValue}"></i>`;
  }
  if (cat.iconType === "svg" && cat.iconValue) {
    return `<img src="${cat.iconValue}" alt="${cat.name}" style="width:22px;height:22px;vertical-align:middle;" />`;
  }
  // حالت پیش‌فرض: از آیکون SVG قدیمی بر اساس شناسهٔ دسته استفاده کن (fallback)
  return icons[cat.id] || "";
}

// فرمت قیمت با نماد تومان
function formatPrice(price) {
  const num = Number(price);
  const formatted = num.toLocaleString("fa-IR");
  return `<svg xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg" width="14" height="10" viewBox="0 0 22 18" fill="none"><g id="toman-1 1" clip-path="url(#clip0_181_1123)" fill="none"><g id="Layer 1" fill="none"><g id="Group" fill="none"><path id="Vector" d="M16.8984 0.750259H14.5224C14.1425 0.750259 13.8346 1.05819 13.8346 1.43805C13.8346 1.8179 14.1425 2.12583 14.5224 2.12583H16.8984C17.2782 2.12583 17.5862 1.8179 17.5862 1.43805C17.5862 1.05819 17.2782 0.750259 16.8984 0.750259Z" fill="#8F9BAD"></path><path id="Vector_2" d="M21.2474 3.81424C21.2265 3.43908 21.164 2.94669 21.0598 2.33706C20.999 1.98275 20.9365 1.65014 20.8722 1.33925C20.8002 0.991882 20.4528 0.776514 20.1106 0.866829C19.7945 0.950197 19.5983 1.26456 19.6625 1.58414C19.7268 1.90372 19.7876 2.2233 19.8484 2.56372C19.9474 3.11603 20.0073 3.54329 20.0281 3.8455C20.049 4.22066 19.9369 4.51245 19.6921 4.72087C19.4472 4.92929 19.0225 5.0335 18.4181 5.0335H6.67273V3.47035C6.67273 2.8034 6.55289 2.21201 6.31321 1.69617C6.07353 1.18033 5.72963 0.776514 5.28153 0.484725C4.83343 0.192937 4.31237 0.0470428 3.71838 0.0470428C3.15564 0.0470428 2.65283 0.198148 2.20993 0.500357C1.76704 0.802566 1.42315 1.2142 1.17825 1.73525C0.93336 2.2563 0.810913 2.83466 0.810913 3.47035C0.810913 4.40824 1.07925 5.13771 1.61594 5.65876C2.15262 6.17981 2.85864 6.44034 3.73401 6.44034H5.42221V6.53412C5.42221 6.78423 5.32321 6.98223 5.12521 7.12812C4.92721 7.27402 4.63543 7.39907 4.24985 7.50328C3.86427 7.60749 3.21817 7.75338 2.31154 7.94096L2.2907 7.9453C1.91641 8.01999 1.67673 8.3882 1.76009 8.76075C1.84086 9.12201 2.19517 9.35214 2.5573 9.28006C2.70493 9.25054 2.8517 9.22101 2.99933 9.19148C3.9789 8.99348 4.7214 8.79548 5.22682 8.59749C5.73224 8.39949 6.09958 8.14157 6.32884 7.82373C6.5581 7.50588 6.67273 7.07602 6.67273 6.53412V6.44034H18.4181C19.0538 6.44034 19.5878 6.31528 20.0203 6.06518C20.4528 5.81507 20.7706 5.48942 20.9738 5.08821C21.177 4.687 21.2682 4.26234 21.2474 3.81424ZM5.45347 5.0335H3.73401C3.14001 5.0335 2.70754 4.91626 2.43659 4.68179C2.16565 4.44732 2.03017 4.0435 2.03017 3.47035C2.03017 2.85551 2.17867 2.36311 2.47567 1.99317C2.77267 1.62322 3.1869 1.43825 3.71838 1.43825C4.29153 1.43825 4.724 1.61801 5.01579 1.97754C5.30758 2.33706 5.45347 2.83466 5.45347 3.47035V5.0335Z" fill="#8F9BAD"></path><path id="Vector_3" d="M6.23507 12.8413C6.23507 12.4097 5.88515 12.0597 5.4535 12.0597C5.02184 12.0597 4.67192 12.4097 4.67192 12.8413C4.67192 13.273 5.02184 13.6229 5.4535 13.6229C5.88515 13.6229 6.23507 13.273 6.23507 12.8413Z" fill="#8F9BAD"></path><path id="Vector_4" d="M20.7724 12.3489C20.5432 11.8123 20.2201 11.3859 19.8033 11.0672C19.3864 10.7493 18.9071 10.5904 18.3652 10.5904C17.6878 10.5904 17.1094 10.8231 16.6301 11.286C16.1507 11.7497 15.7964 12.388 15.5671 13.2009L15.0669 14.9985C15.0148 15.2173 14.9132 15.3815 14.7621 15.4909C14.611 15.6003 14.4104 15.655 14.1603 15.655C13.6913 15.655 13.3553 15.6064 13.152 15.5065C12.9488 15.4075 12.8134 15.233 12.7456 14.9829C12.6779 14.7328 12.644 14.3263 12.644 13.7636L12.6284 9.74629C12.6284 9.3503 12.5607 9.00206 12.4252 8.69898C12.2897 8.39677 12.0761 8.15969 11.7843 7.98775C11.4925 7.8158 11.1226 7.72983 10.6744 7.72983H10.1586C9.70008 7.72983 9.32232 7.8158 9.02532 7.98775C8.72832 8.15969 8.51469 8.39417 8.38443 8.69117C8.25417 8.98817 8.18904 9.33987 8.18904 9.74629L8.20467 14.1075C8.20467 14.7119 8.1213 15.1887 7.95456 15.5378C7.78783 15.8877 7.50646 16.1422 7.11046 16.3037C6.71446 16.4661 6.16215 16.546 5.45352 16.546H5.226C4.57989 16.546 4.04842 16.4114 3.63158 16.1396C3.21474 15.8686 2.90732 15.497 2.70932 15.0219C2.51132 14.5478 2.41232 14.0041 2.41232 13.3884C2.41232 13.1705 2.44619 12.8743 2.48787 12.593C2.54953 12.1744 2.18306 11.8192 1.76622 11.8922C1.49874 11.939 1.29467 12.1544 1.25819 12.4236C1.21477 12.7406 1.19306 13.0619 1.19306 13.3884C1.19306 14.1804 1.34677 14.9264 1.65419 15.6237C1.96161 16.322 2.41753 16.8847 3.02195 17.312C3.62637 17.7401 4.36105 17.9528 5.226 17.9528H5.45352C6.38099 17.9528 7.13912 17.7965 7.72791 17.4839C8.31669 17.1713 8.74917 16.7284 9.02532 16.1552C9.30148 15.5829 9.43435 14.8995 9.42393 14.1075L9.4083 9.74629C9.4083 9.50661 9.4578 9.34595 9.5568 9.26172C9.6558 9.17835 9.8564 9.13666 10.1586 9.13666H10.6744C10.9558 9.13666 11.1486 9.18356 11.2528 9.27735C11.357 9.37114 11.4091 9.52745 11.4091 9.74629L11.4248 13.7636C11.4248 14.4731 11.5055 15.0671 11.6671 15.5456C11.8286 16.025 12.1073 16.3975 12.5033 16.6632C12.8993 16.929 13.4517 17.0618 14.1603 17.0618C14.4625 17.0618 14.7543 16.9941 15.0356 16.8586C15.317 16.724 15.5619 16.5365 15.7703 16.2959L15.8329 16.3272C16.6457 16.744 17.2501 17.0288 17.6461 17.1791C18.0421 17.3302 18.4381 17.4057 18.8341 17.4057C19.2301 17.4057 19.587 17.2946 19.9361 17.0697C20.2852 16.8456 20.5692 16.4861 20.788 15.9911C21.0069 15.497 21.1163 14.8639 21.1163 14.0919C21.1163 13.4666 21.0017 12.8865 20.7724 12.3489ZM19.6313 15.6003C19.4542 15.866 19.1884 15.9989 18.8341 15.9989C18.5632 15.9989 18.2766 15.939 17.9744 15.8191C17.6722 15.7002 17.1667 15.4622 16.4581 15.1079L16.3487 15.0454L16.7551 13.576C16.901 13.0445 17.112 12.6485 17.3882 12.388C17.6643 12.1284 17.99 11.9972 18.3652 11.9972C18.8654 11.9972 19.2457 12.1831 19.5063 12.5522C19.7668 12.9221 19.897 13.4353 19.897 14.0919C19.897 14.8326 19.8085 15.3346 19.6313 15.6003Z" fill="#8F9BAD"></path></g></g></g><defs><clipPath id="clip0_181_1123"><rect width="20.4391" height="17.9059" fill="white" transform="translate(0.810913 0.0470428)"></rect></clipPath></defs></svg> ${formatted}`;
}

// بارگذاری داده‌ها از سرور
async function loadData() {
  try {
    const [catRes, itemRes, addonRes] = await Promise.all([
      fetch(`${apiBase}/categories`),
      fetch(`${apiBase}/items`),
      fetch(`${apiBase}/addons`),
    ]);
    allCategories = await catRes.json();
    allItems = await itemRes.json();
    allAddonGroups = await addonRes.json();
    renderMenu();
    setupScrollingDesc();
    setupSpy();
  } catch (err) {
    console.error("خطا در بارگذاری منو:", err);
  }
}

const catNav = document.getElementById("catNav");
const menuContainer = document.getElementById("menuContainer");

function renderMenu() {
  catNav.innerHTML = "";
  menuContainer.innerHTML = "";

  allCategories.forEach((cat) => {
    // دکمه ناوبری
    const btn = document.createElement("button");
    btn.className = "cat-btn";
    btn.dataset.target = cat.id;
    const iconHTML = getCategoryIconHTML(cat);
    btn.innerHTML = `${iconHTML}<span>${cat.name}</span>`;
    btn.onclick = () => {
      document
        .getElementById(cat.id)
        .scrollIntoView({ behavior: "smooth", block: "start" });
    };
    catNav.appendChild(btn);

    // بخش آیتم‌ها
    const section = document.createElement("section");
    section.className = "category-section";
    section.id = cat.id;
    section.innerHTML = `<h2 class="section-title">${iconHTML}${cat.name}</h2>`;

    const itemsInCat = allItems.filter((item) => item.categoryId === cat.id);
    if (itemsInCat.length === 0) {
      section.innerHTML +=
        '<p style="color:var(--text-muted); padding:10px;">آیتمی در این دسته وجود ندارد</p>';
    } else {
      itemsInCat.forEach((item) => {
        const card = document.createElement("div");
        card.className = "menu-item";
        const imgSrc =
          item.images && item.images.length > 0
            ? item.images[0]
            : "https://picsum.photos/seed/default/200/200";
        card.innerHTML = `
          <img class="item-img" src="${imgSrc}" alt="${item.name}" loading="lazy">
          <div class="item-body">
            <h3>${item.name}</h3>
            <div class="desc-wrap"><div class="desc-text">${item.desc}</div></div>
            <div class="price">${formatPrice(item.price)}</div>
          </div>`;
        card.onclick = () => openModal(item);
        section.appendChild(card);
      });
    }
    menuContainer.appendChild(section);
  });
}

// اسکرول توضیحات بلند
function setupScrollingDesc() {
  document.querySelectorAll(".desc-wrap").forEach((wrap) => {
    const text = wrap.querySelector(".desc-text");
    const overflow = text.scrollHeight - wrap.clientHeight;
    if (overflow > 2) {
      wrap.style.setProperty("--shift", `-${overflow}px`);
      wrap.classList.add("scrolling");
    }
  });
}

// اسپای دسته‌بندی
function setupSpy() {
  const buttons = document.querySelectorAll(".cat-btn");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          buttons.forEach((b) =>
            b.classList.toggle("active", b.dataset.target === id),
          );
          const activeBtn = [...buttons].find((b) => b.dataset.target === id);
          activeBtn?.scrollIntoView({
            behavior: "smooth",
            inline: "center",
            block: "nearest",
          });
        }
      });
    },
    { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
  );
  document
    .querySelectorAll(".category-section")
    .forEach((s) => observer.observe(s));
}

// ---------- پاپ‌آپ و افزودنی‌ها ----------
const overlay = document.getElementById("modalOverlay");
const mImg = document.getElementById("mImg");
const mName = document.getElementById("mName");
const mDesc = document.getElementById("mDesc");
const mPrice = document.getElementById("mPrice");
const mAdd = document.getElementById("mAdd");
const mAddons = document.getElementById("mAddons");
const addonsRow = document.getElementById("addonsRow");
const notesCount = document.getElementById("notesCount");

let currentItem = null;
let modalStep = "details";
let currentAddon = null;
let notes = JSON.parse(localStorage.getItem("cafeNotes") || "[]");

function getAddonsForItem(item) {
  if (!item.addonGroup || !allAddonGroups[item.addonGroup]) return [];
  return allAddonGroups[item.addonGroup];
}

function renderAddons() {
  addonsRow.innerHTML = "";
  getAddonsForItem(currentItem).forEach((a) => {
    const card = document.createElement("div");
    card.className = "addon-card";
    card.innerHTML = `
      <img src="${a.image}" alt="${a.name}" />
      <div class="addon-name">${a.name}</div>
      <div class="addon-price">${formatPrice(a.price)}</div>
    `;
    card.onclick = () => {
      currentAddon = a;
      document
        .querySelectorAll(".addon-card")
        .forEach((c) => c.classList.remove("selected"));
      card.classList.add("selected");
      mAdd.disabled = false;
      mAdd.classList.remove("added");
    };
    addonsRow.appendChild(card);
  });
}

function openModal(item) {
  currentItem = item;
  modalStep = "details";
  currentAddon = null;

  mImg.src = item.images?.[0] || "https://picsum.photos/seed/default/200/200";
  mName.textContent = item.name;
  mDesc.textContent = item.desc;
  mPrice.innerHTML = formatPrice(item.price);

  mDesc.style.display = "";
  mPrice.style.display = "";
  mAddons.classList.remove("show");
  mAdd.disabled = false;
  mAdd.classList.remove("added");
  mAdd.textContent = "افزودن به سبد خرید";
  overlay.classList.add("open");
}

function closeModal() {
  overlay.classList.remove("open");
}

overlay.onclick = (e) => {
  if (e.target === overlay) closeModal();
};

mAdd.onclick = () => {
  if (!currentItem) return;

  // مرحله ۱: نمایش افزودنی‌ها
  if (modalStep === "details") {
    const addons = getAddonsForItem(currentItem);
    if (addons.length === 0) {
      // بدون افزودنی مستقیم اضافه کن
      notes.push({
        name: currentItem.name,
        price: currentItem.price,
        img: currentItem.images?.[0] || "",
        addon: null,
        addonPrice: 0,
        qty: 1,
      });
      saveNotes();
      closeModal();
      return;
    }
    modalStep = "addons";
    renderAddons();
    mDesc.style.display = "none";
    mPrice.style.display = "none";
    mAddons.classList.add("show");
    mAdd.disabled = true;
    mAdd.classList.remove("added");
    mAdd.textContent = "افزودن به سبد خرید";
    return;
  }

  // مرحله ۲: افزودن نهایی
  if (modalStep === "addons") {
    if (!currentAddon) return;
    notes.push({
      name: currentItem.name + " + " + currentAddon.name,
      price: currentItem.price,
      img: currentItem.images?.[0] || "",
      addon: currentAddon.name,
      addonPrice: currentAddon.price,
      qty: 1,
    });
    saveNotes();
    closeModal();
  }
};

// ---------- سبد خرید ----------
const cartFab = document.getElementById("cartFab");
const cartOverlay = document.getElementById("cartOverlay");
const cartList = document.getElementById("cartList");
const cartTotalEl = document.getElementById("cartTotal");
const fabCount = document.getElementById("fabCount");
const checkoutBtn = document.getElementById("checkoutBtn");

function updateNotesCount() {
  const total = notes.reduce((s, n) => s + (n.qty || 1), 0);
  notesCount.textContent = total;
}

function saveNotes() {
  localStorage.setItem("cafeNotes", JSON.stringify(notes));
  updateNotesCount();
  updateFabCount();
}

function updateFabCount() {
  const total = notes.reduce((s, n) => s + (n.qty || 1), 0);
  fabCount.textContent = total;
}

function renderCart() {
  cartList.innerHTML = "";
  if (notes.length === 0) {
    cartList.innerHTML =
      '<div class="cart-empty">هنوز چیزی اضافه نکرده‌اید</div>';
    cartTotalEl.innerHTML = formatPrice(0);
    checkoutBtn.disabled = true;
    return;
  }
  checkoutBtn.disabled = false;
  let total = 0;
  notes.forEach((n, i) => {
    const qty = n.qty || 1;
    const base = Number(n.price) || 0;
    const addon = Number(n.addonPrice) || 0;
    total += (base + addon) * qty;

    const priceDisplay = n.addonPrice
      ? `${formatPrice(base)} + ${formatPrice(addon)}`
      : formatPrice(base);

    const row = document.createElement("div");
    row.className = "cart-row";
    row.innerHTML = `
      <img src="${n.img}" alt="${n.name}">
      <div class="cart-info">
        <div class="name">${n.name}</div>
        <div class="price">${priceDisplay}</div>
      </div>
      <div class="qty-ctrl">
        <button data-act="dec" data-i="${i}">−</button>
        <span>${qty}</span>
        <button data-act="inc" data-i="${i}">+</button>
      </div>`;
    cartList.appendChild(row);
  });
  cartTotalEl.innerHTML = formatPrice(total);
}

cartList.onclick = (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const i = +btn.dataset.i;
  if (btn.dataset.act === "inc") {
    notes[i].qty = (notes[i].qty || 1) + 1;
  } else {
    notes[i].qty = (notes[i].qty || 1) - 1;
    if (notes[i].qty <= 0) notes.splice(i, 1);
  }
  saveNotes();
  renderCart();
};

cartFab.onclick = () => {
  renderCart();
  cartOverlay.classList.add("open");
};
cartOverlay.onclick = (e) => {
  if (e.target === cartOverlay) cartOverlay.classList.remove("open");
};
checkoutBtn.onclick = () => {
  if (notes.length === 0) return;
  alert("سفارش شما ثبت شد! ممنون از خریدتان 🌸");
  notes = [];
  saveNotes();
  renderCart();
  cartOverlay.classList.remove("open");
};

updateNotesCount();
updateFabCount();

// لودینگ و بارگذاری اولیه
window.addEventListener("load", () => {
  const loader = document.getElementById("loader");
  loadData().finally(() => {
    setTimeout(() => {
      loader.classList.add("hide");
      setTimeout(() => loader.remove(), 600);
    }, 1000);
  });
});
