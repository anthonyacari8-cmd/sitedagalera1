/* =========================================================
   CLOUD SPACE
   HTML + CSS + JAVASCRIPT

   Sistema de fotos entre amigos.

   IMPORTANTE:

   Esta versão utiliza localStorage.

   Isso significa que os dados ficam armazenados
   neste navegador/dispositivo.

   O sistema possui:

   - Contas
   - Login
   - ID único
   - Perfil
   - Foto de perfil
   - Amigos
   - Pedidos de amizade
   - Grupos
   - Fotos pessoais
   - Fotos em grupos
   - Exclusão
   - Download
   - Galeria

========================================================= */


/* =========================================================
   CONFIGURAÇÃO
========================================================= */

const USERS_KEY = "cloud_space_users";

const SESSION_KEY = "cloud_space_session";


/* =========================================================
   ELEMENTOS
========================================================= */

const $ = id =>
    document.getElementById(id);


/* =========================================================
   BANCO LOCAL
========================================================= */

function getUsers() {

    return JSON.parse(
        localStorage.getItem(
            USERS_KEY
        ) || "[]"
    );

}


function saveUsers(users) {

    localStorage.setItem(
        USERS_KEY,
        JSON.stringify(users)
    );

}


function getSession() {

    return localStorage.getItem(
        SESSION_KEY
    );

}


function setSession(id) {

    localStorage.setItem(
        SESSION_KEY,
        id
    );

}


function clearSession() {

    localStorage.removeItem(
        SESSION_KEY
    );

}


/* =========================================================
   GERAR ID ÚNICO
========================================================= */

function generateUniqueId() {

    const users =
        getUsers();


    let id;


    do {

        id =
            "#" +
            Math.floor(
                100000 +
                Math.random() *
                900000
            );

    } while (
        users.some(
            user =>
                user.id === id
        )
    );


    return id;

}


/* =========================================================
   MODELO DE USUÁRIO
========================================================= */

function createUser(
    name,
    email,
    password
) {

    return {

        id:
            generateUniqueId(),

        name:
            name,

        email:
            email,

        password:
            password,

        avatar:
            "",

        friends:
            [],

        receivedRequests:
            [],

        sentRequests:
            [],

        groups:
            [],

        photos:
            []

    };

}


/* =========================================================
   USUÁRIO ATUAL
========================================================= */

function currentUser() {

    const id =
        getSession();


    if (!id) {

        return null;

    }


    const users =
        getUsers();


    return users.find(
        user =>
            user.id === id
    ) || null;

}


/* =========================================================
   SALVAR ALTERAÇÃO
========================================================= */

function updateUser(updatedUser) {

    const users =
        getUsers();


    const index =
        users.findIndex(
            user =>
                user.id ===
                updatedUser.id
        );


    if (index === -1) {

        return;

    }


    users[index] =
        updatedUser;


    saveUsers(users);

}


/* =========================================================
   ATUALIZAR VÁRIOS USUÁRIOS
========================================================= */

function updateUsers(users) {

    saveUsers(users);

}


/* =========================================================
   LOGIN / CADASTRO
========================================================= */

function showLogin() {

    $("loginBox")
        .classList
        .remove("hidden");

    $("registerBox")
        .classList
        .add("hidden");

}


function showRegister() {

    $("loginBox")
        .classList
        .add("hidden");

    $("registerBox")
        .classList
        .remove("hidden");

}


$("showRegister")
    .addEventListener(
        "click",
        showRegister
    );


$("showLogin")
    .addEventListener(
        "click",
        showLogin
    );


/* =========================================================
   CADASTRO
========================================================= */

$("registerForm")
    .addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            const name =
                $("registerName")
                    .value
                    .trim();


            const email =
                $("registerEmail")
                    .value
                    .trim()
                    .toLowerCase();


            const password =
                $("registerPassword")
                    .value;


            const error =
                $("registerError");


            error.textContent =
                "";


            if (
                name.length < 2
            ) {

                error.textContent =
                    "Digite seu nome.";

                return;

            }


            if (
                password.length < 6
            ) {

                error.textContent =
                    "A senha precisa ter pelo menos 6 caracteres.";

                return;

            }


            const users =
                getUsers();


            const emailExists =
                users.some(
                    user =>
                        user.email ===
                        email
                );


            if (emailExists) {

                error.textContent =
                    "Este e-mail já está cadastrado.";

                return;

            }


            const user =
                createUser(
                    name,
                    email,
                    password
                );


            users.push(
                user
            );


            saveUsers(
                users
            );


            setSession(
                user.id
            );


            $("registerForm")
                .reset();


            openApp();

        }
    );


/* =========================================================
   LOGIN
========================================================= */

