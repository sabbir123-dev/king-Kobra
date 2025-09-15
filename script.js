// Global variables
let currentUser = null;
let currentRole = null;
let currentToken = null;
let applications = [];

// API base URL
const API_BASE = 'http://localhost:3000/api';
function handleLevelChange() {
    const level = document.getElementById('level').value;
    const semesterSelect = document.getElementById('semester');
    const courseNameGroup = document.getElementById('courseNameGroup');
    
    // Reset semester when level changes
    semesterSelect.selectedIndex = 0;
    
    if (level === 'CSE') {
        // For CSE: show semester dropdown and course select
        semesterSelect.disabled = false;
        semesterSelect.onchange = updateCourseOptions;
        
        // Replace with select dropdown for courses
        courseNameGroup.innerHTML = `
            <label for="courseName">Course Name</label>
            <select id="courseName" required>
                <option value="">Please select a semester first</option>
            </select>
        `;
    } else if (level) {
        // For non-CSE departments: disable semester and show text input
        semesterSelect.disabled = true;
        semesterSelect.onchange = null;
        
        // Replace with text input for course name
        courseNameGroup.innerHTML = `
            <label for="courseName">Course Name</label>
            <input type="text" id="courseName" placeholder="Enter course name" required>
        `;
    } else {
        // No level selected
        semesterSelect.disabled = true;
        courseNameGroup.innerHTML = `
            <label for="courseName">Course Name</label>
            <select id="courseName" required>
                <option value="">Please select a level first</option>
            </select>
        `;
    }
}

