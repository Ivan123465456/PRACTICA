// начало
function elementsPage(sel) {
    return document.querySelector(sel);
}

function createPage(sel) {
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

const HOST = 'http://web-app.api-web-tech.local';
const context = elementsPage('.content');
var TOKEN = 'aj3f0gh2di6b149587ec';
var Email = "";
var EddFile = {};

function GetResponse(params, callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', params.url);
    xhr.send();

    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            callback(xhr.responseText);
        }
    };
}

function _post(params, callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('POST', params.url);
    xhr.send(params.data);

    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            callback(xhr.responseText);
        }
    };
}

function LoadPage(url, element, callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.send();

    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            element.innerHTML = xhr.responseText;
            if (callback) {
                callback();
            }
        }
    };
}

LoadPage('/modules/authorization.html', context, onLoadAuth);

// авторизация
function onLoadAuth() {
    elementsPage('.go-register').addEventListener('click', function() {
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

    elementsPage('.authorize').addEventListener('click', function() {
        let req_data = new FormData();
        Email = elementsPage('input[name="email"]').value;

        req_data.append('email', elementsPage('input[name="email"]').value);
        req_data.append('password', elementsPage('input[name="password"]').value);
        
        _post({url: `${HOST}/authorization/`, data: req_data}, function(response) {
            try {
                response = JSON.parse(response);
                console.log(response);
                if (response.success) {
                    TOKEN = response.token;
                    console.log(TOKEN);
                    LoadPage('/modules/profile.html', context, UserFiles);
                } else {
                    elementsPage('.message--block').innerHTML = '';
                    elementsPage('.message--block').textContent = response.message;
                }
            } catch (e) {
                console.error('Error parsing response:', e);
            }
        });
    });
}

// регистрация 
function DoRegist() {
    elementsPage('.register').addEventListener('click', function() {
        let req_data = new FormData();
        Email = elementsPage('input[name="email"]').value;
        
        req_data.append('email', Email);
        req_data.append('password', elementsPage('input[name="password"]').value);
        req_data.append('first_name', elementsPage('input[name="first_name"]').value);
        req_data.append('last_name', elementsPage('input[name="last_name"]').value);

        var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(Email)) {
            elementsPage('.btn-reg').textContent = "Пожалуйста, введите корректный адрес электронной почты.";
            return;
        }

        _post({url: `${HOST}/registration/`, data: req_data}, function(response) {
            try {
                response = JSON.parse(response);
                console.log(response);
                if (response.success) {
                    elementsPage('.btn-reg').textContent = 'Регистрация успешна!';
                } else {
                    elementsPage('.btn-reg').textContent = response.message || 'Ошибка регистрации';
                }
            } catch (e) {
                console.error('Error parsing response:', e);
            }
        });
    });
}

// 
   function LoadPageMessage(){
    LoadPage('/message',context,function(){
        
    })
   }
//
function UploadFiles() {
    // реализация функции
}