$("loginForm")
    .addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            const identifier =
                $("loginIdentifier")
                    .value
                    .trim()
                    .toLowerCase();


            const password =
                $("loginPassword")
                    .value;


            const error =
                $("loginError");


            error.textContent =
                "";


            const users =
                getUsers();


            const user =
                users.find(
                    item =>

                        (
                            item.email
                                .toLowerCase() ===
                            identifier

                        ) ||

                        (
                            item.id
                                .toLowerCase() ===
                            identifier
                        )

                );


            if (
                !user ||
                user.password !==
                password
            ) {

                error.textContent =
                    "ID/e-mail ou senha incorretos.";

                return;

            }


            setSession(
                user.id
            );


            $("loginForm")
                .reset();


            openApp();

        }
    );


/* =========================================================
   ABRIR APLICAÇÃO
========================================================= */

function openApp() {

    $("authScreen")
        .classList
        .add("hidden");


    $("app")
        .classList
        .remove("hidden");


    updateInterface();


    renderHome();

}


/* =========================================================
   LOGOUT
========================================================= */

$("logoutButton")
    .addEventListener(
        "click",
        function() {

            clearSession();


            $("app")
                .classList
                .add("hidden");


            $("authScreen")
                .classList
                .remove("hidden");


            showLogin();

        }
    );


/* =========================================================
   INTERFACE DO USUÁRIO
========================================================= */

function updateInterface() {

    const user =
        currentUser();


    if (!user) {

        return;

    }


    const name =
        user.name ||
        "Usuário";


    const firstLetter =
        name
            .charAt(0)
            .toUpperCase();


    $("topUserName")
        .textContent =
        name;


    $("topUserId")
        .textContent =
        user.id;


    $("homeUserName")
        .textContent =
        name;


    $("topAvatar")
        .textContent =
        firstLetter;


    $("profileName")
        .textContent =
        name;


    $("profileEmail")
        .textContent =
        user.email;


    $("profileId")
        .textContent =
        user.id;


    const profileAvatar =
        $("profileAvatar");


    if (
        user.avatar
    ) {

        profileAvatar.style.backgroundImage =
            `url("${user.avatar}")`;

        profileAvatar.textContent =
            "";

    } else {

        profileAvatar.style.backgroundImage =
            "";

        profileAvatar.textContent =
            firstLetter;

    }

}


/* =========================================================
   NAVEGAÇÃO
========================================================= */

const pages = {

    home: {
        element:
            "homePage",
        title:
            "Início",
        subtitle:
            "Seu Cloud Space"
    },

    photos: {
        element:
            "photosPage",
        title:
            "Minhas fotos",
        subtitle:
            "Sua galeria pessoal"
    },

    friends: {
        element:
            "friendsPage",
        title:
            "Amigos",
        subtitle:
            "Pessoas que você adicionou"
    },

    groups: {
        element:
            "groupsPage",
        title:
            "Grupos",
        subtitle:
            "Compartilhe fotos com seus amigos"
    },

    profile: {
        element:
            "profilePage",
        title:
            "Meu perfil",
        subtitle:
            "Suas informações"
    },

    groupChat: {
        element:
            "groupChatPage",
        title:
            "Grupo",
        subtitle:
            "Fotos do grupo"
    }

};


function openPage(pageName) {

    Object.values(
        pages
    ).forEach(
        page => {

            const element =
                $(page.element);


            if (element) {

                element
                    .classList
                    .add("hidden");

            }

        }
    );


    const page =
        pages[
            pageName
        ];


    if (!page) {

        return;

    }


    $(page.element)
        .classList
        .remove("hidden");


    $("pageTitle")
        .textContent =
        page.title;


    $("pageSubtitle")
        .textContent =
        page.subtitle;


    document
        .querySelectorAll(
            ".nav-button[data-page]"
        )
        .forEach(
            button => {

                button
                    .classList
                    .remove(
                        "active"
                    );


                if (
                    button.dataset.page ===
                    pageName
                ) {

                    button
                        .classList
                        .add(
                            "active"
                        );

                }

            }
        );


    if (
        pageName ===
        "home"
    ) {

        renderHome();

    }


    if (
        pageName ===
        "photos"
    ) {

        renderPhotos();

    }


    if (
        pageName ===
        "friends"
    ) {

        renderFriends();

    }


    if (
        pageName ===
        "groups"
    ) {

        renderGroups();

    }


    if (
        pageName ===
        "profile"
    ) {

        updateInterface();

    }

}


document
    .querySelectorAll(
        ".nav-button[data-page]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    openPage(
                        button.dataset.page
                    );

                }
            );

        }
    );


document
    .querySelectorAll(
        "[data-open-page]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    openPage(
                        button.dataset.openPage
                    );

                }
            );

        }
    );


/* =========================================================
   FOTOS
========================================================= */

$("homeUploadButton")
    .addEventListener(
        "click",
        () => {

            $("photoInput")
                .click();

        }
    );


$("photosUploadButton")
    .addEventListener(
        "click",
        () => {

            $("photoInput")
                .click();

        }
    );


$("photoInput")
    .addEventListener(
        "change",
        function(event) {

            const files =
                Array.from(
                    event.target.files
                );


            uploadPersonalPhotos(
                files
            );


            event.target.value =
                "";

        }
    );


