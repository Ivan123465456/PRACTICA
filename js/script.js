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
var TOKEN = 'aj3f0gh2di6b149587ec';
var Email = "";
var EddFile = {};

function GetResponse(params, callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', params.url);
    xhr.setRequestHeader('Authorization', `Bearer ${TOKEN}`);
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
    xhr.setRequestHeader('Authorization', `Bearer ${TOKEN}`);
    
    if (params.contentType) {
        xhr.setRequestHeader('Content-Type', params.contentType);
    }
    
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200 || xhr.status === 201) {
                try {
                    const response = xhr.responseText ? JSON.parse(xhr.responseText) : null;
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

LoadPage('/modules/authorization.html', context, onLoadAuth);

// авторизация
function onLoadAuth() {
    elementsPage('.go-register')?.addEventListener('click', function() {
        LoadPage('/modules/registration.html', context, DoRegist);
    });

    // Обработчик кнопки смены цвета
    let color = ["#FFF8DC", "#FFFFFF"];
    let currentColorIndex = 0;

     document.getElementById('btn_change').addEventListener('click', function() {
        document.body.style.background = color[currentColorIndex];
        currentColorIndex++;
        if (currentColorIndex >= color.length) {
            currentColorIndex = 0;
        }
    });

    elementsPage('.authorize')?.addEventListener('click', function() {
        let req_data = new FormData();
        Email = elementsPage('input[name="email"]').value;

        req_data.append('email', Email);
        req_data.append('pass', elementsPage('input[name="password"]').value);
        
        _post({
            url: `${HOST}/authorization/`, 
            data: req_data
        }, function(response, error) {
            if (error) {
                showError(error.message);
                return;
            }

            if (response && response.success) {
                TOKEN = response.token;
                console.log('Auth token:', TOKEN);
                LoadPage('/modules/profile.html', context, UserFiles);
            } else {
                showError(response?.message || 'Authorization failed');
            }
        });
    });

    function showError(message) {
        const errorBlock = elementsPage('.message--block');
        if (errorBlock) {
            errorBlock.innerHTML = '';
            errorBlock.textContent = message;
        }
    }
}

// регистрация 
function DoRegist() {
    const registerBtn = elementsPage('.register');
    if (!registerBtn) return;

    registerBtn.addEventListener('click', function() {
        let req_data = new FormData();
        Email = elementsPage('input[name="email"]').value;
        
        req_data.append('email', Email);
        req_data.append('pass', elementsPage('input[name="pass"]').value);
        req_data.append('name', elementsPage('input[name="name"]').value);
        req_data.append('fam', elementsPage('input[name="fam"]').value);

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(Email)) {
            showRegError("Пожалуйста, введите корректный адрес электронной почты.");
            return;
        }

        _post({
            url: `${HOST}/registration/`, 
            data: req_data
        }, function(response, error) {
            if (error) {
                showRegError('Registration failed: ' + error.message);
                return;
            }

            if (response && response.success) {
                // Авторизация после успешной регистрации
                let auth_data = new FormData();
                auth_data.append('email', Email);
                auth_data.append('password', elementsPage('input[name="pass"]').value);
                
                _post({
                    url: `${HOST}/authorization/`, 
                    data: auth_data
                }, function(authResponse, authError) {
                    if (authError) {
                        showRegError('Auto-login failed: ' + authError.message);
                        return;
                    }

                    if (authResponse && authResponse.success) {
                        TOKEN = authResponse.token;
                        LoadPage('/modules/message.html', context, initializeChatPage);
                    } else {
                        showRegError(authResponse?.message || 'Auto-login failed');
                    }
                });
            } else {
                showRegError(response?.message || 'Registration failed');
            }
        });
    });

    function showRegError(message) {
        const btnReg = elementsPage('.btn-reg');
        if (btnReg) {
            btnReg.textContent = message;
        }
    }
}

function initializeChatPage() {
    setupChatUI();
    loadChatList();
    // Остальные функции инициализации
}

function setupChatUI() {
    const telegramUI = document.querySelector('telegram-ui');
    if (!telegramUI) return;

    if (!elementsPage('.message-container')) {
        const messageArea = document.createElement('div');
        messageArea.className = 'message-container';
        telegramUI.appendChild(messageArea);
    }
    
    if (!elementsPage('.message-input-area')) {
        const inputArea = document.createElement('div');
        inputArea.className = 'message-input-area';
        inputArea.innerHTML = `
            <input type="text" class="message-input" placeholder="Type a message...">
            <button class="send-message">Send</button>
        `;
        telegramUI.appendChild(inputArea);
    }
}

function loadChatList() {
    _post({
        url: `${HOST}/chats`,
        contentType: 'application/json'
    }, function(response, error) {
        if (error) {
            console.error('Failed to load chat list:', error);
            return;
        }

        const chatContainer = elementsPage('.message-container');
        if (!chatContainer) return;

        if (response && Array.isArray(response)) {
            chatContainer.innerHTML = '';
            response.forEach(chat => {
                const chatElement = document.createElement('div');
                chatElement.className = 'chat-item';
                chatElement.innerHTML = `
                    <h3>${chat.name || 'Unnamed Chat'}</h3>
                    <p>${chat.lastMessage || ''}</p>
                `;
                chatContainer.appendChild(chatElement);
            });
        } else {
            chatContainer.innerHTML = '<p>No chats available</p>';
        }
    });
}

function UploadFiles() {
    // Реализация загрузки файлов с обработкой статусов
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        _post({url: `${HOST}/upload`,data: formData},
            function(response, error) {
            if (error) {
                console.error('Upload failed:', error);
                return;
            }

            if (response && response.success) {
                console.log('File uploaded successfully:', response.fileUrl);
                EddFile = response.fileInfo;
            } else {
                console.error('Upload failed:', response?.message);
            }
        });
    };
    fileInput.click();
}