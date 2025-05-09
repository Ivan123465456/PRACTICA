function _elem(sel){
    return document.querySelector(sel)
}
function _create(sel){
    return document.createElement(sel)
}
function _CreateContentAppend(sel, content, body){
    let el = document.createElement(sel)
        el.textContent = content
    if (body){
        body.append(el)
        return el
    }else{
        return el
    }
}
//const HOST = 'http://apiweb.akulov.pw'
//#region Переменные
const HOST = 'http://web-app.api-web-tech.local';
const CONTEXT = _elem('.content')
var TOKEN='aj3f0gh2di6b149587ec';
var Email ='';
var EddFile = {}
//#endregion
//#region AJAX Function
function _get(params, callback){
    let xhr = new XMLHttpRequest();
    xhr.open('GET', params.url)
    xhr.send()

    xhr.onreadystatechange = function(){
        if (xhr.readyState==4){
            callback(xhr.responseText)
        }
    }
}

function _post(params, callback){
    let xhr = new XMLHttpRequest();
    xhr.open('POST', `${params.url}`)
    xhr.send(params.data)

    xhr.onreadystatechange = function(){
        if (xhr.readyState==4){
            callback(xhr.responseText)
        }
    }
}

function _load(url, element, callback){
    let xhr = new XMLHttpRequest();
    xhr.open('GET', url)
    xhr.send()

    xhr.onreadystatechange = function(){
        if (xhr.readyState==4){
            element.innerHTML = xhr.responseText;
            if (callback){
                callback()
            }
        }
    }
}
//#endregion
_load('/modules/authorization.html', CONTEXT, onLoadAuth)
//_load('/modules/profile.html', CONTEXT, UserFiles)
//_load('/modules/upload.html', CONTEXT, UploadFiles)
//_load('/modules/registration.html', CONTEXT, doReg)
//_load('/modules/file.html', CONTEXT)

//#region UnAuth User
function onLoadAuth(){
    _elem('.go-register').addEventListener('click', function(){
        _load('/modules/registration.html',CONTEXT, doReg)
    })

    _elem('.authorize').addEventListener('click', function(){
        let req_data = new FormData();
        Email = _elem('input[name="email"]').value;

        req_data.append('email', _elem('input[name="email"]').value)
        req_data.append('password', _elem('input[name="password"]').value)
        
        _post({url:`${HOST}/authorization/`, data: req_data},function(response){
            response = JSON.parse(response)
            console.log(response)
            if (response.success){
                
                TOKEN = response.token;
                console.log(TOKEN)
                _load('/modules/profile.html', CONTEXT, UserFiles)
            }else{
                _elem('.message--block').innerHTML = ''
                _elem('.message--block').append(response.message)
            }
        })
    })
}

function doReg(){
    _elem('.register').addEventListener('click', function(){
        let req_data = new FormData();
        req_data.append('email', _elem('input[name="email"]').value)
        req_data.append('password', _elem('input[name="password"]').value)
        req_data.append('first_name', _elem('input[name="first_name"]').value)
        req_data.append('last_name', _elem('input[name="last_name"]').value)
        _post({url:`${HOST}/registration/`, data: req_data},function(response){
            response = JSON.parse(response)
            console.log(response)
        })
    })
}
//#endregion

//#region Auth User

