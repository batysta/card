import {
    auth, db, storage,
    onAuthStateChanged, signOut,
    collection, addDoc, getDocs, deleteDoc, doc, query, orderBy,
    ref, uploadBytes, getDownloadURL
} from './firebase-config.js';

document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('page-loader');
    const container = document.getElementById('admin-container');
    const userInfo = document.getElementById('user-info');
    const logoutBtn = document.getElementById('logout-btn');

    // Form Elements
    const form = document.getElementById('news-form');
    const titleInput = document.getElementById('news-title');
    const dateInput = document.getElementById('news-date');
    const summaryInput = document.getElementById('news-summary');
    const contentInput = document.getElementById('news-content');
    const linkInput = document.getElementById('news-source-link');
    const imageMethod = document.getElementById('news-image-method');
    const imageFileGroup = document.getElementById('image-upload-group');
    const fileInput = document.getElementById('news-image-file');
    const imageUrlGroup = document.getElementById('image-url-group');
    const urlInput = document.getElementById('news-image-url');
    const submitBtn = document.getElementById('submit-news-btn');
    const statusMsg = document.getElementById('form-status');
    const tableBody = document.getElementById('admin-news-list');

    // --- Auth Check ---
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Logged in
            userInfo.textContent = `Logado como: ${user.email}`;
            loader.style.display = 'none';
            container.style.display = 'grid'; // .admin-layout display

            // Load existing news right away
            fetchNews();
        } else {
            // Not logged in
            window.location.href = 'login.html';
        }
    });

    // --- Logout ---
    logoutBtn.addEventListener('click', () => {
        signOut(auth).then(() => {
            window.location.href = 'login.html';
        });
    });

    // --- Image Method Toggle ---
    imageMethod.addEventListener('change', () => {
        const val = imageMethod.value;
        if (val === 'upload') {
            imageFileGroup.style.display = 'block';
            imageUrlGroup.style.display = 'none';
        } else if (val === 'url') {
            imageFileGroup.style.display = 'none';
            imageUrlGroup.style.display = 'block';
        } else {
            imageFileGroup.style.display = 'none';
            imageUrlGroup.style.display = 'none';
        }
    });

    // --- Set Today as Default Date ---
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    dateInput.value = `${yyyy}-${mm}-${dd}`;

    // --- Submit News ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = titleInput.value.trim();
        const dateVal = dateInput.value; // YYYY-MM-DD
        const summary = summaryInput.value.trim();
        const content = contentInput.value.trim();
        const link = linkInput.value.trim();

        // Convert YYYY-MM-DD to DD/MM/YYYY for the site parsing functions
        const parts = dateVal.split('-');
        const formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;

        // Handle Image
        let finalImageUrl = '';
        const imethod = imageMethod.value;

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Publicando...';
            statusMsg.textContent = '';
            statusMsg.style.color = '';

            if (imethod === 'url') {
                finalImageUrl = urlInput.value.trim();
            } else if (imethod === 'upload' && fileInput.files.length > 0) {
                const file = fileInput.files[0];
                // Create unique name
                const fileName = `noticias/${Date.now()}_${file.name}`;
                const storageRef = ref(storage, fileName);

                statusMsg.textContent = 'Fazendo upload da imagem...';
                await uploadBytes(storageRef, file);
                finalImageUrl = await getDownloadURL(storageRef);
            }

            statusMsg.textContent = 'Salvando notícia no banco de dados...';

            // Save to Firestore
            const docRef = await addDoc(collection(db, "noticias"), {
                titulo: title,
                data: formattedDate,
                isoDate: new Date(dateVal).toISOString(), // Used for sorting securely
                resumo: summary,
                conteudo: content,
                link: link,
                imagem_url: finalImageUrl,
                status: 'PUBLICADO',
                createdAt: new Date().toISOString()
            });

            statusMsg.textContent = '✅ Notícia publicada com sucesso!';
            statusMsg.style.color = '#28a745';

            form.reset();
            dateInput.value = `${yyyy}-${mm}-${dd}`; // reset date
            imageMethod.value = 'upload';
            imageMethod.dispatchEvent(new Event('change'));

            setTimeout(() => {
                statusMsg.textContent = '';
            }, 4000);

            // Refresh list
            fetchNews();

        } catch (error) {
            console.error("Erro ao publicar:", error);
            statusMsg.textContent = "❌ Erro ao publicar. Verifique o console.";
            statusMsg.style.color = '#dc3545';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Publicar Notícia';
        }
    });

    // --- Fetch and Display News ---
    async function fetchNews() {
        try {
            // Order by descending date so newest show first
            const q = query(collection(db, "noticias"), orderBy("isoDate", "desc"));
            const querySnapshot = await getDocs(q);

            tableBody.innerHTML = ''; // clear

            if (querySnapshot.empty) {
                tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Nenhuma notícia encontrada.</td></tr>';
                return;
            }

            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const tr = document.createElement('tr');

                const hasImage = data.imagem_url ? 'Sim' : 'Não';

                tr.innerHTML = `
          <td>${data.data}</td>
          <td><strong>${data.titulo}</strong></td>
          <td>${hasImage}</td>
          <td class="action-buttons">
            <button class="btn-delete" data-id="${docSnap.id}">Excluir</button>
          </td>
        `;
                tableBody.appendChild(tr);
            });

            // Attach delete listeners
            document.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', deleteNews);
            });

        } catch (error) {
            console.error("Erro ao buscar notícias:", error);
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: red;">Erro ao carregar os dados.</td></tr>';
        }
    }

    // --- Delete News ---
    async function deleteNews(e) {
        const id = e.target.getAttribute('data-id');
        if (!id) return;

        if (confirm('Tem certeza que deseja excluir esta notícia? Esta ação não pode ser desfeita.')) {
            try {
                e.target.disabled = true;
                e.target.textContent = '...';
                await deleteDoc(doc(db, "noticias", id));
                fetchNews(); // Reload
            } catch (error) {
                console.error("Erro ao excluir:", error);
                alert('Erro ao excluir notícia. Verifique as permissões.');
                e.target.disabled = false;
                e.target.textContent = 'Excluir';
            }
        }
    }

});
