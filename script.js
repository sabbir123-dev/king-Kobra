
// Global variables
let currentUser = null;
let currentRole = null;
let currentToken = null;
let applications = [];

// API base URL
const API_BASE = 'http://localhost:3000/api';

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
// Predefined secret code (in a real application, this would be stored securely on the server)
const TEACHER_SECRET_CODE = "nub123456";

// Show secret code modal for teacher verification
function showSecretCodeModal() {
    document.getElementById('secretCodeModal').style.display = 'flex';
}

// Close secret code modal
function closeSecretCodeModal() {
    document.getElementById('secretCodeModal').style.display = 'none';
    document.getElementById('teacherSecretCode').value = '';
}

// Verify teacher secret code
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

// Modify the showRoleSelection function to handle teacher verification
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
        doc.text(`Course: ${slip.course_name}`, 20, 100);
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
