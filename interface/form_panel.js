// ==========================================================================
// 1. FORM VIEW / HISTORY PANEL TOGGLE
// ==========================================================================

function toggleFormView(showForm) {
  if (window.innerWidth <= 768) {
    document.getElementById("history_panel").style.display = showForm ? "none" : "block";
    document.getElementById("form_panel").style.display = showForm ? "block" : "none";
    document.getElementById("app_navigation").style.display = showForm ? "none" : "flex";

    if (showForm) {
      setTimeout(() => {
        initMap();
        if (map) map.invalidateSize();
      }, 300);
    }
    return;
  }

  const form = document.getElementById("form_panel");
  const overlay = document.getElementById("form_overlay");

  if (!form || !overlay) return;

  if (showForm) {
    overlay.style.display = "block";
    form.style.display = "block";

    requestAnimationFrame(() => {
      form.classList.add("show");
      overlay.classList.add("show");
    });

    // Load at Render ng Mapa kapag lumabas ang Modal Overlay
    setTimeout(() => {
      initMap();
      if (map) map.invalidateSize();
    }, 350);

  } else {
    form.classList.remove("show");
    overlay.classList.remove("show");

    setTimeout(() => {
      form.style.display = "none";
      overlay.style.display = "none";
    }, 300);
  }
}

// ==========================================================================
// 2. SELECTED IMAGE / ATTACHMENT PREVIEW
// ==========================================================================

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

  if (!fileNames || !previewArea) return;
  previewArea.innerHTML = "";
  fileNames.textContent =
    selectedFiles.length === 0
      ? ""
      : `${selectedFiles.length} image${
          selectedFiles.length === 1 ? "" : "s"
        } selected`;

  previewArea.style.display = selectedFiles.length ? "flex" : "none";

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

// ==========================================================================
// 3. MOCK REPORT DATA
// ==========================================================================
// Temporary data.
// Later Firebase data ang papalit dito.
// ==========================================================================

const mockReports = {
  rep_000001: {
    reportID: "000001",
    reportStatus: "Received",
    issueCategory: "Infrastructures",
    barangayArea: "Brgy. Dapawan, Purok 3",
    issueDescription: "A large pothole has developed along the roadside...",
    timestamp: {
      submitted: "April 14, 2026 - 08:10 AM",
      for_verification: "",
      for_referral: "",
      resolved: "",
      not_lgu: "",
    },
    supportingImage: [],
  },
  rep_000002: {
    reportID: "000002",
    reportStatus: "Resolved",
    issueCategory: "Drainage and Flooding",
    barangayArea: "Brgy. Liwanag, Riverside",
    issueDescription: "The drainage canal in the area was clogged...",
    timestamp: {
      submitted: "April 15, 2026 - 01:20 PM",
      for_verification: "April 16, 2026 - 09:00 AM",
      for_referral: "April 16, 2026 - 02:00 PM",
      resolved: "April 17, 2026 - 04:35 PM",
      not_lgu: "",
    },
    supportingImage: [],
  },
  rep_000003: {
    reportID: "000003",
    reportStatus: "For Verification",
    issueCategory: "Garbage Collection",
    barangayArea: "Brgy. Tulay, Public Market",
    issueDescription: "Garbage has accumulated around the public market...",
    timestamp: {
      submitted: "April 18, 2026 - 10:45 AM",
      for_verification: "April 19, 2026 - 08:30 AM",
      for_referral: "",
      resolved: "",
      not_lgu: "",
    },
    supportingImage: [],
  },
  rep_000004: {
    reportID: "000004",
    reportStatus: "For Referral/Referred",
    issueCategory: "Drainage and Flooding",
    barangayArea: "Brgy. Tulay, Public Market",
    issueDescription: "The main drainage canal near the public market is heavily clogged...",
    timestamp: {
      submitted: "April 18, 2026 - 10:45 AM",
      for_verification: "April 19, 2026 - 08:30 AM",
      for_referral: "April 19, 2026 - 01:15 PM",
      resolved: "",
      not_lgu: "",
    },
    supportingImage: [],
  },
  rep_000005: {
    reportID: "000005",
    reportStatus: "Not within LGU Jurisdiction",
    issueCategory: "Public Facilities",
    barangayArea: "Brgy. Poblacion, Highway",
    issueDescription: "Concern regarding national highway maintenance electrical post...",
    timestamp: {
      submitted: "April 20, 2026 - 09:00 AM",
      for_verification: "April 20, 2026 - 10:30 AM",
      for_referral: "",
      resolved: "",
      not_lgu: "April 20, 2026 - 11:00 AM",
    },
    supportingImage: [],
  },
};
// ==========================================================================
// 4. CURRENT ACTIVE REPORT
// ==========================================================================

