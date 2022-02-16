export const Gantt = (function () {
    const ganttChart = document.querySelector('#gantt');

    function Controller() {
        let models, save, saveContent, blockAutoChange = false, toggler = false;

        this.init = function (model) {
            models = model;

            window.addEventListener('keydown', this.workRedo);
            window.addEventListener('keydown', this.workUndo);
            window.addEventListener('click', this.emptyCopiedAttrs);
            window.addEventListener('click', this.pasteCopiedAttrs);
            window.addEventListener('click', this.copyAttrs);
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
            window.addEventListener('keydown', this.inputKey);
        }

        this.workUndo = function (ev){
            if(!(ev.key=='z' && ev.ctrlKey)) return;

            models.workUndo();
        }

        this.workRedo = function (ev){
            if(!(ev.key=='y' && ev.ctrlKey)) return;

            models.workRedo();
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
            if(target.id!='export') return;

            models.exportResult(target);
        }

        this.autoAttrsValueChange = function (ev){
            const target = ev.target;
            if(!target.classList.contains('attrs')) return;

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

        this.inputKey = function (ev){
            const target = ev.target;

            if(target.tagName != 'TEXTAREA') return;

            const parent = target.closest('th,td');

            if(toggler){
                if(ev.key == 'Escape'){
                    blockAutoChange = true;
                    parent.classList.remove('active');
                    parent.innerHTML = saveContent;
                    save = null;
                    saveContent = null;
                    toggler = false;
                } else if(ev.ctrlKey && ev.key == 'Enter'){
                    parent.classList.remove('active');
                    target.blur();
                    parent.innerHTML = target.value.replace(/[\n]/gm, '<br>');
                    save = null;
                    saveContent = null;
                    toggler = false;
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
                            el.innerHTML = el.querySelector('textarea').value.replace(/[\n]/gm, '<br>');
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
                        el.innerHTML = el.querySelector('textarea').value.replace(/[\n]/gm, '<br>');
                    }
                    toggler = false;
                }
            });

            save = target;

            if(!save.classList.contains('active')) {
                save.classList.add('active');
                saveContent = save.innerHTML.replace(/<br>/gm, '\n');
                toggler = true;
            } else {
                save.classList.remove('active');
                toggler = false;
            }
            
            if(toggler){
                ta.value = save.innerHTML.replace(/<br>/g, '\n');
                save.insertAdjacentElement('beforeend', ta);
                ta.focus();
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
            console.log(history, hisIndex)
        }

        this.workUndo = function (ev){
            if(hisIndex>0){
                hisIndex--;
                gantt = history[hisIndex];
                console.log(hisIndex, history)
                this.setStorage(gantt);
                views.renderChart(gantt);
            }
        }

        this.workRedo = function (ev){
            if(hisIndex<history.length-1){
                hisIndex++;
                gantt = history[hisIndex];
                console.log(hisIndex, history)
                this.setStorage(gantt);
                views.renderChart(gantt);
            }
        }

        this.clearCopiedAttrs = function (){
            Object.keys(copiedAttrs).forEach(e=>delete copiedAttrs[e]);
        }

        this.emptyCopiedAttrs = function (target, controlList){
            this.clearCopiedAttrs();
            
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

        this.autoAttrsValueChange = function (target){
            const closest = target.closest('ul.control-list');
            const type = closest.getAttribute('type');
            const ganttType = type=='TH'?'head':'body';
            const {rowid, colid} = closest.attributes;
            let hex, rgb, opacity, hexOpacity, bgHex, bgRgb, bgOpacity, hexBgOpacity, fontSize, unit, parent;

            switch(target.id){
                case 'color': case 'colorOpacity':
                    parent = target.parentNode;
                    hex = parent.querySelector('#color').value;
                    opacity = parseInt(parent.querySelector('#colorOpacity').value);
                    rgb = hex.slice(1).match(/.{1,2}/g).map(e=>parseInt(e, 16));

                    hexOpacity = opacity.toString(16);

                    document.querySelector(`${type}[rowid="${rowid.value}"][colid="${colid.value}"]`).style['color'] = hex+hexOpacity;
                    gantt[ganttType][rowid.value][colid.value].attr['color'] = hex+hexOpacity;
                    break;
                    case 'backgroundColor': case 'backgroundColorOpacity':
                    parent = target.parentNode;
                    bgHex = parent.querySelector('#backgroundColor').value;
                    bgOpacity = parseInt(parent.querySelector('#backgroundColorOpacity').value);
                    bgRgb = bgHex.slice(1).match(/.{1,2}/g).map(e=>parseInt(e, 16));

                    hexBgOpacity = bgOpacity.toString(16);

                    document.querySelector(`${type}[rowid="${rowid.value}"][colid="${colid.value}"]`).style['backgroundColor'] = bgHex+hexBgOpacity;
                    gantt[ganttType][rowid.value][colid.value].attr['backgroundColor'] = bgHex+hexBgOpacity;
                    break;
                case 'fontSize': case 'unit':
                    parent = target.parentNode;
                    fontSize = parent.querySelector('#fontSize').value;
                    unit = parent.querySelector('#unit').value;
                    document.querySelector(`${type}[rowid="${rowid.value}"][colid="${colid.value}"]`).style['fontSize'] = fontSize+unit;
                    gantt[ganttType][rowid.value][colid.value].attr['fontSize'] = fontSize+unit;
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

            views.popupControlList(closest, originData, ev, Object.keys(copiedAttrs).length);
        }

        this.getStorage = function(){
            let temp;
            if(!localStorage['gantt']) this.setStorage(gantt);
            if(localStorage['gantt']) temp = JSON.parse(localStorage['gantt']);
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
            rowid = parseInt(rowid);
            gantt.head.splice(rowid + 1, 0, new Array(gantt.head[rowid].length).fill({text:'New Contents', attr:{}}));
        }

        this.addBodyRow = function(rowid){
            rowid = parseInt(rowid);
            gantt.body.splice(rowid + 1, 0, new Array(gantt.body[rowid].length).fill({text:'New Contents', attr:{}}));
        }

        this.addHeadCol = function(colid){
            colid = parseInt(colid);
            gantt.head.map(row=>row.splice(colid + 1, 0, {text:'New Contents', attr:{}}));
        }

        this.addBodyCol = function(colid){
            colid = parseInt(colid);
            gantt.body.map(row=>row.splice(colid + 1, 0, {text:'New Contents', attr:{}}));
        }

        this.popupDeleteBtn = function (target){
            const rect = target.getBoundingClientRect();
            let control = 0;
            switch(target.tagName){
                case 'TH':
                    if(gantt.head.length==1 && gantt.head[0].length==1) control = 0;
                    else if(gantt.head.length>1 && gantt.head[0].length==1) control = 2;
                    else if(gantt.head.length==1 && gantt.head[0].length>1) control = 1;
                    else if(gantt.head.length>1 && gantt.head[0].length>1) control = 3;
                    break;
                case 'TD':
                    if(gantt.body.length==1 && gantt.body[0].length==1) control = 0;
                    else if(gantt.body.length>1 && gantt.body[0].length==1) control = 2;
                    else if(gantt.body.length==1 && gantt.body[0].length>1) control = 1;
                    else if(gantt.body.length>1 && gantt.body[0].length>1) control = 3;
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
        let parts, chart, thead, tbody, temp;

        this.init = function (part) {
            parts = part;

            this.renderTable();
        }

        this.popupControlList = function (target, data, ev, isCopied){
            // console.log(ev.x, ev.y, ev.x-ev.offsetX, ev.y-ev.offsetY)
            parts.controlList.render(target, data, ev, isCopied);
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

            parts.addBtn.render(target, target.attributes, temp);
        }

        this.renderChart = function (gantt) {
            chart.id = 'chart';

            this.clearThead();
            this.clearTbody();
            this.clearBtns();

            gantt.head?.forEach((rows, rowId)=>{
                let tr = document.createElement('tr');

                rows.forEach((cols, colId)=>{
                    let th = document.createElement('th');

                    Object.entries(cols.attr).forEach(([key, val])=>{
                        th.style[key] = val;
                    });

                    th.innerHTML = cols.text.replace(/[\n]/gm, '<br>');
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
                        td.style[key] = val;
                    });

                    td.innerHTML = cols.text.replace(/[\n]/gm, '<br>');
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
                        target.insertAdjacentHTML('beforeend',`<table id="chart">
                            <thead id="thead">
                                
                            </thead>
                            <tbody id="tbody">
                                
                            </tbody>
                        </table>`);
                    }
                },
                controlList: {
                    render(target, data, {x, y}, isCopied){
                        const {rowid, colid} = target.attributes;
                        const [number, unit] = data.attr.fontSize?.match(/([0-9.]+)(\w+)/).slice(1)||[0,'rem'];

                        const hex = data.attr.color?.slice(0,7)||'#000000';
                        const bgHex = data.attr.backgroundColor?.slice(0,7)||'#ffffff';
                        const opacity = parseFloat(parseInt((data.attr.color?.slice(7, 9)||'ff'), 16).toFixed(2));
                        const bgOpacity = parseFloat(parseInt((data.attr.backgroundColor?.slice(7, 9)||'ff'), 16).toFixed(2));

                        ganttChart.insertAdjacentHTML('beforeend', `
                            <ul
                            type="${target.tagName}"
                            class="control-list"
                            rowid="${rowid.value}"
                            colid="${colid.value}"
                            style="
                                top: ${y}px;
                                left: ${x}px;
                            ">
                                <li class="text-center">
                                    ${isCopied>0?`
                                        <button id="pasteAttrs" class="btn">Pates</button>
                                    `:`
                                        <button id="pasteAttrs" class="btn" disabled>Pates</button>
                                    `}
                                    <button id="copyAttrs" class="btn">Copy</button>
                                    <button id="clearAttrs" class="btn clear">Clear</button>
                                </li>
                                <li class="text-center">
                                    Color
                                    <br>
                                    <input type="color" id="color" class="form-input attrs" value="${hex}">
                                    <br>
                                    <input type="range" step="1" min="16" max="255" class="form-input attrs" id="colorOpacity" value="${opacity}">
                                </li>
                                <li class="text-center">
                                    bgColor
                                    <br>
                                    <input type="color" id="backgroundColor" class="form-input attrs" value="${bgHex}">
                                    <br>
                                    <input type="range" step="1" min="16" max="255" class="form-input attrs" id="backgroundColorOpacity" value="${bgOpacity}">
                                </li>
                                <li class="text-center">
                                    Font size
                                    <input id="fontSize" type="number" value="${number||16}" min="0" class="form-input attrs">
                                    <select id="unit" class="form-input attrs">
                                        <option${(unit||'px')=='px'?' selected':''} value="px">px</option>
                                        <option${(unit||'px')=='cm'?' selected':''} value="cm">cm</option>
                                        <option${(unit||'px')=='mm'?' selected':''} value="mm">mm</option>
                                        <option${(unit||'px')=='in'?' selected':''} value="in">in</option>
                                        <option${(unit||'px')=='pc'?' selected':''} value="pc">pc</option>
                                        <option${(unit||'px')=='pt'?' selected':''} value="pt">pt</option>
                                        <option${(unit||'px')=='ch'?' selected':''} value="ch">ch</option>
                                        <option${(unit||'px')=='em'?' selected':''} value="em">em</option>
                                        <option${(unit||'px')=='rem'?' selected':''} value="rem">rem</option>
                                        <option${(unit||'px')=='vh'?' selected':''} value="vh">vh</option>
                                        <option${(unit||'px')=='vw'?' selected':''} value="vw">vw</option>
                                        <option${(unit||'px')=='vmin'?' selected':''} value="vmin">vmin</option>
                                        <option${(unit||'px')=='vmax'?' selected':''} value="vmax">vmax</option>
                                    </select>
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
                        top: ${rect.top + target.clientHeight/2}px;
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
                        top: ${rect.top + rect.height}px;
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
                        top: ${rect.top + target.clientHeight/2}px;
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