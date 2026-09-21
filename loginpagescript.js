//Assignment of the accounbt role to the currentRole variable

let currentRole = 'admin'; 

function setRole(role) {
    currentRole = role; 
    
    const btnAdmin = document.getElementById('btn-admin');
    const btnSuper = document.getElementById('btn-super');

    if (role === 'admin') {
        btnAdmin.classList.add('active');
        btnSuper.classList.remove('active');
    } else {
        btnSuper.classList.add('active');
        btnAdmin.classList.remove('active');
    }
}

// this is the credentials for the admin and super admin accounts. The user can only log in using these credentials.

function handleLoginSubmit(event) {
    event.preventDefault(); 
    
    const emailInput = document.getElementById('email').value;
    const passwordInput = document.getElementById('password').value;

    const validAdminEmail = "admin@insec.com";
    const validAdminPassword = "admin123";

    const validSuperEmail = "super@insec.com";
    const validSuperPassword = "super123";

    if (currentRole === 'admin') {
        if (emailInput === validAdminEmail && passwordInput === validAdminPassword) {
            window.location.href = "AdminDashboard.html"; 
        } else {
            alert("Invalid Admin credentials! Please use:\nEmail: admin@insec.com\nPassword: admin123");
        }
    } else if (currentRole === 'super') {
        if (emailInput === validSuperEmail && passwordInput === validSuperPassword) {
            window.location.href = "TeacherAccountManagement.html"; 
        } else {
            alert("Invalid Super Admin credentials! Please use:\nEmail: super@insec.com\nPassword: super123");
        }
    }
}