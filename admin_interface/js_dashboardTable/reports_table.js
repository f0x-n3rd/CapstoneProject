// Global memory store for reports (Firebase Firestore target container)
let currentReportsList = [];

// Mock Data with images array property (Ready for Firebase URL arrays)
const reportsData = [
  { 
    id: "REP-001", 
    residentName: "Juan Dela Cruz", 
    category: "Electrical and Streetlight", 
    location: "Brgy. Amatong Purok Pag-asa",
    description: " Streetlight malfunction on Damage Road, Brgy. Amatong. Several streetlights have not been functioning properly, making the road very dark at night. Residents are requesting immediate inspection and repair to ensure the safety of pedestrians and motorists. The problem has been reported to the concerned personnel for proper assessment and action.", 
    date: "2026-08-12", 
    status: "Received",
    images: [] // Empty for now; populated with image URLs in future Firebase upload
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
    location: "Near Basketball Court",
    description: "Pundido ang poste ng ilaw malapit sa basketball court, napakadilim at delikado para sa mga dumadaan sa gabi.", 
    date: "2026-08-17", 
    status: "Resolved",
    images: [
      // Example of populated image URLs for testing UI
      "https://via.placeholder.com/300/09f/fff.png",
      "https://via.placeholder.com/300/f00/fff.png"
    ]
  },
  { 
    id: "REP-004", 
    residentName: "Andres Bonifacio", 
    category: "Waste Management", 
    location: "Purok 2, Front of Chapel",
    description: "May malaking tumatagas na tubo ng tubig sa harap ng Purok 2, umaapaw na ang tubig sa kalsada.", 
    date: "2026-08-18", 
    status: "Received",
    images: []
  },
  { 
    id: "REP-005", 
    residentName: "Emilio Aguinaldo", 
    category: "Road Obstruction", 
    location: "Zone 5, Highway Boundary",
    description: "May mga nakatambak na construction materials sa gitna ng daanan na humaharang sa mga sasakyan.", 
    date: "2026-08-18", 
    status: "Ongoing",
    images: []
  }
];

// Function to render table rows
function renderReportsTable(data) {
  currentReportsList = data; // Cache current displayed list for lookup
  const tbody = document.getElementById('reportsTableBody');
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

// Live Search Filter
function filterReports() {
  const query = document.getElementById('residentSearchInput').value.toLowerCase();
  const filteredData = reportsData.filter(report => 
    report.residentName.toLowerCase().includes(query)
  );
  renderReportsTable(filteredData);
}

// Modal Control Functions
function openModal(id) {
  const report = currentReportsList.find(item => item.id === id);
  if (!report) return;

  const modal = document.getElementById('descModal');
  const imagesGrid = document.getElementById('modalImagesGrid');

  // Set ID and Description Text
  document.getElementById('modalReportId').innerText = `Report Details - ${report.id}`;
  document.getElementById('modalDescription').innerText = report.description;

  // Render Attached Images
  imagesGrid.innerHTML = '';
  if (report.images && report.images.length > 0) {
    report.images.forEach(imgUrl => {
      const img = document.createElement('img');
      img.src = imgUrl;
      img.alt = `Report Image ${report.id}`;
      img.className = 'modal-img-thumb';
      
      // Click thumbnail to open image directly in new tab
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

// Initial Load
renderReportsTable(reportsData);

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