// ito ay para sa pag toggle ng form view at history panel
function toggleFormView(showForm) {
  if (window.innerWidth <= 768) {
    // Existing mobile behavior (HUWAG BAGUHIN)
    document.getElementById("history_panel").style.display = showForm
      ? "none"
      : "block";

    document.getElementById("form_panel").style.display = showForm
      ? "block"
      : "none";

    document.getElementById("app_navigation").style.display = showForm
      ? "none"
      : "flex";

    return;
  }

  const form = document.getElementById("form_panel");
  const overlay = document.getElementById("form_overlay");

  if (showForm) {
    overlay.style.display = "block";
    form.style.display = "block";

    requestAnimationFrame(() => {
      form.classList.add("show");
      overlay.classList.add("show");
    });
  } else {
    form.classList.remove("show");
    overlay.classList.remove("show");

    setTimeout(() => {
      form.style.display = "none";
      overlay.style.display = "none";
    }, 300);
  }
}

// Store all selected images in one list.
const selectedFiles = [];
function showSelectedImage(input) {
  for (const file of input.files) {
    if (file.type.startsWith("image/") && !selectedFiles.includes(file)) {
      selectedFiles.push(file);
    }
  }

  renderSelectedImages();
  input.value = "";
}

function renderSelectedImages() {
  const fileNames = document.getElementById("selected_attachment");
  const previewArea = document.getElementById("attachment_preview");

  // Rebuild the preview area so every selected image remains visible.
  previewArea.innerHTML = "";
  fileNames.textContent =
    selectedFiles.length === 0
      ? ""
      : `${selectedFiles.length} image${selectedFiles.length === 1 ? "" : "s"} selected`;
  previewArea.style.display = selectedFiles.length ? "flex" : "none";

  // ito yong pag Create ng preview for every selected image.
  for (const file of selectedFiles) {
    const previewWrapper = document.createElement("div");
    previewWrapper.className = "image_preview_wrapper";

    const image = document.createElement("img");
    image.src = URL.createObjectURL(file);
    image.alt = file.name;
    image.title = file.name;
    image.className = "image_preview";

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.textContent = "x";
    removeButton.setAttribute("aria-label", `Remove ${file.name}`);
    removeButton.title = "Remove image";
    removeButton.className = "remove_image_button";
    removeButton.onclick = () => removeSelectedImage(file);

    previewWrapper.appendChild(image);
    previewWrapper.appendChild(removeButton);
    previewArea.appendChild(previewWrapper);
  }
}

function removeSelectedImage(fileToRemove) {
  const fileIndex = selectedFiles.indexOf(fileToRemove);
  if (fileIndex !== -1) {
    selectedFiles.splice(fileIndex, 1);
  }

  renderSelectedImages();
}









//dito mo na eh edit ang sa backend kailangan ma kuha ang data sa database sa ngayon kasi sample data la
// 1. MOCK DATA STRUCTURE
const mockReports = {
  rep_000001: {
    id: "000001",
    status: "Resolved",
    category: "Electrical and Streetlight",
    location: "Brgy. Amatong purok Pag-asa", // <<< IDINAGDAG ANG LOCATION FIELD
    description:
      "Streetlight malfunction on Damage Road, Brgy. Amatong. dfdsfdfdfdfsdfdsfdfdsfdsfdfdsfsfsdfdf dfdfdsfsdfdfsdf  dtgfgggfg fgfgfdg gdfgfdg g sg sgsg sg sgfgfgdf gdf gdfg fg f gfg gf gg fg fdg sdfg",
    timeline: {
      submitted: "April 12, 2026 - 02:45 PM",
      ongoing: "April 13, 2026 - 11:40 AM",
      resolved: "April 13, 2026 - 02:15 PM",
    },
    attachments: [],
  },
};

// Helper function update (may fallback location na rin)
function getReportData(docId) {
  return (
    mockReports[docId] || {
      id: docId.replace("rep_", ""),
      status: "Received",
      category: "General Concern",
      location: "N/A",
      description: "No description available.",
      timeline: {},
      attachments: [],
    }
  );
}

/* ==========================================================================
   2. HISTORY CARDS DYNAMIC BADGE UPDATE
   ========================================================================== */

// Function para i-sync ang kulay ng Status Badge sa lahat ng History Cards sa HTML
function renderHistoryCards() {
  const cards = document.querySelectorAll(".data_card[data-fb-document]");

  cards.forEach((card) => {
    const docId = card.getAttribute("data-fb-document");
    const report = getReportData(docId);

    if (report) {
      // 1. Category
      const titleElem = card.querySelector(".card_category");
      if (titleElem) titleElem.textContent = report.category;

      // 2. Location (IDINAGDAG)
      const locElem = card.querySelector(".card_location");
      if (locElem) locElem.textContent = ` ${report.location || "N/A"}`;

      // 3. Description
      const descElem = card.querySelector(".card_desc");
      if (descElem) descElem.textContent = report.description;

      // 4. Date
      const dateElem = card.querySelector(".card_date");
      if (dateElem) {
        const dateOnly = report.timeline.submitted
          ? report.timeline.submitted.split(" - ")[0]
          : "N/A";
        dateElem.textContent = `Date: ${dateOnly}`;
      }

      // 5. Status Badge Text & Color
      const badge = card.querySelector(".badge");
      if (badge) {
        badge.textContent = report.status;
        badge.classList.remove(
          "badge_received",
          "badge_ongoing",
          "badge_resolved",
        );

        const statusLower = report.status.toLowerCase();
        if (statusLower === "ongoing") {
          badge.classList.add("badge_ongoing");
        } else if (statusLower === "resolved") {
          badge.classList.add("badge_resolved");
        } else {
          badge.classList.add("badge_received");
        }
      }
    }
  });
}