function updateCourseOptions() {
    const semester = document.getElementById('semester').value;
    const courseSelect = document.getElementById('courseName');
    
    // Clear existing options
    courseSelect.innerHTML = '';
    
    if (!semester) {
        courseSelect.innerHTML = '<option value="">Please select a semester first</option>';
        return;
    }
    
    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select Course';
    courseSelect.appendChild(defaultOption);
    
    // Define courses for each semester (CSE only)
    const coursesBySemester = {
        '1': [
            'ENG 1100 Sentence and Their Elements',
            'ENG 1203 Reading and Writing',
            'GED 1202 Emergence of Bangladesh',
            'CSE 1101 Introduction to Computers'
        ],
        '2': [
            'MATH 1101 Mathematics I (Differential Calculus and Integral Calculus)',
            'CSE 1102 Structured Programming Language',
            'CSE 1157 Structured Programming Language Lab Works',
            'ENG 1102 English Language-II: Listening & Speaking',
            'CSE 1258 Discrete Mathematics'
        ],
        '3': [
            'MATH 1302 Mathematics II (Differential Equation & Fourier Analysis)',
            'CSE 1307 Object Oriented Programming I (C++)',
            'CSE 1360 Object Oriented Programming I (C++) Lab Work',
            'PHY 1201 Physics I',
            'CSE 2111 Data Structure',
            'CSE 2162 Data Structure Lab Works',
            'HUM 1301 Economics'
        ],
        '4': [
            'CSE 2263 Algorithm Design and Analysis',
            'CSE 2367 Algorithm Design and Analysis Lab Work',
            'CSE 1205 Electrical Engineering and Circuit Analysis',
            'CSE 1259 Electrical Engineering and Circuit Analysis Lab Work',
            'CSE 1290 Software Development I',
            'MATH 2103 Mathematics III (Matrices, Vectors & Coordinate Geometry)',
            'PHY 1302 Physics II'
        ],
        '5': [
            'MATH 2204 Mathematics IV (Complex Variable & Laplace Transformation)',
            'CSE 2215 Digital Logic Design',
            'CSE 2265 Digital Logic Design Lab Work',
            'BANG 1101 Bangla Language & Literature',
            'CSE 1290 Software Development I',
            'CSE 2109 Electronic Engineering',
            'CSE 2161 Electronic Engineering Lab Work'
        ],
        '6': [
            'CSE 2291 Software Development II',
            'CHE 2103 Basic Chemistry',
            'MATH 2305 Mathematics-V (Statistics and Probability)',
            'ME 4102 Industrial Management',
            'CSE 2317 Digital Electronics & Pulse Technique',
            'CSE 2366 Digital Electronics & Pulse Technique Lab Works',
            'CSE 3169 Theory of Computation'
        ],
        '7': [
            'CSE 3124 Microprocessor and Assembly Language programming',
            'CSE 3171 Microprocessor and Assembly Language Programming',
            'CSE 3230 Software Engineering',
            'CSE 3227 Compiler Design',
            'CSE 3272 Compiler Design Lab Work',
            'CSE 3331 Operating System',
            'CSE 3373 Operating Lab Work',
            'PHY 1303 Physics Lab Work'
        ],
        '8': [
            'CSE 3333 Object-Oriented Programming II (Java)',
            'CSE 3374 Object-Oriented Programming II Lab Work (Java)',
            'CHE 2103 Basic Chemistry',
            'CSE 3375 Communication Engineering',
            'CSE 4138 Computer Peripherals and Interfacing',
            'CSE 4177 Computer Peripherals and Interfacing Lab Work',
            'CSE 3292 Software Development III (Web Programming)'
        ],
        '9': [
            'CSE 4136 Computer Networks',
            'CSE 4176 Computer Networks Lab Work',
            'CSE 3226 Mathematical Analysis for Computer Science',
            'CSE 4278 Computer Graphics and Multimedia System Design',
            'CSE 4288 Computer Graphics and Multimedia System Design Lab Work',
            'HUM 3302 Financial and Managerial Accounting'
        ],
        '10': [
            'CSE 4241 VLSI Design',
            'CSE 4279 VLSI Design Lab Work',
            'CSE 4349 Management Information System',
            'CSE 3226 Mathematical Analysis for Computer Science'
        ],
        '11': [
            'CSE 4351 Image Processing and Computer Vision',
            'CSE 4383 Image Processing and Computer Vision Lab Work',
            'CSE 4000 Project and Thesis',
            'CSE 4389 Field work (Industrial Training)'
        ],
        '12': []
    };
    
    // Add courses for the selected semester
    if (coursesBySemester[semester]) {
        if (semester === '12') {
            // Special case for semester 12
            alert('Please talk to your teacher for course selection in Semester 12.');
            courseSelect.innerHTML = '<option value="">Contact teacher for course selection</option>';
        } else {
            coursesBySemester[semester].forEach(course => {
                const option = document.createElement('option');
                option.value = course;
                option.textContent = course;
                courseSelect.appendChild(option);
            });
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Make sure semester is disabled initially
    document.getElementById('semester').disabled = true;
});
// Initialize the page
function init() {
    // Check if user is already logged in (token in localStorage)
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('user');
    const savedRole = localStorage.getItem('role');

    if (savedToken && savedUser && savedRole) {
        currentToken = savedToken;
        currentUser = JSON.parse(savedUser);
        currentRole = savedRole;

        if (currentRole === 'student') {
            showStudentDashboard();
        } else {
            showTeacherDashboard();
        }
    } else {
        showHomePage();
    }

    updateNavigation();

    // Set current date as default for application form
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('applicationDate').value = today;
}

// API helper functions
async function apiRequest(url, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (currentToken) {
        headers['Authorization'] = `Bearer ${currentToken}`;
    }

    try {
        const response = await fetch(`${API_BASE}${url}`, {
            ...options,
            headers
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }

        return data;
    } catch (error) {
        console.error('API request failed:', error);
        showModal('Error', error.message || 'An error occurred. Please try again.');
        throw error;
    }
}

// Page navigation functions (remain mostly the same)
function showHomePage() {
    hideAllPages();
    document.getElementById('homePage').style.display = 'block';
    updateNavigation();
}

function showRoleSelection(role) {
    currentRole = role;
    hideAllPages();
    document.getElementById('rolePage').style.display = 'block';
    document.getElementById('roleTitle').textContent = `${role.charAt(0).toUpperCase() + role.slice(1)} Options`;
    updateNavigation();
}

function showRolePage() {
    hideAllPages();
    document.getElementById('rolePage').style.display = 'block';
}

function showSignup() {
    hideAllPages();
    document.getElementById('signupPage').style.display = 'block';
    document.getElementById('signupTitle').textContent = `${currentRole.charAt(0).toUpperCase() + currentRole.slice(1)} Sign Up`;
}

function showLogin() {
    hideAllPages();
    document.getElementById('loginPage').style.display = 'block';
    document.getElementById('loginTitle').textContent = `${currentRole.charAt(0).toUpperCase() + currentRole.slice(1)} Login`;
}

function showStudentDashboard() {
    hideAllPages();
    document.getElementById('studentDashboard').style.display = 'block';
    updateNavigation();
    checkApplicationStatus();
}

function showTeacherDashboard() {
    hideAllPages();
    document.getElementById('teacherDashboard').style.display = 'block';
    updateNavigation();
}

function showApplicationForm() {
    hideAllPages();
    document.getElementById('applicationPage').style.display = 'block';
}

function hideAllPages() {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.style.display = 'none';
    });
}

