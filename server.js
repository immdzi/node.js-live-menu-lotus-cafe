// تولید بندانگشتی و برگرداندن نام فایل
async function generateThumbnail(file) {
  const thumbFilename = "thumb-" + file.filename;
  const thumbPath = path.join(THUMBS_DIR, thumbFilename);

  try {
    await sharp(file.path)
      .resize({
        width: 250,
        height: 250,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 70 })
      .toFile(thumbPath);

    return thumbFilename;
  } catch (err) {
    console.error("خطا در تولید بندانگشتی:", file.filename, err.message);
    // در صورت شکست، بندانگشتی وجود نخواهد داشت (بعداً می‌توانیم آدرس اصلی را برگردانیم)
    return null;
  }
}

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const sharp = require("sharp");

const UPLOADS_DIR = path.join(__dirname, "public", "uploads");
const THUMBS_DIR = path.join(UPLOADS_DIR, "thumbnails");

// ایجاد پوشه‌های لازم
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(THUMBS_DIR)) fs.mkdirSync(THUMBS_DIR, { recursive: true });

const app = express();
const PORT = 3000;
const JWT_SECRET = "lotus-cafe-secret-key-change-me";

app.use(cors());
app.use(express.json());

// سرو فایل‌های استاتیک از پوشه public
app.use(express.static(path.join(__dirname, "public")));

// آپلود عکس در پوشه public/uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "public", "uploads");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// تابع کمکی برای خواندن و نوشتن data.json
const DATA_FILE = path.join(__dirname, "data.json");
function readData() {
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}
function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// ---------- احراز هویت ----------
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "توکن ارسال نشده" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== "admin") throw new Error();
    next();
  } catch (err) {
    res.status(403).json({ error: "دسترسی غیرمجاز" });
  }
}

app.post("/api/login", (req, res) => {
  const { password } = req.body;
  const data = readData();
  if (password === data.admin.password) {
    const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "24h" });
    res.json({ token });
  } else {
    res.status(401).json({ error: "رمز عبور اشتباه" });
  }
});

// ---------- APIهای عمومی (بدون احراز) ----------
app.get("/api/categories", (req, res) => {
  const data = readData();
  res.json(data.categories);
});

app.get("/api/items", (req, res) => {
  const data = readData();
  res.json(data.items);
});

app.get("/api/addons", (req, res) => {
  const data = readData();
  res.json(data.addonGroups);
});

// ---------- APIهای مدیریت (نیاز به احراز) ----------

// -- دسته‌بندی‌ها --
app.post(
  "/api/categories",
  authMiddleware,
  upload.single("image"),
  async (req, res) => {
    const data = readData();
    const { name, icon } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : "";
    const id = name.toLowerCase().replace(/\s+/g, "-");
    const newCat = { id, name, icon, image };
    data.categories.push(newCat);

    // تولید بندانگشتی اگر فایلی ارسال شده باشد
    if (req.file) {
      await generateThumbnail(req.file);
    }

    writeData(data);
    res.json(newCat);
  },
);