function uploadPersonalPhotos(
    files
) {

    const user =
        currentUser();


    if (!user) {

        return;

    }


    if (!files.length) {

        return;

    }


    let completed =
        0;


    files.forEach(
        file => {

            if (
                !file.type
                    .startsWith(
                        "image/"
                    )
            ) {

                completed++;

                return;

            }


            const reader =
                new FileReader();


            reader.onload =
                function(event) {

                    const photo = {

                        id:
                            crypto
                                .randomUUID(),

                        name:
                            file.name,

                        data:
                            event.target
                                .result,

                        size:
                            file.size,

                        createdAt:
                            Date.now()

                    };


                    user.photos
                        .unshift(
                            photo
                        );


                    completed++;


                    if (
                        completed ===
                        files.length
                    ) {

                        updateUser(
                            user
                        );


                        updateInterface();


                        renderHome();


                        renderPhotos();

                    }

                };


            reader.readAsDataURL(
                file
            );

        }
    );

}


/* =========================================================
   RENDERIZAR HOME
========================================================= */

function renderHome() {

    const user =
        currentUser();


    if (!user) {

        return;

    }


    $("statPhotos")
        .textContent =
        user.photos.length;


    $("statFriends")
        .textContent =
        user.friends.length;


    $("statGroups")
        .textContent =
        user.groups.length;


    const container =
        $("recentPhotos");


    container.innerHTML =
        "";


    if (
        !user.photos.length
    ) {

        container.innerHTML =
            emptyState(
                "Nenhuma foto ainda",
                "Adicione suas primeiras fotos."
            );

        return;

    }


    user.photos
        .slice(0, 8)
        .forEach(
            photo => {

                container.appendChild(
                    createPhotoCard(
                        photo,
                        true
                    )
                );

            }
        );

}


/* =========================================================
   MINHAS FOTOS
========================================================= */

function renderPhotos() {

    const user =
        currentUser();


    if (!user) {

        return;

    }


    const container =
        $("myPhotos");


    container.innerHTML =
        "";


    if (
        !user.photos.length
    ) {

        container.innerHTML =
            emptyState(
                "Sua galeria está vazia",
                "Clique em Adicionar fotos."
            );

        return;

    }


    user.photos.forEach(
        photo => {

            container.appendChild(
                createPhotoCard(
                    photo,
                    true
                )
            );

        }
    );

}


/* =========================================================
   CARD DE FOTO
========================================================= */

function createPhotoCard(
    photo,
    canDelete
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "photo-card";


    const imageArea =
        document.createElement(
            "div"
        );


    imageArea.className =
        "photo-card-image";


    const image =
        document.createElement(
            "img"
        );


    image.src =
        photo.data;


    image.alt =
        photo.name;


    imageArea.appendChild(
        image
    );


    imageArea.addEventListener(
        "click",
        () => {

            openPhoto(
                photo.data
            );

        }
    );


    card.appendChild(
        imageArea
    );


    if (canDelete) {

        const deleteButton =
            document.createElement(
                "button"
            );


        deleteButton.className =
            "photo-delete";


        deleteButton.textContent =
            "×";


        deleteButton.title =
            "Excluir foto";


        deleteButton.addEventListener(
            "click",
            event => {

                event.stopPropagation();


                deletePersonalPhoto(
                    photo.id
                );

            }
        );


        card.appendChild(
            deleteButton
        );

    }


    const info =
        document.createElement(
            "div"
        );


    info.className =
        "photo-card-info";


    const title =
        document.createElement(
            "strong"
        );


    title.textContent =
        photo.name;


    const date =
        document.createElement(
            "span"
        );


    date.textContent =
        formatDate(
            photo.createdAt
        );


    info.appendChild(
        title
    );


    info.appendChild(
        date
    );


    card.appendChild(
        info
    );


    return card;

}


/* =========================================================
   EXCLUIR FOTO
========================================================= */

function deletePersonalPhoto(
    photoId
) {

    const user =
        currentUser();


    if (!user) {

        return;

    }


    const confirmed =
        confirm(
            "Deseja excluir esta foto?"
        );


    if (!confirmed) {

        return;

    }


    user.photos =
        user.photos.filter(
            photo =>
                photo.id !==
                photoId
        );


    updateUser(
        user
    );


    renderHome();

    renderPhotos();

}


/* =========================================================
   MODAL DE FOTO
========================================================= */

function openPhoto(
    source
) {

    $("modalPhoto")
        .src =
        source;


    $("photoModal")
        .classList
        .remove(
            "hidden"
        );

}


$("closePhotoModal")
    .addEventListener(
        "click",
        () => {

            $("photoModal")
                .classList
                .add(
                    "hidden"
                );

        }
    );


$("photoModal")
    .addEventListener(
        "click",
        event => {

            if (
                event.target ===
                $("photoModal")
            ) {

                $("photoModal")
                    .classList
                    .add(
                        "hidden"
                    );

            }

        }
    );