function updateNavigation() {
    const headerNav = document.getElementById('headerNav');
    headerNav.innerHTML = '';

    if (currentUser) {
        const homeBtn = document.createElement('div');
        homeBtn.className = 'nav-btn btn-secondary';
        homeBtn.textContent = 'Home';
        homeBtn.onclick = showHomePage;

        const profileBtn = document.createElement('div');
        profileBtn.className = 'nav-btn btn-primary';
        profileBtn.textContent = 'Profile';
        profileBtn.onclick = showProfile;

        const logoutBtn = document.createElement('div');
        logoutBtn.className = 'nav-btn btn-login';
        logoutBtn.textContent = 'Logout';
        logoutBtn.onclick = logout;

        headerNav.appendChild(homeBtn);
        headerNav.appendChild(profileBtn);
        headerNav.appendChild(logoutBtn);
    } else {
        // Empty nav when not logged in
    }
}

function showProfile() {
    const profileDrawer = document.getElementById('profileDrawer');
    const profileInfo = document.getElementById('profileInfo');

    profileInfo.innerHTML = `
                <p><strong>Name:</strong> <span>${currentUser.full_name || currentUser.name}</span></p>
                <p><strong>Email:</strong> <span>${currentUser.email}</span></p>
                <p><strong>ID:</strong> <span>${currentUser.student_id || currentUser.teacher_id || currentUser.id}</span></p>
                <p><strong>Role:</strong> <span>${currentRole}</span></p>
            `;

    profileDrawer.classList.add('open');
}

function closeProfile() {
    document.getElementById('profileDrawer').classList.remove('open');
}

function showModal(title, message) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalMessage').textContent = message;
    document.getElementById('messageModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('messageModal').style.display = 'none';
}


async function checkApplicationStatus() {
    const statusElement = document.getElementById('applicationStatus');
    const downloadBtn = document.getElementById('downloadBtn');

    try {
        const response = await apiRequest(`/${currentRole}s/slips`);

        if (response.slips && response.slips.length > 0) {
            const latestApp = response.slips[0]; // Most recent application

            if (latestApp.status === 'approved') {
                statusElement.textContent = 'Approved';
                statusElement.className = 'status status-approved';
                downloadBtn.disabled = false;
                downloadBtn.setAttribute('data-slip-id', latestApp.id);
            } else if (latestApp.status === 'pending') {
                statusElement.textContent = 'Pending Approval';
                statusElement.className = 'status status-pending';
                downloadBtn.disabled = true;
            } else {
                statusElement.textContent = 'Rejected';
                statusElement.className = 'status status-rejected';
                downloadBtn.disabled = true;
            }
        } else {
            statusElement.textContent = 'No application submitted';
            statusElement.className = 'status status-pending';
            downloadBtn.disabled = true;
        }
    } catch (error) {
        statusElement.textContent = 'Error checking status';
        statusElement.className = 'status status-pending';
        downloadBtn.disabled = true;
    }
}

function logout() {
    currentUser = null;
    currentRole = null;
    currentToken = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    showHomePage();
}

const TEACHER_SECRET_CODE = "nub";

// Show secret code modal for teacher verification
function showSecretCodeModal() {
    document.getElementById('secretCodeModal').style.display = 'flex';
}

// Close secret code modal
function closeSecretCodeModal() {
    document.getElementById('secretCodeModal').style.display = 'none';
    document.getElementById('teacherSecretCode').value = '';
}


function verifyTeacherCode() {
    const enteredCode = document.getElementById('teacherSecretCode').value;
    
    if (enteredCode === TEACHER_SECRET_CODE) {
        showModal('Success', 'Correct! You are verified as faculty.');
        closeSecretCodeModal();
        // Now show the signup form
        showSignup();
    } else {
        showModal('Error', 'You are not faculty. Please contact administration if you believe this is an error.');
    }
}


