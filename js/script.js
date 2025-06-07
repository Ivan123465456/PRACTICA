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
function SendMessage(){
    const sendmes = elementsPage('#send-button');
    if(sendmes){
        sendmes.addEventListener('click',function(){
            Send_Message();
        });
    }
}

function Send_Message(){
    
    let xhr = new XMLHttpRequest();
    let url =  `${HOST}/messages/`;
    xhr.open('POST',url,true)
    
    
}


function GetMessage(){
    
}
///////////////////////////////////

// Добавляем функцию инициализации страницы профиля
function initializeProfilePage() {

    

    const emailInput = elementsPage('#email');
    const famInput = elementsPage('#fam');
    const nameInput = elementsPage('#name');
    const otchInput = elementsPage('#otch');
    
    if (emailInput) emailInput.value = currentUser.email || '';
    if (famInput) emailInput.value = '';
    if (nameInput) nameInput.value = '';
    if (otchInput) otchInput.value = '';



    const deleteBtn = elementsPage('#deleteProf');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function() {
            if (confirm('Вы действительно хотите удалить свой профиль? Это действие нельзя отменить.')) {
                deleteProfile();
            }
        });
    }

    function deleteProfile() {
        const token = getToken();
        if (!token) {
            alert('Ошибка: пользователь не авторизован');
            return;
        }

        let xhr = new XMLHttpRequest();
        let url = `${HOST}/user/`;
        xhr.open('DELETE', url, true);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        if (response.data) {
                            alert('Профиль успешно удален');
                            logout(); // Выходим после удаления
                        } else {
                            alert('Ошибка при удалении профиля: ' + (response.message || 'Неизвестная ошибка'));
                        }
                    } catch (e) {
                        console.error('Ошибка обработки ответа:', e);
                        alert('Ошибка обработки ответа сервера');
                    }
                } else if (xhr.status === 401) {
                    alert('Ошибка авторизации. Пожалуйста, войдите снова.');
                    logout();
                } else {
                    alert(`Ошибка удаления профиля. Статус: ${xhr.status}`);
                }
            }
        };
        
        xhr.onerror = function() {
            alert('Ошибка сети при попытке удалить профиль');
        };
        
        xhr.send();
    }


    // Обработчик кнопки выхода
    const exitProfBtn = elementsPage('#exit-prof');
    if (exitProfBtn) {
        exitProfBtn.addEventListener('click', function() {
            logout();
        });
    }
    
    // Обработчик кнопки сохранения
    const saveProfBtn = elementsPage('#save-profile');
    if (saveProfBtn) {
        saveProfBtn.addEventListener('click', function() {
           
            alert('Профиль сохранен');
        });
    }
}
    


//выход
function ExitProfile() {
    const exit = elementsPage('#exit-prof'); 
    if (exit) {
        exit.addEventListener('click', function() {
            logout(); 
        });
    }
}


function createUser(){
    
}

///////////////////////////////////////////////////////////// чат 
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

        // Обработчики для чатов
    const chatItems = document.querySelectorAll('.chat-item');
    chatItems.forEach(item => {
        item.addEventListener('click', function() {
            switchTochat(this);
        });
    });

        // Инициализация первого чата как активного
    if(chatItems.length>0){
        switchTochat(chatItems[0]);
    }

    // Удаляем класс active у всех чатов
    function switchTochat(){
        document.querySelectorAll('chat-item').forEach(chat => {
            chat.classList.remove('active');
        });
    }

    // добавляем активность
    chatElement.chatlist.add('active');

    const userName = chatElement.querySelector('.chat-name').textContent.value;
    const lastMessage = chatElement.querySelector('.chat-preview-text').textContent.value;
    const lastMessageTime = chatElement.querySelector('.chat-time').textContent.value;
    const avatarSrc = chatElement.querySelector('.chat-avatar').src;

    updateChatHeader(userName,avatarSrc);
    loadChatUsers(userName,lastMessage,lastMessageTime)

    //обнова имени и авы
    function updateChatHeader(){
        const chatHeader = document.querySelector('.chat-header');
        if (chatHeader){
            const avatar = document.querySelector('.chat-avatar');
            if (avatar){
                avatar.src = avatarSrc;
            }
            const nameElement = document.querySelector('.chat-name');
            if(nameElement){
                nameElement.textContent = userName;
            }
        }
    }

    //очистка
    function loadChatUsers(userName,lastMessage,lastMessageTime){
        const conteiner = document.querySelector('chat-preview-text');
        if (!conteiner) return;
            conteiner.innerHTML = '';
        }

    
    const 
  
    outMessage();
}