app.put(
  "/api/items/:id",
  authMiddleware,
  upload.array("images", 5),
  async (req, res) => {
    try {
      const data = readData();
      const index = data.items.findIndex((item) => item.id === req.params.id);
      if (index === -1) return res.status(404).json({ error: "آیتم یافت نشد" });

      const item = data.items[index];
      const {
        name,
        desc,
        price,
        categoryId,
        addonGroup,
        orderMin,
        orderMax,
        keepImages,
      } = req.body;

      if (name) item.name = name;
      if (desc) item.desc = desc;
      if (price) item.price = Number(price);
      if (categoryId) item.categoryId = categoryId;
      if (addonGroup !== undefined) item.addonGroup = addonGroup || null;
      if (orderMin !== undefined) item.orderMin = Number(orderMin);
      if (orderMax !== undefined) item.orderMax = Number(orderMax);

      // مدیریت عکس‌های نگه‌داشته‌شده
      let finalImages = item.images || [];
      if (keepImages !== undefined) {
        try {
          finalImages = JSON.parse(keepImages);
        } catch (e) {
          finalImages = [];
        }
        // حذف فایل‌های قدیمی که حذف شدن از لیست
        const oldImages = item.images || [];
        oldImages.forEach((oldImg) => {
          if (!finalImages.includes(oldImg) && oldImg.startsWith("/uploads/")) {
            const filePath = path.join(__dirname, "public", oldImg);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            // حذف بندانگشتی مربوطه هم در صورت وجود
            const thumbName = "thumb-" + path.basename(oldImg);
            const thumbPath = path.join(THUMBS_DIR, thumbName);
            if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
          }
        });
      }

      // افزودن عکس‌های جدید و تولید بندانگشتی
      if (req.files && req.files.length > 0) {
        const newPaths = req.files.map((f) => `/uploads/${f.filename}`);
        finalImages = finalImages.concat(newPaths);
        // تولید بندانگشتی‌ها
        await Promise.all(req.files.map(generateThumbnail));
      }

      item.images = finalImages;
      writeData(data);

      console.log(
        "🔄 update item:",
        req.params.id,
        "keepImages:",
        req.body.keepImages,
        "new files:",
        req.files?.length,
      );
      console.log("📌 final images:", item.images);

      // فقط یک پاسخ
      return res.json(item);
    } catch (err) {
      console.error("خطا در ویرایش آیتم:", err);
      if (!res.headersSent) {
        return res.status(500).json({ error: "خطای داخلی" });
      }
    }
  },
);

app.delete("/api/categories/:id", authMiddleware, (req, res) => {
  const data = readData();
  const index = data.categories.findIndex((c) => c.id === req.params.id);
  if (index === -1)
    return res.status(404).json({ error: "دسته‌بندی یافت نشد" });
  data.categories.splice(index, 1);
  writeData(data);
  res.json({ success: true });
});

// -- آیتم‌ها --
app.post(
  "/api/items",
  authMiddleware,
  upload.array("images", 5),
  async (req, res) => {
    const data = readData();
    const { name, desc, price, categoryId, addonGroup, orderMin, orderMax } =
      req.body;
    const images = req.files
      ? req.files.map((f) => `/uploads/${f.filename}`)
      : [];
    const id = categoryId + "-" + Date.now();
    const newItem = {
      id,
      name,
      desc,
      price: Number(price),
      categoryId,
      images,
      addonGroup: addonGroup || null,
      orderMin: Number(orderMin) || 0,
      orderMax: Number(orderMax) || 0,
    };
    // ساخت بندانگشتی برای فایل‌های جدید
    if (req.files && req.files.length > 0) {
      await Promise.all(req.files.map(generateThumbnail));
    }
    data.items.push(newItem);
    writeData(data);
    res.json(newItem);
  },
);

app.put(
  "/api/items/:id",
  authMiddleware,
  upload.array("images", 5),
  async (req, res) => {
    const data = readData();
    const index = data.items.findIndex((item) => item.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: "آیتم یافت نشد" });

    const item = data.items[index];
    const {
      name,
      desc,
      price,
      categoryId,
      addonGroup,
      orderMin,
      orderMax,
      keepImages,
    } = req.body;

    if (name) item.name = name;
    if (desc) item.desc = desc;
    if (price) item.price = Number(price);
    if (categoryId) item.categoryId = categoryId;
    if (addonGroup !== undefined) item.addonGroup = addonGroup || null;
    if (orderMin !== undefined) item.orderMin = Number(orderMin);
    if (orderMax !== undefined) item.orderMax = Number(orderMax);

    // مدیریت عکس‌ها
    let finalImages = item.images || [];
    if (keepImages !== undefined) {
      // لیست عکس‌هایی که کاربر نگه داشته (JSON string)
      try {
        finalImages = JSON.parse(keepImages);
      } catch (e) {
        finalImages = [];
      }
      // حذف فایل‌های قدیمی که در لیست جدید نیستند (فقط فایل‌های محلی)
      const oldImages = item.images || [];
      oldImages.forEach((oldImg) => {
        if (!finalImages.includes(oldImg) && oldImg.startsWith("/uploads/")) {
          const filePath = path.join(__dirname, "public", oldImg);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
      });
    }

    // افزودن عکس‌های جدید آپلودشده
    if (req.files && req.files.length > 0) {
      const newPaths = req.files.map((f) => `/uploads/${f.filename}`);
      finalImages = finalImages.concat(newPaths);
    }
    if (req.files && req.files.length > 0) {
      await Promise.all(req.files.map(generateThumbnail));
    }

    item.images = finalImages;
    writeData(data);
    console.log(
      "🔄 update item:",
      req.params.id,
      "keepImages:",
      req.body.keepImages,
      "new files:",
      req.files?.length,
    );
    console.log("📌 final images:", item.images);
    res.json(item);
    res.json(item);
  },
);