/* =========================================================
   AMIGOS
========================================================= */

$("searchFriendButton")
    .addEventListener(
        "click",
        searchFriend
    );


$("friendSearchInput")
    .addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Enter"
            ) {

                searchFriend();

            }

        }
    );


function searchFriend() {

    const id =
        $("friendSearchInput")
            .value
            .trim()
            .toUpperCase();


    const container =
        $("friendSearchResult");


    container.innerHTML =
        "";


    if (!id) {

        return;

    }


    const me =
        currentUser();


    const users =
        getUsers();


    const found =
        users.find(
            user =>
                user.id
                    .toUpperCase() ===
                id
        );


    if (!found) {

        container.innerHTML =
            `
                <div class="empty">
                    <strong>Pessoa não encontrada</strong>
                    <span>Confira o ID informado.</span>
                </div>
            `;

        return;

    }


    if (
        found.id ===
        me.id
    ) {

        container.innerHTML =
            `
                <div class="empty">
                    <strong>Esse é o seu próprio ID</strong>
                    <span>Procure outro usuário.</span>
                </div>
            `;

        return;

    }


    const alreadyFriend =
        me.friends
            .includes(
                found.id
            );


    const alreadySent =
        me.sentRequests
            .includes(
                found.id
            );


    const alreadyReceived =
        me.receivedRequests
            .includes(
                found.id
            );


    const card =
        createPersonCard(
            found,
            false
        );


    const button =
        document.createElement(
            "button"
        );


    button.className =
        "secondary-button";


    if (
        alreadyFriend
    ) {

        button.textContent =
            "Amigos";

        button.disabled =
            true;

    }

    else if (
        alreadySent
    ) {

        button.textContent =
            "Pedido enviado";

        button.disabled =
            true;

    }

    else if (
        alreadyReceived
    ) {

        button.textContent =
            "Pedido recebido";

        button.addEventListener(
            "click",
            () => {

                acceptFriend(
                    found.id
                );

                searchFriend();

            }
        );

    }

    else {

        button.textContent =
            "Adicionar";

        button.addEventListener(
            "click",
            () => {

                sendFriendRequest(
                    found.id
                );

                searchFriend();

            }
        );

    }


    card.appendChild(
        button
    );


    container.appendChild(
        card
    );

}


/* =========================================================
   CRIAR CARD DE PESSOA
========================================================= */

function createPersonCard(
    user,
    showButton
) {

    const card =
        document.createElement(
            "div"
        );


    card.className =
        "person-card";


    if (
        user.avatar
    ) {

        const avatar =
            document.createElement(
                "img"
            );


        avatar.className =
            "person-avatar";


        avatar.src =
            user.avatar;


        card.appendChild(
            avatar
        );

    }

    else {

        const avatar =
            document.createElement(
                "div"
            );


        avatar.className =
            "person-avatar-letter";


        avatar.textContent =
            user.name
                .charAt(0)
                .toUpperCase();


        card.appendChild(
            avatar
        );

    }


    const info =
        document.createElement(
            "div"
        );


    info.className =
        "person-info";


    const name =
        document.createElement(
            "strong"
        );


    name.textContent =
        user.name;


    const id =
        document.createElement(
            "span"
        );


    id.textContent =
        user.id;


    info.appendChild(
        name
    );


    info.appendChild(
        id
    );


    card.appendChild(
        info
    );


    return card;

}


/* =========================================================
   ENVIAR PEDIDO
========================================================= */

function sendFriendRequest(
    targetId
) {

    const users =
        getUsers();


    const me =
        users.find(
            user =>
                user.id ===
                getSession()
        );


    const target =
        users.find(
            user =>
                user.id ===
                targetId
        );


    if (
        !me ||
        !target
    ) {

        return;

    }


    if (
        me.friends
            .includes(
                targetId
            )
    ) {

        return;

    }


    if (
        !me.sentRequests
            .includes(
                targetId
            )
    ) {

        me.sentRequests
            .push(
                targetId
            );

    }


    if (
        !target.receivedRequests
            .includes(
                me.id
            )
    ) {

        target.receivedRequests
            .push(
                me.id
            );

    }


    updateUsers(
        users
    );


    renderFriends();

}


/* =========================================================
   PEDIDOS
========================================================= */

function renderFriends() {

    const me =
        currentUser();


    if (!me) {

        return;

    }


    renderFriendRequests(
        me
    );


    renderFriendsList(
        me
    );

}


