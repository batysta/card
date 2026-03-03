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
    const pageTitle = document.getElementById('admin-page-title');

    // --- Tabs Logic ---
    const adminTabs = document.getElementById('admin-tabs');
    const tabLinks = adminTabs ? adminTabs.querySelectorAll('a[data-tab]') : [];
    const tabContents = document.querySelectorAll('.tab-content');

    tabLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            // Remove active classes
            tabLinks.forEach(l => l.classList.remove('active'));
            tabContents.forEach(c => {
                c.classList.remove('active-tab');
                c.style.display = 'none';
            });

            // Set current tab
            link.classList.add('active');
            const targetId = link.getAttribute('data-tab');
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.classList.add('active-tab');
                targetContent.style.display = 'block';
            }

            // Adjust title based on tab
            if (pageTitle) {
                pageTitle.textContent = link.textContent;
            }
        });
    });

    // Form Elements - News
    const form = document.getElementById('news-form');
    const titleInput = document.getElementById('news-title');
    const dateInput = document.getElementById('news-date');
    const summaryInput = document.getElementById('news-summary');
    // Content will be handled by Quill
    const linkInput = document.getElementById('news-source-link');
    const imageMethod = document.getElementById('news-image-method');
    const imageFileGroup = document.getElementById('image-upload-group');
    const fileInput = document.getElementById('news-image-file');
    const imageUrlGroup = document.getElementById('image-url-group');
    const urlInput = document.getElementById('news-image-url');
    const submitBtn = document.getElementById('submit-news-btn');
    const statusMsg = document.getElementById('form-status');
    const tableBody = document.getElementById('admin-news-list');

    // Form Elements - Agenda
    const agendaForm = document.getElementById('agenda-form');
    const agendaTitleInput = document.getElementById('agenda-title');
    const agendaDateInput = document.getElementById('agenda-date');
    const agendaTimeInput = document.getElementById('agenda-time');
    const agendaLocInput = document.getElementById('agenda-location');
    const agendaSummaryInput = document.getElementById('agenda-summary');
    const agendaSubmitBtn = document.getElementById('submit-agenda-btn');
    const agendaStatusMsg = document.getElementById('agenda-form-status');
    const agendaTableBody = document.getElementById('admin-agenda-list');

    // Form Elements - Convenios
    const conveniosForm = document.getElementById('convenios-form');
    const convenioNameInput = document.getElementById('convenio-name');
    const convenioDiscountInput = document.getElementById('convenio-discount');
    const convenioImageInput = document.getElementById('convenio-image-url');
    const convenioSubmitBtn = document.getElementById('submit-convenio-btn');
    const convenioStatusMsg = document.getElementById('convenio-form-status');
    const convenioTableBody = document.getElementById('admin-convenios-list');

    // Quill variable defined here, but initialized later
    let quill;

    // --- Auth Check ---
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Logged in
            userInfo.textContent = `Logado como: ${user.email}`;
            loader.style.display = 'none';
            container.style.display = 'grid'; // .admin-layout display

            // Initialize Quill Editor now that the container is visible
            quill = new Quill('#news-content-editor', {
                theme: 'snow',
                placeholder: 'Escreva o texto completo da notícia aqui... (Suporta estruturação em parágrafos, listas, etc)',
                modules: {
                    toolbar: [
                        [{ 'header': [2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                        ['link', 'blockquote'],
                        ['clean']
                    ]
                }
            });

            // Load existing data right away
            fetchNews();
            fetchAgenda();
            fetchConvenios();
        } else {
            // Not logged in
            window.location.href = '../pages/login.html';
        }
    });

    // --- Logout ---
    logoutBtn.addEventListener('click', () => {
        signOut(auth).then(() => {
            window.location.href = '../pages/login.html';
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
        const content = quill.root.innerHTML; // Get formatted HTML
        const link = linkInput.value.trim();

        // Convert YYYY-MM-DD to DD/MM/YYYY for the site parsing functions
        const parts = dateVal.split('-');
        const formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;

        // Handle Image
        let finalImageUrl = urlInput ? urlInput.value.trim() : '';

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Publicando...';
            statusMsg.textContent = '';
            statusMsg.style.color = '';

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
            quill.setContents([]); // clear editor
            if (urlInput) urlInput.value = '';

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

    // ==========================================
    // --- AGENDA LOGIC ---
    // ==========================================

    if (agendaForm) {
        agendaForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = agendaTitleInput.value.trim();
            const dateVal = agendaDateInput.value; // YYYY-MM-DD
            const timeVal = agendaTimeInput.value;
            const locVal = agendaLocInput.value.trim();
            const summary = agendaSummaryInput.value.trim();

            const parts = dateVal.split('-');
            const formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;

            try {
                agendaSubmitBtn.disabled = true;
                agendaSubmitBtn.textContent = 'Adicionando...';
                agendaStatusMsg.textContent = 'Salvando na agenda...';

                await addDoc(collection(db, "agenda"), {
                    titulo: title,
                    data: formattedDate,
                    isoDate: new Date(dateVal).toISOString(),
                    horario: timeVal,
                    local: locVal,
                    descricao: summary,
                    status: 'PUBLICADO',
                    createdAt: new Date().toISOString()
                });

                agendaStatusMsg.textContent = '✅ Evento adicionado!';
                agendaStatusMsg.style.color = '#28a745';
                agendaForm.reset();
                setTimeout(() => agendaStatusMsg.textContent = '', 4000);

                fetchAgenda();

            } catch (error) {
                console.error("Erro Agenda:", error);
                agendaStatusMsg.textContent = "❌ Erro ao salvar.";
                agendaStatusMsg.style.color = '#dc3545';
            } finally {
                agendaSubmitBtn.disabled = false;
                agendaSubmitBtn.textContent = 'Publicar na Agenda';
            }
        });
    }

    async function fetchAgenda() {
        if (!agendaTableBody) return;
        try {
            const q = query(collection(db, "agenda"), orderBy("isoDate", "desc"));
            const snapshot = await getDocs(q);
            agendaTableBody.innerHTML = '';

            if (snapshot.empty) {
                agendaTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Nenhum evento na agenda.</td></tr>';
                return;
            }

            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${data.data} ${data.horario ? 'às ' + data.horario : ''}</td>
                    <td><strong>${data.titulo}</strong></td>
                    <td>${data.local}</td>
                    <td class="action-buttons">
                        <button class="btn-delete btn-delete-agenda" data-id="${docSnap.id}">Excluir</button>
                    </td>
                `;
                agendaTableBody.appendChild(tr);
            });

            document.querySelectorAll('.btn-delete-agenda').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.target.getAttribute('data-id');
                    if (confirm('Excluir este evento da Agenda?')) {
                        await deleteDoc(doc(db, "agenda", id));
                        fetchAgenda();
                    }
                });
            });
        } catch (error) {
            console.error("Erro fetch agenda:", error);
            agendaTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:red;">Erro ao carregar os dados.</td></tr>';
        }
    }

    // ==========================================
    // --- CONVENIOS LOGIC ---
    // ==========================================

    if (conveniosForm) {
        conveniosForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = convenioNameInput.value.trim();
            const discount = convenioDiscountInput.value.trim();
            const imageUrl = convenioImageInput.value.trim();

            try {
                convenioSubmitBtn.disabled = true;
                convenioSubmitBtn.textContent = 'Cadastrando...';
                convenioStatusMsg.textContent = 'Salvando parceiro...';

                await addDoc(collection(db, "convenios"), {
                    nome: name,
                    desconto: discount,
                    imagem: imageUrl,
                    createdAt: new Date().toISOString()
                });

                convenioStatusMsg.textContent = '✅ Convênio cadastrado!';
                convenioStatusMsg.style.color = '#28a745';
                conveniosForm.reset();
                setTimeout(() => convenioStatusMsg.textContent = '', 4000);

                fetchConvenios();

            } catch (error) {
                console.error("Erro Convenio:", error);
                convenioStatusMsg.textContent = "❌ Erro ao salvar.";
                convenioStatusMsg.style.color = '#dc3545';
            } finally {
                convenioSubmitBtn.disabled = false;
                convenioSubmitBtn.textContent = 'Cadastrar Convênio';
            }
        });
    }

    async function fetchConvenios() {
        if (!convenioTableBody) return;
        try {
            const q = query(collection(db, "convenios"), orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);
            convenioTableBody.innerHTML = '';

            if (snapshot.empty) {
                convenioTableBody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Nenhum convênio cadastrado.</td></tr>';
                return;
            }

            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${data.nome}</strong></td>
                    <td>${data.desconto}</td>
                    <td class="action-buttons">
                        <button class="btn-delete btn-delete-convenio" data-id="${docSnap.id}">Excluir</button>
                    </td>
                `;
                convenioTableBody.appendChild(tr);
            });

            document.querySelectorAll('.btn-delete-convenio').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.target.getAttribute('data-id');
                    if (confirm('Remover este Parceiro/Convênio?')) {
                        await deleteDoc(doc(db, "convenios", id));
                        fetchConvenios();
                    }
                });
            });
        } catch (error) {
            console.error("Erro fetch convenio:", error);
            convenioTableBody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:red;">Erro ao carregar os dados.</td></tr>';
        }
    }

});
