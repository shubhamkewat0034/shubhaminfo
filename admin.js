const PAGE_SIZE = 10;
let currentPage = 1;
let currentSearch = "";
let currentSort = "created_desc";

const loginScreen = document.getElementById("loginScreen");
const dashboardScreen = document.getElementById("dashboardScreen");

// ==================== AUTH ====================
async function checkAuth() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    loginScreen.classList.add("hidden");
    dashboardScreen.classList.remove("hidden");
    loadData();
    loadTotalCount();
  } else {
    loginScreen.classList.remove("hidden");
    dashboardScreen.classList.add("hidden");
  }
}

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const errorBox = document.getElementById("loginError");
  const loginBtn = document.getElementById("loginBtn");

  errorBox.classList.add("hidden");
  loginBtn.disabled = true;
  loginBtn.textContent = "Logging in...";

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

  loginBtn.disabled = false;
  loginBtn.textContent = "Login";

  if (error) {
    errorBox.textContent = "Invalid email or password.";
    errorBox.classList.remove("hidden");
    return;
  }
  checkAuth();
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  checkAuth();
});

// ==================== DATA LOADING ====================
async function loadData() {
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabaseClient.from("submissions").select("*", { count: "exact" });

  if (currentSearch) {
    query = query.or(`name.ilike.%${currentSearch}%,mobile_no.ilike.%${currentSearch}%`);
  }

  const sortMap = {
    created_desc: { col: "created_at", asc: false },
    created_asc: { col: "created_at", asc: true },
    name_asc: { col: "name", asc: true },
    name_desc: { col: "name", asc: false },
  };
  const sort = sortMap[currentSort];
  query = query.order(sort.col, { ascending: sort.asc }).range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error(error);
    return;
  }

  renderTable(data);
  renderPagination(count);
  document.getElementById("resultCount").textContent = `${count} record(s) found`;
}