app.delete("/api/items/:id", authMiddleware, (req, res) => {
  const data = readData();
  const index = data.items.findIndex((item) => item.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "آیتم یافت نشد" });
  data.items.splice(index, 1);
  writeData(data);
  res.json({ success: true });
});

// -- افزودنی‌ها --
app.put("/api/addons/:group", authMiddleware, (req, res) => {
  const { group } = req.params;
  const { addons } = req.body; // آرایه‌ای از { name, price, image }
  const data = readData();
  if (!data.addonGroups[group])
    return res.status(404).json({ error: "گروه افزودنی نامعتبر" });
  data.addonGroups[group] = addons;
  writeData(data);
  res.json(data.addonGroups[group]);
});

// ---------- مدیریت رسانه‌ها ----------

// لیست تمام فایل‌های موجود
app.get("/api/media", authMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    // خواندن همه فایل‌ها از پوشه uploads (به‌جز thumbnails)
    const allFiles = fs
      .readdirSync(UPLOADS_DIR)
      .filter((file) => {
        const fullPath = path.join(UPLOADS_DIR, file);
        return fs.statSync(fullPath).isFile() && !file.startsWith("thumb-");
      })
      .map((file) => {
        const stats = fs.statSync(path.join(UPLOADS_DIR, file));
        const thumbFilename = "thumb-" + file;
        const thumbPath = path.join(THUMBS_DIR, thumbFilename);
        const thumbnailUrl = fs.existsSync(thumbPath)
          ? `/uploads/thumbnails/${thumbFilename}`
          : `/uploads/${file}`; // اگر بندانگشتی وجود نداشت، اصل برگردانده شود

        return {
          filename: file,
          url: `/uploads/${file}`,
          thumbnailUrl,
          size: stats.size,
          uploadedAt: stats.mtime,
        };
      })
      .sort((a, b) => b.uploadedAt - a.uploadedAt); // جدیدترین اول

    const total = allFiles.length;
    const files = allFiles.slice(offset, offset + limit);

    res.json({ files, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطا در خواندن فایل‌ها" });
  }
});

// حذف یک فایل
app.delete("/api/media/:filename", authMiddleware, (req, res) => {
  const filePath = path.join(UPLOADS_DIR, req.params.filename);
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "فایل پیدا نشد" });
    }
  } catch (err) {
    res.status(500).json({ error: "خطا در حذف فایل" });
  }
});

// آپلود مستقیم فایل به کتابخانه (بدون ایجاد آیتم)
app.post(
  "/api/media/upload",
  authMiddleware,
  upload.array("images", 10),
  async (req, res) => {
    const files = req.files.map((f) => ({
      filename: f.filename,
      url: `/uploads/${f.filename}`,
    }));

    // تولید بندانگشتی برای فایل‌های جدید
    if (req.files && req.files.length > 0) {
      await Promise.all(req.files.map(generateThumbnail));
    }

    res.json({ files });
  },
);

app.post("/api/media/generate-thumbnails", authMiddleware, async (req, res) => {
  try {
    const files = fs
      .readdirSync(UPLOADS_DIR)
      .filter(
        (f) =>
          !f.startsWith("thumb-") &&
          fs.statSync(path.join(UPLOADS_DIR, f)).isFile(),
      );
    let count = 0;
    for (const file of files) {
      const thumbFilename = "thumb-" + file;
      const thumbPath = path.join(THUMBS_DIR, thumbFilename);
      if (!fs.existsSync(thumbPath)) {
        await sharp(path.join(UPLOADS_DIR, file))
          .resize({ width: 250, height: 250, fit: "inside" })
          .jpeg({ quality: 70 })
          .toFile(thumbPath);
        count++;
      }
    }
    res.json({ generated: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// شروع سرور
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
