// Global memory store for reports
let currentReportsList = [];

// Mock Data
const reportsData = [
  { 
    id: "REP-001", 
    residentName: "Juan Dela Cruz", 
    category: "Electrical and Streetlight", 
    location: "Brgy. Amatong Purok Pag-asa",
    description: " Streetlight malfunction on Damage Road, Brgy. Amatong. Several streetlights have not been functioning properly, making the road very dark at night. Residents are requesting immediate inspection and repair to ensure the safety of pedestrians and motorists. The problem has been reported to the concerned personnel for proper assessment and action.", 
    date: "2026-08-12", 
    status: "Received",
    images: [] 
  },
  
  { 
    id: "REP-002", 
    residentName: "Juan Dela Cruz", 
    category: "Infrastructures", 
    location: "Brgy. Dapawan, Purok 3",
    description: "A large pothole has developed along the roadside. The damaged portion of the road is becoming difficult to pass, especially for motorcycles and small vehicles. Residents are requesting immediate road inspection and repair before the damage becomes worse.", 
    date: "2026-08-16", 
    status: "Ongoing",
    images: []
  },
  { 
    id: "REP-003", 
    residentName: "Jose Rizal", 
    category: "Electrical and Streetlight", 
    location: "Dapawan Near Basketball Court",
    description: "Pundido ang poste ng ilaw malapit sa basketball court, napakadilim at delikado para sa mga dumadaan sa gabi.", 
    date: "2026-08-17", 
    status: "Resolved",
    images: [
      "https://via.placeholder.com/300/09f/fff.png",
      "https://via.placeholder.com/300/f00/fff.png"
    ]
  },
  
  { 
    id: "REP-004", 
    residentName: "Andres Bonifacio", 
    category: "Waste Management", 
    location: "Mayha Purok 2, Front of Chapel",
    description: "May malaking tumatagas na tubo ng tubig sa harap ng Purok 2, umaapaw na ang tubig sa kalsada.", 
    date: "2026-08-18", 
    status: "Received",
    images: []
  },
  { 
    id: "REP-005", 
    residentName: "Emilio Aguinaldo", 
    category: "Road Obstruction", 
    location: "Batiano Zone 5, Highway Boundary",
    description: "May mga nakatambak na construction materials sa gitna ng daanan na humaharang sa mga sasakyan.", 
    date: "2026-08-18", 
    status: "Ongoing",
    images: []
  }
];

// Helper function para makuha ang angkop na class color
function getStatusClass(status) {
  const statusLower = (status || '').toLowerCase();
  if (statusLower === 'received') return 'card-status-received';
  if (statusLower === 'ongoing') return 'card-status-ongoing';
  if (statusLower === 'resolved') return 'card-status-resolved';
  return '';
}

// Function na nagpapalit ng kulay ng dropdown kapag pinalitan ng user
function handleStatusColorChange(selectElement) {
  selectElement.classList.remove('card-status-received', 'card-status-ongoing', 'card-status-resolved');
  const newClass = getStatusClass(selectElement.value);
  selectElement.classList.add(newClass);
}

