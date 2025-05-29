 
    const firebaseConfig = {
      apiKey: 'AIzaSyCybmzCk3M8jV_255SbRGkGPWLAz2lgayE',
      authDomain: 'bijus-app-52978.firebaseapp.com',
      databaseURL: 'https://bijus-app-52978.firebaseio.com',
      projectId: 'bijus-app-52978',
      storageBucket: 'bijus-app-52978.appspot.com',
      messagingSenderId: '796288544713',
      appId: '1:796288544713:web:fa89b05a039a9232aec218'
    };

    const app = firebase.initializeApp(firebaseConfig);
    const db = firebase.database();
    const daysInMonth = 12;
    let attendance = [];
firebase.database().ref(".info/connected").on("value", function(snapshot) {
  const isConnected = snapshot.val() === true;
  const statusIcon = document.getElementById("statusIcon");
  const statusText = document.getElementById("statusText");
  const statusContainer = document.getElementById("offlineStatus");

  if (isConnected) {
   
    statusIcon.textContent = "🟢";
    statusText.textContent = "Online";
    statusContainer.style.backgroundColor = "#d4edda";
    statusContainer.style.color = "#155724";
  } else {
    
    statusIcon.textContent = "🔴";
    statusText.textContent = "Offline";
    statusContainer.style.backgroundColor = "#f8d7da";
    statusContainer.style.color = "#721c24";
  }
});



function loadData() {
  firebase.database().ref("attendance").on("value", (snapshot) => {
    const data = snapshot.val() || {};
    attendance = Object.values(data);
    renderTable();
  });
}

function toggleFeeDefaulterReport() {
  const reportDiv = document.getElementById("defaulterReportDiv");
  const button = document.getElementById("feeBtn");

  const isHidden = reportDiv.style.display === "none" || reportDiv.style.display === "";

  if (isHidden) {
    generateFeeDefaultersReport(); // Load data
    reportDiv.style.display = "block";
    button.innerHTML = `<i class="fa fa-times" style="color:red;"></i> Close`;
  } else {
    reportDiv.style.display = "none";
    button.innerHTML = `<i class="fa fa-exclamation-triangle"></i> Fee Defaulters Report`;
  }
}


 



function generateFeeDefaultersReport() {
  const defaulters = [];

  attendance.forEach(student => {
    for (let i = 1; i <= 12; i++) {
      const mon = `Month ${i}`;
      const data = student.months?.[mon] || [];

      const isValidMonth = data.length === 12 &&
        data.every(e => typeof e === "string" && (e.startsWith("Present") || e.startsWith("Absent")));
      const feeStatus = student.fees?.[mon]?.status || "Unpaid";

      if (isValidMonth && feeStatus === "Unpaid") {
        const presentCount = data.filter(e => e.startsWith("Present")).length;

        defaulters.push({
          name: student.name || "Unknown",
          class: student.class || "N/A",
          month: mon,
          presentDays: presentCount,
          amount: student.fees?.[mon]?.amount || "200"
        });
      }
    }
  });

  const reportDiv = document.getElementById("defaulterReportDiv");
  const contentDiv = document.getElementById("defaulterReportContent");

  reportDiv.style.display = "block";
  contentDiv.innerHTML = "";

  if (defaulters.length === 0) {
    contentDiv.innerHTML = "<p>No fee defaulters found.</p>";
    return;
  }

  let table = "<table border='1' cellpadding='5'><tr><th>Name</th><th>Class</th><th>Month</th><th>Present Days</th><th>Amount</th></tr>";
  defaulters.forEach(d => {
    table += `<tr><td>${d.name}</td><td>${d.class}</td><td>${d.month}</td><td>${d.presentDays}</td><td>${d.amount}</td></tr>`;
  });
  table += "</table>";

  contentDiv.innerHTML = table;
}
function hideFeeDefaulterReport() {
  document.getElementById("defaulterReportDiv").style.display = "none";
}