function renderFriendRequests(
    me
) {

    const container =
        $("friendRequests");


    container.innerHTML =
        "";


    if (
        !me.receivedRequests.length
    ) {

        container.innerHTML =
            `
                <div class="empty">
                    <strong>Nenhum pedido</strong>
                    <span>Quando alguém enviar um pedido, aparecerá aqui.</span>
                </div>
            `;

        return;

    }


    const users =
        getUsers();


    me.receivedRequests
        .forEach(
            id => {

                const person =
                    users.find(
                        user =>
                            user.id ===
                            id
                    );


                if (!person) {

                    return;

                }


                const card =
                    createPersonCard(
                        person,
                        false
                    );


                const accept =
                    document.createElement(
                        "button"
                    );


                accept.className =
                    "primary-button";


                accept.textContent =
                    "Aceitar";


                accept.addEventListener(
                    "click",
                    () => {

                        acceptFriend(
                            person.id
                        );

                    }
                );


                const reject =
                    document.createElement(
                        "button"
                    );


                reject.className =
                    "danger-button";


                reject.textContent =
                    "Recusar";


                reject.addEventListener(
                    "click",
                    () => {

                        rejectFriend(
                            person.id
                        );

                    }
                );


                card.appendChild(
                    accept
                );


                card.appendChild(
                    reject
                );


                container.appendChild(
                    card
                );

            }
        );

}


/* =========================================================
   ACEITAR AMIZADE
========================================================= */

function acceptFriend(
    friendId
) {

    const users =
        getUsers();


    const me =
        users.find(
            user =>
                user.id ===
                getSession()
        );


    const friend =
        users.find(
            user =>
                user.id ===
                friendId
        );


    if (
        !me ||
        !friend
    ) {

        return;

    }


    if (
        !me.friends
            .includes(
                friend.id
            )
    ) {

        me.friends
            .push(
                friend.id
            );

    }


    if (
        !friend.friends
            .includes(
                me.id
            )
    ) {

        friend.friends
            .push(
                me.id
            );

    }


    me.receivedRequests =
        me.receivedRequests
            .filter(
                id =>
                    id !==
                    friend.id
            );


    friend.sentRequests =
        friend.sentRequests
            .filter(
                id =>
                    id !==
                    me.id
            );


    updateUsers(
        users
    );


    renderFriends();

    renderHome();

}


/* =========================================================
   RECUSAR
========================================================= */

function rejectFriend(
    friendId
) {

    const users =
        getUsers();


    const me =
        users.find(
            user =>
                user.id ===
                getSession()
        );


    const friend =
        users.find(
            user =>
                user.id ===
                friendId
        );


    if (
        !me ||
        !friend
    ) {

        return;

    }


    me.receivedRequests =
        me.receivedRequests
            .filter(
                id =>
                    id !==
                    friendId
            );


    friend.sentRequests =
        friend.sentRequests
            .filter(
                id =>
                    id !==
                    me.id
            );


    updateUsers(
        users
    );


    renderFriends();

}


/* =========================================================
   LISTA DE AMIGOS
========================================================= */

function renderFriendsList(
    me
) {

    const container =
        $("friendsList");


    container.innerHTML =
        "";


    if (
        !me.friends.length
    ) {

        container.innerHTML =
            `
                <div class="empty">
                    <strong>Você ainda não tem amigos</strong>
                    <span>Use o ID de alguém para enviar um pedido.</span>
                </div>
            `;

        return;

    }


    const users =
        getUsers();


    me.friends
        .forEach(
            id => {

                const friend =
                    users.find(
                        user =>
                            user.id ===
                            id
                    );


                if (!friend) {

                    return;

                }


                const card =
                    createPersonCard(
                        friend,
                        false
                    );


                const remove =
                    document.createElement(
                        "button"
                    );


                remove.className =
                    "danger-button";


                remove.textContent =
                    "Remover";


                remove.addEventListener(
                    "click",
                    () => {

                        removeFriend(
                            friend.id
                        );

                    }
                );


                card.appendChild(
                    remove
                );


                container.appendChild(
                    card
                );

            }
        );

}


/* =========================================================
   REMOVER AMIGO
========================================================= */

function removeFriend(
    friendId
) {

    const users =
        getUsers();


    const me =
        users.find(
            user =>
                user.id ===
                getSession()
        );


    const friend =
        users.find(
            user =>
                user.id ===
                friendId
        );


    if (
        !me ||
        !friend
    ) {

        return;

    }


    if (
        !confirm(
            "Remover esta pessoa dos seus amigos?"
        )
    ) {

        return;

    }


    me.friends =
        me.friends
            .filter(
                id =>
                    id !==
                    friendId
            );


    friend.friends =
        friend.friends
            .filter(
                id =>
                    id !==
                    me.id
            );


    updateUsers(
        users
    );


    renderFriends();

    renderHome();

}


/* =========================================================
   GRUPOS
========================================================= */

let selectedGroupId =
    null;


$("createGroupButton")
    .addEventListener(
        "click",
        openGroupModal
    );


$("closeGroupModal")
    .addEventListener(
        "click",
        closeGroupModal
    );


function openGroupModal() {

    const me =
        currentUser();


    if (!me) {

        return;

    }


    $("groupNameInput")
        .value =
        "";


    $("groupAvatarInput")
        .value =
        "";


    renderGroupFriendSelection();


    $("groupModal")
        .classList
        .remove(
            "hidden"
        );

}


