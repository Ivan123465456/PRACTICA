// начало



function elementsPage(sel) {
    return document.querySelector(sel);
}

function createContent(sel, content, body) {
    let element = document.createElement(sel);
    element.textContent = content;
    if (body) {
        body.append(element);
        return element;
    } else {
        return element;
    }
}

const HOST = 'http://api-messenger.web-srv.local';
const context = elementsPage('.content');
let TOKEN = ''; 
var currentUser = {
    email: "",
    isAuthenticated: false
};
var EddFile = {};

// получаем запрос
function GetResponse(params, callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', params.url);
    xhr.send();

    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                callback(xhr.responseText);
            } else {
                console.error(`Error ${xhr.status}: ${xhr.statusText}`);
                callback(null, new Error(`Request failed with status ${xhr.status}`));
            }
        }
    };
}

function _post(params, callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('POST', params.url);
    
    if (params.contentType) {
        xhr.setRequestHeader('Content-Type', params.contentType);
    }
    
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    callback(response);
                } catch (e) {
                    console.error('Error parsing JSON:', e);
                    callback(null, new Error('Invalid JSON response'));
                }
            } else {
                console.error(`Error ${xhr.status}: ${xhr.statusText}`);
                callback(null, new Error(`Request failed with status ${xhr.status}`));
            }
        }
    };
    
    xhr.send(params.data);
}

function LoadPage(url, element, callback) {
    if (!element) {
        console.error('Target element not found for URL:', url);
        return;
    }

    let xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.send();

    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                element.innerHTML = xhr.responseText;
                if (callback) {
                    callback();
                }
            } else {
                console.error(`Failed to load page: ${url}. Status: ${xhr.status}`);
                element.innerHTML = `<p>Error loading page. Status: ${xhr.status}</p>`;
            }
        }
    };
}

/////Проверяем состояние аутентификации///////////////////////////////////////////////////////////////// 
function checkAuthState() {
    
    const savedToken = localStorage.getItem('authToken');
    
    if (savedToken) {
         
        TOKEN = savedToken;
        currentUser.isAuthenticated = true;
        currentUser.email = localStorage.getItem('userEmail');
       
        LoadPage('/modules/massage.html', context, initializeChatPage);
    } else{
         LoadPage('/modules/authorization.html', context, onLoadAuth);
    }
}

if (context) {
    checkAuthState();
} else {
    console.error('Context element (.content) not found');
}

//получем токен
function getToken() {
    let token = localStorage.getItem("authToken");
    if (token) {
        return token;
    } else {
        return '';
    }
}

//отправляем токен 
function setToken(token) {
    localStorage.setItem("authToken", token);
    TOKEN = token;
}

//выход из авторизации
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    TOKEN = '';
    currentUser.isAuthenticated = false;
    currentUser.email = '';
    checkAuthState();
}

////авторизация////////////////////////////////////////////////////////////////////////// 
function onLoadAuth() {
    elementsPage('.go-register')?.addEventListener('click', function() {
        LoadPage('/modules/registration.html', context, DoRegist);
    });

    // Обработчик кнопки смены цвета
    let color = ["#FFF8DC", "#FFFFFF"];
    let currentColorIndex = 0;

    const changeColorBtn = elementsPage('#btn_change');
    if (changeColorBtn) {
        changeColorBtn.addEventListener('click', function() {
            document.body.style.background = color[currentColorIndex];
            currentColorIndex = (currentColorIndex + 1) % color.length;
        });
    }

    // обработчик событий кнопки авторизации
    const authButton = elementsPage('.authorize');
    if (authButton) {
        authButton.addEventListener('click', function() {
            let req_data = new FormData();
            const emailInput = elementsPage('input[name="email"]');
            const passwordInput = elementsPage('input[name="pass"]');

            if (!emailInput || !passwordInput) {
                showError('Не найдены поля ввода email или пароля');
                return;
            }

            if (!emailInput.value || !passwordInput.value) {
                showError('Поля электронной почты и пароля обязательны для заполнения.');
                return;
            }

            const email = emailInput.value.trim();
            const pass = passwordInput.value.trim();

            if (!email || !pass) {
                showError('Электронная почта и пароль не могут быть пустыми');
                return;
            }

            req_data.append('email', email);
            req_data.append('pass', pass);

            let xhr = new XMLHttpRequest();
            let url = `${HOST}/auth/`;
            xhr.open("POST", url, true);
            
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        try {
                            const response = JSON.parse(xhr.responseText);
                            if (response.Data) {
                                setToken(response.token);
                                localStorage.setItem('userEmail', email);
                                currentUser.isAuthenticated = true;
                                currentUser.email = email;
                                LoadPage('/modules/massage.html', context, initializeChatPage);
                            } else {
                                showError('Токен не получен в ответе');
                            }
                        } catch (e) {
                            showError('Ошибка обработки ответа сервера');
                        }
                    } else if (xhr.status === 422) {
                        showError('Неверные данные запроса');
                    } else if (xhr.status === 401) {
                        showError('Несанкционированный доступ');
                    } else if (xhr.status === 403) {
                        showError('Доступ запрещен');
                    } else {
                        showError(`Ошибка: ${xhr.status}`);
                    }
                }
            };

            xhr.onerror = function() {
                showError('Ошибка сети при отправке запроса');
            };

            xhr.send(req_data);
        });
       
    }

     Profile();

    function showError(message) {
        const errorBlock = elementsPage('.message--block');
        if (errorBlock) {
            errorBlock.textContent = message;
        }
    }
      exitProfile();
}