async function generateDateWiseAttendanceReport() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 10;

  attendance.forEach((student, index) => {
    const month = student.currentMonth;
    const data = student.months[month] || [];

    const tableBody = [];
    for (let day = 0; day < data.length; day++) {
      const entry = data[day];
      if (entry) {
        const [status, date] = entry.split(" ");
        tableBody.push([
          `Day ${day + 1}`,
          date || "-",
          status
        ]);
      } else {
        tableBody.push([
          `Day ${day + 1}`,
          "-",
          "--"
        ]);
      }
    }

    doc.setFontSize(12);
    doc.text(`Student: ${student.name} | Class: ${student.class} | Month: ${month}`, 14, y);
    y += 6;

    doc.autoTable({
      startY: y,
      head: [['Day', 'Date', 'Status']],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [22, 160, 133] },
      styles: { halign: 'center' },
      didDrawPage: function (data) {
        y = data.cursor.y + 10;
      }
    });

    if (y > 240 || index < attendance.length - 1) {
      doc.addPage();
      y = 10;
    }
  });

  // Save the PDF with a dynamic name based on the current date
  const fileName = `DateWise_Attendance_Report_${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(fileName);

  // Show a hint message after download
  showDownloadHint(fileName);
}

// Function to display the download hint message
function showDownloadHint(fileName) {
  const hintMessage = `The PDF report "${fileName}" has been downloaded successfully! Please check your Downloads folder or the default download location of your browser.`;

  // Create a simple message box for the hint
  const messageBox = document.createElement("div");
  messageBox.style.position = "fixed";
  messageBox.style.bottom = "20px";
  messageBox.style.left = "50%";
  messageBox.style.transform = "translateX(-50%)";
  messageBox.style.padding = "15px";
  messageBox.style.backgroundColor = "#4CAF50";
  messageBox.style.color = "#fff";
  messageBox.style.borderRadius = "5px";
  messageBox.style.fontSize = "16px";
  messageBox.style.boxShadow = "0px 0px 10px rgba(0, 0, 0, 0.2)";
  messageBox.innerHTML = hintMessage;

  document.body.appendChild(messageBox);

  // Remove the message box after 5 seconds
  setTimeout(() => {
    document.body.removeChild(messageBox);
  }, 5000);
}


async function generateDetailedYearlyAttendanceReport() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 10;

  attendance.forEach((student, index) => {
    doc.setFontSize(12);
    doc.text(`Student ID: ${student.id}`, 14, y);
    y += 6;
    doc.text(`Name: ${student.name} | Class: ${student.class}`, 14, y);
    y += 6;

    // --- Fees Summary First ---
    let totalFeesPaid = 0;
    let totalFeesUnpaid = 0;
    const feeRows = [];

    for (let i = 1; i <= 12; i++) {
      const monthKey = `Month ${i}`;
      const fee = student.fees?.[monthKey];
      const status = fee?.status || "Unpaid";
      const amount = parseInt(fee?.amount || "0");
      if (status === "Paid") totalFeesPaid += amount;
      else totalFeesUnpaid += amount;

      feeRows.push({
        month: monthKey,
        status,
        amount: `₹${amount}`,
        fillColor: status === "Paid" ? [200, 255, 200] : [255, 200, 200], // Green or Red
      });
    }

    doc.text(`Fees Summary`, 14, y);
    y += 6;
    doc.text(`Total Paid: ₹${totalFeesPaid}`, 14, y);
    y += 5;
    doc.text(`Total Unpaid: ₹${totalFeesUnpaid}`, 14, y);
    y += 5;

    // Color-coded Fees Table
    doc.autoTable({
      startY: y,
      head: [['Month', 'Status', 'Amount']],
      body: feeRows.map(r => [r.month, r.status, r.amount]),
      theme: 'grid',
      styles: { halign: 'center' },
      headStyles: { fillColor: [241, 196, 15] },
      didParseCell: function (data) {
        const rowIndex = data.row.index;
        const colIndex = data.column.index;
        if (data.section === 'body') {
          const fill = feeRows[rowIndex].fillColor;
          data.cell.styles.fillColor = fill;
          if (colIndex === 1) { // status text color
            data.cell.styles.textColor = feeRows[rowIndex].status === "Paid" ? [0, 100, 0] : [139, 0, 0];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
      didDrawPage: function (data) {
        y = data.cursor.y + 10;
      }
    });

    // --- Attendance Table ---
    const attendanceRows = [];
    let totalPresent = 0;
    let totalAbsent = 0;

    for (let i = 1; i <= 12; i++) {
      const monthKey = `Month ${i}`;
      const days = student.months[monthKey] || [];

      days.forEach((entry, dayIndex) => {
        if (!entry) return;
        const [status, date] = entry.split(" ");
        const formattedDate = date ? new Date(date).toLocaleDateString('en-IN') : "-";

        if (status === "Present") totalPresent++;
        if (status === "Absent") totalAbsent++;

        attendanceRows.push([
          monthKey,
          `Day ${dayIndex + 1}`,
          formattedDate,
          status
        ]);
      });
    }

    doc.setFontSize(12);
    doc.text(`Attendance Details`, 14, y);
    y += 4;

    doc.autoTable({
      startY: y,
      head: [['Month', 'Day', 'Date', 'Status']],
      body: attendanceRows,
      theme: 'grid',
      styles: { halign: 'center' },
      headStyles: { fillColor: [52, 152, 219] },
      margin: { top: 10 },
      didDrawPage: function (data) {
        y = data.cursor.y + 10;
      }
    });

    y += 5;
    doc.setFontSize(11);
    doc.text(`Total Present Days: ${totalPresent}`, 14, y);
    y += 5;
    doc.text(`Total Absent Days: ${totalAbsent}`, 14, y);
    
    y += 10;

    // --- Signatures ---
   
// --- Signatures ---
doc.setFontSize(11);

// Place Bijush Kumar Roy close to the line (minimal space)
doc.text("Bijush Kumar Roy", 28, y - 1);  // Reduced gap to make the name close to the line

// Line for admin signature right after the name
y += 5;  // Small space between the name and the line
doc.text("________________________", 20, y);  // Admin signature line

y += 5;  // Small gap for "Signature of Admin"
doc.text("Signature of Admin", 20, y);  

y += 15;  // Adjust space for next section

// Parent/Guardian signature line
doc.text("________________________", 140, y + 5); 
y += 15;
doc.text("Parent/Guardian Signature", 142, y);  // Label for the parent's signature




    // --- Add Character Certificate Page ---
    doc.addPage();
    y = 20;

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 128);
    doc.text("CHARACTER CERTIFICATE", 105, y, { align: "center" });

    y += 20;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);

    const issuedDate = new Date().toLocaleDateString('en-IN');
    const charText = `This is to certify that Mr./Ms. ${student.name}, studying in class ${student.class}, has been a student of Bijush's Academy during the academic session. To the best of our knowledge, he/she bears a good moral character and has shown respectful and disciplined behavior during the tuition class.`;

    const splitText = doc.splitTextToSize(charText, 170);
    doc.text(splitText, 20, y);
    y += splitText.length * 7;

    // Institution and Signature Section
    doc.setFontSize(12);
    doc.text("Issued by:", 20, y + 10);
    doc.text("Bijush's Academy", 20, y + 15);
    doc.text(`Date of Issue: ${issuedDate}`, 20, y + 25);
    doc.text("Principal Signature:", 140, y + 20);
    doc.text("Bijush Kumar Roy", 140, y + 25);

    // Adding a decorative border for the certificate (can be adjusted for your design)
    doc.setLineWidth(0.5);
    doc.rect(10, 10, 190, 277); // Adjust width and height as needed

    // Page break if not the last student
    if (index < attendance.length - 1) {
      doc.addPage();
      y = 10;
    }
  });

  const fileName = `Yearly_Attendance_Fees_Report_${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(fileName);
  showDownloadHint(fileName);
}



function toggleBulkAttendance() {
  const bulkSection = document.getElementById("allAttendance");
  const button = document.getElementById("bulkBtn");

  if (bulkSection.style.display === "none") {
    bulkSection.style.display = "block";
    button.innerHTML = `<i class="fa fa-times" style="color:red;"></i> Close`;
  } else {
    bulkSection.style.display = "none";
    button.innerHTML = `<i class="fa fa-users"></i> Bulk Attendance`;
  }
}


function renderBulkDayOptions() {
  const bulkDaySelect = document.getElementById("bulkDay");
  if (bulkDaySelect) {
    
    const daysInMonth = 12;

    bulkDaySelect.innerHTML =
      `<option value="">Select Day</option>` +
      Array.from({ length: daysInMonth }, (_, i) =>
        `<option value="${i}">Day ${i + 1}</option>`).join("");
  }
}

let previousAttendanceState = []; 

function applyBulkAttendance() {
  const daySelectEl = document.getElementById("bulkDay");
  const statusSelectEl = document.getElementById("bulkStatus");

  const dayIndex = parseInt(daySelectEl?.value);
  const status = statusSelectEl?.value;
  const todayDate = new Date().toISOString().split("T")[0];

  if (isNaN(dayIndex) || !status) {
    alert("Please select both a day and a status before applying.");
    return;
  }

  // Get selected student checkboxes
  const selectedCheckboxes = document.querySelectorAll(".select-student:checked");
  if (selectedCheckboxes.length === 0) {
    alert("Please select at least one student to apply the attendance.");
    return;
  }

  const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.dataset.id);

  previousAttendanceState = JSON.parse(JSON.stringify(attendance));

  const confirmed = confirm(`Are you sure you want to mark selected students as "${status}" for Day ${dayIndex + 1}?`);
  if (!confirmed) return;

  attendance.forEach(student => {
    if (!selectedIds.includes(student.id)) return; // Skip unselected students

    const currentMonth = student.currentMonth;
    if (!student.months) student.months = {};
    if (!student.months[currentMonth]) student.months[currentMonth] = [];

    student.months[currentMonth][dayIndex] = `${status} ${todayDate}`;
  });

  localStorage.setItem("attendanceData", JSON.stringify(attendance));
  renderBulkDayOptions();
  renderTable();
}

function undoBulkAttendance() {
  if (previousAttendanceState.length === 0) {
    alert("No actions to undo!");
    return;
  }

 
  attendance = JSON.parse(JSON.stringify(previousAttendanceState));  

  renderBulkDayOptions();
  renderTable();
}

document.addEventListener("DOMContentLoaded", function () {
  renderBulkDayOptions();
  
  
});


function saveData() {
  const updates = {};
  attendance.forEach(s => updates[s.id] = s);
  firebase.database().ref("attendance").set(updates);
}

   function addStudent() {
  const name = document.getElementById("studentName").value.trim().toUpperCase();
  const studentClass = document.getElementById("studentClass").value.trim().toUpperCase();



  if (!name || !studentClass) {
    return alert("Enter name and class");
  }

  
  const id = `${name.toLowerCase().replace(/\s+/g, '')}-${studentClass.toLowerCase().replace(/\s+/g, '')}`;

  
  db.ref("attendance").child(id).once("value", (snapshot) => {
    if (snapshot.exists()) {
      alert("Student already exists");
      return;
    }

    // Initialize months and fees
    const months = {};
    const fees = {};
    for (let i = 1; i <= 12; i++) {
  months[`Month ${i}`] = Array(daysInMonth).fill("");
  fees[`Month ${i}`] = { status: "Unpaid", amount: "200" }; // FIXED
}


    // Create the new student object
    const newStudent = {
      id,
      name,
      class: studentClass,
      months,
      fees,
      currentMonth: "Month 1",
      feesPaid: 0, // New field to track total fees paid
    };

    // Save the new student to the database
    db.ref("attendance").child(id).set(newStudent, (error) => {
      if (error) {
        alert("Error adding student: " + error.message);
      } else {
        alert("Student added successfully");
        renderTable(); // Refresh the table to show the new student
      }
    });
  });
  document.getElementById("studentName").value = "";
  document.getElementById("studentClass").value = "";
}


    function deleteStudent(id) {
      if (confirm("Delete this student?")) db.ref("attendance/" + id).remove();
    }

    function editStudent(id) {
      const student = attendance.find(s => s.id === id);
      const newName = prompt("Edit name:", student.name);
      const newClass = prompt("Edit class:", student.class);
      if (newName && newClass) {
        student.name = newName;
        student.class = newClass.trim().toUpperCase();
        saveData();
      }
    }

    function changeMonth(id, m) {
      const student = attendance.find(s => s.id === id);
      student.currentMonth = m;
      saveData();
    }

    function formatDate(d) {
      if (!d) return "";
      const date = new Date(d);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    function editDateInline(id, month, dayIndex) {
      const student = attendance.find(s => s.id === id);
      const entry = student.months[month][dayIndex];
      if (!entry) return;

      const [status, oldDate] = entry.split(" ");
      const input = document.createElement("input");
      input.type = "date";
      input.value = oldDate;
      input.onblur = () => {
        const newDate = input.value;
        if (newDate) {
          student.months[month][dayIndex] = `${status} ${newDate}`;
          saveData();
        }
        renderTable();
      };
      const cell = document.getElementById(`date-${id}-${month}-${dayIndex}`);
      cell.innerHTML = "";
      cell.appendChild(input);
      input.focus();
    }

    function updateAttendance(id, month, d, v) {
      const student = attendance.find(s => s.id === id);
      const today = new Date().toISOString().slice(0, 10);
      if (v === "Present" || v === "Absent") {
        student.months[month][d] = v + " " + today;

        const count = student.months[month].filter(e => e.startsWith("Present") || e.startsWith("Absent")).length;
        if (count >= 12) {
          const num = parseInt(month.split(" ")[1]);
          if (num < 12) student.currentMonth = "Month " + (num + 1);
        }
      } else {
        student.months[month][d] = "";
      }
      saveData();
    }

   function updateFeesStatus(studentId, month, value) {
  const student = attendance.find(s => s.id === studentId);
  
  if (!student.fees[month] || typeof student.fees[month] !== "object") {
    student.fees[month] = { status: value, amount: "200" };
  } else {
    student.fees[month].status = value;
  }
  saveData(); // Add this line
  renderTable();
}

function updateFeesAmount(studentId, month, value) {
  const student = attendance.find(s => s.id === studentId);
  
  if (!student.fees[month] || typeof student.fees[month] !== "object") {
    student.fees[month] = { status: "Unpaid", amount: value };
  } else {
    student.fees[month].amount = value;
  }
  saveData(); // Add this line
  
  renderTable();
}



   function renderTable() {
  const table = document.getElementById("attendanceTable");

  const classFilterEl = document.getElementById("classFilter");
  const searchInputEl = document.getElementById("searchInput");
  const sortSelectEl = document.getElementById("sortSelect");

  const cls = classFilterEl ? classFilterEl.value : "All";
  const searchQuery = searchInputEl ? searchInputEl.value.toLowerCase() : "";
  const sortOption = sortSelectEl ? sortSelectEl.value : "class";

  const list = attendance
    .filter(s => {
      const matchClass = cls === "All" || s.class === cls;
      const matchName = s.name.toLowerCase().includes(searchQuery);
      return matchClass && matchName;
    })
    .sort((a, b) => {
      if (sortOption === "class") {
        return parseInt(b.class) - parseInt(a.class);
      } else if (sortOption === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortOption === "present") {
        const month = document.getElementById("monthSelect")?.value;
        const presentA = a.months?.[month]?.filter(d => d.startsWith("Present")).length || 0;
        const presentB = b.months?.[month]?.filter(d => d.startsWith("Present")).length || 0;
        return presentB - presentA;
      }
      return 0;
    });

  const selectedClass = classFilterEl ? classFilterEl.value : "All";
  
  const classes = [...new Set(attendance.map(s => (s.class || "").trim().toUpperCase()))];


  classFilterEl.innerHTML =
    `<option value="All">All</option>` +
    classes.map(c => `<option value="${c}" ${c === selectedClass ? "selected" : ""}>${c}
        </option>`).join("");

  let html = `<tr>
    <th><input type="checkbox" id="selectAll" onclick="toggleSelectAll(this)"></th>
    <th>#</th><th>Name</th><th>Class</th>`;

  for (let d = 1; d <= daysInMonth; d++) html += `<th>Day ${d}</th>`;

  html += `<th>Total Present Days</th><th>Current Month</th><th>Fees Status</th><th>Fee Amount</th><th>Paid Month</th><th>Actions</th></tr>`;

  list.forEach((student, idx) => {
    const mon = student.currentMonth;
    const data = student.months[mon] || [];

    let row = `<tr>
      <td><input type="checkbox" class="select-student" data-id="${student.id}"></td>
      <td>${idx + 1}</td>
      <td>${student.name}</td>
      <td>${student.class}</td>`;

    for (let day = 0; day < daysInMonth; day++) {
      const entry = data[day] || "";
      let val = "", date = "";
      if (typeof entry === "string" && entry) {
        const parts = entry.split(" ");
        val = parts[0];
        date = parts[1];
      }
      const cls = val === "Present" ? "present" : val === "Absent" ? "absent" : "";
      row += `<td class="${cls}">
        <select onchange="updateAttendance('${student.id}', '${mon}', ${day}, this.value)">
          <option value="">--</option>
          <option value="Present" ${val === "Present" ? "selected" : ""}>P</option>
          <option value="Absent" ${val === "Absent" ? "selected" : ""}>A</option>
        </select>
        <div id="date-${student.id}-${mon}-${day}">
          ${date ? `<small onclick="editDateInline('${student.id}', '${mon}', ${day})">${formatDate(date)}</small>` : ""}
        </div>
      </td>`;
    }

    const total = data.filter(e => typeof e === "string" && e.startsWith("Present")).length;
    

    const globalMonthValue = document.getElementById("monthSelect")?.value || "Month 1";
const currentMonthNumber = parseInt(globalMonthValue.split(" ")[1]);

    const options = Array.from({ length: 12 }, (_, k) => {
  const monthNumber = k + 1;
  const monthLabel = "Month " + monthNumber;
  const monthData = student.months[monthLabel] || [];
  const hasMarked = monthData.some(e => typeof e === "string" && (e.startsWith("Present") || e.startsWith("Absent")));

  const disabled = monthNumber > currentMonthNumber && !hasMarked ? "disabled" : "";

  return `<option value="${monthLabel}" ${monthLabel === student.currentMonth ? "selected" : ""} ${disabled}>${monthLabel}</option>`;
}).join("");



    const feesData = student.fees[mon] || {};
    const feesStatus = feesData.status || "Unpaid";
    const feesAmount = feesData.amount || "0";

    const badgeColor = feesStatus === "Paid" ? "#d4edda" : "#f8d7da";
    const badgeTextColor = feesStatus === "Paid" ? "#155724" : "#721c24";
    const feesStatusSelect = `
      <div style="display:flex; flex-direction:column; align-items:center;">
        <select onchange="updateFeesStatus('${student.id}', '${mon}', this.value)">
          <option value="Paid" ${feesStatus === "Paid" ? "selected" : ""}>Paid</option>
          <option value="Unpaid" ${feesStatus === "Unpaid" ? "selected" : ""}>Unpaid</option>
        </select>
        <span style="margin-top:4px; padding:2px 6px; border-radius:6px; background:${badgeColor}; color:${badgeTextColor}; font-size:12px;">
          ${feesStatus}
        </span>
      </div>`;

    const feesAmountSelect = `<select onchange="updateFeesAmount('${student.id}', '${mon}', this.value)">
      ${[200, 250, 300, 350, 400, 450, 500].map(amount => 
        `<option value="${amount}" ${feesAmount === String(amount) ? "selected" : ""}>${amount}</option>`).join("")}
    </select>`;

    let totalPaid = 0;
    for (let i = 1; i <= 12; i++) {
      const mKey = "Month " + i;
      if (student.fees[mKey]?.status === "Paid") totalPaid++;
    }

    row += `
  <td>${total}</td>
  <td><select onchange="changeMonth('${student.id}', this.value)">${options}</select></td>
  <td>${feesStatusSelect}</td>
  <td>${feesAmountSelect}</td>
  <td>${totalPaid}</td>
  <td style="display:flex; flex-direction:column; align-items:center; gap:4px;">
    <button class="icon-btn" onclick="editStudent('${student.id}')" title="Edit"><i class="fa fa-pen"></i></button>
    <button class="icon-btn" onclick="deleteStudent('${student.id}')" title="Delete"><i class="fa fa-trash"></i></button>
    <button class="icon-btn" onclick="promoteStudent('${student.id}')" title="Promote"><i class="fa fa-arrow-up"></i></button>
    <button class="icon-btn" onclick="demoteStudent('${student.id}')" title="Demote"><i class="fa fa-arrow-down"></i></button>
  </td>
</tr>`;


    html += row;
  });

  table.innerHTML = html;

  let totalFeesThisMonth = 0;
  list.forEach(student => {
    const mon = student.currentMonth;
    const feeData = student.fees[mon];
    if (feeData && feeData.amount) {
      totalFeesThisMonth += parseInt(feeData.amount);
    }
  });

  const totalRow = `
    <tr style="font-weight:bold; background:#f0f0f0;">
      <td colspan="${daysInMonth + 10}" style="text-align:left;">Total Fees This Month:</td>
      <td>₹${totalFeesThisMonth}</td>
    </tr>`;
  table.innerHTML += totalRow;
}