function UserFiles(){
    let req_data = new FormData();
    req_data.append('token', TOKEN)

    _post({url:`${HOST}/disk/`, data: req_data}, function(response){
        response = JSON.parse(response);
        //console.log(response)
        for (let index = 0; index < response.length; index++) {
            let row = _create('tr');
            
            let cell_fileID = document.createElement('td');
            let id_file = response[index].file_id; 
            cell_fileID.textContent = id_file;
            row.append(cell_fileID)
        

            
            let cell_name = document.createElement('td');
            
            cell_name.textContent = response[index].name;
            row.append(cell_name)
            


            let cell_download = document.createElement('td');
            let btn_download = document.createElement('button');
            btn_download.textContent='Скачать файл';
            var DOWNLOAD = response[index].url;
            console.log(response[index].url)
            btn_download.addEventListener('click', function(){
                window.location.assign(`${HOST}/${DOWNLOAD}`)
            })
            cell_download.append(btn_download)
            row.append(cell_download)

            let cell_delete = document.createElement('td');
            let btn_delete = document.createElement('button');
            btn_delete.textContent='Удалить файл';
            btn_delete.addEventListener('click', function(){
                let req_data = new FormData();
                req_data.append('id_file', response[index].file_id);
                req_data.append('token', TOKEN);
                _post({url:`${HOST}/delete/`, data: req_data}, function(res){
                    res = JSON.parse(res);
                    console.log(res)
                    cell_fileID.textContent = '';
                    cell_download.textContent = '';
                    cell_delete.textContent = '';
                    cell_changFl.textContent = '';
                    cell_changeAc.textContent = '';
                    
                    cell_name.textContent = res.message;
                })
            })
            cell_delete.append(btn_delete)
            row.append(cell_delete)
            

            //ИЗМЕНИТЬ ФАЙЛ
            let cell_changFl = _create('td')
            let btn_changeFl = _CreateContentAppend('button', 'Изменить файл', cell_changFl);
            btn_changeFl.addEventListener('click', function(){
                _load('/modules/file.html', CONTEXT, function(){
                    let old_fileName = _elem('.old_fileName');
                    let file_id = _elem('.file_id');
                    
                    file_id.textContent = response[index].file_id;
                    old_fileName.textContent = response[index].name;
                    
                    _elem('.back').addEventListener('click', function(){
                        _load('/modules/profile.html', CONTEXT, UserFiles)
                    })
                    
                    
                    let btn_change_file = document.querySelector('.btn--new_fileName');
                    btn_change_file.addEventListener('click', function(){
                        let inp = _elem('input[name="new_fileName"]').value;
                        let req_data = new FormData();
                        req_data.append('name', inp);
                        req_data.append('id_file', response[index].file_id);
                        req_data.append('token', TOKEN);
                        console.log(req_data)
                        _post({url:`${HOST}/edit/`, data: req_data}, function(res){
                            res = JSON.parse(res);
                            console.log(res)
                            if (res.success){
                                _elem('.message--block').textContent = 'Успешно переименовано';
                            }else{
                                _elem('.message--block').textContent = 'Ошибка';
                            }
                        })
                    })
                    

                    
                })
            })
            row.append(cell_changFl)


            //ИЗМЕНИТЬ ПРАВА ДОСТУПА
            let cell_changeAc = _create('td');
            let btn_changeAc = _CreateContentAppend('button', 'Изменить права доступа', cell_changeAc);
            btn_changeAc.addEventListener('click', function(){
                _load('/modules/access.html', CONTEXT, function(){

                    
                    let req = new FormData();
                    req.append('token', TOKEN)
                    _post({url:`${HOST}/disk/`, data: req}, function(response){
                        response = JSON.parse(response);
                        console.log('response', response)
                        for (let index = 0; index < response.length; index++) {
                            if (response[index].file_id == id_file){

                                array = response[index].access
                                
                                // let access_email = response[index].access
                                // let cell_ac_em = _create('tr');
                                // cell_ac_em.textContent = access_email;
                                // row.append(cell_ac_em)
                                // _elem('table').append(row)
                                for (let i = 0; i < array.length; i++) {
                                    console.log(array[i])
                                    row = _create('tr')
                                    let access_email = array[i].email;
                                    
                                    row.textContent = access_email;

                                    _elem('table').append(row)
                                }

                            }
                            
                        }
                    })
                
                    _elem('.name_old_access').append (response[index].name)
                    _elem('.id_access').append (id_file)

        
                    
                    _elem('.btn--addAc').addEventListener('click', function(){
                        //let id_file = _elem('input[name="id_access"]').value;
                        let email_access = _elem('input[name="email_access"').value;
                        
                        let req_data = new FormData();
                        req_data.append('id_file', id_file);
                        req_data.append('email', email_access);
                        req_data.append('token', TOKEN);
                        _post({url:`${HOST}/accesses/`, data: req_data}, function(res){
                            res = JSON.parse(res);
                            console.log(res);
                            _elem('table').textContent = ''
                            for (let i = 0; i < res.length; i++) {
                                let row = _create('tr');
                                row.textContent = res[i].email;
                                _elem('table').append(row)
                                
                            }
                        })
                    })
                    _elem('.btn--delAc').addEventListener('click', function(){
                        let req_data = new FormData();
                        let email_delAc = _elem('input[name="email_access"').value;
                        //let id_file = _elem('input[name="id_access"]').value;
                        req_data.append('email', email_delAc);
                        req_data.append('id_file', id_file);
                        req_data.append('token', TOKEN);
                        _post({url:`${HOST}/deleteaccesses/`, data: req_data}, function(res){
                            res = JSON.parse(res);
                            console.log(res);
                            _elem('table').textContent = ''
                            for (let i = 0; i < res.length; i++) {
                                let row = _create('tr');
                                row.textContent = res[i].email;
                                _elem('table').append(row)
                                
                            }   
                        })
                    })
                    _elem('.back').addEventListener('click', function(){
                        _load('/modules/profile.html', CONTEXT, UserFiles)
                    })
                })
            })
            row.append(cell_changeAc)
            _elem('table tbody').append(row)
        }
    })
    _elem('.btn-upload-file').addEventListener('click', function(){
        _load('/modules/upload.html', CONTEXT, UploadFiles)
    })
    _elem('.btn-private-file').addEventListener('click', function(){
        _load('/modules/useraccess.html', CONTEXT, function(){
            // _get(`http://apiweb.akulov.pw/shared/?token=${TOKEN}`, function(response){
            //     console.log(response)
            // })
           
           

            let req_data = new FormData();
            req_data.append('token', TOKEN)
            _post({url: `${HOST}/shared/`, data: req_data},  function(res){
                res = JSON.parse(res)
                for (let i = 0; i < res.length; i++) {

                    let row = _create('tr')
                    let cell_file_id = _create('td')
                    cell_file_id.textContent = res[i].file_id;
                    row.append(cell_file_id)

                    let file_name = res[i].name;
                    let cell_file = _create('td')
                    cell_file.textContent = file_name;
                    row.append(cell_file)

                    let cell_download = _create('td');
                    let btn_download = _create('button');
                    btn_download.textContent='Скачать файл';
                    btn_download.addEventListener('click', function(){
                        _post({url:`${HOST}/disk/`, data: req_data}, function(response){
                            response = JSON.parse(response);
                            window.location.assign(`${HOST}/${response[i].url}`)
                        })
                        
                    })
                    cell_download.append(btn_download)
                    row.append(cell_download)


                    _elem('tbody').append(row)
                }
                //console.log(res)
            })
            _elem('.btn-to-disk').addEventListener('click', function(){
                _load('/modules/profile.html', CONTEXT, UserFiles)
            })
        })
    })
}


