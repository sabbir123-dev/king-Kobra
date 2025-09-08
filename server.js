const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('.'));

// MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'university_portal'
});

// Connect to MySQL
db.connect((err) => {
    if (err) {
        console.log('MySQL connection error:', err);
    } else {
        console.log('Connected to MySQL database');
        
        // Create tables if they don't exist
        createTables();
    }
});

// JWT Secret
const JWT_SECRET = 'your_jwt_secret_key_change_this_in_production';

// Create tables function
function createTables() {
    const sqlCommands = [
        `CREATE TABLE IF NOT EXISTS students (
            id INT AUTO_INCREMENT PRIMARY KEY,
            full_name VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL UNIQUE,
            student_id VARCHAR(20) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS teachers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            full_name VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL UNIQUE,
            teacher_id VARCHAR(20) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS permission_slips (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            level VARCHAR(20) NOT NULL,
            name VARCHAR(100) NOT NULL,
            semester VARCHAR(20) NOT NULL,
            section VARCHAR(20) NOT NULL,
            course_name VARCHAR(100) NOT NULL,
            due_amount DECIMAL(10, 2) NOT NULL,
            reason TEXT NOT NULL,
            slip_date DATE NOT NULL,
            status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
            approved_by INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            user_type ENUM('student', 'teacher') NOT NULL,
            message TEXT NOT NULL,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
    ];

    const executeQuery = (index) => {
        if (index >= sqlCommands.length) {
            console.log('All tables created successfully');
            return;
        }

        db.query(sqlCommands[index], (err, results) => {
            if (err) {
                console.error('Error executing SQL:', sqlCommands[index], err);
            } else {
                executeQuery(index + 1);
            }
        });
    };

    executeQuery(0);
}

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Routes

// 1. Student Signup
app.post('/api/students/signup', async (req, res) => {
    const { fullName, email, studentId, password } = req.body;

    // Validate input
    if (!fullName || !email || !studentId || !password) {
        return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    try {
        // Check if student already exists
        const checkQuery = 'SELECT * FROM students WHERE email = ? OR student_id = ?';
        db.query(checkQuery, [email, studentId], async (err, results) => {
            if (err) {
                return res.status(500).json({ success: false, error: 'Database error' });
            }

            if (results.length > 0) {
                return res.status(400).json({ success: false, error: 'Student already exists' });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert new student
            const insertQuery = 'INSERT INTO students (full_name, email, student_id, password) VALUES (?, ?, ?, ?)';
            db.query(insertQuery, [fullName, email, studentId, hashedPassword], (err, result) => {
                if (err) {
                    return res.status(500).json({ success: false, error: 'Failed to create student' });
                }

                res.status(201).json({ 
                    success: true,
                    message: 'Student created successfully',
                    studentId: result.insertId
                });
            });
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// 2. Student Login
app.post('/api/students/login', (req, res) => {
    const { studentId, password } = req.body;

    // Validate input
    if (!studentId || !password) {
        return res.status(400).json({ success: false, error: 'Student ID and password are required' });
    }

    const query = 'SELECT * FROM students WHERE student_id = ?';
    db.query(query, [studentId], async (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, error: 'Database error' });
        }

        if (results.length === 0) {
            return res.status(400).json({ success: false, error: 'Invalid credentials' });
        }

        const student = results[0];

        // Check password
        const validPassword = await bcrypt.compare(password, student.password);
        if (!validPassword) {
            return res.status(400).json({ success: false, error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: student.id, student_id: student.student_id, type: 'student' },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token,
            student: {
                id: student.id,
                full_name: student.full_name,
                email: student.email,
                student_id: student.student_id
            }
        });
    });
});

// 3. Student Apply for Permission Slip
app.post('/api/students/apply', authenticateToken, (req, res) => {
    if (req.user.type !== 'student') {
        return res.status(403).json({ success: false, error: 'Only students can submit permission slips' });
    }

    const { level, name, semester, section, courseName, dueAmount, reason, slipDate } = req.body;

    // Validate input
    if (!level || !name || !semester || !section || !courseName || !dueAmount || !reason || !slipDate) {
        return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    const query = `
        INSERT INTO permission_slips 
        (student_id, level, name, semester, section, course_name, due_amount, reason, slip_date) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(query, [
        req.user.id, level, name, semester, section, courseName, dueAmount, reason, slipDate
    ], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, error: 'Failed to submit permission slip' });
        }

        // Create notification for student
        const notificationQuery = `
            INSERT INTO notifications (user_id, user_type, message) 
            VALUES (?, 'student', ?)
        `;
        db.query(notificationQuery, [
            req.user.id, 
            'Your permission slip has been submitted and is waiting for approval.'
        ]);

        res.status(201).json({ 
            success: true,
            message: 'Permission slip submitted successfully', 
            id: result.insertId 
        });
    });
});
 


