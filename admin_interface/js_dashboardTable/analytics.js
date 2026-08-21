// Master list ng 25 Barangays sa Odiongan, Romblon
const ODIONGAN_BARANGAYS = [
  "Amatong", "Anahao", "Bangon", "Batiano", "Budiong", "Canduyong", "Dapawan", 
  "Gabawan", "Libertad", "Ligaya", "Liwanag", "Liwayway", "Malilico", "Mayha", 
  "Panique", "Pato-o", "Poctoy", "Progreso Este", "Progreso Weste", "Rizal", 
  "Tabing Dagat", "Tabobo-an", "Tuburan", "Tumingad", "Tulay"
];

// Master list ng 6 Categories
const CATEGORIES_LIST = [
  "Infrastructures", 
  "Waste Management", 
  "Drainage and Flooding", 
  "Public Facilities", 
  "Electrical and Streetlight", 
  "Road Obstruction"
];

let categoryChartInstance = null;
let barangayChartInstance = null;

// Initializer
document.addEventListener('DOMContentLoaded', () => {
  const dataToUse = (typeof reportsData !== 'undefined') ? reportsData : [];
  processAnalytics(dataToUse);
});

// Processing Function
function processAnalytics(data) {
  const selectedCat = document.getElementById('categoryFilter')?.value || 'All';

  // Filter base sa napiling Category dropdown
  const filteredData = (selectedCat === 'All') 
    ? data 
    : data.filter(r => r.category === selectedCat);

  // 1. Update Counter Cards (Kasama ang Ongoing)
  const received = filteredData.filter(r => r.status === 'Received').length;
  const ongoing = filteredData.filter(r => r.status === 'Ongoing').length;
  const resolved = filteredData.filter(r => r.status === 'Resolved').length;
  const total = filteredData.length;

  document.getElementById('countReceived').innerText = received;
  document.getElementById('countOngoing').innerText = ongoing;
  document.getElementById('countResolved').innerText = resolved;
  document.getElementById('countTotal').innerText = total;

  // 2. Render Charts
  renderCategoryChart(data); 
  renderBarangayChart(filteredData);
}

// Category Bar Chart Render Function
function renderCategoryChart(data) {
  const ctx = document.getElementById('categoryChart').getContext('2d');

  const counts = CATEGORIES_LIST.map(cat => 
    data.filter(r => r.category === cat).length
  );

  if (categoryChartInstance) categoryChartInstance.destroy();

  categoryChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: CATEGORIES_LIST,
      datasets: [{
        label: 'Reports Count',
        data: counts,
        backgroundColor: [
          '#22c55e', // Green
          '#6366f1', // Indigo
          '#d97706', // Amber
          '#eab308', // Yellow
          '#ef4444', // Red
          '#8b5cf6'  // Purple
        ],
        borderRadius: 4,
        barThickness: 30,
        maxBarThickness: 40
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } }
      }
    }
  });
}

// 25 Barangays Bar Chart Render Function
function renderBarangayChart(data) {
  const ctx = document.getElementById('barangayChart').getContext('2d');

  const barangayCounts = ODIONGAN_BARANGAYS.map(brgy => {
    return data.filter(r => (r.location || '').toLowerCase().includes(brgy.toLowerCase())).length;
  });

  if (barangayChartInstance) barangayChartInstance.destroy();

  barangayChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ODIONGAN_BARANGAYS,
      datasets: [{
        label: 'Total Reports',
        data: barangayCounts,
        backgroundColor: '#1e293b',
        barThickness: 12
      }]
    },
   options: {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        precision: 0 // Iwas sa mga decimal numbers kapag kaunti pa ang data
      }
    }
  }
}
  });
}

// Listener para sa Category Dropdown Filter
function filterAnalyticsByCategory() {
  const dataToUse = (typeof reportsData !== 'undefined') ? reportsData : [];
  processAnalytics(dataToUse);
}



// Function para sa pag-export ng Summary at Graphs
function exportAnalyticsReport() {
  const element = document.querySelector('.analytics_container') || document.querySelector('.main_content');
  const selectedCat = document.getElementById('categoryFilter')?.value || 'All';
  const cleanCatName = selectedCat.replace(/[^a-zA-Z0-9]/g, '_');

  const opt = {
    margin:       [8, 8, 8, 8], // Binawasan ng kaunti ang margin (8mm)
    filename:     `Odiongan_Analytics_${cleanCatName}_Report.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { 
      scale: 2, 
      useCORS: true,
      scrollY: 0 // Iniiwasan ang pagputol sanhi ng window scroll offset
    },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
    // Awtomatikong idi-divide o i-fi-fit ang content para hindi maputol sa dulo
    pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] } 
  };

  const exportBtn = document.querySelector('.btn_export');
  if (exportBtn) exportBtn.style.display = 'none';

  html2pdf().set(opt).from(element).save().then(() => {
    if (exportBtn) exportBtn.style.display = 'block';
  });
}

/*
  ==============================================
  FIREBASE FIRESTORE READY LISTENER (FUTURE USE)
  ==============================================
  
  db.collection("reports").onSnapshot((snapshot) => {
    const firebaseReports = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        category: data.category || '',
        location: data.location || '',
        status: data.status || 'Received'
      };
    });
    
    // Automatic refresh ng charts kapag may bagong dagdag sa database
    processAnalytics(firebaseReports);
  });
*/