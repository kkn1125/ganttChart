export const Gantt = (function () {
    const ganttChart = document.querySelector('#gantt');

    function Controller() {
        let models, save, saveContent, blockAutoChange = false, toggler = false;

        this.init = function (model) {
            models = model;

            this.isRequest();
            this.renderChart();
            window.addEventListener('click', this.exportResult);
            window.addEventListener('click', this.deleteRowCol);
            window.addEventListener('click', this.addRowCol);
            window.addEventListener('click', this.toggleInput);
            window.addEventListener('mouseover', this.popupDeleteBtn);
            window.addEventListener('mouseover', this.popupAddBtn);
            window.addEventListener('contextmenu', this.popupControlList);
            window.addEventListener('change', this.autoValueChange);
            window.addEventListener('keydown', this.inputKey);
        }

        this.isRequest = function (){
            if(location.search == '') return;

            const params = new Map(location.search.slice(1).split('&').map(a=>a.split('=')));
            switch(params.get('req')){
                case 'true': setTimeout(() => {
                    document.body.innerHTML = `<div id="gantt">${document.querySelector('#gantt table#chart').outerHTML}</div>`;
                }); break;
                case 'false': console.log(''); break;
            }
        }

        this.popupControlList = function (ev){
            const target = ev.target;
            const closest = target.closest('th,td');
            if(!closest) {
                if(document.querySelector('.control-list')) document.querySelector('.control-list').remove();
                return;
            }

            ev.preventDefault();

            models.popupControlList(closest, ev);
        }

        this.exportResult = function (ev){
            const target = ev.target;
            if(target.id!='export') return;

            models.exportResult(target);
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

        this.renderChart = function () {
            models.renderChart();
        }
    }

    function Model() {
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

        this.init = function (view) {
            views = view;

            gantt = this.getStorage();
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

            views.popupControlList(closest, originData, ev);
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
            const ganttBody = document.querySelector("#gantt");
            ganttBody.querySelector('table#chart').style.cssText = `
                border-collapse: collapse;
                width: 100%;
            `;
            ganttBody.querySelectorAll('table th').forEach(el=>el.style.cssText = `
                background-color: gray;
                font-weight: bold;
                user-select: none;
                padding: .5rem;
                position: relative;
            `);
            ganttBody.querySelectorAll('table td').forEach(el=>el.style.cssText = `
                user-select: none;
                padding: .5rem;
                position: relative;
            `);
            navigator.clipboard.writeText(document.querySelector("#gantt").innerHTML.trim().replace(/\s{2,}/g, ' ')).then(
            clipText =>  console.log(document.querySelector("#gantt").innerHTML.trim().replace(/\s{2,}/g, ' '),'를 복사했습니다'));
        }

        this.autoValueChange = function (target){
            const parent = target.parentNode;
            const value = target.value;

            const {rowid, colid} = parent.attributes;

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

        this.popupControlList = function (target, data, ev){
            console.log(ev.x, ev.y, ev.x-ev.offsetX, ev.y-ev.offsetY)
            parts.controlList.render(ev, data);
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
                    console.log(cols.attr);

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
                    render({x, y}, data){
                        const [number, unit] = data.attr.fontSize?.match(/([0-9.]+)(\w+)/).slice(1)||[0,'rem'];
                        ganttChart.insertAdjacentHTML('beforeend', `
                            <ul
                            class="control-list"
                            style="
                                top: ${y}px;
                                left: ${x}px;
                            ">
                                <li class="text-center">
                                    Color
                                    <input type="color" id="color" class="form-input">
                                </li>
                                <li class="text-center">
                                    Font size
                                    <input type="number" value="${number}" min="0" class="form-input">
                                    <select id="unit" class="form-input" value="${unit}">
                                        <option value="px">px</option>
                                        <option value="cm">cm</option>
                                        <option value="mm">mm</option>
                                        <option value="in">in</option>
                                        <option value="pc">pc</option>
                                        <option value="pt">pt</option>
                                        <option value="ch">ch</option>
                                        <option value="em">em</option>
                                        <option value="rem">rem</option>
                                        <option value="vh">vh</option>
                                        <option value="vw">vw</option>
                                        <option value="vmin">vmin</option>
                                        <option value="vmax">vmax</option>
                                    </select>
                                </li>
                                <li class="text-center">3</li>
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
                        transform: translate(0%, -50%);
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
                        transform: translate(0%, -100%);
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