let currentActiveDocId = null;
// ==========================================================================
// 5. GET REPORT DATA
// ==========================================================================

function getReportData(docId) {
  return (
    mockReports[docId] || {
      reportID: docId.replace("rep_", ""),
      reportStatus: "Received",
      issueCategory: "General Concern",
      barangayArea: "N/A",
      issueDescription: "No description available.",
      timestamp: {},
      supportingImage: [],
    }
  );
}

// ==========================================================================
// 6. CREATE STATUS CLASS
// ==========================================================================
function getStatusClass(reportStatus) {
  const currentStatus = (reportStatus || "Received").toLowerCase();
  
  if (currentStatus === "for verification") {
    return "badge_verification";
  }
  if (currentStatus === "for referral/referred" || currentStatus === "referred") {
    return "badge_referral";
  }
  if (currentStatus === "resolved") {
    return "badge_resolved";
  }
  if (currentStatus === "not within lgu jurisdiction") {
    return "badge_not_lgu";
  }
  return "badge_received";
}
// ==========================================================================
// 7. HISTORY CARD TEMPLATE
// ==========================================================================
// Ito mismo ang structure ng card na binigay mo.
// Hindi na kailangan ng .data_card sa HTML.
// JS na ang gagawa ng lahat.
// ==========================================================================

function createReportCard(docId, report) {
  const submittedDate =
    report.timestamp && report.timestamp.submitted
      ? report.timestamp.submitted.split(" - ")[0]
      : "N/A";
  const reportStatus = report.reportStatus || "Received";
  const statusClass = getStatusClass(reportStatus);
  return `
    <div
      class="data_card"
      data-fb-document="${docId}">
      <div class="card_header_flex">
        <div class="card_info">
          
          <!-- Category -->
          <div class="alignment_icon">
            <h4 class="card_category">
              ${report.issueCategory || "N/A"}
            </h4>
          </div>


          <!-- Location -->
          <div class="alignment_icon">
           <img src="assets/location.png" class="nav_icon" alt="Location">
            <p class="card_location">
              ${report.barangayArea || "N/A"}
            </p>
          </div>


          <!-- Description -->
          <div class="alignment_icon1">
          <p class="card_desc">${report.issueDescription ? report.issueDescription.trim() : "N/A"}</p>
          </div>

        <!-- Date -->
        <div class="card_date">
            Date: ${submittedDate}
          </div>
        </div>

        <!-- STATUS -->
        <div class="detail_status">
          <span
            class="badge ${statusClass}">
            ${reportStatus}
          </span>
          <button class="btn_text" type="button" onclick="openDetailsModal('${docId}', event)">
            View Details
          </button>
        </div>
      </div>
    </div>
  `;
}

// ==========================================================================
// 8. RENDER ALL HISTORY CARDS
// ==========================================================================

function renderHistoryCards() {
  const historyPanel = document.getElementById("history_panel");
  if (!historyPanel) {
    console.error("history_panel not found.");
    return;
  }

  // ----------------------------------------------------------
  // CREATE ALL CARDS
  // ----------------------------------------------------------

  let cardsHTML = "";
  Object.entries(mockReports).forEach(([docId, report]) => {
    cardsHTML += createReportCard(docId, report);
  });

  // ----------------------------------------------------------
  // INSERT CARDS
  // ----------------------------------------------------------
  // Important:
  // Hindi natin tatanggalin ang Create New Report button.
  // ----------------------------------------------------------
  const createButton = historyPanel.querySelector(".btn_primary");

  // Remove existing generated cards
  historyPanel
    .querySelectorAll(".data_card[data-fb-document]")
    .forEach((card) => card.remove());

  if (createButton) {
    createButton.insertAdjacentHTML("beforebegin", cardsHTML);
  } else {
    historyPanel.insertAdjacentHTML("beforeend", cardsHTML);
  }

  // (See more / See less functionality removed)
}

//=======================================================================
// 9. ATTACHMENTS DISPLAY
// ==========================================================================