function showRoleSelection(role) {
    currentRole = role;
    
    if (role === 'teacher') {
        // For teachers, show the secret code verification first
        showSecretCodeModal();
    } else {
        // For students, proceed directly to options
        hideAllPages();
        document.getElementById('rolePage').style.display = 'block';
        document.getElementById('roleTitle').textContent = `${role.charAt(0).toUpperCase() + role.slice(1)} Options`;
        updateNavigation();
    }
}

async function downloadPdf() {
    const slipId = document.getElementById('downloadBtn').getAttribute('data-slip-id');

    if (!slipId) {
        showModal('Error', 'No permission slip available for download');
        return;
    }

    try {
        const response = await apiRequest(`/students/slip/${slipId}`);
        const slip = response.slip;

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: [200, 200]
        });
        // Set page dimensions
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const onlyDate = new Date(slip.slip_date).toLocaleDateString();


        // Add university header
        doc.setFillColor(78, 84, 200);
        doc.rect(0, 0, 210, 30, 'F');
        doc.setFontSize(20);
        doc.setTextColor(255, 255, 255);
        doc.text('Northern University of Bangladesh', 105, 15, { align: 'center' });

        // Add permission slip title
        doc.setFontSize(18);
        doc.setTextColor(0, 0, 0);
        doc.text('PERMISSION SLIP', 105, 45, { align: 'center' });

        // Add student information
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(`Name: ${slip.name}`, 20, 60);
        doc.text(`Student ID: ${slip.student_id}`, 20, 70);
        doc.text(`Semester: ${slip.semester}`, 20, 80);
        doc.text(`Section: ${slip.section}`, 20, 90);
        doc.text(`Course Name: ${slip.course_name}`, 20, 100);
        doc.text(`Date: ${onlyDate}`, 20, 110);
        doc.text(`Due Amount: ${slip.due_amount}`, 20, 120);
        doc.text(`Reason: ${slip.reason}`, 20, 130);



        const approvalY = pageHeight - 60; // 60 units from bottom

        // --- Line coordinates ---
        const lineStartX = pageWidth - 65;
        const lineEndX = pageWidth - 20;
        const lineY = approvalY - 5;

        // Draw line
        doc.setDrawColor(0, 0, 0);
        doc.line(lineStartX, lineY, lineEndX, lineY);

        // --- "Approved" centered inside line ---
        doc.setFontSize(10);
        doc.setTextColor(0, 128, 0); // green
        doc.setFont("helvetica", "bold");

        // Midpoint of the line
        const lineMidX = (lineStartX + lineEndX) / 2;
        doc.text("Approved", lineMidX, lineY - 2, { align: "center" }); // slightly above line

        // --- "APPROVAL SIGNATURE" label under line ---
        doc.text("APPROVAL SIGNATURE", pageWidth - 20, approvalY, { align: "right" });


        // --- FOOTER (Bottom Center) ---
        const footerText = "This is an officially generated permission slip from Northern University of Bangladesh";
        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);
        doc.setFont("helvetica", "normal");
        doc.text(footerText, pageWidth / 2, pageHeight - 20, { align: "center" });


        // Save the PDF
        doc.save('permission-slip.pdf');
    } catch (error) {
        showModal('Error', 'Failed to download permission slip');
    }
}


async function loadApplications() {
    const container = document.getElementById('applicationsContainer');
    container.innerHTML = '<h3 style="margin: 20px 0; text-align: center;">Pending Applications</h3>';

    try {
        const response = await apiRequest('/teachers/applications/pending');
        const pendingApplications = response.applications;

        if (pendingApplications.length === 0) {
            container.innerHTML += '<p style="text-align: center;">No pending applications</p>';
            return;
        }

        pendingApplications.forEach((app, index) => {
            const appElement = document.createElement('div');
            appElement.className = 'application-item';
            appElement.innerHTML = `
                        <h4>Application from ${app.name}</h4>
                        <p><strong>Student ID:</strong> ${app.student_id}</p>
                        <p><strong>Level:</strong> ${app.level}</p>
                        <p><strong>Semester:</strong> ${app.semester}</p>
                        <p><strong>Course:</strong> ${app.course_name}</p>
                        <p><strong>Date:</strong> ${app.slip_date}</p>
                        <p><strong>Reason:</strong> ${app.reason}</p>
                        <button class="btn btn-success" onclick="approveApplication(${app.id})">Approve</button>
                        <button class="btn btn-danger" onclick="rejectApplication(${app.id})" style="margin-left: 10px;">Reject</button>
                    `;
            container.appendChild(appElement);
        });
    } catch (error) {
        container.innerHTML += '<p style="text-align: center;">Error loading applications</p>';
    }
}

