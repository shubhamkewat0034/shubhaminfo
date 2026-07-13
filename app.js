// ==================== LANGUAGE SETUP ====================
document.addEventListener("DOMContentLoaded", () => {
  const savedLang = localStorage.getItem("shubhaminfo_lang") || "en";
  applyLanguage(savedLang);
});

document.getElementById("langToggleBtn").addEventListener("click", () => {
  applyLanguage(currentLang === "en" ? "hi" : "en");
});

// ==================== IMAGE COMPRESSION ====================
// Compresses an image file down using canvas, targeting under maxKB.
// Returns a Promise<Blob>.
function compressImage(file, maxWidth = 1000, maxKB = 300) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => { img.src = e.target.result; };
    reader.onerror = reject;
    reader.readAsDataURL(file);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      let quality = 0.8;

      const tryCompress = () => {
        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error("Compression failed"));
          if (blob.size / 1024 <= maxKB || quality <= 0.3) {
            resolve(blob);
          } else {
            quality -= 0.1;
            tryCompress();
          }
        }, "image/jpeg", quality);
      };
      tryCompress();
    };
    img.onerror = reject;
  });
}

// Show live size info under each file input after compression preview
document.querySelectorAll(".fileInput").forEach((input) => {
  input.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    const infoEl = input.closest("div").querySelector(".sizeInfo");
    if (!file) { infoEl.textContent = ""; return; }
    infoEl.textContent = "Compressing...";
    try {
      const compressed = await compressImage(file);
      infoEl.textContent = `Original: ${(file.size/1024).toFixed(0)} KB -> Compressed: ${(compressed.size/1024).toFixed(0)} KB`;
      input._compressedBlob = compressed;
    } catch (err) {
      infoEl.textContent = "Could not preview compression, will compress on submit.";
    }
  });
});

// ==================== FORM SUBMISSION ====================
const form = document.getElementById("admissionForm");
const submitBtn = document.getElementById("submitBtn");
const formMessage = document.getElementById("formMessage");

function showMessage(text, type = "error") {
  formMessage.textContent = text;
  formMessage.className = `text-sm rounded-lg px-3 py-2.5 ${
    type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"
  }`;
  formMessage.classList.remove("hidden");
  formMessage.scrollIntoView({ behavior: "smooth", block: "center" });
}

async function uploadFile(mobile, label, inputEl) {
  const file = inputEl.files[0];
  if (!file) return null;
  const blob = inputEl._compressedBlob || await compressImage(file);
  const path = `${mobile}/${label}_${Date.now()}.jpg`;
  const { error } = await supabaseClient.storage.from("documents").upload(path, blob, {
    contentType: "image/jpeg",
  });
  if (error) throw error;
  return path; // store path; admin panel will generate signed URLs for viewing
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  formMessage.classList.add("hidden");

  const t = translations[currentLang];
  const name = document.getElementById("fieldName").value.trim();
  const mobile = document.getElementById("fieldMobile").value.trim();
  const bankAcc = document.getElementById("fieldBankAcc").value.trim();
  const ifsc = document.getElementById("fieldIfsc").value.trim().toUpperCase();

  if (!name || !/^[0-9]{10}$/.test(mobile) || !bankAcc || !ifsc) {
    showMessage(t.errorRequired);
    return;
  }

  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
    showMessage(t.errorIfsc);
    return;
  }

  const fileInputs = {
    aadhar_url: document.getElementById("fieldAadhar"),
    pan_url: document.getElementById("fieldPan"),
    passbook_url: document.getElementById("fieldPassbook"),
    passport_photo_url: document.getElementById("fieldPassport"),
    signature_url: document.getElementById("fieldSignature"),
  };
  for (const key in fileInputs) {
    if (!fileInputs[key].files[0]) {
      showMessage(t.errorRequired);
      return;
    }
  }

  submitBtn.disabled = true;
  submitBtn.textContent = t.submitting;

  try {
    // Check for duplicate mobile number first
    const { data: existing, error: checkErr } = await supabaseClient
      .from("submissions")
      .select("id")
      .eq("mobile_no", mobile)
      .maybeSingle();

    if (checkErr) throw checkErr;
    if (existing) {
      showMessage(t.errorDuplicate);
      submitBtn.disabled = false;
      submitBtn.textContent = t.submit;
      return;
    }

    // Upload all files (compressed) in parallel
    const uploadResults = {};
    const uploadPromises = Object.entries(fileInputs).map(async ([key, input]) => {
      uploadResults[key] = await uploadFile(mobile, key.replace("_url", ""), input);
    });
    await Promise.all(uploadPromises);

    // Insert record
    const { error: insertErr } = await supabaseClient.from("submissions").insert({
      name,
      mobile_no: mobile,
      bank_acc_no: bankAcc,
      ifsc_code: ifsc,
      ...uploadResults,
    });

    if (insertErr) {
      if (insertErr.code === "23505") {
        showMessage(t.errorDuplicate);
      } else {
        throw insertErr;
      }
      submitBtn.disabled = false;
      submitBtn.textContent = t.submit;
      return;
    }

    form.reset();
    document.querySelectorAll(".sizeInfo").forEach(el => el.textContent = "");
    showMessage(t.successMsg, "success");
    submitBtn.textContent = t.submit;

  } catch (err) {
    console.error(err);
    const msg = (err && err.message) ? err.message.toLowerCase() : "";
    if (msg.includes("row-level security") || msg.includes("policy")) {
      showMessage(translations[currentLang].errorUpload);
    } else {
      showMessage(translations[currentLang].errorGeneric);
    }
    submitBtn.textContent = translations[currentLang].submit;
  } finally {
    submitBtn.disabled = false;
  }
});