function renderAttachments(container, supportingImage) {
  container.innerHTML = "";
  if (!Array.isArray(supportingImage) || supportingImage.length === 0) {
    container.textContent = "No attachments";
    return;
  }

  supportingImage.forEach((attachment) => {
    const item = document.createElement("div");
    item.className = "attachment_item";

    if (typeof attachment === "string") {
      item.textContent = attachment;
    } else {
      item.textContent = attachment.name || "Attachment";
    }
    container.appendChild(item);
  });
}

// ==========================================================================
// 10. OPEN DETAILS MODAL
// ==========================================================================

function openDetailsModal(docId, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  currentActiveDocId = docId;
  const report = getReportData(docId);
  const modal = document.getElementById("details_panel");
  const overlay = document.getElementById("form_overlay");

  if (!modal || !overlay) {
    console.error("details_panel or form_overlay not found.");
    return;
  }
  modal.setAttribute("data-fb-document", docId);

  // ----------------------------------------------------------
  // REPORT ID
  // ----------------------------------------------------------

  const reportIds = document.getElementById("detail_report_id");
  if (reportIds) {
    reportIds.textContent = report.reportID || "N/A";
  }

  // ----------------------------------------------------------
  // CATEGORY
  // ----------------------------------------------------------
  const issueCategory = document.getElementById("detail_category");
  if (issueCategory) {
    issueCategory.textContent = report.issueCategory || "N/A";
  }

  // ----------------------------------------------------------
  // LOCATION
  // ----------------------------------------------------------
  const barangayArea = document.getElementById("detail_location");
  if (barangayArea) {
    barangayArea.textContent = report.barangayArea || "N/A";
  }
  // ----------------------------------------------------------
  // DESCRIPTION
  // ----------------------------------------------------------
  const issueDescription = document.getElementById("detail_description");

  if (issueDescription) {
    issueDescription.textContent = report.issueDescription || "N/A";
  }
  // ----------------------------------------------------------
  // EDIT DESCRIPTION
  // ----------------------------------------------------------
  const descriptionInput = document.getElementById("edit_description_input");
  if (descriptionInput) {
    descriptionInput.value = report.issueDescription || "";
  }
  // ----------------------------------------------------------
  // STATUS
  // ----------------------------------------------------------
  updateStatusBadgeUI(report.reportStatus);
  // ----------------------------------------------------------
  // TIMELINE
  // ----------------------------------------------------------
  updateTimelineUI(report.reportStatus, report.timestamp);
  // ----------------------------------------------------------
  // ATTACHMENTS
  // ----------------------------------------------------------
  const attachmentContainer = document.getElementById("detail_attachments");
  if (attachmentContainer) {
    renderAttachments(attachmentContainer, report.supportingImage);
  }
  // ----------------------------------------------------------
  // RESET EDIT MODE
  // ----------------------------------------------------------
  toggleEditDescription(false);
  // ----------------------------------------------------------
  // SHOW MODAL
  // ----------------------------------------------------------
  modal.style.display = "block";
  overlay.style.display = "block";  
  setTimeout(() => {
    modal.classList.add("show");
    overlay.classList.add("show");
  }, 10);
}