function closeGroupModal() {

    $("groupModal")
        .classList
        .add(
            "hidden"
        );

}


/* =========================================================
   SELECIONAR AMIGOS
========================================================= */

function renderGroupFriendSelection() {

    const container =
        $("groupFriendsSelection");


    container.innerHTML =
        "";


    const me =
        currentUser();


    if (
        !me.friends.length
    ) {

        container.innerHTML =
            `
                <div class="empty">
                    <strong>Você não possui amigos</strong>
                    <span>Adicione amigos antes de criar o grupo.</span>
                </div>
            `;

        return;

    }


    const users =
        getUsers();


    me.friends
        .forEach(
            id => {

                const friend =
                    users.find(
                        user =>
                            user.id ===
                            id
                    );


                if (!friend) {

                    return;

                }


                const item =
                    document.createElement(
                        "label"
                    );


                item.className =
                    "selection-item";


                const checkbox =
                    document.createElement(
                        "input"
                    );


                checkbox.type =
                    "checkbox";


                checkbox.value =
                    friend.id;


                const text =
                    document.createElement(
                        "span"
                    );


                text.textContent =
                    `${friend.name} (${friend.id})`;


                item.appendChild(
                    checkbox
                );


                item.appendChild(
                    text
                );


                container.appendChild(
                    item
                );

            }
        );

}


/* =========================================================
   CRIAR GRUPO
========================================================= */

$("confirmCreateGroup")
    .addEventListener(
        "click",
        createGroup
    );


function createGroup() {

    const me =
        currentUser();


    if (!me) {

        return;

    }


    const name =
        $("groupNameInput")
            .value
            .trim();


    if (!name) {

        alert(
            "Digite um nome para o grupo."
        );

        return;

    }


    const selected =
        Array.from(
            document.querySelectorAll(
                "#groupFriendsSelection input:checked"
            )
        )
        .map(
            input =>
                input.value
        );


    if (
        !selected.length
    ) {

        alert(
            "Escolha pelo menos um amigo."
        );

        return;

    }


    const avatarFile =
        $("groupAvatarInput")
            .files[0];


    if (
        avatarFile
    ) {

        const reader =
            new FileReader();


        reader.onload =
            event => {

                finishGroupCreation(
                    name,
                    selected,
                    event.target.result
                );

            };


        reader.readAsDataURL(
            avatarFile
        );

    }

    else {

        finishGroupCreation(
            name,
            selected,
            ""
        );

    }

}


function finishGroupCreation(
    name,
    selected,
    avatar
) {

    const users =
        getUsers();


    const me =
        users.find(
            user =>
                user.id ===
                getSession()
        );


    const group = {

        id:
            crypto
                .randomUUID(),

        name:
            name,

        avatar:
            avatar,

        members:
            [
                me.id,
                ...selected
            ],

        photos:
            [],

        createdAt:
            Date.now()

    };


    me.groups
        .push(
            group
        );


    /*
       Para permitir que os outros membros
       também vejam o grupo no navegador
       local, colocamos uma cópia do grupo
       em cada conta.
    */

    selected.forEach(
        memberId => {

            const member =
                users.find(
                    user =>
                        user.id ===
                        memberId
                );


            if (!member) {

                return;

            }


            if (
                !member.groups
                    .some(
                        item =>
                            item.id ===
                            group.id
                    )
            ) {

                member.groups
                    .push(
                        JSON.parse(
                            JSON.stringify(
                                group
                            )
                        )
                    );

            }

        }
    );


    saveUsers(
        users
    );


    closeGroupModal();


    renderGroups();

    renderHome();

}


/* =========================================================
   RENDERIZAR GRUPOS
========================================================= */

