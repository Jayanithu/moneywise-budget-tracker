let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    
    // Tab switching
    const tabs = document.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('.auth-form');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetForm = tab.dataset.tab;
            
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Show corresponding form
            forms.forEach(form => {
                form.classList.remove('active');
                if (form.id === `${targetForm}Form`) {
                    form.classList.add('active');
                }
            });
        });
    });

    // Login form handling
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        try {
            const result = await window.electronAPI.login({ email, password });
            if (result.success) {
                currentUser = result.user;
                // Main window will be created by main process
            } else {
                alert(result.error);
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed. Please try again.');
        }
    });

    // Signup form handling
    const signupForm = document.getElementById('signupForm');
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const avatarInput = document.getElementById('avatar');
        
        try {
            const userData = {
                name,
                email,
                password,
                avatar: avatarInput.files.length > 0 ? await readFileAsDataURL(avatarInput.files[0]) : null
            };

            const result = await window.electronAPI.signup(userData);
            if (result.success) {
                currentUser = result.user;
                // Main window will be created by main process
            } else {
                alert(result.error);
            }
        } catch (error) {
            console.error('Signup error:', error);
            alert('Signup failed. Please try again.');
        }
    });

    // Avatar preview
    const avatarInput = document.getElementById('avatar');
    const avatarPreview = document.getElementById('avatarPreview');
    
    avatarInput.addEventListener('change', async (e) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                avatarPreview.src = e.target.result;
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    });

    // Password visibility toggle
    const toggleButtons = document.querySelectorAll('.toggle-password');
    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const input = button.parentElement.querySelector('input');
            const icon = button.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.setAttribute('data-lucide', 'eye-off');
            } else {
                input.type = 'password';
                icon.setAttribute('data-lucide', 'eye');
            }
            lucide.createIcons();
        });
    });
});

// Helper function to read file as Data URL
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);


        document.addEventListener('DOMContentLoaded', () => {
            const tabs = document.querySelectorAll('.auth-tab');
            const forms = document.querySelectorAll('.auth-form');
        
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    const targetForm = tab.dataset.tab;
                    tabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    forms.forEach(form => {
                        form.classList.remove('active');
                        if (form.id === `${targetForm}Form`) {
                            form.classList.add('active');
                        }
                    });
                });
            });
        
            document.getElementById('loginForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('loginEmail').value;
                const password = document.getElementById('loginPassword').value;
                try {
                    const result = await window.electronAPI.login({ email, password });
                    if (!result.success) alert(result.error);
                } catch (error) {
                    console.error('Login failed:', error);
                }
            });
        
            document.getElementById('signupForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const name = document.getElementById('signupName').value;
                const email = document.getElementById('signupEmail').value;
                const password = document.getElementById('signupPassword').value;
                try {
                    const result = await window.electronAPI.signup({ name, email, password });
                    if (!result.success) alert(result.error);
                } catch (error) {
                    console.error('Signup failed:', error);
                }
            });
        
            document.getElementById('googleLogin').addEventListener('click', async () => {
                try {
                    const result = await window.electronAPI.googleLogin();
                    if (!result.success) alert(result.error);
                } catch (error) {
                    console.error('Google login failed:', error);
                }
            });
        
            document.querySelectorAll('.toggle-password').forEach(button => {
                button.addEventListener('click', () => {
                    const input = button.parentElement.querySelector('input');
                    input.type = input.type === 'password' ? 'text' : 'password';
                });
            });
        });
        
    });
} 