// ==========================================================================
// 11. STATUS BADGE
// ==========================================================================
function updateStatusBadgeUI(reportStatus) {
  const badge = document.getElementById("detail_status");
  if (!badge) return;
  const currentStatus = reportStatus || "Received";
  badge.textContent = currentStatus;
  badge.classList.remove(
    "badge_received", 
    "badge_verification", 
    "badge_referral", 
    "badge_resolved", 
    "badge_not_lgu"
  );
  badge.classList.add(getStatusClass(currentStatus));
}
// ==========================================================================
// 12. TIMELINE
// ==========================================================================
function updateTimelineUI(reportStatus, timelineData = {}) {
  const timelineContainer = document.querySelector(".timeline_container");
  if (!timelineContainer) return;

  const currentStatus = reportStatus || "Received";
  const statusLower = currentStatus.toLowerCase();

  // Kapag "Not within LGU Jurisdiction" -> Maikling 2-step timeline
  if (statusLower === "not within lgu jurisdiction") {
    timelineContainer.innerHTML = `
      <div class="timeline_item active step_1">
        <div class="timeline_node"></div>
        <div class="timeline_content">
          <h4>Received</h4>
          <p id="time_submitted">${timelineData.submitted || "N/A"}</p>
        </div>
      </div>
      <div class="timeline_item active step_5">
        <div class="timeline_node"></div>
        <div class="timeline_content">
          <h4>Not within LGU Jurisdiction</h4>
          <p id="time_not_lgu">${timelineData.not_lgu || "Process Closed"}</p>
        </div>
      </div>
    `;
    return;
  }

  // Standard 4-Step Timeline Workflow
  timelineContainer.innerHTML = `
    <div class="timeline_item step_1" id="timeline_step_received">
      <div class="timeline_node"></div>
      <div class="timeline_content">
        <h4>Received</h4>
        <p id="time_submitted">${timelineData.submitted || "N/A"}</p>
      </div>
    </div>
    <div class="timeline_item step_2" id="timeline_step_verification">
      <div class="timeline_node"></div>
      <div class="timeline_content">
        <h4>For Verification</h4>
        <p id="time_verification">Pending...</p>
      </div>
    </div>
    <div class="timeline_item step_3" id="timeline_step_referral">
      <div class="timeline_node"></div>
      <div class="timeline_content">
        <h4>For Referral / Referred</h4>
        <p id="time_referral">Pending...</p>
      </div>
    </div>
    <div class="timeline_item step_4" id="timeline_step_resolved">
      <div class="timeline_node"></div>
      <div class="timeline_content">
        <h4>Resolved</h4>
        <p id="time_resolved">Pending...</p>
      </div>
    </div>
  `;

  let currentStep = 1;
  if (statusLower === "for verification") currentStep = 2;
  else if (statusLower === "for referral/referred" || statusLower === "referred") currentStep = 3;
  else if (statusLower === "resolved") currentStep = 4;

  const steps = [
    { id: "timeline_step_received", timeId: "time_submitted", val: timelineData.submitted || "N/A" },
    { id: "timeline_step_verification", timeId: "time_verification", val: timelineData.for_verification || "In Progress" },
    { id: "timeline_step_referral", timeId: "time_referral", val: timelineData.for_referral || "In Progress" },
    { id: "timeline_step_resolved", timeId: "time_resolved", val: timelineData.resolved || "Finished" }
  ];

  steps.forEach((step, idx) => {
    const item = document.getElementById(step.id);
    const timeElem = document.getElementById(step.timeId);
    if (item) {
      if (idx + 1 <= currentStep) {
        item.classList.add("active");
        if (timeElem) timeElem.textContent = step.val;
      } else {
        item.classList.remove("active");
        if (timeElem) timeElem.textContent = "Pending...";
      }
    }
  });
}
// ==========================================================================
// 13. CLOSE ALL MODALS
// ==========================================================================
function closeAllModals() {
  const form = document.getElementById("form_panel");
  const details = document.getElementById("details_panel");
  const overlay = document.getElementById("form_overlay");
  if (!form || !details || !overlay) {
    return;
  }
  form.classList.remove("show");
  details.classList.remove("show");
  overlay.classList.remove("show");

  setTimeout(() => {
    form.style.display = "none";
    details.style.display = "none";
    overlay.style.display = "none";
  }, 300);
}

// ==========================================================================
// 14. CLOSE DETAILS MODAL
// ==========================================================================
function closeDetailsModal() {
  const modal = document.getElementById("details_panel");
  const overlay = document.getElementById("form_overlay");

  if (!modal || !overlay) {
    return;
  }

  modal.classList.remove("show");
  overlay.classList.remove("show");
  setTimeout(() => {
    modal.style.display = "none";
    overlay.style.display = "none";
  }, 300);
}

