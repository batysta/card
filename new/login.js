import { auth, signInWithEmailAndPassword, onAuthStateChanged } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorMsg = document.getElementById('login-error');
    const submitBtn = document.getElementById('login-submit-btn');

    // Check if user is already logged in
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in, redirect to admin panel
            window.location.href = 'admin.html';
        }
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            showError('Por favor, preencha e-mail e senha.');
            return;
        }

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Entrando...';
            errorMsg.classList.remove('active');

            await signInWithEmailAndPassword(auth, email, password);
            // It will automatically redirect by onAuthStateChanged above
        } catch (error) {
            console.error('Erro no login:', error);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Entrar no painel';

            let message = 'Erro ao fazer login. Tente novamente.';
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                message = 'E-mail ou senha incorretos.';
            } else if (error.code === 'auth/too-many-requests') {
                message = 'Muitas tentativas falhas. Tente novamente mais tarde.';
            }

            showError(message);
        }
    });

    function showError(message) {
        errorMsg.textContent = message;
        errorMsg.classList.add('active');
    }
});