// automatik papatularin ang renderHistoryCards sa pagbukas ng page
document.addEventListener("DOMContentLoaded", () => {
  renderHistoryCards();
});

/* ==========================================================================
   3. DETAILS MODAL & TIMELINE LOGIC
   ========================================================================== */

// Buksan ang Details Modal
function openDetailsModal(docId) {
  currentActiveDocId = docId;

  const report = getReportData(docId);
  const modal = document.getElementById("details_panel");
  modal.setAttribute("data-fb-document", docId);

  // I-populate ang basic text details
  document.getElementById("detail_report_id").textContent = report.id;
  document.getElementById("detail_category").textContent = report.category;
  document.getElementById("detail_description").textContent =
    report.description;
  document.getElementById("edit_description_input").value = report.description;

  // Dynamic Status Badge Color Update sa loob ng Modal
  updateStatusBadgeUI(report.status);

  // Dynamic Timeline UI Update
  updateTimelineUI(report.status, report.timeline);

  toggleEditDescription(false);

  // Ipakita ang overlay at modal
  const overlay = document.getElementById("form_overlay");
  modal.style.display = "block";
  overlay.style.display = "block";

  setTimeout(() => {
    modal.classList.add("show");
    overlay.classList.add("show");
  }, 10);
}

// Function para sa Status Badge ng Modal
function updateStatusBadgeUI(status) {
  const badge = document.getElementById("detail_status");
  if (!badge) return;

  badge.textContent = status;
  badge.classList.remove("badge_received", "badge_ongoing", "badge_resolved");

  const lowerStatus = status.toLowerCase();
  if (lowerStatus === "ongoing") {
    badge.classList.add("badge_ongoing");
  } else if (lowerStatus === "resolved") {
    badge.classList.add("badge_resolved");
  } else {
    badge.classList.add("badge_received");
  }
}

// Function para sa Dynamic Timeline Update
function updateTimelineUI(status, timelineData = {}) {
  const timelineItems = document.querySelectorAll(".timeline_item");
  let currentStep = 1;

  if (status.toLowerCase() === "ongoing") {
    currentStep = 2;
  } else if (status.toLowerCase() === "resolved") {
    currentStep = 3;
  }

  timelineItems.forEach((item, index) => {
    const stepNumber = index + 1;

    item.classList.remove("step_1", "step_2", "step_3");
    item.classList.add(`step_${stepNumber}`);

    if (stepNumber <= currentStep) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  document.getElementById("time_submitted").textContent =
    timelineData.submitted || "N/A";
  document.getElementById("time_ongoing").textContent =
    currentStep >= 2 ? timelineData.ongoing || "In Progress" : "Pending...";
  document.getElementById("time_resolved").textContent =
    currentStep >= 3 ? timelineData.resolved || "Finished" : "Pending...";
}

function closeAllModals() {
  const form = document.getElementById("form_panel");
  const details = document.getElementById("details_panel");
  const overlay = document.getElementById("form_overlay");

  form.classList.remove("show");
  details.classList.remove("show");
  overlay.classList.remove("show");

  setTimeout(() => {
    form.style.display = "none";
    details.style.display = "none";
    overlay.style.display = "none";
  }, 300);
}
function closeDetailsModal() {
  const modal = document.getElementById("details_panel");
  const overlay = document.getElementById("form_overlay");

  modal.classList.remove("show");
  overlay.classList.remove("show");

  setTimeout(() => {
    modal.style.display = "none";
    overlay.style.display = "none";
  }, 300);
}

// Toggle para sa Edit/Save ng Description
function toggleEditDescription(isEditing) {
  const descText = document.getElementById("detail_description");
  const descInput = document.getElementById("edit_description_input");
  const btnEdit = document.getElementById("btn_edit_desc");
  const btnSave = document.getElementById("btn_save_desc");

  if (isEditing) {
    descText.style.display = "none";
    descInput.style.display = "block";
    descInput.focus();
    btnEdit.disabled = true;
    btnSave.disabled = false;
  } else {
    descText.style.display = "block";
    descInput.style.display = "none";
    btnEdit.disabled = false;
    btnSave.disabled = true;
  }
}

// I-save ang na-edit na description (Backend-ready)
function saveDescription() {
  const updatedDescription = document.getElementById(
    "edit_description_input",
  ).value;
  document.getElementById("detail_description").textContent =
    updatedDescription;

  if (currentActiveDocId && mockReports[currentActiveDocId]) {
    mockReports[currentActiveDocId].description = updatedDescription;
  }

  // DITO MO ILALAGAY ANG BACKEND API / FIRESTORE UPDATE CALL SA HINAHARAP:
  // Example: db.collection('reports').doc(currentActiveDocId).update({ description: updatedDescription });
  console.log(
    `[Backend Ready] Updated Document ${currentActiveDocId}:`,
    updatedDescription,
  );

  toggleEditDescription(false);
}
