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

///////////////////////////////////

// Добавляем функцию инициализации страницы профиля
function initializeChatPage() {
    if (!currentUser.isAuthenticated || !TOKEN) {
        checkAuthState();
        return;
    }

    console.log('Chat page initialized for user:', currentUser.email);
    
    const logoutBtn = elementsPage('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Инициализация чатов
    initChats();
    
    // Инициализация обработчиков сообщений
    initMessageHandlers();
    
    Profile();
    outMessage();
}

function initChats() {
    // Обработчики для чатов
    const chatItems = document.querySelectorAll('.chat-item');
    chatItems.forEach(item => {
        item.addEventListener('click', function() {
            // Удаляем класс active у всех чатов
            document.querySelectorAll('.chat-item').forEach(chat => {
                chat.classList.remove('active');
            });
            
            // Добавляем активность текущему чату
            this.classList.add('active');
            
            // Обновляем заголовок чата
            updateChatHeader(this);
            
            // Загружаем сообщения для выбранного чата
            loadChatMessages(this);
        });
    });

    // Активируем первый чат, если есть
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
            <div class=""
            <div class="chat-header-name">${userName}</div>
            <div class="chat-header-status">был(а) в сети 5 минут назад</div>
        </div>

    `;

    // Переинициализируем кнопку выхода
    outMessage();
}

function loadChatMessages(chatElement) {
    const chatMessages = elementsPage('.chat-messages');
    if (!chatMessages) return;
    
    // Очищаем предыдущие сообщения
    chatMessages.innerHTML = '';
    

    // Временно добавляем тестовые сообщения
    const userName = chatElement.querySelector('.chat-name').textContent.value;
    
    // Входящее сообщение
    const incomingMsg = document.createElement('div');
    incomingMsg.className = 'message incoming';
    incomingMsg.innerHTML = `
        <div class="message-content">Привет, как дела?</div>
        <div class="message-time">${getCurrentTime()}</div>
    `;
    chatMessages.appendChild(incomingMsg);
    
    // Прокручиваем вниз
    chatMessages.scrollTop = chatMessages.scrollHeight;
}


function initMessageHandlers() {
    const sendButton = elementsPage('.send-button');
    const messageInput = elementsPage('.message-input');
    
    if (sendButton && messageInput) {
        sendButton.addEventListener('click', function() {
            sendMessage();
        });
        
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
}

function sendMessage() {
    const messageInput = elementsPage('.message-input');
    if (!messageInput || !messageInput.value.trim()) return;

    const messageText = messageInput.value.trim();
    const chatMessages = elementsPage('.chat-messages');
    
    if (chatMessages) {
        // Создаем элемент сообщения
        const messageElement = document.createElement('div');
        messageElement.className = 'message outgoing';
        messageElement.innerHTML = `
            <div class="message-content">${messageText}</div>
            <div class="message-time">${getCurrentTime()}</div>
        `;
        
        // Добавляем сообщение в чат
        chatMessages.appendChild(messageElement);
        
        // Очищаем поле ввода
        messageInput.value = '';
        
        // Прокручиваем вниз
        chatMessages.scrollTop = chatMessages.scrollHeight;
        loadChatMessages();

    }
}


function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function sendMessageToServer(messageText) {
    const token = getToken();
    if (!token) return;

    const activeChat = document.querySelector('.chat-item.active');
    if (!activeChat) return;

    const chatId = activeChat.dataset.chatId || 'default';
    
    _post({
        url: `${HOST}/messages/`,
        data: JSON.stringify({
            text: messageText,
            chatId: chatId,
            timestamp: new Date().toISOString()
        })
    },
    (response, error) => {
        if (error) {
            console.error('Ошибка отправки сообщения:', error);
            // Можно добавить уведомление пользователю
        } else {
            console.log('Сообщение успешно отправлено:', response);
        }
    });
       xhr.send(JSON.stringify(data));
}
    
 


function getActiveChatId() {
    const activeChat = document.querySelector('.chat-item.active');
    return activeChat ? activeChat.dataset.chatId || 'default' : 'default';
}