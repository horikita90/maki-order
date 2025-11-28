// ===========================
// 商品リスト
// ===========================
const products = [
  { name: "丹後巻", price: 880, image: "tango.jpg" },
  { name: "穴子巻", price: 1080, image: "anago.jpg" },
  { name: "牛しぐれ巻（ハーフ）", price: 780, image: "ushigure.jpg" },
  { name: "【冷凍】郷土料理 丹後のばらずし", price: 969, image: "barazushi.jpg" },
  { name: "【冷凍】自然なおいしさ 焼鯖すし", price: 1166, image: "yakisaba.jpg" },
  { name: "だし巻き丹後（ハーフ）", price: 580, image: "dashimaki.jpg" },
  { name: "鰻巻", price: 1380, image: "unagi.jpg" },
  { name: "サーモン巻（ハーフ）", price: 740, image: "salmon.jpg" },
  { name: "【冷凍】丹後のばらずし かに入り", price: 1058, image: "kani.jpg" }
];

// ===========================
// 要素取得
// ===========================
const productList = document.getElementById("productList");
const totalPriceEl = document.getElementById("totalPrice");
const form = document.getElementById("orderForm");
const tableBody = document.querySelector("#orderTable tbody");

// ===========================
// 商品カード生成（画像パス修正版）
// ===========================
products.forEach((p, i) => {
  const card = document.createElement("div");
  card.className = "product-card";
  card.innerHTML = `
    <img src="sushi/images/${p.image}" alt="${p.name}">
    <label>${p.name}</label>
    <p>${p.price}円</p>
    <input type="number" min="0" value="0" data-index="${i}" class="qty-input">
  `;
  productList.appendChild(card);
});

// ===========================
// 合計金額更新
// ===========================
function updateTotal() {
  let total = 0;
  document.querySelectorAll(".qty-input").forEach(input => {
    const index = input.dataset.index;
    const qty = parseInt(input.value) || 0;
    total += qty * products[index].price;
  });
  totalPriceEl.textContent = `合計金額：${total.toLocaleString()}円`;
}
document.querySelectorAll(".qty-input").forEach(input =>
  input.addEventListener("input", updateTotal)
);

// ===========================
// 希望受け取り時間の制限（平日限定、12:00～18:00、30分刻み）
// ===========================
function setPickupTimeConstraints() {
  const pickupInput = document.getElementById("pickupTime");
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const todayStr = `${year}-${month}-${day}`;

  pickupInput.min = `${todayStr}T12:00`;

  pickupInput.addEventListener("input", () => {
    if (!pickupInput.value) return;

    const [date, time] = pickupInput.value.split("T");
    const [yyyy, mm, dd] = date.split("-").map(Number);
    let [hh, min] = time.split(":").map(Number);

    const selectedDate = new Date(yyyy, mm - 1, dd);
    const dayOfWeek = selectedDate.getDay(); // 0=日曜,6=土曜

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      alert("受け取りは月曜日～金曜日のみ可能です。");
      pickupInput.value = "";
      return;
    }

    if (hh < 12) hh = 12;
    if (hh > 18) hh = 18;

    min = min < 15 ? 0 : min < 45 ? 30 : 0;
    if (hh === 18 && min > 0) min = 0;

    pickupInput.value = `${date}T${String(hh).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  });
}
setPickupTimeConstraints();

// ===========================
// 発注履歴を localStorage から読み込む
// ===========================
function loadOrders() {
  const orders = JSON.parse(localStorage.getItem("orders")) || [];
  tableBody.innerHTML = "";

  orders.forEach((o, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${o.customerName}</td>
      <td>${o.className}</td>
      <td>${formatDateTimeNoYear(o.pickupTime)}</td>
      <td>${o.details.replace(/\n/g, "<br>")}</td>
      <td>${o.total.toLocaleString()}円</td>
      <td>${o.time}</td>
      <td><button data-index="${i}" class="cancel-btn">キャンセル</button></td>
    `;
    tableBody.appendChild(tr);
  });

  document.querySelectorAll(".cancel-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      const i = e.target.dataset.index;
      const orders = JSON.parse(localStorage.getItem("orders")) || [];
      orders.splice(i, 1);
      localStorage.setItem("orders", JSON.stringify(orders));
      loadOrders();
    });
  });
}

// ===========================
// 日付・時間を見やすく表示（年省略）
// ===========================
function formatDateTimeNoYear(dtStr) {
  const d = new Date(dtStr);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${m}月${day}日 ${hh}時${mm}分`;
}

// ===========================
// フォーム送信処理（localStorage版）
// ===========================
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const customerName = document.getElementById("customerName").value;
  const className = document.getElementById("classSelect").value;
  const pickupTime = document.getElementById("pickupTime").value;

  if (!pickupTime) {
    alert("希望受け取り時間を正しく選択してください（平日12:00～18:00）。");
    return;
  }

  let total = 0;
  let details = "";

  document.querySelectorAll(".qty-input").forEach(input => {
    const index = input.dataset.index;
    const qty = parseInt(input.value) || 0;
    if (qty > 0) {
      const item = products[index];
      details += `${item.name} × ${qty}個\n`;
      total += item.price * qty;
    }
  });

  if (total === 0) {
    alert("商品を1つ以上選択してください。");
    return;
  }

  const orders = JSON.parse(localStorage.getItem("orders")) || [];
  orders.push({
    customerName,
    className,
    pickupTime,
    details,
    total,
    time: new Date().toLocaleString()
  });
  localStorage.setItem("orders", JSON.stringify(orders));

  form.reset();
  updateTotal();
  setPickupTimeConstraints();
  loadOrders();
});

// ===========================
// 初期化
// ===========================
updateTotal();
loadOrders();