// ==========================================================================
// 16. EDIT DESCRIPTION
// ==========================================================================
function toggleEditDescription(isEditing) {
  const descText = document.getElementById("detail_description");
  const descInput = document.getElementById("edit_description_input");
  const btnEdit = document.getElementById("btn_edit_desc");
  const btnSave = document.getElementById("btn_save_desc");

  if (!descText || !descInput || !btnEdit || !btnSave) {
    return;
  }
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
// ==========================================================================
// 15. SAVE DESCRIPTION
// ==========================================================================

function saveDescription() {
  const input = document.getElementById("edit_description_input");
  const issueDescription = document.getElementById("detail_description");

  if (!input || !issueDescription) {
    return;
  }
  const updatedDescription = input.value;
 // UPDATE MODAL// ----------------------------------------------------------
  issueDescription.textContent = updatedDescription;
 // UPDATE MOCK DATA
 if (currentActiveDocId && mockReports[currentActiveDocId]) {
    mockReports[currentActiveDocId].issueDescription = updatedDescription;
  }
  // ----------------------------------------------------------
  // UPDATE HISTORY CARD
  // ----------------------------------------------------------
  const card = document.querySelector(
    `.data_card[data-fb-document="${currentActiveDocId}"]`,
  );
  if (card) {
    const cardDescription = card.querySelector(".card_desc");
    if (cardDescription) {
      cardDescription.textContent = updatedDescription;
      // Reset See More / See Less
      cardDescription.classList.remove("description_expanded");
      const seeMoreButton = card.querySelector(".see_more_btn");
      if (seeMoreButton) {
        seeMoreButton.textContent = "See More";
      }
    }
  }





  // ----------------------------------------------------------
  // BACKEND READY
  // ----------------------------------------------------------
  console.log(
    `[Backend Ready] Updated Document ${currentActiveDocId}:`,
    updatedDescription,
  );
  /*
  FUTURE FIREBASE:
  await updateDoc(
    doc(db, "reports", currentActiveDocId),
    {
      issueDescription: updatedDescription
    }
  );
  */
  toggleEditDescription(false);
}







// ==========================================================================
// 16. INITIALIZE
// ==========================================================================
document.addEventListener("DOMContentLoaded", function () {
  renderHistoryCards();

  // Automatic Pin kapag pumili ng Barangay ang User
  const locationInput = document.getElementById("location");
  if (locationInput) {
    locationInput.addEventListener("change", function () {
      const selectedBarangay = this.value.trim();
      if (barangayCoordinates[selectedBarangay]) {
        const coords = barangayCoordinates[selectedBarangay];
        if (map) {
          map.setView(coords, 16);
          setMapMarker(coords[0], coords[1]);
        }
      }
    });
  }
});









// ==========================================================================
// FORM PANEL & REAL-TIME GEOLOCATION (PURE GEOGRAPHIC MAP SEARCH)
// ==========================================================================

let map = null;
let marker = null;

// Open/Close Modal Form Overlay
function toggleFormView(showForm) {
  const form = document.getElementById("form_panel");
  const overlay = document.getElementById("form_overlay");

  if (!form || !overlay) return;

  if (showForm) {
    overlay.style.display = "block";
    form.style.display = "block";

    requestAnimationFrame(() => {
      form.classList.add("show");
      overlay.classList.add("show");
    });

    // Render Map kapag lumabas ang modal
    setTimeout(() => {
      initMap();
      if (map) map.invalidateSize();
    }, 350);

  } else {
    form.classList.remove("show");
    overlay.classList.remove("show");

    setTimeout(() => {
      form.style.display = "none";
      overlay.style.display = "none";
    }, 300);
  }
}

// Initialize Leaflet Map (Centering sa Odiongan, Romblon)
function initMap() {
  if (map !== null) return;

  // Default Center: Odiongan Proper
  const defaultCoords = [12.3980, 121.9820]; 

  map = L.map('map').setView(defaultCoords, 14);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  }).addTo(map);

  map.on('click', function(e) {
    setMapMarker(e.latlng.lat, e.latlng.lng);
  });
}

// Create & Move Pin Marker
function setMapMarker(lat, lng) {
  if (marker) {
    marker.setLatLng([lat, lng]);
  } else {
    marker = L.marker([lat, lng], { draggable: true }).addTo(map);

    // Kapag inilipat o in-drag ang pin
    marker.on('dragend', function(e) {
      const pos = marker.getLatLng();
      updateCoordInputs(pos.lat, pos.lng);
      updateLocationLabelFromMap(pos.lat, pos.lng);
    });
  }

  updateCoordInputs(lat, lng);
  updateLocationLabelFromMap(lat, lng);
}

function updateCoordInputs(lat, lng) {
  const latInput = document.getElementById('latitude');
  const lngInput = document.getElementById('longitude');
  if (latInput && lngInput) {
    latInput.value = lat;
    lngInput.value = lng;
  }
}