async function approveApplication(appId) {
    try {
        await apiRequest(`/teachers/applications/${appId}/approve`, {
            method: 'PUT'
        });

        showModal('Success', 'Application approved successfully');
        loadApplications();
    } catch (error) {
        showModal('Error', 'Failed to approve application');
    }
}

async function rejectApplication(appId) {
    try {
        await apiRequest(`/teachers/applications/${appId}/reject`, {
            method: 'PUT'
        });

        showModal('Success', 'Application rejected successfully');
        loadApplications();
    } catch (error) {
        showModal('Error', 'Failed to reject application');
    }
}

async function showApprovedSlips() {
    const container = document.getElementById('applicationsContainer');
    container.innerHTML = '<h3 style="margin: 20px 0; text-align: center;">Approved Applications</h3>';

    try {
        const response = await apiRequest('/teachers/applications/approved');
        const approvedApplications = response.applications;

        if (approvedApplications.length === 0) {
            container.innerHTML += '<p style="text-align: center;">No approved applications</p>';
            return;
        }

        approvedApplications.forEach((app, index) => {
            const appElement = document.createElement('div');
            appElement.className = 'application-item';
            appElement.innerHTML = `
                        <h4>Application from ${app.student_name}</h4>
                        <p><strong>Student ID:</strong> ${app.student_id}</p>
                        <p><strong>Level:</strong> ${app.level}</p>
                        <p><strong>Semester:</strong> ${app.semester}</p>
                        <p><strong>Course:</strong> ${app.course_name}</p>
                        <p><strong>Date:</strong> ${app.slip_date}</p>
                        <p><strong>Approved by:</strong> ${app.approved_by_teacher || 'Unknown'}</p>
                        <div class="status status-approved">Approved</div>
                    `;
            container.appendChild(appElement);
        });
    } catch (error) {
        container.innerHTML += '<p style="text-align: center;">Error loading approved applications</p>';
    }
}

// Form submission handlers - UPDATED TO USE API
document.getElementById('signupForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const name = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const id = document.getElementById('userId').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        showModal('Error', 'Passwords do not match');
        return;
    }

    try {
        const endpoint = currentRole === 'student' ? '/students/signup' : '/teachers/signup';
        const response = await apiRequest(endpoint, {
            method: 'POST',
            body: JSON.stringify({
                fullName: name,
                email: email,
                [currentRole + 'Id']: id,
                password: password
            })
        });

        showModal('Success', 'Your account has been created successfully. Please login.');
        showLogin();
    } catch (error) {
        // Error is handled by apiRequest
    }
});

document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const id = document.getElementById('loginId').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const endpoint = currentRole === 'student' ? '/students/login' : '/teachers/login';
        const response = await apiRequest(endpoint, {
            method: 'POST',
            body: JSON.stringify({
                [currentRole + 'Id']: id,
                password: password
            })
        });

        // Store token and user info
        currentToken = response.token;
        currentUser = response[currentRole];

        localStorage.setItem('authToken', currentToken);
        localStorage.setItem('user', JSON.stringify(currentUser));
        localStorage.setItem('role', currentRole);

        if (currentRole === 'student') {
            showStudentDashboard();
        } else {
            showTeacherDashboard();
        }
    } catch (error) {
        // Error is handled by apiRequest
    }
});
 ``
document.getElementById('applicationForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const level = document.getElementById('level').value;
    const name = document.getElementById('applyName').value;
    const studentId = document.getElementById('applyId').value;
    const semester = document.getElementById('semester').value;
    const section = document.getElementById('section').value;
    const courseName = document.getElementById('courseName').value;
    const dueAmount = document.getElementById('dueAmount').value;
    const reason = document.getElementById('reason').value;
    const date = document.getElementById('applicationDate').value;

    try {
        const response = await apiRequest('/students/apply', {
            method: 'POST',
            body: JSON.stringify({
                level,
                name,
                semester,
                section,
                courseName,
                dueAmount,
                reason,
                slipDate: date
            })
        });

        showModal('Application Submitted', 'Your permission slip application has been submitted. Please wait for approval.');
        showStudentDashboard();
    } catch (error) {
        // Error is handled by apiRequest
    }
});

// Initialize the application
window.onload = init;
