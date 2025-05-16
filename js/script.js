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

//загрузка страницы авторизации 
/////Проверяем состояние аутентификации///////////////////////////////////////////////////////////////// 
function checkAuthState() {
    // Проверяем наличие токена в localStorage
    const savedToken = localStorage.getItem('authToken');
    
    if (savedToken) {
        TOKEN = savedToken;
        currentUser.isAuthenticated = true;
        currentUser.email = localStorage.getItem('userEmail') || "";
        LoadPage('/modules/authorization.html', context, onLoadAuth);
    } else {
        LoadPage('/modules/message.html', context, initializeChatPage);
    }
}

if (context) {
    checkAuthState();
} else {
    console.error('Context element (.content) not found');
}

////авторизация////////////////////////////////////////////////////////////////////////// 
function onLoadAuth() {
    elementsPage('.go-register')?.addEventListener('click', function() {
        LoadPage('/modules/registration.html', context, DoRegist);
    });

    // Обработчик кнопки смены цвета (не трогаем)//////////////
    let color = ["#FFF8DC", "#FFFFFF"];
    let currentColorIndex = 0;

    const changeColorBtn = elementsPage('#btn_change');
    if (changeColorBtn) {
        changeColorBtn.addEventListener('click', function() {
            document.body.style.background = color[currentColorIndex];
            currentColorIndex = (currentColorIndex + 1) % color.length;
        });
    }
////////////////////////////////////////////////////////////
    // обработчик событий кнопки
    elementsPage('.authorize').addEventListener('click', function() {
        let req_data = new FormData();
        const emailInput = elementsPage('input[name="email"]');
        const passwordInput = elementsPage('input[name="pass"]');

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

// исправть здесь
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    if (response.token) {
                        TOKEN = response.token;
                        localStorage.setItem('authToken', TOKEN);
                        currentUser.isAuthenticated = true;
                        LoadPage('/modules/message.html', context, initializeChatPage);
                    } else {
                        showError('Токен не получен в ответе');
                    }
 
// исправление 
                } else if (xhr.status === 422) {
                    showError('Неверные данные запроса');
                } else if (xhr.status === 401) {
                    showError('Несанкционированный доступ');
                } else if(xhr.status===403){
                    showError('Доступ запрещен');
                }else {
                    showError(`Ошибка: ${xhr.status}`);
                }
            }
        };

        xhr.onerror = function() {
            showError('Ошибка сети при отправке запроса');
        };

        xhr.send(req_data);
    });

    function showError(message) {
        const errorBlock = elementsPage('.message--block');
        if (errorBlock) {
            errorBlock.textContent = message;
        }
    }
}

// В функции DoRegist изменим обработчик успешной регистрации:
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
                const response = JSON.parse(xhr.responseText);
                if (response.token) {
                   
                    localStorage.setItem('regEmail', email);
                    localStorage.setItem('regPass', pass);
                    
                    // Переходим на страницу авторизации
                    LoadPage('/modules/authorization.html', context, function() {
                       
                        const emailInput = elementsPage('input[name="email"]');
                        const passInput = elementsPage('input[name="pass"]');
                     
                        
                        if (emailInput && passInput) {
                            emailInput.value = localStorage.getItem('regEmail') || '';
                            passInput.value = localStorage.getItem('regPass') || '';
                            
                            
                            
                        }
                        
                        // Очищаем временные данные
                        localStorage.removeItem('regEmail');
                        localStorage.removeItem('regPass');
                    });
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
}
////////////////////////////конец регистрации////////////////////////////////////////////////////

function UserFiles() {
    console.log('UserFiles function called');
}

function initializeChatPage() {
  
    if (!currentUser.isAuthenticated || !TOKEN) {
        checkAuthState();
        return;
    }
    
 
    console.log('Chat page initialized for user:', currentUser.email);
    
    // Пример: добавление обработчика выхода
    const logoutBtn = elementsPage('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userEmail');
            TOKEN = '';
            currentUser.isAuthenticated = false;
            currentUser.email = '';
            LoadPage('/modules/authorization.html', context, onLoadAuth);
        });
    }
}