// Reverse Geocoding: Kukuha ng totoong lugar/building name at idudurugtong sa location input
function updateLocationLabelFromMap(lat, lng) {
  if (!marker) return;

  const locationInput = document.getElementById("location");
  const hiddenLocationNameInput = document.getElementById("location_name");

  // Kukunin ang kasalukuyang pumasok na Barangay input ni user (kung mayroon)
  let userBarangay = locationInput ? locationInput.value.trim() : "";

  // Linisin ang lumang idinugtong na detalye kung nag-re-drag si user para manatili lang ang base input
  if (userBarangay.includes(",")) {
    userBarangay = userBarangay.split(",")[0].trim();
  }

  showTooltip(`📍 <b>Locating…</b>`);

  fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`)
    .then(response => response.json())
    .then(data => {
      let buildingOrSpot = "";
      let detectedBarangay = "";

      if (data && data.address) {
        const addr = data.address;

        // 1. Kuhanin ang Building Name, Amenity, Landmark, o Kalye
        buildingOrSpot = 
          addr.building || 
          addr.amenity || 
          addr.office || 
          addr.leisure || 
          addr.shop || 
          addr.tourism || 
          addr.road || 
          addr.pedestrian || 
          addr.suburb || 
          "";

        // 2. Kuhanin ang Barangay / Village mula sa mapa
        detectedBarangay = addr.village || addr.quarter || addr.suburb || addr.neighbourhood || addr.town || "";
      }

      let finalLocationText = "";

      // RULE LOGIC:
      if (userBarangay !== "") {
        // MAY INPUT SI USER:
        // Huwag nang baguhin o palitan ang Barangay na pinili/in-input ni user.
        // Idudugtong lang sa dulo ang nahanap na Building Name / Spot (kung may nahanap).
        if (buildingOrSpot && buildingOrSpot.toLowerCase() !== userBarangay.toLowerCase()) {
          finalLocationText = `${userBarangay}, ${buildingOrSpot}`;
        } else {
          finalLocationText = userBarangay;
        }
      } else {
        // WALANG INPUT SI USER:
        // Automatic na ilagay sa UNAHAN ang na-detect na Barangay mula sa pin coordinates.
        if (buildingOrSpot) {
          finalLocationText = detectedBarangay 
            ? `${detectedBarangay}, ${buildingOrSpot}` 
            : buildingOrSpot;
        } else {
          finalLocationText = detectedBarangay || "Selected Location";
        }
      }

      // 1. Update sa visible input field
      if (locationInput) {
        locationInput.value = finalLocationText;
      }

      // 2. Update sa hidden input
      if (hiddenLocationNameInput) {
        hiddenLocationNameInput.value = finalLocationText;
      }

      // 3. Ipakita sa Pin Label
      showTooltip(`📍 <b>${finalLocationText}</b>`);
    })
    .catch(() => {
      const fallback = userBarangay || "Selected Location";
      if (locationInput) locationInput.value = fallback;
      showTooltip(`📍 <b>${fallback}</b>`);
    });
}

function showTooltip(htmlContent) {
  marker.bindTooltip(htmlContent, { 
    permanent: true, 
    direction: 'top',
    className: 'custom-map-tooltip'
  }).openTooltip();
}

// Direct True Map Geocoding Search (No Static Array)
function geocodeBarangaySearch(locationName) {
  if (!locationName) return;

  // Ise-search ang mismong pangalan ng lugar sa totoong mapa ng Odiongan
  const searchQuery = `${locationName}, Odiongan, Romblon, Philippines`;

  fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`)
    .then(res => res.json())
    .then(data => {
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        if (map) {
          map.setView([lat, lon], 16);
          setMapMarker(lat, lon);
        }
      } else {
        // Fallback search para sa buong Odiongan
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=Odiongan, Romblon, Philippines`)
          .then(res => res.json())
          .then(fallbackData => {
            if (fallbackData && fallbackData.length > 0) {
              const lat = parseFloat(fallbackData[0].lat);
              const lon = parseFloat(fallbackData[0].lon);
              if (map) {
                map.setView([lat, lon], 14);
                setMapMarker(lat, lon);
              }
            }
          });
      }
    })
    .catch(err => console.error("True map search error:", err));
}

// Event Listeners
document.addEventListener("DOMContentLoaded", function () {
  const locationInput = document.getElementById("location");
  
  if (locationInput) {
    // Kapag pumili ng Barangay sa dropdown o nag-change ang value
    locationInput.addEventListener("change", function () {
      const selectedLocation = this.value.trim();
      geocodeBarangaySearch(selectedLocation);
    });
  }
});