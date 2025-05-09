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

// пользователь
function UserFiles() {
    let req_data = new FormData();
    req_data.append('token', TOKEN);

    _post({url: `${HOST}/disk/`, data: req_data}, function(response) {
        try {
            response = JSON.parse(response);
            let tableBody = elementsPage('table tbody');
            tableBody.innerHTML = '';

            for (let i = 0; i < response.length; i++) {
                let row = document.createElement('tr');

                let CellFile_ID = document.createElement('td');
                let id_file = response[i].file_id;
                CellFile_ID.textContent = id_file;
                row.append(CellFile_ID);

                let cell_name = document.createElement('td');
                cell_name.textContent = response[i].name;
                row.append(cell_name);

                // скачивание 
                let cell_down = document.createElement('td');
                let btn_down = document.createElement('button');
                btn_down.textContent = 'скачать файлы';
                var down = response[i].url;
                console.log(response[i].url);
                btn_down.addEventListener('click', function() {
                    window.location.assign(`${HOST}/${down}`);
                });
                cell_down.append(btn_down);
                row.append(cell_down);

                // удаление 
                let cell_delete = document.createElement('td');
                let btn_delete = document.createElement('button');
                btn_delete.textContent = 'Удалить файл';
                btn_delete.addEventListener('click', function() {
                    let delete_data = new FormData();
                    delete_data.append('token', TOKEN);
                    delete_data.append('id_file', response[i].file_id);
                    _post({url: `${HOST}/delete/`, data: delete_data}, function(res) {
                        try {
                            res = JSON.parse(res);
                            console.log(res);
                            if (res.success) {
                                row.remove();
                            } else {
                                cell_name.textContent = res.message || 'Ошибка удаления';
                            }
                        } catch (e) {
                            console.error('Error parsing response:', e);
                        }
                    });
                });
                cell_delete.append(btn_delete);
                row.append(cell_delete);

                // изменить файл
                let cell_changFI = document.createElement('td');
                let btn_changeFI = createContent('button', 'изменить файл', cell_changFI);
                btn_changeFI.addEventListener('click', function() {
                    LoadPage('/modules/file.html', context, function() {
                        let OldFileName = elementsPage('.oldFileName');
                        let file_id = elementsPage('.file_id');

                        file_id.textContent = response[i].file_id;
                        OldFileName.textContent = response[i].name;

                        elementsPage('.back').addEventListener('click', function() {
                            LoadPage('/modules/profile.html', context, UserFiles);
                        });
                        
                        let btn_changeFI = elementsPage('.btn--new_FileName');
                        btn_changeFI.addEventListener('click', function() {
                            let inp = elementsPage('input[name="new_fileName"]').value;
                            let req_data = new FormData();
                            req_data.append('name', inp);
                            req_data.append('id_file', response[i].file_id);
                            req_data.append('token', TOKEN);
                            console.log(req_data);
                            _post({url: `${HOST}/edit/`, data: req_data}, function(res) {
                                try {
                                    res = JSON.parse(res);
                                    console.log(res);
                                    if (res.success) {
                                        elementsPage('.message--block').textContent = 'Успешно переименовано';
                                    } else {
                                        elementsPage('.message--block').textContent = 'Ошибка';
                                    }
                                } catch (e) {
                                    console.error('Error parsing response:', e);
                                }
                            });
                        });
                    });
                });
                row.append(cell_changFI);

                // изменить права доступа
                let cell_changAc = document.createElement('td');
                let btn_changeAc = createContent('button', 'Изменить доступ', cell_changAc);
                btn_changeAc.addEventListener('click', function() {
                    LoadPage('/modules/access.html', context, function() {
                        let req = new FormData();
                        req.append('token', TOKEN);
                        _post({url: `${HOST}/disk/`, data: req}, function(response) {
                            try {
                                response = JSON.parse(response);
                                for (let j = 0; j < response.length; j++) {
                                    if (response[j].file_id == id_file) {
                                        let array = response[j].access;

                                        for (let k = 0; k < array.length; k++) {
                                            console.log(array[k]);
                                            let row = document.createElement('tr');
                                            let access_email = array[k].email;

                                            row.textContent = access_email;
                                            elementsPage('table').append(row);
                                        }
                                    }
                                }
                            } catch (e) {
                                console.error('Error parsing response:', e);
                            }
                        });

                        elementsPage('.name_old_access').textContent = response[i].name;
                        elementsPage('.id_access').textContent = id_file;
                        elementsPage('.btn--addAc').addEventListener('click', function() {
                            let emailAcces = elementsPage('input[name="email_access"]').value;
                            let req_data = new FormData();
                            req_data.append('email', emailAcces);
                            req_data.append('id_file', id_file);
                            req_data.append('token', TOKEN);
                            _post({url: `${HOST}/accesses/`, data: req_data}, function(res) {
                                try {
                                    res = JSON.parse(res);
                                    console.log(res);
                                    elementsPage('table').innerHTML = '';
                                    for (let l = 0; l < res.length; l++) {
                                        let row = document.createElement('tr');
                                        row.textContent = res[l].email;
                                        elementsPage('table').append(row);
                                    }
                                } catch (e) {
                                    console.error('Error parsing response:', e);
                                }
                            });
                        });
                        elementsPage('.back').addEventListener('click', function() {
                            LoadPage('/modules/profile.html', context, UserFiles);
                        });
                    });
                });
                row.append(cell_changAc);
                tableBody.append(row);
            }
        } catch (e) {
            console.error('Error parsing response:', e);
        }
    });
    
    elementsPage('.btn-upload-file').addEventListener('click', function() {
        LoadPage('/modules/upload.html', context, UploadFiles);
    });

    
    
    elementsPage('.btn-private-file').addEventListener('click', function() {
        LoadPage('/modules/useraccess.html', context, function() {
            let req_data = new FormData();
            req_data.append('token', TOKEN);
            _post({url: `${HOST}/shared/`, data: req_data}, function(res) {
                try {
                    res = JSON.parse(res);
                    for (let i = 0; i < res.length; i++) {
                        let row = document.createElement('tr');
                        let cell_FileID = document.createElement('td');
                        cell_FileID.textContent = res[i].file_id;
                        row.append(cell_FileID);

                        let file_name = res[i].name;
                        let cell_file = document.createElement('td');
                        cell_file.textContent = file_name;
                        row.append(cell_file);

                        let cell_down = document.createElement('td');
                        let btn_down = document.createElement('button');
                        btn_down.textContent = 'Скачать файл';
                        btn_down.addEventListener('click', function() {
                            window.location.assign(`${HOST}/${res[i].url}`);
                        });
                        cell_down.append(btn_down);
                        row.append(cell_down);
        
                        elementsPage('table tbody').append(row);
                    }
                } catch (e) {
                    console.error('Error parsing response:', e);
                }
            });
            
            elementsPage('.btn-to-disk').addEventListener('click', function() {
                LoadPage('/modules/profile.html', context, UserFiles);
            });
        });
    });
}

function UploadFiles() {
   
}