function toggleSelectAll(source) {
  document.querySelectorAll('.select-student').forEach(checkbox => {
    checkbox.checked = source.checked;
  });
}

function promoteStudent(id) {
  const student = attendance.find(s => s.id === id);
  let currentClass = parseInt(student.class);
  if (!isNaN(currentClass)) {
    const confirmed = confirm(`Promote ${student.name} from Class ${currentClass} to Class ${currentClass + 1}?`);
    if (confirmed) {
      student.class = (currentClass + 1).toString();
      saveData();
      renderTable();
    }
  } else {
    alert("Cannot promote: class is not a number.");
  }
}

function demoteStudent(id) {
  const student = attendance.find(s => s.id === id);
  let currentClass = parseInt(student.class);
  if (!isNaN(currentClass) && currentClass > 1) {
    const confirmed = confirm(`Demote ${student.name} from Class ${currentClass} to Class ${currentClass - 1}?`);
    if (confirmed) {
      student.class = (currentClass - 1).toString();
      saveData();
      renderTable();
    }
  } else {
    alert("Cannot demote: class is already the lowest or invalid.");
  }
}



    function toggleSummary() {
  const section = document.getElementById("summarySection");
  const button = document.getElementById("summaryBtn");

  const isHidden = section.style.display === "none" || section.style.display === "";

  if (isHidden) {
    renderSummary();
    section.style.display = "block";
    button.innerHTML = `<i class="fa fa-times" style="color:red;"></i> Close`;
  } else {
    section.style.display = "none";
    button.innerHTML = `<i class="fa fa-list"></i> Show Attendance Summary`;
  }
}



    function renderSummary() {
  const section = document.getElementById("summarySection");
  let html = `<h3>Attendance Summary</h3><table border="1" style="width:100%; border-collapse:collapse;">
                <tr><th>#</th><th>Name</th><th>Class</th><th>Present</th><th>Absent</th><th>Attendance %</th><th>Total Fees</th></tr>`;
  
  attendance.forEach((s, i) => {
    let totalPresent = 0, totalAbsent = 0, totalFees = 0;
    Object.values(s.months).forEach(month => {
      month.forEach(entry => {
        if (entry.startsWith("Present")) totalPresent++;
        if (entry.startsWith("Absent")) totalAbsent++;
      });
    });

    Object.values(s.fees).forEach(fee => {
  if (typeof fee === "object" && fee.status === "Paid" && fee.amount) {
    totalFees += parseInt(fee.amount);
  }
});


    const totalDays = totalPresent + totalAbsent;
    const percent = totalDays ? ((totalPresent / totalDays) * 100).toFixed(1) : "N/A";
    
    html += `<tr>
               <td>${i + 1}</td>
               <td>${s.name}</td>
               <td>${s.class}</td>
               <td>${totalPresent}</td>
               <td>${totalAbsent}</td>
               <td>${percent}%</td>
               <td>₹${totalFees}</td>
             </tr>`;
  });

  html += `</table>`;
  section.innerHTML = html;
}

    loadData();
  