function renderTable(rows) {
  const tbody = document.getElementById("tableBody");
  const emptyState = document.getElementById("emptyState");
  tbody.innerHTML = "";

  if (!rows || rows.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }
  emptyState.classList.add("hidden");

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.className = "border-t border-slate-100 hover:bg-slate-50";
    tr.innerHTML = `
      <td class="px-4 py-3 font-medium text-slate-800">${escapeHtml(row.name)}</td>
      <td class="px-4 py-3">${escapeHtml(row.mobile_no)}</td>
      <td class="px-4 py-3">${escapeHtml(row.bank_acc_no)}</td>
      <td class="px-4 py-3">${escapeHtml(row.ifsc_code)}</td>
      <td class="px-4 py-3">
        <button class="viewDocsBtn text-blue-600 hover:underline font-medium" data-id="${row.id}">View Documents</button>
      </td>
      <td class="px-4 py-3 text-slate-500">${new Date(row.created_at).toLocaleDateString("en-IN")}</td>
      <td class="px-4 py-3">
        <button class="deleteBtn text-red-600 hover:underline font-medium">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
    tr.querySelector(".viewDocsBtn").addEventListener("click", () => openDocModal(row));
    tr.querySelector(".deleteBtn").addEventListener("click", () => deleteSubmission(row));
  });
}

function escapeHtml(str) {
  if (str == null) return "";
  return String(str).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}

// ==================== DELETE (with type-to-confirm) ====================
const deleteModal = document.getElementById("deleteModal");
const deleteConfirmInput = document.getElementById("deleteConfirmInput");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
let pendingDeleteRow = null;

function deleteSubmission(row) {
  pendingDeleteRow = row;
  document.getElementById("deleteTargetName").textContent = row.name;
  document.getElementById("deleteTargetNameRepeat").textContent = row.name;
  deleteConfirmInput.value = "";
  confirmDeleteBtn.disabled = true;
  deleteModal.classList.remove("hidden");
  deleteConfirmInput.focus();
}

deleteConfirmInput.addEventListener("input", () => {
  confirmDeleteBtn.disabled = deleteConfirmInput.value.trim() !== pendingDeleteRow?.name.trim();
});

document.getElementById("cancelDeleteBtn").addEventListener("click", () => {
  deleteModal.classList.add("hidden");
  pendingDeleteRow = null;
});

confirmDeleteBtn.addEventListener("click", async () => {
  if (!pendingDeleteRow) return;
  const row = pendingDeleteRow;
  confirmDeleteBtn.disabled = true;
  confirmDeleteBtn.textContent = "Deleting...";

  const paths = DOC_FIELDS.map((f) => row[f.key]).filter(Boolean);

  if (paths.length) {
    const { error: storageError } = await supabaseClient.storage.from("documents").remove(paths);
    if (storageError) {
      console.error(storageError);
      alert("Could not delete documents. Please check permissions and try again.");
      confirmDeleteBtn.textContent = "Delete Permanently";
      return;
    }
  }

  const { error: dbError } = await supabaseClient.from("submissions").delete().eq("id", row.id);
  confirmDeleteBtn.textContent = "Delete Permanently";

  if (dbError) {
    console.error(dbError);
    alert("Documents were deleted but the record could not be removed. Please try again.");
    return;
  }

  deleteModal.classList.add("hidden");
  pendingDeleteRow = null;
  loadData();
  loadTotalCount();
});

// ==================== TOTAL COUNT ====================
async function loadTotalCount() {
  const { count } = await supabaseClient.from("submissions").select("*", { count: "exact", head: true });
  document.getElementById("totalCount").textContent = `Total staff registered: ${count ?? 0}`;
}

// ==================== PAGINATION ====================
function renderPagination(totalCount) {
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const container = document.getElementById("pagination");
  container.innerHTML = "";

  const makeBtn = (label, page, disabled = false, active = false) => {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.disabled = disabled;
    btn.className = `px-3 py-1.5 rounded-lg text-sm border ${
      active ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
    } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`;
    btn.addEventListener("click", () => { currentPage = page; loadData(); });
    return btn;
  };

  container.appendChild(makeBtn("Prev", currentPage - 1, currentPage <= 1));

  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, start + 4);
  for (let p = start; p <= end; p++) {
    container.appendChild(makeBtn(String(p), p, false, p === currentPage));
  }

  container.appendChild(makeBtn("Next", currentPage + 1, currentPage >= totalPages));
}

// ==================== SEARCH & SORT ====================
let searchDebounce;
document.getElementById("searchBox").addEventListener("input", (e) => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    currentSearch = e.target.value.trim();
    currentPage = 1;
    loadData();
  }, 350);
});

document.getElementById("sortSelect").addEventListener("change", (e) => {
  currentSort = e.target.value;
  currentPage = 1;
  loadData();
});

// ==================== DOCUMENT VIEW MODAL ====================
const docModal = document.getElementById("docModal");
const docModalBody = document.getElementById("docModalBody");
const docModalTitle = document.getElementById("docModalTitle");

const DOC_FIELDS = [
  { key: "aadhar_url", label: "Aadhar Card" },
  { key: "pan_url", label: "PAN Card" },
  { key: "passbook_url", label: "Bank Passbook" },
  { key: "passport_photo_url", label: "Passport Photo" },
  { key: "signature_url", label: "Signature" },
];

async function openDocModal(row) {
  docModalTitle.textContent = `${row.name} - Documents`;
  docModalBody.innerHTML = '<p class="col-span-2 text-slate-400 text-sm">Loading documents...</p>';
  docModal.classList.remove("hidden");

  const cards = [];
  for (const field of DOC_FIELDS) {
    const path = row[field.key];
    if (!path) continue;
    const { data, error } = await supabaseClient.storage.from("documents").createSignedUrl(path, 3600);
    if (error || !data) continue;
    const fileName = `${row.name.replace(/\s+/g, "_")}_${field.label.replace(/\s+/g, "_")}.jpg`;
    cards.push(`
      <div class="border border-slate-200 rounded-lg overflow-hidden">
        <img src="${data.signedUrl}" class="w-full h-40 object-cover bg-slate-100" alt="${field.label}">
        <div class="p-2 flex items-center justify-between">
          <span class="text-xs font-medium text-slate-700">${field.label}</span>
          <button class="downloadDocBtn text-xs text-blue-600 hover:underline" data-url="${data.signedUrl}" data-filename="${fileName}">Download</button>
        </div>
      </div>
    `);
  }
  docModalBody.innerHTML = cards.length ? cards.join("") : '<p class="col-span-2 text-slate-400 text-sm">No documents found.</p>';

  docModalBody.querySelectorAll(".downloadDocBtn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const originalText = btn.textContent;
      btn.textContent = "Downloading...";
      try {
        const response = await fetch(btn.dataset.url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = btn.dataset.filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(blobUrl);
      } catch (err) {
        console.error(err);
        alert("Download failed. Please try again.");
      }
      btn.textContent = originalText;
    });
  });
}

document.getElementById("closeDocModal").addEventListener("click", () => docModal.classList.add("hidden"));
docModal.addEventListener("click", (e) => { if (e.target === docModal) docModal.classList.add("hidden"); });

// ==================== EXCEL EXPORT ====================
document.getElementById("exportBtn").addEventListener("click", async () => {
  const exportBtn = document.getElementById("exportBtn");
  exportBtn.disabled = true;
  exportBtn.textContent = "Preparing file...";

  let query = supabaseClient.from("submissions").select("name, mobile_no, bank_acc_no, ifsc_code, created_at");
  if (currentSearch) {
    query = query.or(`name.ilike.%${currentSearch}%,mobile_no.ilike.%${currentSearch}%`);
  }
  const sortMap = {
    created_desc: { col: "created_at", asc: false },
    created_asc: { col: "created_at", asc: true },
    name_asc: { col: "name", asc: true },
    name_desc: { col: "name", asc: false },
  };
  const sort = sortMap[currentSort];
  query = query.order(sort.col, { ascending: sort.asc });

  const { data, error } = await query;
  exportBtn.disabled = false;
  exportBtn.textContent = "Export to Excel";

  if (error || !data) {
    alert("Could not export. Please try again.");
    return;
  }

  const sheetData = data.map((row) => ({
    "Name": row.name,
    "Mobile Number": row.mobile_no,
    "Bank Account Number": row.bank_acc_no,
    "IFSC Code": row.ifsc_code,
    "Submitted On": new Date(row.created_at).toLocaleString("en-IN"),
  }));

  const ws = XLSX.utils.json_to_sheet(sheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Staff Submissions");
  XLSX.writeFile(wb, `shubhaminfo_submissions_${new Date().toISOString().slice(0,10)}.xlsx`);
});

// ==================== INIT ====================
checkAuth();