// 4. Get Student's Permission Slips
app.get('/api/students/slips', authenticateToken, (req, res) => {
    if (req.user.type !== 'student') {
        return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const query = 'SELECT * FROM permission_slips WHERE student_id = ? ORDER BY created_at DESC';
    
    db.query(query, [req.user.id], (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, error: 'Database error' });
        }

        res.json({
            success: true,
            slips: results
        });
    });
});

// 5. Download Permission Slip (if approved)
app.get('/api/students/slip/:id', authenticateToken, (req, res) => {
    if (req.user.type !== 'student') {
        return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const slipId = req.params.id;
    
    const query = `
        SELECT ps.*, s.full_name, s.student_id 
        FROM permission_slips ps 
        JOIN students s ON ps.student_id = s.id 
        WHERE ps.id = ? AND ps.student_id = ?
    `;
    
    db.query(query, [slipId, req.user.id], (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, error: 'Database error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, error: 'Permission slip not found' });
        }

        res.json({
            success: true,
            slip: results[0]
        });
    });
});

// 6. Teacher Signup
app.post('/api/teachers/signup', async (req, res) => {
    const { fullName, email, teacherId, password } = req.body;

    // Validate input
    if (!fullName || !email || !teacherId || !password) {
        return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    try {
        // Check if teacher already exists
        const checkQuery = 'SELECT * FROM teachers WHERE email = ? OR teacher_id = ?';
        db.query(checkQuery, [email, teacherId], async (err, results) => {
            if (err) {
                return res.status(500).json({ success: false, error: 'Database error' });
            }

            if (results.length > 0) {
                return res.status(400).json({ success: false, error: 'Teacher already exists' });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert new teacher
            const insertQuery = 'INSERT INTO teachers (full_name, email, teacher_id, password) VALUES (?, ?, ?, ?)';
            db.query(insertQuery, [fullName, email, teacherId, hashedPassword], (err, result) => {
                if (err) {
                    return res.status(500).json({ success: false, error: 'Failed to create teacher' });
                }

                res.status(201).json({ 
                    success: true,
                    message: 'Teacher created successfully',
                    teacherId: result.insertId
                });
            });
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// 7. Teacher Login
app.post('/api/teachers/login', (req, res) => {
    const { teacherId, password } = req.body;

    // Validate input
    if (!teacherId || !password) {
        return res.status(400).json({ success: false, error: 'Teacher ID and password are required' });
    }

    const query = 'SELECT * FROM teachers WHERE teacher_id = ?';
    db.query(query, [teacherId], async (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, error: 'Database error' });
        }

        if (results.length === 0) {
            return res.status(400).json({ success: false, error: 'Invalid credentials' });
        }

        const teacher = results[0];

        // Check password
        const validPassword = await bcrypt.compare(password, teacher.password);
        if (!validPassword) {
            return res.status(400).json({ success: false, error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: teacher.id, teacher_id: teacher.teacher_id, type: 'teacher' },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token,
            teacher: {
                id: teacher.id,
                full_name: teacher.full_name,
                email: teacher.email,
                teacher_id: teacher.teacher_id
            }
        });
    });
});

// 8. Get Pending Applications for Teacher
app.get('/api/teachers/applications/pending', authenticateToken, (req, res) => {
    if (req.user.type !== 'teacher') {
        return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const query = `
        SELECT ps.*, s.full_name, s.student_id 
        FROM permission_slips ps 
        JOIN students s ON ps.student_id = s.id 
        WHERE ps.status = 'pending' 
        ORDER BY ps.created_at DESC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, error: 'Database error' });
        }

        res.json({
            success: true,
            applications: results
        });
    });
});

// 9. Approve Application
app.put('/api/teachers/applications/:id/approve', authenticateToken, (req, res) => {
    if (req.user.type !== 'teacher') {
        return res.status(403).json({ success: false, error: 'Only teachers can approve permission slips' });
    }

    const applicationId = req.params.id;

    const query = 'UPDATE permission_slips SET status = "approved", approved_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    db.query(query, [req.user.id, applicationId], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, error: 'Database error' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Application not found' });
        }

        // Get student ID for notification
        const getStudentQuery = 'SELECT student_id FROM permission_slips WHERE id = ?';
        db.query(getStudentQuery, [applicationId], (err, results) => {
            if (err) {
                return res.status(500).json({ success: false, error: 'Database error' });
            }

            const studentId = results[0].student_id;
            
            // Create notification for student
            const notificationQuery = `
                INSERT INTO notifications (user_id, user_type, message) 
                VALUES (?, 'student', ?)
            `;
            db.query(notificationQuery, [
                studentId, 
                'Your permission slip has been approved. You can now download it.'
            ]);

            res.json({ 
                success: true,
                message: 'Application approved successfully' 
            });
        });
    });
});

// 10. Reject Application
app.put('/api/teachers/applications/:id/reject', authenticateToken, (req, res) => {
    if (req.user.type !== 'teacher') {
        return res.status(403).json({ success: false, error: 'Only teachers can reject permission slips' });
    }

    const applicationId = req.params.id;

    const query = 'UPDATE permission_slips SET status = "rejected", approved_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    db.query(query, [req.user.id, applicationId], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, error: 'Database error' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Application not found' });
        }

        // Get student ID for notification
        const getStudentQuery = 'SELECT student_id FROM permission_slips WHERE id = ?';
        db.query(getStudentQuery, [applicationId], (err, results) => {
            if (err) {
                return res.status(500).json({ success: false, error: 'Database error' });
            }

            const studentId = results[0].student_id;
            
            // Create notification for student
            const notificationQuery = `
                INSERT INTO notifications (user_id, user_type, message) 
                VALUES (?, 'student', ?)
            `;
            db.query(notificationQuery, [
                studentId, 
                'Your permission slip has been rejected. Please contact administration for more details.'
            ]);

            res.json({ 
                success: true,
                message: 'Application rejected successfully' 
            });
        });
    });
});

// 11. Get Approved Applications
app.get('/api/teachers/applications/approved', authenticateToken, (req, res) => {
    if (req.user.type !== 'teacher') {
        return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const query = `
        SELECT ps.*, s.full_name as student_name, s.student_id, t.full_name as approved_by_teacher
        FROM permission_slips ps 
        JOIN students s ON ps.student_id = s.id 
        LEFT JOIN teachers t ON ps.approved_by = t.id 
        WHERE ps.status = 'approved'
        ORDER BY ps.updated_at DESC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, error: 'Database error' });
        }

        res.json({
            success: true,
            applications: results
        });
    });
});

// 12. Get Student Notifications
app.get('/api/students/notifications', authenticateToken, (req, res) => {
    if (req.user.type !== 'student') {
        return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const query = `
        SELECT * FROM notifications 
        WHERE user_id = ? AND user_type = 'student'
        ORDER BY created_at DESC
    `;
    
    db.query(query, [req.user.id], (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, error: 'Database error' });
        }

        res.json({
            success: true,
            notifications: results
        });
    });
});

// Serve the main application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
