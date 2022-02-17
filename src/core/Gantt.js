export const Gantt = (function () {
    const ganttChart = document.querySelector('#gantt');
    const textEdit = {};

    textEdit.spaceToNbsp = (value) => value.replace(/[\s]/gm, '&nbsp;');
    textEdit.nbspToSpace = (value) => value.replace(/&nbsp;/gm, ' ');
    textEdit.enterToBr = (value) => value.replace(/[\n]/gm, '<br>');
    textEdit.brToEnter = (value) => value.replace(/<br>/gm, '\n');

    textEdit.taToHTML = (ta) => textEdit.spaceToNbsp(textEdit.enterToBr(ta));
    textEdit.htmlToTa = (ta) => textEdit.nbspToSpace(textEdit.brToEnter(ta));

    function Controller() {
        let models, save, saveContent, blockAutoChange = false, toggler = false, tempRow, tempCol;

        this.init = function (model) {
            models = model;

            window.addEventListener('keydown', this.workRedo);
            window.addEventListener('keydown', this.workUndo);
            window.addEventListener('click', this.addInitialRow);
            window.addEventListener('click', this.borderReset);
            window.addEventListener('click', this.movingRowCol);
            window.addEventListener('click', this.emptyCopiedAttrs);
            window.addEventListener('click', this.pasteCopiedAttrs);
            window.addEventListener('click', this.copyAttrs);
            window.addEventListener('click', this.emptyCopiedContents);
            window.addEventListener('click', this.pasteCopiedContents);
            window.addEventListener('click', this.copyContents);
            window.addEventListener('click', this.exportResult);
            window.addEventListener('click', this.deleteRowCol);
            window.addEventListener('click', this.addRowCol);
            window.addEventListener('click', this.toggleInput);
            window.addEventListener('click', this.closePopupControlList);
            window.addEventListener('mouseover', this.popupDeleteBtn);
            window.addEventListener('mouseover', this.popupAddBtn);
            window.addEventListener('contextmenu', this.popupControlList);
            window.addEventListener('change', this.autoValueChange);
            window.addEventListener('input', this.autoAttrsValueChange);
            window.addEventListener('keydown', this.inputKey.bind(this));
        }

        this.addInitialRow = function (ev){
            const target = ev.target;
            if(target.id!='addRowHead' && target.id!='addRowBody') return;
            
            if(target.id == 'addRowHead') models.addInitailRowHead();
            else if(target.id == 'addRowBody') models.addInitailRowBody();
        }

        this.workUndo = function (ev){
            if(!(ev.key=='z' && ev.ctrlKey)) return;

            models.workUndo();
        }

        this.workRedo = function (ev){
            if(!(ev.key=='y' && ev.ctrlKey)) return;

            models.workRedo();
        }

        this.borderReset = function (ev){
            const target = ev.target;
            const controlList = target.closest('.control-list');
            if(target.id!='bReset') return;

            models.borderReset(target, controlList);
        }

        this.movingRowCol = function (ev){
            const target = ev.target;
            const controlList = target.closest('.control-list');

            if(!target.classList.contains('move')) return;

            models.movingRowCol(target, controlList);
        }

        this.emptyCopiedContents = function (ev){
            const target = ev.target;
            const controlList = target.closest('.control-list');
            if(target.id != 'clearContents') return;

            models.emptyCopiedContents(target, controlList);
        }

        this.pasteCopiedContents = function (ev){
            const target = ev.target;
            const controlList = target.closest('.control-list');
            if(target.id != 'pasteContents') return;

            models.pasteCopiedContents(target, controlList);
        }

        this.copyContents = function (ev){
            const target = ev.target;
            const controlList = target.closest('.control-list');
            if(target.id != 'copyContents') return;

            models.copyContents(target, controlList);
        }

        this.emptyCopiedAttrs = function (ev){
            const target = ev.target;
            const controlList = target.closest('.control-list');
            if(target.id != 'clearAttrs') return;

            models.emptyCopiedAttrs(target, controlList);
        }

        this.pasteCopiedAttrs = function (ev){
            const target = ev.target;
            const controlList = target.closest('.control-list');
            if(target.id != 'pasteAttrs') return;

            models.pasteCopiedAttrs(target, controlList);
        }

        this.copyAttrs = function (ev){
            const target = ev.target;
            const controlList = target.closest('.control-list');
            if(target.id != 'copyAttrs') return;

            models.copyAttrs(target, controlList);
        }

        this.popupControlList = function (ev){
            const target = ev.target;
            const closest = target.closest('th,td');

            if(document.querySelector('.control-list')) document.querySelector('.control-list').remove();

            if(!closest) return;

            ev.preventDefault();

            models.popupControlList(closest, ev);
        }

        this.closePopupControlList = function(ev){
            const target = ev.target;
            const closest = target.closest('.control-list');

            if(!closest) document.querySelectorAll('.control-list').forEach(el=>el.remove());
        }

        this.exportResult = function (ev){
            const target = ev.target;

            tempRow = 0;
            tempCol = 0;

            if(target.id!='export') return;

            models.exportResult(target);
        }

        this.autoAttrsValueChange = function (ev){
            const target = ev.target;
            if(!target.classList.contains('attrs')) return;

            document.querySelectorAll('.active').forEach(el=>el.classList.remove('active'));
            if(target.type == 'radio'){
                target.previousElementSibling.classList.add('active');
            }
            models.autoAttrsValueChange(target);
        }

        this.autoValueChange = function (ev){
            const target = ev.target;
            if(blockAutoChange) {
                blockAutoChange = false;
                return;
            }

            if(target.tagName != 'TEXTAREA') return;

            models.autoValueChange(target);
        }

        this.saveContent = function (target, parent){
            parent.classList.remove('active');
            target.blur();
            parent.innerHTML = textEdit.taToHTML(target.value);
            save = null;
            saveContent = null;
            toggler = false;
        }

        this.cancelContent = function (parent){
            blockAutoChange = true;
            parent.classList.remove('active');
            parent.innerHTML = saveContent;
            save = null;
            saveContent = null;
            toggler = false;
        }

        this.inputKey = function (ev){
            const target = ev.target;

            if(target.tagName != 'TEXTAREA') return;

            const parent = target.closest('th,td');
            if(toggler){
                if(ev.key == 'Escape'){
                    this.cancelContent(parent);
                } else if(ev.ctrlKey && ev.key == 'Enter'){
                    this.saveContent(target, parent);
                } else if(ev.key == 'Tab'){
                    ev.preventDefault();
                    this.saveContent(target, parent);

                    let {rowid, colid} = parent.attributes;
                    let getTHTD;
                    let tagName = parent.tagName;

                    if(!tempRow) tempRow = parseInt(rowid.value);
                    if(!tempCol) tempCol = parseInt(colid.value);

                    getTHTD = document.querySelector(`${tagName}[rowid="${tempRow}"][colid="${++tempCol}"]`);

                    if(!getTHTD) {
                        tempRow++;
                        tempCol = 0;
                        getTHTD = document.querySelector(`${tagName}[rowid="${tempRow}"][colid="${tempCol}"]`);
                        if(!getTHTD){
                            tagName = 'TD';
                            tempRow = 0;
                            tempCol = 0;
                            getTHTD = document.querySelector(`${tagName}[rowid="${tempRow}"][colid="${tempCol}"]`);
                        }
                    }

                    getTHTD.click();
                    getTHTD.querySelector('textarea').focus();
                    setTimeout(() => {
                        getTHTD.querySelector('textarea').select();
                    }, 0);
                }
            }
        }

        this.toggleInput = function (ev){
            const target = ev.target;
            const ta = document.createElement('textarea');
            const closests = target.closest('TD,TH');

            if(!closests) {
                document.querySelectorAll('th.active, td.active').forEach(el=>{
                    if(el!=closests){
                        el.classList.remove('active');
                        if(el.querySelector('textarea')){
                            models.autoValueChange(el.querySelector('textarea'));
                            el.innerHTML = textEdit.taToHTML(el.querySelector('textarea').value);
                        }
                        toggler = false;
                    }
                });
                return;
            }

            document.querySelectorAll('th.active, td.active').forEach(el=>{
                if(el!=closests){
                    el.classList.remove('active');
                    if(el.querySelector('textarea')){
                        el.innerHTML = textEdit.taToHTML(el.querySelector('textarea').value);
                    }
                    toggler = false;
                }
            });

            save = target;

            if(!save.classList.contains('active')) {
                save.classList.add('active');
                saveContent = textEdit.htmlToTa(save.innerHTML);
                toggler = true;
            } else {
                save.classList.remove('active');
                toggler = false;
            }
            
            if(toggler){
                ta.value = textEdit.htmlToTa(save.innerHTML);
                save.insertAdjacentElement('beforeend', ta);
                ta.focus();
                ta.select();
            } else {
                ta.remove();
                save = null;
            }
        }

        this.deleteRowCol = function (ev){
            const target = ev.target;
            if(!target.classList.contains('del-btn')) return;

            models.deleteRowCol(target);
        }

        this.addRowCol = function (ev){
            const target = ev.target;
            if(!target.classList.contains('add-btn')) return;

            models.addRowCol(target);
        }

        this.popupDeleteBtn = function (ev){
            const target = ev.target;

            if(!target.classList.contains('del-btn') && document.querySelector('.del-btn')) document.querySelectorAll('.del-btn').forEach(el=>{
                el.remove();
            })

            if(target.tagName != 'TD' && target.tagName != 'TH') {
                return;
            }
            
            models.popupDeleteBtn(target);
        }

        this.popupAddBtn = function (ev){
            const target = ev.target;

            if(!target.classList.contains('add-btn') && document.querySelector('.add-btn')) document.querySelectorAll('.add-btn').forEach(el=>{
                el.remove();
            })

            if(target.tagName != 'TD' && target.tagName != 'TH') {
                return;
            }
            
            models.popupAddBtn(target);
        }
    }

    function Model() {
        const copiedAttrs = {};
        const copiedContents = {text: ''};
        let views;
        let gantt = {
            head: [
                [
                    {
                        text: '헤드 부분입니다.',
                        attr: {fontSize: '32px'},
                    }
                ],
            ],
            body: [
                [
                    {
                        text: '바디 부분입니다.',
                        attr: {},
                    }
                ],
            ],
        };
        let history = [];
        let hisIndex = 0;

        this.init = function (view) {
            views = view;

            gantt = this.getStorage();

            this.addHistory();

            this.renderChart();
        }

        this.addHistory = function (){
            const head = [...gantt.head].map(h=>[...h].map(k=>{
                const temp = {};
                Object.entries(k.attr).forEach(([k,v])=>temp[k]=v);
                return {
                    text: k.text,
                    attr: temp,
                };
            }));
            const body = [...gantt.body].map(h=>[...h].map(k=>{
                const temp = {};
                Object.entries(k.attr).forEach(([k,v])=>temp[k]=v);
                return {
                    text: k.text,
                    attr: temp,
                };
            }));

            let temp = {head: head, body: body};
            history.splice(hisIndex+1, 0, temp);
            hisIndex = history.indexOf(temp)+1;
            history = history.slice(0, hisIndex+1);
        }

        this.workUndo = function (ev){
            if(hisIndex>0){
                hisIndex--;
                gantt = history[hisIndex];
                this.setStorage(gantt);
                views.renderChart(gantt);
            }
        }

        this.workRedo = function (ev){
            if(hisIndex<history.length-1){
                hisIndex++;
                gantt = history[hisIndex];
                this.setStorage(gantt);
                views.renderChart(gantt);
            }
        }

        this.addInitailRowHead = function (){
            if(gantt.head.length==0 || gantt.head[0].every(a=>a.length==0)) {
                let temp = {text: '', attr: {}};
                Object.entries(copiedAttrs).forEach(([k,v])=>temp.attr[k]=v);

                temp.text = copiedContents.text;
                gantt.head = [];

                gantt.head.splice(0, 1, new Array(gantt.body[0]?gantt.body[0].length:1).fill({text: temp.text||'', attr: temp.attr||{}}));
            }

            this.renderChart();
        }

        this.addInitailRowBody = function (){
            if(gantt.body.length==0 || gantt.body[0].every(a=>a.length==0)) {
                let temp = {text: '', attr: {}};
                Object.entries(copiedAttrs).forEach(([k,v])=>temp.attr[k]=v);

                temp.text = copiedContents.text;
                gantt.body = [];
                
                gantt.body.splice(0, 1, new Array(gantt.head[0]?gantt.head[0].length:1).fill({text: temp.text||'', attr: temp.attr||{}}));
            }

            this.renderChart();
        }

        this.borderReset = function (target, controlList){
            const typeList = ['borderWidth', 'borderTopWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderRightWidth', 'borderColor', 'borderTopColor', 'borderBottomColor', 'borderLeftColor', 'borderRightColor', 'borderStyle', 'borderTopStyle', 'borderBottomStyle', 'borderLeftStyle', 'borderRightStyle'];
            this.addHistory();

            document.querySelectorAll('td,th').forEach(el=>{
                typeList.forEach(type=>el.style[type] = '');
            });

            gantt.head = gantt.head.map(row=>{
                return row.map(col=>{
                    typeList.forEach(type=>delete col.attr[type]);
                    return col;
                });
            });

            gantt.body = gantt.body.map(row=>{
                return row.map(col=>{
                    typeList.forEach(type=>delete col.attr[type]);
                    return col;
                });
            });
            
            views.clearControlList();

            this.renderChart();
        }

        this.movingRowCol = function (target, controlList){
            const {type, rowid, colid} = controlList.attributes;
            const {moving} = target.attributes;
            const ganttType = type.value=='TH'?'head':'body';
            const rowId = parseInt(rowid.value);
            const colId = parseInt(colid.value);
            const move = moving.value;

            this.addHistory();

            switch(move){
                case 'left':
                    if(colId-1>=0) {
                        gantt[ganttType].map(row=>{
                            row.splice(colId-1, 0, row.splice(colId, 1).pop());
                            return row;
                        });
                    }
                    break;
                case 'right':
                    if(colId+1<gantt[ganttType][rowId].length) {
                        gantt[ganttType].map(row=>{
                            row.splice(colId+1, 0, row.splice(colId, 1).pop());
                            return row;
                        });
                    }
                    break;
                case 'top':
                    if(rowId-1>=0) {
                        gantt[ganttType].splice(rowId-1, 0, gantt[ganttType].splice(rowId, 1).pop());
                    }
                    break;
                case 'bottom':
                    if(rowId+1<gantt[ganttType].length) {
                        gantt[ganttType].splice(rowId+1, 0, gantt[ganttType].splice(rowId, 1).pop());
                    }
                    break;
            }
            
            this.renderChart();
        }

        this.clearCopiedContents = function (){
            copiedContents.text = '';
        }

        this.emptyCopiedContents = function (target, controlList){
            views.clearControlList();
            this.renderChart();
            this.clearCopiedContents();
        }

        this.pasteCopiedContents = function (target, controlList){
            const {type, rowid, colid} = controlList.attributes;
            const ganttType = type.value=='TH'?'head':'body';
            gantt[ganttType][rowid.value][colid.value].text = '';

            this.addHistory();

            gantt[ganttType][rowid.value][colid.value].text = copiedContents.text;

            document.querySelector(`${type.value}[rowid="${rowid.value}"][colid="${colid.value}"]`).innerHTML = copiedContents.text;

            views.clearControlList();

            this.renderChart();
        }

        this.copyContents = function (target, controlList){
            this.clearCopiedContents();

            const {type, rowid, colid} = controlList.attributes;
            const ganttType = type.value=='TH'?'head':'body';
            copiedContents.text = gantt[ganttType][rowid.value][colid.value].text;

            views.clearControlList();

            this.renderChart();
        }

        this.clearCopiedAttrs = function (){
            Object.keys(copiedAttrs).forEach(e=>delete copiedAttrs[e]);
        }

        this.emptyCopiedAttrs = function (target, controlList){
            views.clearControlList();
            this.renderChart();
            this.clearCopiedAttrs();
        }

        this.pasteCopiedAttrs = function (target, controlList){
            const {type, rowid, colid} = controlList.attributes;
            const ganttType = type.value=='TH'?'head':'body';
            gantt[ganttType][rowid.value][colid.value].attr = {};

            this.addHistory();

            Object.entries(copiedAttrs).forEach(([key, val])=>{
                gantt[ganttType][rowid.value][colid.value].attr[key] = val;

                document.querySelector(`${type.value}[rowid="${rowid.value}"][colid="${colid.value}"]`).style[key] = val;
            })

            views.clearControlList();

            this.renderChart();
        }

        this.copyAttrs = function (target, controlList){
            this.clearCopiedAttrs();

            const {type, rowid, colid} = controlList.attributes;
            const ganttType = type.value=='TH'?'head':'body';
            Object.assign(copiedAttrs, gantt[ganttType][rowid.value][colid.value].attr);

            views.clearControlList();

            this.renderChart();
        }

        this.autoAttrsValueChange = function (target){
            const closest = target.closest('ul.control-list');
            const type = closest.getAttribute('type');
            const ganttType = type=='TH'?'head':'body';
            const {rowid, colid} = closest.attributes;

            let autoValue = [...document.querySelectorAll(`#${target.id}`)].reduce((pre, cur)=>{
                let value;
                if(cur.type=='range'){
                    let hex = parseInt(cur.value).toString(16);
                    value = hex.length==1?`0${hex}`:hex||'ff';
                } else {
                    value = cur.value;
                }
                return pre += value;
            }, '');
            
            switch(target.id){
                case 'al': case 'ac': case 'ar':
                    let align = document.querySelector('[name="align"]:checked').value;
                    if(closest.querySelector('#bRow').checked){
                        gantt[ganttType][rowid.value].map(col=>{
                            col.attr['textAlign'] = align;
                        });
                    }

                    if(closest.querySelector('#bCol').checked){
                        gantt[ganttType].map(row=>{
                            return row[colid.value].attr['textAlign'] = align;
                        });
                    }

                    gantt[ganttType][rowid.value][colid.value].attr['textAlign'] = align;
                    break;

                case 'borderWidth': case 'borderStyle': case 'borderColor':
                    if(closest.querySelector('#bRow').checked){
                        gantt[ganttType][rowid.value].map(col=>{
                            col.attr[target.id] = autoValue;
                        });
                    }

                    if(closest.querySelector('#bCol').checked){
                        gantt[ganttType].map(row=>{
                            return row[colid.value].attr[target.id] = autoValue;
                        });
                    }

                    gantt[ganttType].map(row=>{
                        return row.map(col=>{
                            col.attr[target.id] = autoValue;
                            return col;
                        });
                    });
                    break;

                default :
                    if(closest.querySelector('#bRow').checked){
                        gantt[ganttType][rowid.value].map(col=>{
                            col.attr[target.id] = autoValue;
                        });
                    }

                    if(closest.querySelector('#bCol').checked){
                        gantt[ganttType].map(row=>{
                            return row[colid.value].attr[target.id] = autoValue;
                        });
                    }

                    gantt[ganttType][rowid.value][colid.value].attr[target.id] = autoValue;
                    break;
            }

            this.addHistory();
            this.setStorage(gantt);
            views.renderChart(gantt);
        }

        this.popupControlList = function (closest, ev){
            const {rowid, colid} = closest.attributes;
            const rowId = rowid.value;
            const colId = colid.value;
            let originData;

            switch(closest.tagName){
                case 'TH': originData = gantt.head[rowId][colId]; break;
                case 'TD': originData = gantt.body[rowId][colId]; break;
            }

            views.popupControlList(closest, originData, ev, Object.keys(copiedAttrs).length, copiedContents.text!='');
        }

        this.getStorage = function(){
            let temp;
            if(!localStorage['gantt']) this.setStorage(gantt);
            if(localStorage['gantt']) temp = JSON.parse(localStorage['gantt']);
            temp.head.map(row=>{
                return row.map(col=>{
                    delete col.attr['[object HTMLInputElement]'];
                    delete col.attr['allUnit'];
                    return;
                });
            });
            
            temp.body.map(row=>{
                return row.map(col=>{
                    delete col.attr['[object HTMLInputElement]'];
                    delete col.attr['allUnit'];
                    return;
                });
            });
            return temp;
        }

        this.setStorage = function(data){
            localStorage['gantt'] = JSON.stringify(data);
        }

        this.exportResult = function (target){
            const ganttBody = document.querySelector("#gantt #chart");
            
            ganttBody.style.borderCollapse = `collapse`;
            ganttBody.style.width = '100%';

            ganttBody.querySelectorAll('th,td').forEach(el=>{
                el.style.userSelect = `none`;
                el.style.padding = `0.5rem`;
                el.style.position = 'relative';
            });

            navigator.clipboard.writeText(document.querySelector("#ganttWrap").innerHTML.trim().replace(/\s{2,}/g, ' ')).then(
            clipText =>  console.log(document.querySelector("#ganttWrap").innerHTML.trim().replace(/\s{2,}/g, ' '),'를 복사했습니다'));
        }

        this.autoValueChange = function (target){
            const parent = target.parentNode;
            const value = target.value;

            const {rowid, colid} = parent.attributes;
            
            this.addHistory();

            if(parent.tagName == 'TH'){
                gantt.head[rowid.value][colid.value].text = value;
            } else {
                gantt.body[rowid.value][colid.value].text = value;
            }

            this.renderChart();
        }

        this.deleteRowCol = function (target) {
            const {type, rowid, colid, direction} = target.attributes;
            const dir = direction.value;

            this.addHistory();

            if(dir=='row'){
                if(type.value == 'TH') this.delHeadRow(rowid.value);
                else this.delBodyRow(rowid.value);
            } else {
                this.delHeadCol(colid.value);
                this.delBodyCol(colid.value);
            }
            
            this.renderChart();
        }

        this.addRowCol = function (target) {
            const {type, rowid, colid, direction} = target.attributes;
            const dir = direction.value;

            this.addHistory();

            if(dir=='bottom'){
                if(type.value == 'TH') this.addHeadRow(rowid.value);
                else this.addBodyRow(rowid.value);
            } else {
                this.addHeadCol(colid.value);
                this.addBodyCol(colid.value);
            }
            
            this.renderChart();
        }

        this.delHeadRow = function(rowid){
            rowid = parseInt(rowid);
            gantt.head.splice(rowid, 1);
        }

        this.delBodyRow = function(rowid){
            rowid = parseInt(rowid);
            gantt.body.splice(rowid, 1);
        }

        this.delHeadCol = function(colid){
            colid = parseInt(colid);
            gantt.head.map(row=>row.splice(colid, 1));
        }

        this.delBodyCol = function(colid){
            colid = parseInt(colid);
            gantt.body.map(row=>row.splice(colid, 1));
        }

        this.addHeadRow = function(rowid){
            let temp = {text: '', attr: {}};
            Object.entries(copiedAttrs).forEach(([k,v])=>temp.attr[k]=v);

            temp.text = copiedContents.text;

            let isEmpty = Object.keys(temp.attr).length==0;
            let isContentsEmpty = temp.text=='';

            rowid = parseInt(rowid);

            gantt.head.splice(rowid + 1, 0, [...gantt.head[rowid]].map((col, cid)=>{
                let beforeCopy = {text: '', attr: {}};
                Object.entries(col.attr).forEach(([k,v])=>beforeCopy.attr[k]=v);
                beforeCopy.text = col.text;

                col = {text: isContentsEmpty?beforeCopy.text:temp.text||'', attr: isEmpty?beforeCopy.attr:temp.attr||{}};
                return col;
            }));
        }

        this.addBodyRow = function(rowid){
            let temp = {text: '', attr: {}};
            Object.entries(copiedAttrs).forEach(([k,v])=>temp.attr[k]=v);

            temp.text = copiedContents.text;

            let isEmpty = Object.keys(temp.attr).length==0;
            let isContentsEmpty = temp.text=='';
            
            rowid = parseInt(rowid);

            gantt.body.splice(rowid + 1, 0, [...gantt.body[rowid]].map((col, cid)=>{
                let beforeCopy = {text: '', attr: {}};
                Object.entries(col.attr).forEach(([k,v])=>beforeCopy.attr[k]=v);
                beforeCopy.text = col.text;

                col = {text: isContentsEmpty?beforeCopy.text:temp.text||'', attr: isEmpty?beforeCopy.attr:temp.attr||{}};
                return col;
            }));
        }

        this.addHeadCol = function(colid){
            let temp = {text: '', attr: {}};
            Object.entries(copiedAttrs).forEach(([k,v])=>temp.attr[k]=v);

            temp.text = copiedContents.text;

            let isEmpty = Object.keys(temp.attr).length==0;
            let isContentsEmpty = temp.text=='';

            colid = parseInt(colid);

            gantt.head.map(row=>{
                let beforeCopy = {text: '', attr: {}};
                Object.entries(row[colid].attr).forEach(([k,v])=>beforeCopy.attr[k]=v);
                beforeCopy.text = row[colid].text;

                row.splice(colid + 1, 0, {text:isContentsEmpty?beforeCopy.text:temp.text||'', attr: isEmpty?beforeCopy.attr:temp.attr||{}});
                return row;
            });
        }

        this.addBodyCol = function(colid){
            let temp = {text: '', attr: {}};
            Object.entries(copiedAttrs).forEach(([k,v])=>temp.attr[k]=v);

            temp.text = copiedContents.text;

            let isEmpty = Object.keys(temp.attr).length==0;
            let isContentsEmpty = temp.text=='';

            colid = parseInt(colid);

            gantt.body.map(row=>{
                let beforeCopy = {text: '', attr: {}};
                Object.entries(row[colid].attr).forEach(([k,v])=>beforeCopy.attr[k]=v);
                beforeCopy.text = row[colid].text;

                row.splice(colid + 1, 0, {text:isContentsEmpty?beforeCopy.text:temp.text||'', attr: isEmpty?beforeCopy.attr:temp.attr||{}});
                return row;
            });
        }

        this.popupDeleteBtn = function (target){
            const rect = target.getBoundingClientRect();
            let control = 3;
            switch(target.tagName){
                case 'TH':
                    // if(gantt.head.length==1 && gantt.head[0].length==1) control = 0;
                    // else if(gantt.head.length>1 && gantt.head[0].length==1) control = 2;
                    // else if(gantt.head.length==1 && gantt.head[0].length>1) control = 1;
                    // else if(gantt.head.length>1 && gantt.head[0].length>1) control = 3;
                    break;
                case 'TD':
                    // if(gantt.body.length==1 && gantt.body[0].length==1) control = 0;
                    // else if(gantt.body.length>1 && gantt.body[0].length==1) control = 2;
                    // else if(gantt.body.length==1 && gantt.body[0].length>1) control = 1;
                    // else if(gantt.body.length>1 && gantt.body[0].length>1) control = 3;
                    break;
            }
            views.popupDeleteBtn(target, rect, control);
        }

        this.popupAddBtn = function (target){
            const rect = target.getBoundingClientRect();

            views.popupAddBtn(target, rect);
        }

        this.renderChart = function () {
            this.setStorage(gantt);
            views.renderChart(gantt);
        }
    }

    function View() {
        let parts, chart, thead, tbody, temp, isMoved;

        this.init = function (part) {
            parts = part;

            this.renderTable();
        }

        this.popupControlList = function (target, data, ev, isCopied, isContentsCopied){
            parts.controlList.render(target, data, ev, isCopied, isContentsCopied);
        }

        this.renderTable = function (){
            parts.table.render(ganttChart);
            
            chart = document.querySelector('#chart');
            thead = document.querySelector('#thead');
            tbody = document.querySelector('#tbody');
        }

        this.popupDeleteBtn = function(target, rect, control){
            if(target.id!='delBtn') temp = rect;

            parts.delBtn.render(target, target.attributes, temp, control);
        }

        this.popupAddBtn = function (target, rect){
            if(target.id!='addBtn') temp = rect;
            isMoved = target;
            setTimeout(()=>{
                if(isMoved == target) parts.addBtn.render(target, target.attributes, temp);
            }, 200);
        }

        this.renderChart = function (gantt) {
            this.clearThead();
            this.clearTbody();
            this.clearBtns();

            gantt.head?.forEach((rows, rowId)=>{
                let tr = document.createElement('tr');

                rows.forEach((cols, colId)=>{
                    let th = document.createElement('th');

                    Object.entries(cols.attr).forEach(([key, val])=>{
                        if(val != '')
                        th.style[key] = val;
                    });

                    th.innerHTML = textEdit.taToHTML(cols.text);
                    th.setAttribute('rowId', rowId);
                    th.setAttribute('colId', colId);
                    tr.append(th);
                });

                thead.append(tr);
            });

            gantt.body?.forEach((rows, rowId)=>{
                let tr = document.createElement('tr');
                rows.forEach((cols, colId)=>{
                    let td = document.createElement('td');

                    Object.entries(cols.attr).forEach(([key, val])=>{
                        if(val != '')
                        td.style[key] = val;
                    });

                    td.innerHTML = textEdit.taToHTML(cols.text);
                    td.setAttribute('rowId', rowId);
                    td.setAttribute('colId', colId);
                    tr.append(td);
                });
                tbody.append(tr);
            });
        }

        this.clearControlList = function (){
            document.querySelectorAll('.control-list').forEach(el=>el?.remove());
        }

        this.clearBtns = function (){
            document.querySelectorAll('.add-btn,.del-btn').forEach(el=>el?.remove());
        }

        this.clearThead = function (){
            thead.innerHTML = '';
        }

        this.clearTbody = function (){
            tbody.innerHTML = '';
        }
    }

    return {
        init() {
            const parts = {
                table: {
                    render(target){
                        target.insertAdjacentHTML('beforeend',`<table id="chart" style="table-layout: fixed;border-collapse: collapse;width: 100%;border-spacing: 0;">
                            <thead id="thead">
                                
                            </thead>
                            <tbody id="tbody">
                                
                            </tbody>
                        </table>`);
                    }
                },
                controlList: {
                    render(target, data, {x, y}, isCopied, isContentsCopied){
                        const styles = ['solid', 'dotted', 'dashed', 'groove', 'ridge', 'double', 'outset', 'hidden', 'none'];
                        const units = ['auto', 'px', 'cm', 'mm', 'in', 'pc', 'pt', 'ch', 'em', 'rem', 'vh', 'vw', 'vmin', 'vmax'];

                        const setBorderStyleList = (style) => [...styles].map(st => `<option${(style||'solid')==st?' selected':''} value="${st}">${st}</option$>`).join('');

                        const setNumberUnitList = (unitName) => [...units].map(numberUnit => `<option${(unitName||'auto')==numberUnit?' selected':''} value="${numberUnit=='auto'?'':numberUnit}">${numberUnit}</option>`).join('');

                        const getNumber = function (id){
                            let autoDefault = 0;
                            if(id.match(/border/g)) autoDefault = 1;
                            else if(id.match(/font/g)) autoDefault = 16;
                            else if(id.match(/font/g)) autoDefault = 16;
                            else if(id.match(/width/g)) autoDefault = target.clientWidth;
                            return data.attr[id]?.match(/([0-9.]+)(\w+)/)?.slice(1).shift()||autoDefault;
                        }
                        
                        const getUnit = function (id){
                            return data.attr[id]?.match(/([0-9.]+)(\w+)/)?.slice(1).pop()||'px';
                        }

                        const getOpacity = (id) => data.attr[id]?.slice(7, 9)||'ff';
                        const hexToNumber = (id) => parseFloat(parseInt((getOpacity(id)), 16).toFixed(2));
                        
                        const getColor = (id) => {
                            let autoDefault = 0;
                            if(id.match(/border/g)) autoDefault = '#e0e0e0';
                            else if(id.match(/font/g)) autoDefault = '#000000';
                            else if(id.match(/background/g)) autoDefault = '#ffffff';
                            return data.attr[id]?.slice(0, 7)||'#e0e0e0';
                        };

                        const getStyle = (id) => {
                            return data.attr[id];
                        };
                        
                        const {rowid, colid} = target.attributes;

                        const fontWeight = data.attr.fontWeight||'normal';

                        const radio = data.attr.textAlign;

                        if(window.innerWidth < 160 + x){
                            x = x - 160;
                        }

                        ganttChart.insertAdjacentHTML('beforeend', `
                            <ul
                            type="${target.tagName}"
                            class="control-list"
                            rowid="${rowid.value}"
                            colid="${colid.value}"
                            style="
                                transform: translateY(0%);
                                top: ${y + document.body.scrollTop}px;
                                left: ${x}px;
                                ${window.innerWidth/2<x?'transform: translateX(-50%)':''}
                            ">
                                <li class="text-center">
                                    <span>Contents Copy</span>
                                    <br>
                                    ${isContentsCopied?`
                                        <button id="pasteContents" class="btn">Paste</button>
                                    `:`
                                        <button id="pasteContents" class="btn" disabled>Pates</button>
                                    `}
                                    <button id="copyContents" class="btn">Copy</button>
                                    <button id="clearContents" class="btn clear">Clear</button>
                                </li>
                                <li class="text-center">
                                    <span>Attrs Copy</span>
                                    <br>
                                    ${isCopied>0?`
                                        <button id="pasteAttrs" class="btn">Paste</button>
                                    `:`
                                        <button id="pasteAttrs" class="btn" disabled>Pates</button>
                                    `}
                                    <button id="copyAttrs" class="btn">Copy</button>
                                    <button id="clearAttrs" class="btn clear">Clear</button>
                                </li>
                                <li class="text-center">
                                    <span>Move</span>
                                    <br>
                                    <button class="btn move" moving="left" class="btn">&#11164;</button>
                                    <button class="btn move" moving="top" class="btn clear">&#11165;</button>
                                    <button class="btn move" moving="bottom" class="btn clear">&#11167;</button>
                                    <button class="btn move" moving="right" class="btn">&#11166;</button>
                                </li>
                                <li class="text-center">
                                    <label for="bRow">To Rows</label>
                                    <input type="checkbox" class="attrs" id="bRow">
                                    <label for="bCol">To Cols</label>
                                    <input type="checkbox" class="attrs" id="bCol">
                                </li>
                                <li class="text-center">
                                    <span>Width & Height</span>
                                    <br>
                                    <label for="width">Width</label>
                                    <input type="number" class="form-input attrs" id="width" value="${getNumber('width')}">
                                    <select id="width" class="form-input attrs">
                                        ${setNumberUnitList(getUnit('width'))}
                                    </select>
                                    <br>
                                    <label for="height">Height</label>
                                    <input type="number" class="form-input attrs" id="height" value="${getNumber('height')}">
                                    <select id="height" class="form-input attrs">
                                        ${setNumberUnitList(getUnit('height'))}
                                    </select>
                                </li>
                                <li class="text-center">
                                    <span>Border All</span>
                                    <br>
                                    <button class="btn" id="bReset">Reset Border</button>
                                    <br>
                                    <input id="borderWidth" class="form-input border attrs" type="number" min="0" style="width: 50px;" value="${getNumber('borderWidth')}">

                                    <select id="borderWidth" class="form-input attrs">
                                        ${setNumberUnitList(getUnit('borderWidth'))}
                                    </select>

                                    <select id="borderStyle" class="form-input attrs" style="width: 70px;">
                                        ${setBorderStyleList(getStyle('borderStyle'))}
                                    </select>
                                    <input type="color" id="borderColor" class="form-input attrs" value="${getColor('borderColor')}">
                                </li>
                                <li class="text-center">
                                    <span>Border</span>
                                    <br>
                                    <span class="w-flex flex-column justify-content-center">
                                        <label class="w-flex justify-content-center" style="gap:.3rem;">
                                            top
                                            <input id="borderTopWidth" class="form-input border attrs" border="top" type="number" min="0" style="width: 50px;" value="${getNumber('borderTopWidth')}">

                                            <select id="borderTopWidth" class="form-input attrs">
                                                ${setNumberUnitList(getUnit('borderTopWidth'))}
                                            </select>

                                            <select id="borderTopStyle" class="form-input attrs" style="width: 70px;">
                                                ${setBorderStyleList(getStyle('borderTopStyle'))}
                                            </select>
                                            <input type="color" id="borderTopColor" class="form-input attrs" value="${getColor('borderTopColor')}">
                                        </label>
                                        <label class="w-flex justify-content-center" style="gap:.3rem;">
                                            left
                                            <input id="borderLeftWidth" class="form-input border attrs" border="left" type="number" min="0" style="width: 50px;" value="${getNumber('borderLeftWidth')}">

                                            <select id="borderLeftWidth" class="form-input attrs">
                                                ${setNumberUnitList(getUnit('borderLeftWidth'))}
                                            </select>

                                            <select id="borderLeftStyle" class="form-input attrs" style="width: 70px;">
                                                ${setBorderStyleList(getStyle('borderLeftStyle'))}
                                            </select>
                                            <input type="color" id="borderLeftColor" class="form-input attrs" value="${getColor('borderLeftColor')}">
                                        </label>
                                        <label class="w-flex justify-content-center" style="gap:.3rem;">
                                            right
                                            <input id="borderRightWidth" class="form-input border attrs" border="right" type="number" min="0" style="width: 50px;" value="${getNumber('borderRightWidth')}">

                                            <select id="borderRightWidth" class="form-input attrs">
                                                ${setNumberUnitList(getUnit('borderRightWidth'))}
                                            </select>

                                            <select id="borderRightStyle" class="form-input attrs" style="width: 70px;">
                                                ${setBorderStyleList(getStyle('borderRightStyle'))}
                                            </select>
                                            <input type="color" id="borderRightColor" class="form-input attrs" value="${getColor('borderRightColor')}">
                                        </label>
                                        <label class="w-flex justify-content-center" style="gap:.3rem;">
                                            bottom
                                            <input id="borderBottomWidth" class="form-input border attrs" border="bottom" type="number" min="0" style="width: 50px;" value="${getNumber('borderBottomWidth')}">

                                            <select id="borderBottomWidth" class="form-input attrs">
                                                ${setNumberUnitList(getUnit('borderBottomWidth'))}
                                            </select>

                                            <select id="borderBottomStyle" class="form-input attrs" style="width: 70px;">
                                                ${setBorderStyleList(getStyle('borderBottomStyle'))}
                                            </select>
                                            <input type="color" id="borderBottomColor" class="form-input attrs" value="${getColor('borderBottomColor')}">
                                        </label>
                                    </span>
                                </li>
                                <li class="text-center">
                                    <span>Colors</span>
                                    <br>
                                    <span class="w-flex justify-content-center">
                                        <span>
                                            font
                                            <br>
                                            <input type="color" id="color" class="form-input attrs" value="${getColor('color')}">
                                            <br>
                                            <input type="range" step="1" min="0" max="255" class="form-input attrs" id="color" value="${hexToNumber('color')}">
                                        </span>
                                        <span>
                                            background
                                            <br>
                                            <input type="color" id="backgroundColor" class="form-input attrs" value="${getColor('backgroundColor')}">
                                            <br>
                                            <input type="range" step="1" min="0" max="255" class="form-input attrs" id="backgroundColor" value="${hexToNumber('backgroundColor')}">
                                        </span>
                                    </span>
                                </li>
                                <li class="text-center">
                                    <span>Font</span>
                                    <br>
                                    <span>
                                        <label for="fontWeight">Bold</label>
                                        <select id="fontWeight" class="form-input attrs">
                                            <option${fontWeight=='lighter'?' selected':''} value="lighter">lighter</option>
                                            <option${fontWeight=='normal'?' selected':''} value="normal">normal</option>
                                            <option${fontWeight=='bold'?' selected':''} value="bold">bold</option>
                                            <option${fontWeight=='bolder'?' selected':''} value="bolder">bolder</option>
                                        </select>
                                    </span>
                                    <br>
                                    <input id="fontSize" type="number" value="${getNumber('fontSize')}" min="0" class="form-input attrs">
                                    <select id="fontSize" class="form-input attrs">
                                        ${setNumberUnitList(getUnit('fontSize'))}
                                    </select>
                                </li>
                                <li class="text-center">
                                    <span>Text align</span>
                                    <br>
                                    <span class="w-flex justify-content-center ta">
                                        <span>
                                            <label ${radio=='left'?'class="active"':radio==undefined?'class="active"':''} for="al">Left</label>
                                            <input class="attrs" type="radio" name="align" id="al" value="left" hidden>
                                        </span>
                                        <span>
                                            <label ${radio=='center'?'class="active"':''} for="ac">Center</label>
                                            <input class="attrs" type="radio" name="align" id="ac" value="center" hidden>
                                        </span>
                                        <span>
                                            <label ${radio=='right'?'class="active"':''} for="ar">Right</label>
                                            <input class="attrs" type="radio" name="align" id="ar" value="right" hidden>
                                        </span>
                                    </span>
                                </li>
                            </ul>
                        `);
                    }
                },
                addBtn: {
                    render(target, {rowid, colid}, rect){
                        ganttChart.insertAdjacentHTML('beforeend',
                        `<span
                        type="${target.tagName}"
                        direction="right"
                        class="add-btn"
                        rowId="${rowid.value}"
                        colId="${colid.value}"
                        style="
                        top: ${target.offsetTop + target.clientHeight/2}px;
                        left: ${rect.right}px;
                        transform: translate(-50%, -50%);
                        ">
                            ➕
                        </span>
                        <span
                        type="${target.tagName}"
                        direction="bottom"
                        class="add-btn"
                        rowId="${rowid.value}"
                        colId="${colid.value}"
                        style="
                        top: ${target.offsetTop + rect.height}px;
                        left: ${rect.right - (rect.width/2)}px;
                        transform: translate(-50%, -50%);
                        ">
                            ➕
                        </span>`.replace(/[\s]+/g, ' '));
                    }
                },
                delBtn: {
                    render(target, {rowid, colid}, rect, control){
                        const tableTop = target.closest('table').offsetTop;
                        const tableleft = target.closest('table').offsetleft;
                        if(control>0)
                        ganttChart.insertAdjacentHTML('beforeend',
                        (control%2!=0?`<span
                        type="${target.tagName}"
                        direction="col"
                        class="del-btn"
                        rowId="${rowid.value}"
                        colId="${colid.value}"
                        style="
                        width: ${rect.width}px;
                        top: ${tableTop}px;
                        left: ${rect.right - target.clientWidth/2}px;
                        transform: translate(-50%, -100%);
                        ">
                            ❌
                        </span>
                        `:'')
                        + (control>1?`<span
                        type="${target.tagName}"
                        direction="row"
                        class="del-btn"
                        rowId="${rowid.value}"
                        colId="${colid.value}"
                        style="
                        height: ${rect.height}px;
                        top: ${target.offsetTop + target.clientHeight/2}px;
                        left: ${tableleft}px;
                        transform: translate(-100%, -50%);
                        ">
                            ❌
                        </span>`.replace(/[\s]+/g, ' '):''));
                    }
                }
            };

            const view = new View();
            const model = new Model();
            const controller = new Controller();

            view.init(parts);
            model.init(view);
            controller.init(model);
        }
    }
})();