// Main function to render UI
function renderReports(data) {
  currentReportsList = data; 
  
  const tbody = document.getElementById('reportsTableBody');
  const cardsContainer = document.getElementById('reportsListContainer');

  // 1. Dashboard Table View
  if (tbody) {
    tbody.innerHTML = '';
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="no-results">No residents found matching your search.</td></tr>';
      return;
    }

    data.forEach(report => {
      const tr = document.createElement('tr');
      let statusCSS = '';
      const statusLower = report.status.toLowerCase();
      if (statusLower === 'received') statusCSS = 'status-received';
      else if (statusLower === 'ongoing') statusCSS = 'status-ongoing';
      else if (statusLower === 'resolved') statusCSS = 'status-resolved';

      tr.innerHTML = `
        <td><strong>${report.id}</strong></td>
        <td>${report.residentName}</td>
        <td>${report.category}</td>
        <td>${report.location}</td>
        <td class="desc-cell" style="cursor: pointer;" title="Click to view full description and images" onclick="openModal('${report.id}')">
          ${report.description}
        </td>
        <td>${report.date}</td>
        <td><span class="status-badge ${statusCSS}">${report.status}</span></td>
      `;
      tbody.appendChild(tr);
    });
  }

  // 2. Report Management Card View
  if (cardsContainer) {
    cardsContainer.innerHTML = '';
    if (data.length === 0) {
      cardsContainer.innerHTML = '<p style="text-align:center; color:#777; padding:20px;">No reports found.</p>';
      return;
    }

    data.forEach(report => {
      const card = document.createElement('div');
      card.className = 'report_card';

      let imagesHTML = '';
      if (report.images && report.images.length > 0) {
        report.images.forEach(url => {
          imagesHTML += `<img src="${url}" class="img_placeholder" alt="Report Image">`;
        });
      } else {
        imagesHTML = `
          <div class="img_placeholder"></div>
          <div class="img_placeholder"></div>
        `;
      }

      const statusColorClass = getStatusClass(report.status);

      card.innerHTML = `
        <div class="card_header">
          <div class="resident_name">${report.residentName}</div>
          <select id="status-select-${report.id}" class="status_select ${statusColorClass}" onchange="handleStatusColorChange(this)">
            <option value="Received" ${report.status === 'Received' ? 'selected' : ''}>Received</option>
            <option value="Ongoing" ${report.status === 'Ongoing' ? 'selected' : ''}>Ongoing</option>
            <option value="Resolved" ${report.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
          </select>
        </div>

        <div class="report_details">
          <p><strong>Report ID:</strong> ${report.id}</p>
          <p><strong>Category:</strong> ${report.category}</p>
          <p><strong>Location:</strong> ${report.location}</p>
          <p><strong>Description:</strong></p>
          <p class="desc_report_management">${report.description}</p>
        </div>

        <div class="card_images">
          ${imagesHTML}
        </div>

        <div class="card_footer">
          <div class="report_date">Date: ${report.date}</div>
          <div class="card_actions">
            <button class="btn_delete" onclick="deleteReport('${report.id}')">Delete</button>
            <button class="btn_update" onclick="updateReportStatus('${report.id}')">Update status</button>
          </div>
        </div>
      `;

      cardsContainer.appendChild(card);
    });
  }
}

// Live Search Filter
function filterReports() {
  const input = document.getElementById('residentSearchInput');
  if (!input) return;

  const query = input.value.toLowerCase();
  const filteredData = reportsData.filter(report => 
    report.residentName.toLowerCase().includes(query) ||
    report.id.toLowerCase().includes(query) ||
    report.category.toLowerCase().includes(query)
  );
  renderReports(filteredData);
}

// Function para sa Delete Button
function deleteReport(id) {
  const confirmDelete = confirm(`Are you sure you want to delete the report? (${id})?`);
  
  if (confirmDelete) {
    const index = reportsData.findIndex(item => item.id === id);
    if (index !== -1) {
      reportsData.splice(index, 1);
      filterReports();
    }
  }
}

// Function para sa Update Status Button
function updateReportStatus(id) {
  const selectElement = document.getElementById(`status-select-${id}`);
  if (!selectElement) return;

  const newStatus = selectElement.value;
  const report = reportsData.find(item => item.id === id);

  if (report) {
    report.status = newStatus;
    alert(`Report status ${id} has been successfully updated to "${newStatus}".`);
    filterReports(); // Re-render para ma-apply ang pagbabago sa buong state
  }
}

// Modal Control Functions (for Dashboard Table)
function openModal(id) {
  const report = currentReportsList.find(item => item.id === id);
  if (!report) return;

  const modal = document.getElementById('descModal');
  const imagesGrid = document.getElementById('modalImagesGrid');

  document.getElementById('modalReportId').innerText = `Report Details - ${report.id}`;
  document.getElementById('modalDescription').innerText = report.description;

  imagesGrid.innerHTML = '';
  if (report.images && report.images.length > 0) {
    report.images.forEach(imgUrl => {
      const img = document.createElement('img');
      img.src = imgUrl;
      img.alt = `Report Image ${report.id}`;
      img.className = 'modal-img-thumb';
      img.onclick = () => window.open(imgUrl, '_blank');
      imagesGrid.appendChild(img);
    });
  } else {
    imagesGrid.innerHTML = '<p class="no-images-text">No images attached to this report.</p>';
  }

  modal.classList.add('active');
}

function closeModal(event) {
  if (event.target.id === 'descModal') {
    document.getElementById('descModal').classList.remove('active');
  }
}

function closeModalDirect() {
  document.getElementById('descModal').classList.remove('active');
}

// Initial Load on page DOM ready
document.addEventListener('DOMContentLoaded', () => {
  renderReports(reportsData);
});

/* 
  Future Firebase Integration Snippet:
  
  db.collection("reports").onSnapshot((snapshot) => {
    const firebaseData = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        residentName: data.residentName || '',
        category: data.category || '',
        location: data.location || '',
        description: data.description || '',
        date: data.date || '',
        status: data.status || 'Received',
        images: Array.isArray(data.images) ? data.images : [] // Pull array of Firebase Storage URLs
      };
    });
    renderReportsTable(firebaseData);
  });
*/