// Регистрация............................................................
function DoRegist() {
    const registerBtn = elementsPage('.register');
    if (!registerBtn) return;

    registerBtn.addEventListener('click', function() {
        let req_data = new FormData();
        const emailInput = elementsPage('input[name="email"]');
        const passInput = elementsPage('input[name="pass"]');
        const nameInput = elementsPage('input[name="name"]');
        const famInput = elementsPage('input[name="fam"]');
        const otchInput = elementsPage('input[name="otch"]');

        if (!emailInput || !passInput || !nameInput || !famInput || !otchInput) {
            showRegError("Все поля обязательны для заполнения");
            return;
        }

        const email = emailInput.value.trim(); 
        const pass = passInput.value.trim();
        const name = nameInput.value.trim();
        const fam = famInput.value.trim();
        const otch = otchInput.value.trim();

        if (!email || !pass || !name || !fam || !otch) {
            showRegError("Пожалуйста, заполните все поля");
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            showRegError("Пожалуйста, введите действительный адрес электронной почты");
            return;
        }

        req_data.append('email', email);
        req_data.append('pass', pass);
        req_data.append('name', name);
        req_data.append('fam', fam);
        req_data.append('otch', otch);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${HOST}/user/`);
   
        xhr.onload = function() {
            if (xhr.status === 200) {
                try {
                    const response = JSON.parse(xhr.responseText);

                    if (response.token) {
                        localStorage.setItem('regEmail', email);
                        localStorage.setItem('regPass', pass);
                        LoadPage('/modules/authorization.html', context, function() {
                            const emailInput = elementsPage('input[name="email"]');
                            const passInput = elementsPage('input[name="pass"]');
                            if (emailInput && passInput) {
                                emailInput.value = localStorage.getItem('regEmail') || '';
                                passInput.value = localStorage.getItem('regPass') || '';
                            }
                            localStorage.removeItem('regEmail');
                            localStorage.removeItem('regPass');
                        });
                    } else {
                        showRegError('Регистрация завершена, но токен не получен');
                    }
                } catch (e) {
                    showRegError('Ошибка обработки ответа сервера');
                }
            } else if (xhr.status === 401) {
                showRegError('Несанкционированный доступ');
            } else if (xhr.status === 422) {
                showRegError('Неверные данные запроса');
            } else if (xhr.status === 403) {
                showRegError('Доступ запрещен');
            } else {
                showRegError(`Ошибка регистрации: ${xhr.status}`);
            }
        };

        xhr.onerror = function() {
            showRegError('Ошибка сети во время регистрации');
        };

        xhr.send(req_data);
    });

    function showRegError(message) {
        const btnReg = elementsPage('.message--block');
        if (btnReg) {
            btnReg.textContent = message;
        }
    }
    outReg();
}
////////////////profile/////////////////////////
    function Profile(){
        const enterProf = document.getElementById('profile');
        if(enterProf){
            enterProf.addEventListener('click',function(){
                 LoadPage('/modules/authorization.html', context, onLoadAuth);
            });
        };
        
        
    }
    
/////////////////////////////
function UserFiles() {
    console.log('UserFiles function called');
}
function outMessage(){
    const exitBtn = document.getElementById('exit');
    if(exitBtn){
        exitBtn.addEventListener('click',function(){
            logout();
        });
    }
    
}

function outReg(){
    const exitReg = document.getElementById('exitR');
    if (exitReg){
        exitReg.addEventListener('click',function(){
               LoadPage('/modules/authorization.html', context, onLoadAuth);
        });
    }
}

function Profile() {
    const prof = elementsPage('#profi'); 
    if (prof) {
        prof.addEventListener('click', function() {
                LoadPage('/modules/profile.html', context, initializeProfilePage);
        });
    }
}



///////////////////////////////

function initializeProfilePage() {
    token = getToken();
    // причина вылета
    // if (!currentUser.isAuthenticated || !TOKEN) {
    //     checkAuthState();
    //     return;
    // }
    //

    console.log('Profile page initialized for user:', currentUser.email);
    
    // Заполняем данные профиля
    fillProfileData();
    
    // Инициализируем кнопки
    initProfileButtons();
}

function fillProfileData(){
    const emailInput = elementsPage('#email');
    if(emailInput) emailInput.value = currentUser.email;
}
function initProfileButtons() {
    // Кнопка сохранения
    const saveBtn = elementsPage('#save-profile');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveProfile);
    }
    
    // Кнопка выхода
    const exitBtn = elementsPage('#exit-prof');
    if (exitBtn) {
        exitBtn.addEventListener('click', logout);
            
    }
    
    // Кнопка удаления профиля
    const deleteBtn = elementsPage('#deleteProf');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', deleteProfile);
    }
}

function saveProfile() {
console.log('save');
    
}

function deleteProfile() {
    if (confirm('Вы уверены, что хотите удалить профиль?')) {
        // Здесь можно добавить логику удаления профиля
        alert('Функция удаления профиля будет реализована позже');
    }
}

// Добавляем функцию инициализации страницы профиля







function initializeChatPage() {
    console.log('Chat page initialized');
    
    // Инициализация чатов
    initChats();
    
    // Инициализация обработчиков сообщений
    initMessageHandlers();
    
    // Кнопка выхода
    const logoutBtn = document.getElementById('exit');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            logout(); // Очищаем данные авторизации
            LoadPage('/modules/authorization.html', context, onLoadAuth); // Загружаем страницу авторизации
        });
    }
}



function initChats() {
    const chatItems = document.querySelectorAll('.chat-item');
    chatItems.forEach(item => {
        item.addEventListener('click', function() {
            document.querySelectorAll('.chat-item').forEach(chat => {
                chat.classList.remove('active');
            });
            
            this.classList.add('active');
            updateChatHeader(this);
            loadChatMessages(this);
        });
    });

    if (chatItems.length > 0) {
        chatItems[0].classList.add('active');
        updateChatHeader(chatItems[0]);
        loadChatMessages(chatItems[0]);
    }
}

function updateChatHeader(chatElement) {
    const chatHeader = elementsPage('.chat-header');
    if (!chatHeader) return;

    const userName = chatElement.querySelector('.chat-name').textContent;
    const avatarSrc = chatElement.querySelector('.chat-avatar').src;

    chatHeader.innerHTML = `
        <img src="${avatarSrc}" class="chat-header-avatar">
        <div class="chat-header-info">
            <div class="chat-header-name">${userName}</div>
            <div class="chat-header-status">был(а) в сети ${getCurrentTime()}</div>
        </div>
    `;
}

function loadChatMessages(chatElement) {
    const chatMessages = elementsPage('.chat-messages');
    if (!chatMessages) return;
    
    chatMessages.innerHTML = '';
    
    // Тестовые сообщения
    const incomingMsg = document.createElement('div');
    incomingMsg.className = 'message incoming';
    incomingMsg.innerHTML = `
        <div class="message-content">Привет, как дела?</div>
        <div class="message-time">${getCurrentTime()}</div>
    `;
    chatMessages.appendChild(incomingMsg);
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Обработчики сообщений
function initMessageHandlers() {
    const sendButton = elementsPage('.send-button');
    const messageInput = elementsPage('.message-input');
    
    if (sendButton && messageInput) {
        sendButton.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') sendMessage();
        });
    }
}

function sendMessage() {
    const messageInput = elementsPage('.message-input');
    if (!messageInput || !messageInput.value.trim()) return;

    const messageText = messageInput.value.trim();
    const chatMessages = elementsPage('.chat-messages');
    
    if (chatMessages) {
        // Создаем и добавляем сообщение
        const messageElement = document.createElement('div');
        messageElement.className = 'message outgoing';
        messageElement.innerHTML = `
            <div class="message-content">${messageText}</div>
            <div class="message-time">${getCurrentTime()}</div>
        `;
        chatMessages.appendChild(messageElement);
        
        // Очищаем поле ввода
        messageInput.value = '';
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Отправляем на сервер (без токена)
        sendMessageToServer(messageText);
    }
}

function sendMessageToServer(messageText) {
    const activeChat = document.querySelector('.chat-item.active');
    const chatId = activeChat ? activeChat.dataset.chatId || 'default' : 'default';
    
    // Модифицированная версия без токена
    _post({
        url: `${HOST}/messages/`,
        contentType: 'application/json',
        data: JSON.stringify({
            text: messageText,
            chatId: chatId,
            timestamp: new Date().toISOString()
        })
    }, (response, error) => {
        if (error) {
            console.error('Ошибка отправки сообщения:', error);
        } else {
            console.log('Сообщение отправлено (без аутентификации):', response);
        }
    });
}

function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}



//создание чатов, завтра продолжим
function MakeChat_1(){
    const ChatBtn = document.getElementById('join');
    if (ChatBtn){
        ChatBtn = addEventListener('click',function(){
        MakeChat_2();
        })
    }
}
    function MakeChat_2(){
        const chatInput = elementsPage('.join');
        if(!chat.value) return;

        

        const chatMassage = document.createElement('div');
        chatMassage.className = 'chat-item';
        chatMassage.dataset.chatId = `chat-${Date.now()}`;
        
            newChat.innerHTML = `
        <img src="https://via.placeholder.com/50" class="chat-avatar" alt="Аватар чата">
        <div class="chat-info">
            <div class="chat-name">${chatName}</div>
            <div class="chat-last-message">Новый чат</div>
            <div class="chat-time">${getCurrentTime()}</div>
            <button id='remove'>удалить</удалить>
        </div>
    `;

function updateChatList(){
    const activeChat = document.querySelector('.chat-item.active');
    const activeChatid = activeChat ? activeChat.dataset.chatId:null;

    setTimeout(() => {
        // В реальном приложении здесь будет обработка ответа от сервера
        const mockResponse = {
            success: true,
            chats: [
                {
                    id: 'chat-1',
                    name: 'Общий чат',
                    lastMessage: 'Новое сообщение в общем чате',
                    time: getCurrentTime(),
                    unread: 2
                },
                {
                    id: 'chat-2',
                    name: 'Рабочая группа',
                    lastMessage: 'Задача выполнена',
                    time: getCurrentTime(),
                    unread: 0
                },
                {
                    id: 'chat-3',
                    name: 'Новый чат',
                    lastMessage: 'Добро пожаловать!',
                    time: getCurrentTime(),
                    unread: 1
                }
            ]
        };
        
        // Обновляем список чатов
        renderChatsList(mockResponse.chats, activeChatId);
    }, 500);
}
    // Функция для отрисовки списка чатов
    function renderChatsList(chats,activeChatId){
        const chatList = elementsPage('.chat-list');
        if(!chatList) return;
        
        //сохраняет scroll position
        const scrollPos = chatList.scrollTop

        //очистка 
        chatList.innerHTML = '';

        //добавление каждый чат в список
        chat.forEach(chat => {
        const chatElement = document.createElement('div');
        chatElement.className = `chat-item ${chat.id === activeChatId ? 'active' : ''}`;
        chatElement.dataset.chatId = chat.id;

        
        });
    }

    newChat.addEventListener('click',function(e){
        if(e.target.classList.constains('remove-chat')){
            return;
        }
        document.querySelectorAll('.chat-item').forEach(chat => {
            chat.classList.remove('active');
        });
        this.classList.add('active');
        updateChatHeader(this);
        loadChatMessages(this);
    });

    }

// Инициализация приложения
if (context) {
    checkAuthState();
} else {
    console.error('Context element (.content) not found');
}