function renderGroups() {

    const me =
        currentUser();


    if (!me) {

        return;

    }


    const container =
        $("groupsList");


    container.innerHTML =
        "";


    if (
        !me.groups.length
    ) {

        container.innerHTML =
            `
                <div class="empty">
                    <strong>Nenhum grupo ainda</strong>
                    <span>Crie um grupo e escolha seus amigos.</span>
                </div>
            `;

        return;

    }


    me.groups.forEach(
        group => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "group-card";


            const top =
                document.createElement(
                    "div"
                );


            top.className =
                "group-card-top";


            const avatar =
                document.createElement(
                    "div"
                );


            avatar.className =
                "group-avatar";


            if (
                group.avatar
            ) {

                avatar.style.backgroundImage =
                    `url("${group.avatar}")`;

                avatar.style.backgroundSize =
                    "cover";

                avatar.textContent =
                    "";

            }

            else {

                avatar.textContent =
                    group.name
                        .charAt(0)
                        .toUpperCase();

            }


            const info =
                document.createElement(
                    "div"
                );


            const title =
                document.createElement(
                    "h3"
                );


            title.textContent =
                group.name;


            const description =
                document.createElement(
                    "p"
                );


            description.textContent =
                `${group.members.length} membros`;


            info.appendChild(
                title
            );


            info.appendChild(
                description
            );


            top.appendChild(
                avatar
            );


            top.appendChild(
                info
            );


            card.appendChild(
                top
            );


            const footer =
                document.createElement(
                    "div"
                );


            footer.className =
                "group-card-footer";


            const photos =
                document.createElement(
                    "span"
                );


            photos.textContent =
                `${group.photos.length} fotos`;


            footer.appendChild(
                photos
            );


            const open =
                document.createElement(
                    "span"
                );


            open.textContent =
                "Abrir →";


            footer.appendChild(
                open
            );


            card.appendChild(
                footer
            );


            card.addEventListener(
                "click",
                () => {

                    openGroup(
                        group.id
                    );

                }
            );


            container.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   ABRIR GRUPO
========================================================= */

function openGroup(
    groupId
) {

    selectedGroupId =
        groupId;


    const me =
        currentUser();


    const group =
        me.groups.find(
            item =>
                item.id ===
                groupId
        );


    if (!group) {

        return;

    }


    $("groupChatName")
        .textContent =
        group.name;


    $("groupChatMembers")
        .textContent =
        `${group.members.length} membros`;


    const avatar =
        $("groupChatAvatar");


    if (
        group.avatar
    ) {

        avatar.style.backgroundImage =
            `url("${group.avatar}")`;

        avatar.style.backgroundSize =
            "cover";

        avatar.textContent =
            "";

    }

    else {

        avatar.style.backgroundImage =
            "";

        avatar.textContent =
            group.name
                .charAt(0)
                .toUpperCase();

    }


    openPage(
        "groupChat"
    );


    renderGroupPhotos();

}


/* =========================================================
   VOLTAR
========================================================= */

$("backToGroups")
    .addEventListener(
        "click",
        () => {

            selectedGroupId =
                null;

            openPage(
                "groups"
            );

        }
    );


/* =========================================================
   FOTOS DO GRUPO
========================================================= */

function renderGroupPhotos() {

    const me =
        currentUser();


    if (
        !me ||
        !selectedGroupId
    ) {

        return;

    }


    const group =
        me.groups.find(
            item =>
                item.id ===
                selectedGroupId
        );


    if (!group) {

        return;

    }


    const container =
        $("groupPhotos");


    container.innerHTML =
        "";


    if (
        !group.photos.length
    ) {

        container.innerHTML =
            `
                <div class="empty">
                    <strong>Nenhuma foto no grupo</strong>
                    <span>Seja o primeiro a compartilhar uma foto.</span>
                </div>
            `;

        return;

    }


    group.photos
        .forEach(
            photo => {

                const card =
                    document.createElement(
                        "article"
                    );


                card.className =
                    "group-photo";


                const image =
                    document.createElement(
                        "img"
                    );


                image.src =
                    photo.data;


                image.alt =
                    photo.name;


                image.addEventListener(
                    "click",
                    () => {

                        openPhoto(
                            photo.data
                        );

                    }
                );


                card.appendChild(
                    image
                );


                const info =
                    document.createElement(
                        "div"
                    );


                info.className =
                    "group-photo-info";


                const sender =
                    document.createElement(
                        "strong"
                    );


                sender.textContent =
                    photo.senderName;


                const date =
                    document.createElement(
                        "span"
                    );


                date.textContent =
                    formatDate(
                        photo.createdAt
                    );


                info.appendChild(
                    sender
                );


                info.appendChild(
                    date
                );


                card.appendChild(
                    info
                );


                if (
                    photo.senderId ===
                    me.id
                ) {

                    const remove =
                        document.createElement(
                            "button"
                        );


                    remove.className =
                        "photo-delete";


                    remove.textContent =
                        "×";


                    remove.title =
                        "Excluir foto";


                    remove.addEventListener(
                        "click",
                        event => {

                            event.stopPropagation();


                            deleteGroupPhoto(
                                group.id,
                                photo.id
                            );

                        }
                    );


                    card.appendChild(
                        remove
                    );

                }


                container.appendChild(
                    card
                );

            }
        );

}


/* =========================================================
   INPUT DO GRUPO
========================================================= */

$("groupPhotoButton")
    .addEventListener(
        "click",
        () => {

            $("groupPhotoInput")
                .click();

        }
    );


$("groupPhotoInput")
    .addEventListener(
        "change",
        function(event) {

            const files =
                Array.from(
                    event.target.files
                );


            uploadGroupPhotos(
                files
            );


            event.target.value =
                "";

        }
    );


/* =========================================================
   ENVIAR FOTO PARA GRUPO
========================================================= */

function uploadGroupPhotos(
    files
) {

    const users =
        getUsers();


    const me =
        users.find(
            user =>
                user.id ===
                getSession()
        );


    if (
        !me ||
        !selectedGroupId
    ) {

        return;

    }


    const group =
        me.groups.find(
            item =>
                item.id ===
                selectedGroupId
        );


    if (!group) {

        return;

    }


    let processed =
        0;


    files.forEach(
        file => {

            if (
                !file.type
                    .startsWith(
                        "image/"
                    )
            ) {

                processed++;

                return;

            }


            const reader =
                new FileReader();


            reader.onload =
                event => {

                    const photo = {

                        id:
                            crypto
                                .randomUUID(),

                        name:
                            file.name,

                        data:
                            event.target
                                .result,

                        senderId:
                            me.id,

                        senderName:
                            me.name,

                        size:
                            file.size,

                        createdAt:
                            Date.now()

                    };


                    /*
                       Adiciona a foto ao grupo
                       da conta atual.
                    */

                    group.photos
                        .push(
                            photo
                        );


                    /*
                       Atualiza a mesma foto
                       nas cópias do grupo
                       existentes nas contas
                       dos outros membros.
                    */

                    users.forEach(
                        user => {

                            if (
                                user.id ===
                                me.id
                            ) {

                                return;

                            }


                            const otherGroup =
                                user.groups.find(
                                    item =>
                                        item.id ===
                                        group.id
                                );


                            if (
                                otherGroup
                            ) {

                                otherGroup.photos
                                    .push()
                                        JSON.parse(
                                            JSON.stringify(
                                                photo
                                            )
                                        );

                            }

                        }
                    );


                    processed++;


                    if (
                        processed ===
                        files.length
                    ) {

                        saveUsers(
                            users
                        );


                        renderGroupPhotos();

                        renderGroups();

                    }

                };


            reader.readAsDataURL(
                file
            );

        }
    );

}


/* =========================================================
   EXCLUIR FOTO DO GRUPO
========================================================= */

function deleteGroupPhoto(
    groupId,
    photoId
) {

    const users =
        getUsers();


    const me =
        users.find(
            user =>
                user.id ===
                getSession()
        );


    if (!me) {

        return;

    }


    const group =
        me.groups.find(
            item =>
                item.id ===
                groupId
        );


    if (!group) {

        return;

    }


    if (
        !confirm(
            "Excluir esta foto do grupo?"
        )
    ) {

        return;

    }


    group.photos =
        group.photos.filter(
            photo =>
                photo.id !==
                photoId
        );


    /*
       Remove a foto das cópias
       dos demais membros.
    */

    users.forEach(
        user => {

            const otherGroup =
                user.groups.find(
                    item =>
                        item.id ===
                        groupId
                );


            if (
                otherGroup
            ) {

                otherGroup.photos =
                    otherGroup.photos.filter(
                        photo =>
                            photo.id !==
                            photoId
                    );

            }

        }
    );


    saveUsers(
        users
    );


    renderGroupPhotos();

    renderGroups();

}


/* =========================================================
   FOTO DE PERFIL
========================================================= */

$("changeAvatarButton")
    .addEventListener(
        "click",
        () => {

            $("avatarInput")
                .click();

        }
    );


$("avatarInput")
    .addEventListener(
        "change",
        function(event) {

            const file =
                event.target.files[0];


            if (!file) {

                return;

            }


            if (
                !file.type
                    .startsWith(
                        "image/"
                    )
            ) {

                return;

            }


            const reader =
                new FileReader();


            reader.onload =
                event => {

                    const user =
                        currentUser();


                    user.avatar =
                        event.target
                            .result;


                    updateUser(
                        user
                    );


                    updateInterface();

                };


            reader.readAsDataURL(
                file
            );


            event.target.value =
                "";

        }
    );


/* =========================================================
   COPIAR ID
========================================================= */

$("copyIdButton")
    .addEventListener(
        "click",
        async () => {

            const user =
                currentUser();


            if (!user) {

                return;

            }


            try {

                await navigator
                    .clipboard
                    .writeText(
                        user.id
                    );


                $("copyIdButton")
                    .textContent =
                    "ID copiado!";


                setTimeout(
                    () => {

                        $("copyIdButton")
                            .textContent =
                            "Copiar ID";

                    },
                    1500
                );

            }

            catch {

                alert(
                    "Seu ID é: " +
                    user.id
                );

            }

        }
    );


/* =========================================================
   ESTADO VAZIO
========================================================= */

function emptyState(
    title,
    description
) {

    const div =
        document.createElement(
            "div"
        );


    div.className =
        "empty";


    const strong =
        document.createElement(
            "strong"
        );


    strong.textContent =
        title;


    const span =
        document.createElement(
            "span"
        );


    span.textContent =
        description;


    div.appendChild(
        strong
    );


    div.appendChild(
        span
    );


    return div;

}


/* =========================================================
   DATA
========================================================= */

function formatDate(
    timestamp
) {

    const date =
        new Date(
            timestamp
        );


    return date.toLocaleString(
        "pt-BR",
        {
            day:
                "2-digit",

            month:
                "2-digit",

            year:
                "numeric",

            hour:
                "2-digit",

            minute:
                "2-digit"
        }
    );

}


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        const session =
            getSession();


        if (
            session &&
            currentUser()
        ) {

            openApp();

        }

        else {

            showLogin();

        }

    }
);