function UploadFiles(){
    _elem('.upload-files').addEventListener('click', function(){
        let array = [];
        for (let index = 0; index < _elem('input[name="files"]').files.length; index++) {
            let req_data = new FormData();
            req_data.append('token', TOKEN)
            req_data.append('files', _elem('input[name="files"]').files[index])
            
            _post({url:`${HOST}/upload`, data: req_data}, function(response){
                response = JSON.parse(response)
                array[index] = response[0];
                
                let row = _create('tr');

                let cell_name = _create('td');
                cell_name.textContent = array[index].name;
                row.append(cell_name)

                let cell_success = _create('td');
                cell_success.textContent = array[index].success;
                row.append(cell_success)

                let cell_download = _create('td');
                let btn_download = _create('button');
                btn_download.textContent='Скачать файл';
                btn_download.addEventListener('click', function(){
                    _post({url:`${HOST}/disk/`, data: req_data}, function(response){
                        response = JSON.parse(response);
                        window.location.assign(`${HOST}/${response[index].url}`)
                    })
                    
                })
                cell_download.append(btn_download)
                row.append(cell_download)


                _elem('.table tbody').append(row)
        
            })   
        }
    })
    _elem('.btn-to-disk').addEventListener('click', function(){
        _load('/modules/profile.html', CONTEXT, UserFiles)
    })
}

//#endregion