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
var currentUser = {
    email: "",
    isAuthenticated: false
};
var EddFile = {};

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

// Проверяем состояние аутентификации
function checkAuthState() {
    if (currentUser.isAuthenticated) {
        LoadPage('/modules/message.html', context, initializeChatPage);
    } else {
        LoadPage('/modules/authorization.html', context, onLoadAuth);
    }
}

if (context) {
    checkAuthState();
} else {
    console.error('Context element (.content) not found');
}

// авторизация
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

    elementsPage('.authorize')?.addEventListener('click', function() {
        let req_data = new FormData();
        const emailInput = elementsPage('input[name="email"]');
        const passwordInput = elementsPage('input[name="pass"]');
        
        if (!emailInput || !passwordInput) {
            showError('Email and password fields are required');
            return;
        }

        currentUser.email = emailInput.value.trim();
        const pass = passwordInput.value.trim();
        
        if (!currentUser.email || !pass) {
            showError('Email and password cannot be empty');
            return;
        }

        req_data.append('email', currentUser.email);
        req_data.append('pass', pass);
        
        _post({url: `${HOST}/auth/`, data: req_data}, function(response, error) {
            if (error) {
                showError(error.message);
                return;
            }

            if (response && response.success) {
                currentUser.isAuthenticated = true;
                console.log('Authorization successful');
                LoadPage('/modules/message.html', context, initializeChatPage);
            } else {
                showError(response?.message || 'Authorization failed');
            }
        });
    });

    function showError(message) {
        const errorBlock = elementsPage('.message--block');
        if (errorBlock) {
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
        const emailInput = elementsPage('input[name="email"]');
        
        if (!emailInput) {
            showRegError("Email field is required");
            return;
        }
        
        currentUser.email = emailInput.value.trim();
        const pass = elementsPage('input[name="pass"]')?.value.trim();
        const name = elementsPage('input[name="name"]')?.value.trim();
        const fam = elementsPage('input[name="fam"]')?.value.trim();
        const otch = elementsPage('input[name="otch"]')?.value.trim();
        
        if (!currentUser.email || !pass || !name || !fam || !otch) {
            showRegError("All fields are required");
            return;
        }

        req_data.append('email', currentUser.email);
        req_data.append('pass', pass);
        req_data.append('name', name);
        req_data.append('fam', fam);
        req_data.append('otch', otch);

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(currentUser.email)) {
            showRegError("Please enter a valid email address");
            return;
        }

        _post({url: `${HOST}/user/`, data: req_data}, function(response, error) {
            if (error) {
                showRegError('Server error: ' + error.message);
                return;
            }

            if (response && response.success) {
                currentUser.isAuthenticated = true;
                showRegError('Registration successful');
                LoadPage('/modules/message.html', context, initializeChatPage);
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
}

function setupChatUI() {
    const telegramUI = elementsPage('.telegram-ui');
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
        
        elementsPage('.send-message')?.addEventListener('click', sendMessage);
    }
}

function sendMessage() {
    const input = elementsPage('.message-input');
    if (!input || !input.value.trim()) return;
    
    const message = input.value.trim();
    input.value = '';
    
    _post({
        url: `${HOST}/message/send`,
        contentType: 'application/json',
        data: JSON.stringify({
            email: currentUser.email,
            message: message
        })
    }, function(response, error) {
        if (error) {
            console.error('Failed to send message:', error);
            return;
        }
        
        if (response && response.success) {
            loadChatList();
        } else {
            console.error('Failed to send message:', response?.message);
        }
    });
}

function loadChatList() {
    GetResponse({url: `${HOST}/message/list?email=${encodeURIComponent(currentUser.email)}`}, 
    function(response, error) {
        if (error) {
            console.error('Failed to load chat list:', error);
            return;
        }

        try {
            const chats = JSON.parse(response);
            const chatList = elementsPage('#chatList');
            
            if (chatList) {
                chatList.innerHTML = '';
                
                if (Array.isArray(chats)) {
                    chats.forEach(chat => {
                        const chatItem = document.createElement('div');
                        chatItem.className = 'chat-item';
                        chatItem.innerHTML = `
                            <div class="chat-avatar">${chat.name.charAt(0)}</div>
                            <div class="chat-info">
                                <div class="chat-name">${chat.name}</div>
                                <div class="chat-preview">${chat.lastMessage || 'No messages'}</div>
                            </div>
                            <div class="chat-time">${chat.time || ''}</div>
                        `;
                        chatList.appendChild(chatItem);
                    });
                }
            }
        } catch (e) {
            console.error('Error parsing chat list:', e);
        }
    });
}

function UploadFiles() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('email', currentUser.email);

        _post({
            url: `${HOST}/upload`,
            data: formData
        }, function(response, error) {
            if (error) {
                console.error('Upload failed:', error);
                return;
            }

            if (response && response.success) {
                console.log('File uploaded successfully:', response.fileUrl);
                EddFile = response.fileInfo || {};
            } else {
                console.error('Upload failed:', response?.message || 'Unknown error');
            }
        });
    };
    fileInput.click();
}

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('message.html')) {
        initializeChatPage();
    }
});

function UserFiles() {
    console.log('UserFiles function called');
}