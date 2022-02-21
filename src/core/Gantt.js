console.warn(`[GanttChart] 현재 버전 : v0.2.4`);
export const Gantt = (function () {
    const ganttWrap = document.querySelector('#ganttWrap');
    const ganttWorkSpace = document.querySelector('.gantt-workspace');
    const ganttChart = document.querySelector('#gantt');
    const textEdit = {};

    textEdit.spaceToNbsp = (value) => value.replace(/[\s]/gm, '&nbsp;');
    textEdit.nbspToSpace = (value) => value.replace(/&nbsp;/gm, ' ');
    textEdit.enterToBr = (value) => value.replace(/[\n]/gm, '<br>');
    textEdit.brToEnter = (value) => value.replace(/<br>/gm, '\n');

    textEdit.taToHTML = (ta) => textEdit.spaceToNbsp(textEdit.enterToBr(ta));
    textEdit.htmlToTa = (ta) => textEdit.nbspToSpace(textEdit.brToEnter(ta));

    textEdit.camelToKebab = (str) => {
        let firstLower;
        let temp = str.match(/[A-Z][a-z]*/g);
        if(temp) firstLower = str.split(temp[0])[0];
        return ((firstLower?firstLower+'-':'')+str.match(/[A-Z][a-z]*/g)?.map(s=>s.toLowerCase()).join('-'))||str;
    };

    function Controller() {
        let models, save, saveContent, blockAutoChange = false, toggler = false, tempRow, tempCol, shift=false, mousedown=false, hoverCell, multiple=false, editSheet=false, handMode=false, selectCount=0, cellEdit=false;

        this.init = function (model) {
            models = model;
            
            window.addEventListener('keyup', this.cancelHotkey);
            window.addEventListener('keydown', this.hotKey.bind(this));
            window.addEventListener('keydown', this.workRedo);
            window.addEventListener('keydown', this.workUndo);
            document.body.addEventListener('mouseleave', this.browserLeave.bind(this));
            window.addEventListener('mouseup', this.selectCell);
            window.addEventListener('mousemove', this.selectingCell);
            window.addEventListener('mousedown', this.selectReadyCell);
            window.addEventListener('mouseup', this.removeGrabMode);
            window.addEventListener('mousemove', this.grabMoveWindow);
            window.addEventListener('mousedown', this.grabWindow);
            window.addEventListener('click', this.cellConcat);
            window.addEventListener('click', this.cellDivide);
            window.addEventListener('click', this.clearpopupHotkey);
            window.addEventListener('click', this.tabExcute.bind(this));
            window.addEventListener('click', this.selectWorkSheet);
            window.addEventListener('click', this.workSheetBtn);
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
            window.addEventListener('click', this.closePopupControlList);
            window.addEventListener('dblclick', this.toggleInput);
            window.addEventListener('mouseover', this.popupDeleteBtn);
            window.addEventListener('mouseover', this.popupAddBtn);
            window.addEventListener('contextmenu', this.popupControlList);
            window.addEventListener('contextmenu', this.popupControlSheet);
            window.addEventListener('change', this.autoValueChange);
            window.addEventListener('input', this.autoAttrsValueChange);
            window.addEventListener('keydown', this.inputKey.bind(this));
        }

        this.browserLeave = function (ev){
            let parent;
            const target = document.querySelector('textarea');
            if(target) parent = target.closest('th,td');
            cellEdit = false;
            if(target) this.saveContent(target, parent);
            models.clearpopupHotkey();
            models.removeHandMode();
            models.clearSelectBox();
            models.clearSelected();
        }

        this.cellConcat = function (ev){
            const target = ev.target;
            const closest = target.closest('.control-list');

            if(target.id!='cellConcat') return;
            
            models.cellConcat(closest);
        }

        this.cellDivide = function (ev){
            const target = ev.target;
            const closest = target.closest('.control-list');

            if(target.id!='cellDivide') return;

            models.cellDivide(closest);
        }

        this.clearpopupHotkey = function (ev){
            const target = ev.target;
            if(ev.which == 2) return;

            if(target.closest('.popup-hotkey') && !target.classList.contains('del-popup')) return;
            models.clearpopupHotkey();
        }

        this.workSheetBtn = function (ev){
            const target = ev.target;
            const closest = target.closest('.sheet-list, .work input');
            if(ev.which == 2) return;

            if(!closest) {
                editSheet = false;
                models.saveWorkSheetName(target);
                return;
            }

            editSheet = true;
            models.workSheetBtn(closest, target);
        }

        this.selectWorkSheet = function (ev){
            const target = ev.target;
            if(ev.which == 2) return;

            if(!target.classList.contains('work')) return;
            models.selectWorkSheet(target);
        }

        this.cancelHotkey = function(ev) {
            if(ev.key == 'Shift'){
                shift = false;
                document.querySelectorAll('.add-btn').forEach(el=>el.remove());
            } else if(ev.key == 'Control'){
                multiple = false;
            } else if(ev.code == 'Space'){
                if(cellEdit) return;
                ev.preventDefault();
                handMode = false;
                ganttWorkSpace.classList.remove('handMode');
            }
        }

        this.tabExcute = function(ev){
            const target = ev.target;
            if(ev.which == 2) return;

            switch(target.id){
                case 'layoutAuto': case 'layoutFixed':
                    const mode = target.textContent.split(' ').pop();
                    document.querySelector('table#chart').style.tableLayout = mode;
                    break;
                case 'addRowHead': case 'addRowBody':
                    this.addInitialRow({target: target});
                    break;
                case 'selectAll':
                    models.selectAll();
                    break;
                case 'deleteAll':
                    models.deleteAll();
                    break;
                case 'devkimson':
                    window.open('https://github.com/kkn1125');
                    break;
                case 'ganttChart':
                    window.open('https://github.com/kkn1125/ganttChart');
                    break;
                case 'showKeyBinding':
                    models.popupHotKeyList();
                    break;
                case 'penMode':
                    handMode = !handMode;
                    if(handMode) models.handMode();
                    else models.removeHandMode();
                    break;
            }
        }

        this.removeGrabMode = function (ev){
            if(ev.which == 2) return;

            if(!handMode) return;
            models.removeGrabMode();
        }

        this.grabMoveWindow = function (ev){
            if(ev.which == 2) return;

            if(!handMode) return;
            models.grabMoveWindow(ev);
        }

        this.grabWindow = function (ev){
            if(ev.which == 2) return;

            if(!handMode) return;
            models.grabMode();
        }

        this.hotKey = function (ev){
            if(editSheet) return;
            if(handMode) return;

            if(ev.ctrlKey && ev.key == 'c'){
                ev.preventDefault();
                models.copyHotKey();
            } else if(ev.ctrlKey && ev.key == 'v'){
                ev.preventDefault();
                models.pasteHotKey();
            } else if(ev.ctrlKey && ev.key == 'a' && !cellEdit){
                ev.preventDefault();
                selectCount = 0;
                models.selectAll();
            } else if(ev.ctrlKey && ev.key == 'Delete'){
                ev.preventDefault();
                models.deleteAll();
            } else if(ev.code == 'Space'){
                if(cellEdit) return; 
                ev.preventDefault();
                if(!handMode) {
                    handMode = true;
                    models.handMode();
                }
            } else if(ev.key == 'F2'){
                ev.preventDefault();  
                this.toggleInput({target: models.getSelected()});
            } else if(ev.key == 'Delete'){
                ev.preventDefault();
                models.clearSelectedContent();
                models.clearSelectBox();
                models.clearSelected();
            } else if(ev.key == 'Escape'){
                ev.preventDefault();
                cellEdit = false;
                models.clearSelectBox();
                models.clearSelected();
                document.querySelector('.popup-hotkey')?.remove();
                document.querySelectorAll('.control-list').forEach(el=>el.remove());
            } else if(ev.key == 'Shift'){
                ev.preventDefault();
                models.clearSelected();
                models.clearSelectBox();
                mousedown = false;
                if(!shift) {
                    shift = true;
                    if(hoverCell){
                        this.popupAddBtn({target: hoverCell});
                    }
                }
            } else if(ev.ctrlKey){
                multiple = true;
            }
        }

        this.selectCell = function (ev){
            const target = ev.target;
            const closest = target.closest('th,td,.control-list');
            if(ev.which == 2) return;

            if(!closest) {
                models.clearSelectBox();
                models.clearSelected();
                mousedown = false;
                return;
            }

            if(ev.which == 1){
                selectCount = 0;
            }

            if(ev.which == 3){
                selectCount = 1;
            }
            
            if(mousedown) {
                models.selectCell(closest);
            }

            mousedown = false;
            models.clearSelectBox();
        }

        this.selectingCell = function (ev){
            if(ev.which == 2) return;
            if(!mousedown) return;
            models.controlSelectingBox(ev);
        }

        this.selectReadyCell = function (ev){
            const target = ev.target;
            const closest = target.closest('th,td,.control-list');
            if(ev.which == 2) return;
            if(handMode) return;
            if(!closest) {
                models.clearSelected();
                return;
            }

            if(!shift){
                mousedown = true;
            }

            if(target.closest('.control-list')){
                mousedown = false;
            }

            if(ev.which == 3){
                selectCount+=2;
                if(selectCount>2) {
                    selectCount = 0;
                    models.clearSelected();
                }
            }

            if(mousedown) {
                if(!multiple && closest && ev.which == 1) {
                    models.clearSelected();
                }
                models.selectReadyCell(closest);
                models.renderSelectingBox(ev);
            }
        }

        this.addInitialRow = function (ev){
            const target = ev.target;

            if(target.id!='addRowHead' && target.id!='addRowBody') return;
            
            if(target.id == 'addRowHead') models.addInitailRowHead();
            else if(target.id == 'addRowBody') models.addInitailRowBody();
        }

        this.workUndo = function (ev){
            if(ev.code == 'Space' && !cellEdit) ev.preventDefault();
            if(!(ev.key=='z' && ev.ctrlKey)) return;
            
            models.workUndo();
        }

        this.workRedo = function (ev){
            if(ev.code == 'Space' && !cellEdit) ev.preventDefault();
            if(!(ev.key=='y' && ev.ctrlKey)) return;

            models.workRedo();
        }

        this.borderReset = function (ev){
            const target = ev.target;
            const controlList = target.closest('.control-list');
            if(ev.which == 2) return;

            if(target.id!='bReset') return;

            models.borderReset(target, controlList);
        }

        this.movingRowCol = function (ev){
            const target = ev.target;
            const controlList = target.closest('.control-list');
            if(ev.which == 2) return;

            if(!target.classList.contains('move')) return;

            models.movingRowCol(target, controlList);
        }

        this.emptyCopiedContents = function (ev){
            const target = ev.target;
            const controlList = target.closest('.control-list');
            if(ev.which == 2) return;

            if(target.id != 'clearContents') return;

            models.emptyCopiedContents(target, controlList);
        }

        this.pasteCopiedContents = function (ev){
            const target = ev.target;
            const controlList = target.closest('.control-list');
            if(ev.which == 2) return;

            if(target.id != 'pasteContents') return;

            models.pasteCopiedContents(target, controlList);
        }

        this.copyContents = function (ev){
            const target = ev.target;
            const controlList = target.closest('.control-list');
            if(ev.which == 2) return;

            if(target.id != 'copyContents') return;

            models.copyContents(target, controlList);
        }

        this.emptyCopiedAttrs = function (ev){
            const target = ev.target;
            const controlList = target.closest('.control-list');
            if(ev.which == 2) return;

            if(target.id != 'clearAttrs') return;

            models.emptyCopiedAttrs(target, controlList);
        }

        this.pasteCopiedAttrs = function (ev){
            const target = ev.target;
            const controlList = target.closest('.control-list');
            if(ev.which == 2) return;

            if(target.id != 'pasteAttrs') return;

            models.pasteCopiedAttrs(target, controlList);
        }

        this.copyAttrs = function (ev){
            const target = ev.target;
            const controlList = target.closest('.control-list');
            if(ev.which == 2) return;

            if(target.id != 'copyAttrs') return;

            models.copyAttrs(target, controlList);
        }

        this.popupControlSheet = function (ev){
            const target = ev.target;
            const closest = target.closest('.work:not(.add-work)');

            if(document.querySelector('.sheet-list')) document.querySelector('.sheet-list').remove();

            if(!closest) return;

            ev.preventDefault();
            editSheet = true;
            models.popupControlSheet(closest, ev);
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
            const closest = target.closest('.control-list, textarea');
            // v0.2.1 셀 편집모드 내용 클릭 시 편집모드 종료되는 버그 수정 *textarea*
            if(ev.which == 2) return;

            if(!closest) {
                document.querySelectorAll('th.active, td.active').forEach(el=>{
                    if(el!=closest){
                        el.classList.remove('active');
                        if(el.querySelector('textarea')){
                            models.autoValueChange(el.querySelector('textarea'));
                            el.innerHTML = textEdit.taToHTML(el.querySelector('textarea').value);
                        }
                        toggler = false;
                    }
                });
            }

            if(!closest && !handMode ) document.querySelectorAll('.control-list').forEach(el=>{
                el.classList.add('out');
                setTimeout(() => {
                    el.remove();
                }, 500);
            });
            if(!closest) document.querySelectorAll('.sheet-list').forEach(el=>el.remove());
        }

        this.exportResult = function (ev){
            const target = ev.target;
            if(ev.which == 2) return;

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
            cellEdit = false;
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
                    cellEdit = false;
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

                    this.toggleInput({target: getTHTD});
                }
            }
        }

        this.toggleInput = function (ev){
            const target = ev.target;
            if(!target) return;
            const ta = document.createElement('textarea');
            const closests = target.closest('TD,TH');

            if(!target.closest('.control-list')) models.clearSelected();

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
                cellEdit = false;
                return;
            }

            document.querySelectorAll('th.active, td.active').forEach(el=>{
                if(el!=closests){
                    el.classList.remove('active');
                    if(el.querySelector('textarea')){
                        el.innerHTML = textEdit.taToHTML(el.querySelector('textarea').value);
                    }
                    toggler = false;
                    cellEdit = false;
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
                cellEdit = true;
            } else {
                ta.remove();
                save = null;
            }
        }

        this.deleteRowCol = function (ev){
            const target = ev.target;
            if(ev.which == 2) return;

            if(!target.classList.contains('del-btn')) return;

            models.deleteRowCol(target);
        }

        this.addRowCol = function (ev){
            const target = ev.target;
            if(ev.which == 2) return;

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

            if(!target.classList.contains('add-btn') && document.querySelector('.add-btn'))
            document.querySelectorAll('.add-btn').forEach(el=>el.remove());

            if(target.tagName != 'TD' && target.tagName != 'TH') {
                hoverCell = null;
                shift = false;
                return;
            }

            hoverCell = target;

            if(shift && hoverCell) {
                models.popupAddBtn(target);
                // hoverCell = null;
                return;
            }
            
            if(shift && hoverCell) models.popupAddBtn(target);
        }
    }

    function Model() {
        const copiedAttrs = {};
        const copiedContents = {text: ''};
        const maxHistory = 30;
        let views;
        let ganttSheet = [];
        let Sheet = ()=>{
            return {
                id: new Date().getTime().toString(36),
                head: [
                    [
                        {
                            text: 'Hello',
                            attr: {
                                fontSize: '16px',
                                width: 'auto',
                                height: 'auto',
                                padding: 'auto',
                                border: 'auto',
                                color: '#000000ff',
                                backgroundColor: '#ffffffff',
                                fontWeight: 'normal',
                                textAlign: 'left',
                                verticalAlign: 'middle',
                            },
                        }
                    ],
                ],
                body: [
                    [
                        {
                            text: 'Master 🙇‍♂️',
                            attr: {
                                fontSize: '16px',
                                width: 'auto',
                                height: 'auto',
                                padding: 'auto',
                                border: 'auto',
                                color: '#000000ff',
                                backgroundColor: '#ffffffff',
                                fontWeight: 'normal',
                                textAlign: 'left',
                                verticalAlign: 'middle',
                            },
                        }
                    ],
                ],
                regdate: new Date().getTime(),
            }
        };
        let gantt = {
            id: new Date().getTime().toString(36),
            head: [
                [
                    {
                        text: '헤드 부분입니다.\n헤드와 바디 경계선은 구분 짓기 위함입니다.\n내보내기하면 구분선 제외하고 복사됩니다.',
                        attr: {
                            fontSize: '16px',
                            width: 'auto',
                            height: 'auto',
                            padding: 'auto',
                            border: 'auto',
                            color: '#00000000',
                            backgroundColor: '#ffffffff',
                            fontWeight: 'normal',
                            textAlign: 'left',
                            verticalAlign: 'middel',
                        },
                    }
                ],
            ],
            body: [
                [
                    {
                        text: '바디 부분입니다.',
                        attr: {
                            fontSize: '16px',
                            width: 'auto',
                            height: 'auto',
                            padding: 'auto',
                            border: 'auto',
                            color: '#00000000',
                            backgroundColor: '#ffffffff',
                            fontWeight: 'normal',
                            textAlign: 'left',
                            verticalAlign: 'middel',
                        },
                    }
                ],
            ],
            regdate: new Date().getTime(),
        };
        let history = [];
        let hisIndex = 0;
        let selected = [];

        this.init = function (view) {
            views = view;

            gantt = this.getStorage();

            ganttSheet = this.getSheetStorage();

            this.renderChartAddHistory();
        }

        this.cellConcat = function (closest){
            const {rowid, colid} = closest.attributes;
            console.log('합치기');
        }

        this.cellDivide = function (closest){
            console.log('나누기');
        }

        this.removeGrabMode = function(){
            ganttWorkSpace.classList.remove('grabMode');
        }

        this.grabMoveWindow = function(ev){
            if(!ganttWorkSpace.classList.contains('grabMode')) return;
            ganttWorkSpace.scrollTo({
                top: ganttWorkSpace.scrollTop - ev.movementY,
                left: ganttWorkSpace.scrollLeft - ev.movementX,
                behavior: 'auto',
            });
        }

        this.grabMode = function(){
            ganttWorkSpace.classList.add('grabMode');
        }

        this.removeHandMode = function(){
            ganttWorkSpace.classList.remove('handMode');
        }

        this.handMode = function(){
            ganttWorkSpace.classList.add('handMode');
        }

        this.getSelected = function(){
            return selected[0]?.el;
        }

        this.clearpopupHotkey = function (){
            views.clearpopupHotkey();
        }

        this.popupHotKeyList = function(){
            views.popupHotKeyList();
        }

        this.saveWorkSheetName = function (target){
            const input = document.querySelector('span.work input');
            if(target == input) return;
            if(!input) return;
            const id = input.id;
            
            const [hasGantt, idx] = this.findGanttSheet(id);

            ganttSheet[idx].title = input.value.trim();

            this.renderChartAddHistory();
        }

        this.workSheetBtn = function (closest, target){
            switch(target.id){
                case 'workRename':
                    this.renameWork(closest.id);
                    break;
                case 'workRemove':
                    this.removeWork(closest.id);
                    break;
            }
        }

        this.renameWork = function (id){
            const ta = document.createElement('input');
            const target = document.querySelector(`span#${id}`);
            ta.id = id;
            ta.value = target.innerHTML;
            target.innerHTML = '';
            target.append(ta);
            ta.select();
        }

        this.removeWork = function (id){
            let tempGantt;
            let ganttIdx = -1;
            let hasGantt = ganttSheet.some((g, i)=>{
                let isSame = g.id==id;
                if(isSame) ganttIdx = i;
                return isSame;
            });

            if (ganttSheet.length == 1) return;

            if (hasGantt) {
                tempGantt = ganttSheet[ganttIdx];
                let answer = confirm(`"${tempGantt.title}" 시트를 삭제하시겠습니까?\n삭제 후 Redo로 되돌릴 수 있지만 새로고침 되면 복구 불가합니다.`);
                
                if (answer) {
                    ganttSheet.splice(ganttIdx, 1);
                    gantt = ganttSheet[ganttSheet.length - 1];
                }
            }

            this.renderChartAddHistory();
        }

        this.selectWorkSheet = function (work){
            let ganttIdx = -1;
            let workIdx = -1;
            let hasGantt = ganttSheet.some((g, i)=>{
                let isSame = g.id==gantt.id;
                if(isSame) ganttIdx = i;
                return isSame;
            });

            let hasWork = ganttSheet.some((g, i)=>{
                let isSame = g.id==work.id;
                if(isSame) workIdx = i;
                return isSame;
            });

            if(hasGantt) ganttSheet[ganttIdx] = gantt;

            if(hasWork) gantt = ganttSheet[workIdx];
            if(!hasWork && work.classList.contains('add-work')){
                gantt = Sheet();
                gantt.title = `Sheet ${ganttSheet.length+1}`;
                ganttSheet.push(gantt);
            }

            this.renderChartAddHistory();
        }

        this.clearSelectedContent = function (){
            selected.map(s=>{
                let rowid = parseInt(s.el.getAttribute('rowid'));
                let colid = parseInt(s.el.getAttribute('colid'));
                gantt[s.el.tagName=='TH'?'head':'body'][rowid][colid].text = '';
            });

            this.renderChartAddHistory();
        }

        this.copyHotKey = function (){
            this.clearCopiedAttrs();

            if(selected.length==0) return;

            let copyTarget = selected[0];

            const type = copyTarget.el.tagName;
            const {rowid, colid} = copyTarget.el.attributes;
            const ganttType = type=='TH'?'head':'body';

            copiedContents.text = gantt[ganttType][rowid.value][colid.value].text;
            Object.assign(copiedAttrs, gantt[ganttType][rowid.value][colid.value].attr);
            if(!copiedAttrs.hasOwnProperty('backgroundColor')) copiedAttrs['backgroundColor'] = '#ffffffff';
        }

        this.pasteHotKey = function (){
            selected.forEach(sel=>{
                const copyTarget = sel.el;
                const type = copyTarget.tagName;
                const {rowid, colid} = copyTarget.attributes;
                const ganttType = type=='TH'?'head':'body';
                
                copyTarget.innerHTML = copiedContents.text;
                
                gantt[ganttType][rowid.value][colid.value].text = copiedContents.text;

                Object.entries(copiedAttrs).forEach(([key, val])=>{
                    copyTarget.style[key] = val;
                    gantt[ganttType][rowid.value][colid.value].attr[key] = val;
                });
            });
            this.clearSelected();
            this.renderChartAddHistory();
        }

        this.findGanttSheet = function (id){
            let ganttIdx = -1;
            let hasGantt = ganttSheet.some((g, i)=>{
                let isSame = g.id==id;
                if(isSame) ganttIdx = i;
                return isSame;
            });
            return [hasGantt, ganttIdx];
        }

        this.findGantt = function (ganttType, {rowid, colid}){
            return gantt[ganttType=='TH'?'head':'body'][rowid.value][colid.value];
        }

        this.clearSelected = function(){
            selected = [];
            document.querySelectorAll('.selected:not(.work)').forEach(el=>el.classList.remove('selected'));
        }

        this.selectCell = function (closest){
            let start = selected.pop();
            
            const endName = closest.tagName;
            const startName = start.el.tagName;
            const {rowid:endRowid, colid:endColid} = closest.attributes;
            const {rowid:startRowid, colid:startColid} = start.el.attributes;

            const [startRowId, startColId, endRowId, endColId] = [parseInt(startRowid.value), parseInt(startColid.value), parseInt(endRowid.value), parseInt(endColid.value)];

            let RowMax = Math.max(startRowId, endRowId);
            let RowMin = Math.min(startRowId, endRowId);
            let ColMax = Math.max(startColId, endColId);
            let ColMin = Math.min(startColId, endColId);
            let temp = [];

            if(startName == endName)
            for (let i = RowMin; i <= RowMax; i++) {
                for (let q = ColMin; q <= ColMax; q++) {
                    let sameRange = document.querySelector(`${startName}[rowid="${i}"][colid="${q}"]`);
                    temp.push(sameRange);
                }
            }
            else{
                if(startName == 'TH' || endName == 'TH')
                for (let i = startName=='TH'?startRowId:endRowId; i <= gantt.head.length-1; i++) {
                    for (let q = ColMin; q <= ColMax; q++) {
                        let headRange = document.querySelector(`${startName=='TH'?startName:endName}[rowid="${i}"][colid="${q}"]`);
                        temp.push(headRange);
                    }
                }

                if(endName == 'TD' || startName == 'TD')
                {
                    for (let i = 0; i <= (endName=='TD'?endRowId:startRowId); i++) {
                        for (let q = ColMin; q <= ColMax; q++) {
                            let sameRange = document.querySelector(`${endName=='TD'?endName:startName}[rowid="${i}"][colid="${q}"]`);
                            temp.push(sameRange);
                        }
                    }
                }
            }

            [...temp].forEach(el=>{
                let {rowid, colid} = el.attributes;
                let [row, col] = [parseInt(rowid.value), parseInt(colid.value)];
                selected.push({el: el, obj:this.findGantt(el.tagName, el.attributes), rowid: row, colid: col})
            });
            
            let idx = selected.findIndex(els=>els.el == start.el);

            selected.splice(0, 0, selected.splice(idx, 1).pop());
            
            selected.forEach(el=>{
                el.el.classList.add('selected');
            });
        }

        this.clearSelectBox = function (){
            views.clearSelectBox();
        }

        this.controlSelectingBox = function (ev){
            views.controlSelectingBox(ev);
        }

        this.renderSelectingBox = function (ev){
            views.renderSelectingBox(ev);
        }

        this.selectReadyCell = function (closest){
            let found = this.findGantt(closest.tagName, closest.attributes);
            let {rowid, colid} = closest.attributes;
            let [row, col] = [parseInt(rowid.value), parseInt(colid.value)];
            selected.push({el:closest, obj:found, rowid: row, colid: col});
        }

        this.selectAll = function (){
            this.clearSelected();
            document.querySelectorAll(`th, td`).forEach(el=>{
                selected.push({el: el, obj:this.findGantt(el.tagName, el.attributes), rowid: parseInt(el.getAttribute('rowid')), colid: parseInt(el.getAttribute('colid'))})
                el.classList.add('selected');
            });
        }

        this.deleteAll = function (){
            this.clearSelected();
            gantt.head = [[]];
            gantt.body = [[]];
            this.renderChartAddHistory();
        }

        this.addHistory = function (){
            history = [...history].slice(0, hisIndex+1);
            history.push(this.copyDeepGantt(gantt));
            if(history.length>maxHistory) history.shift();
            hisIndex = history.length-1;
        }

        this.copyDeepGantt = function(data){
            const head = [...data.head].map(h=>[...h].map(k=>{
                const temp = {};
                Object.entries(k.attr).forEach(([k,v])=>temp[k]=v);
                return {
                    text: k.text,
                    attr: temp,
                };
            }));

            const body = [...data.body].map(h=>[...h].map(k=>{
                const temp = {};
                Object.entries(k.attr).forEach(([k,v])=>temp[k]=v);
                return {
                    text: k.text,
                    attr: temp,
                };
            }));

            return {
                id: data.id,
                title: data.title,
                head: head,
                body: body,
                regdate: data.regdate,
            }
        }

        this.workUndo = function (ev){
            if(hisIndex>0){
                hisIndex--;
                gantt = this.copyDeepGantt(history[hisIndex]);
                this.renderChart();
            }
        }

        this.workRedo = function (ev){
            if(hisIndex<history.length-1){
                hisIndex++;
                gantt = this.copyDeepGantt(history[hisIndex]);
                this.renderChart();
            }
        }

        this.addInitailRowHead = function (){
            if(gantt.head.length==0 || gantt.head[0].every(a=>a.length==0)) {
                let temp = {text: '', attr: {}};
                Object.entries(copiedAttrs).forEach(([k,v])=>temp.attr[k]=v);

                temp.text = copiedContents.text;
                gantt.head = [];

                gantt.head.splice(0, 1, new Array(gantt.body[0].length>0?gantt.body[0].length:1).fill({text: temp.text||'', attr: temp.attr||{}}));
            }

            this.renderChartAddHistory();
        }

        this.addInitailRowBody = function (){
            if(gantt.body.length==0 || gantt.body[0].every(a=>a.length==0)) {
                let temp = {text: '', attr: {}};
                Object.entries(copiedAttrs).forEach(([k,v])=>temp.attr[k]=v);

                temp.text = copiedContents.text;
                gantt.body = [];
                
                gantt.body.splice(0, 1, new Array(gantt.head[0].length>0?gantt.head[0].length:1).fill({text: temp.text||'', attr: temp.attr||{}}));
            }

            this.renderChartAddHistory();
        }

        this.borderReset = function (target, controlList){
            const typeList = ['borderWidth', 'borderTopWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderRightWidth', 'borderColor', 'borderTopColor', 'borderBottomColor', 'borderLeftColor', 'borderRightColor', 'borderStyle', 'borderTopStyle', 'borderBottomStyle', 'borderLeftStyle', 'borderRightStyle'];

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

            this.renderChartAddHistory();
        }

        this.movingRowCol = function (target, controlList){
            const {type, rowid, colid} = controlList.attributes;
            const {moving} = target.attributes;
            const ganttType = type.value=='TH'?'head':'body';
            const rowId = parseInt(rowid.value);
            const colId = parseInt(colid.value);
            const move = moving.value;

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
            
            this.renderChartAddHistory();
        }

        this.clearCopiedContents = function (){
            copiedContents.text = '';
        }

        this.emptyCopiedContents = function (target, controlList){
            views.clearControlList();
            this.renderChartAddHistory();
            this.clearCopiedContents();
        }

        this.pasteCopiedContents = function (target, controlList){
            const {type, rowid, colid} = controlList.attributes;
            const ganttType = type.value=='TH'?'head':'body';
            gantt[ganttType][rowid.value][colid.value].text = '';

            gantt[ganttType][rowid.value][colid.value].text = copiedContents.text;

            document.querySelector(`${type.value}[rowid="${rowid.value}"][colid="${colid.value}"]`).innerHTML = copiedContents.text;

            views.clearControlList();

            this.renderChartAddHistory();
        }

        this.copyContents = function (target, controlList){
            this.clearCopiedContents();

            const {type, rowid, colid} = controlList.attributes;
            const ganttType = type.value=='TH'?'head':'body';
            copiedContents.text = gantt[ganttType][rowid.value][colid.value].text;

            views.clearControlList();

            this.renderChartAddHistory();
        }

        this.clearCopiedAttrs = function (){
            Object.keys(copiedAttrs).forEach(e=>delete copiedAttrs[e]);
        }

        this.emptyCopiedAttrs = function (target, controlList){
            views.clearControlList();
            this.clearCopiedAttrs();
        }

        this.pasteCopiedAttrs = function (target, controlList){
            const {type, rowid, colid} = controlList.attributes;
            const ganttType = type.value=='TH'?'head':'body';
            gantt[ganttType][rowid.value][colid.value].attr = {};

            Object.entries(copiedAttrs).forEach(([key, val])=>{
                gantt[ganttType][rowid.value][colid.value].attr[key] = val;

                document.querySelector(`${type.value}[rowid="${rowid.value}"][colid="${colid.value}"]`).style[key] = val;
            })

            views.clearControlList();
            this.renderChartAddHistory();
        }

        this.copyAttrs = function (target, controlList){
            this.clearCopiedAttrs();

            const {type, rowid, colid} = controlList.attributes;
            const ganttType = type.value=='TH'?'head':'body';
            Object.assign(copiedAttrs, gantt[ganttType][rowid.value][colid.value].attr);

            views.clearControlList();
        }

        this.autoAttrsValueChange = function (target){
            
            if(selected.length>0)
            selected.forEach(sel=>{
                this.autoAttrsApply(target, sel);
            });
            else this.autoAttrsApply(target);

            this.renderChartAddHistory();
        }

        this.autoAttrsApply = function(target, selects){
            const closest = target.closest('ul.control-list');
            const type = closest.getAttribute('type');
            const ganttType = type=='TH'?'head':'body';
            const {rowid, colid} = closest.attributes;
            const selType = selects?(selects.el.tagName=='TH'?'head':'body'):null;
            const {el, rowid: selRow, colid: selCol, obj} = selects||{el:null, rowid:null, colid:null, obj:null};

            const applyRowCol = (id, value) => {
                if(closest.querySelector('#bRow').checked){
                    if(selects)
                    gantt[selType][selRow].map(col=>{
                        col.attr[id] = value;
                    });
                    gantt[ganttType][rowid.value].map(col=>{
                        col.attr[id] = value;
                    });
                }

                if(closest.querySelector('#bCol').checked){
                    if(selects)
                    gantt[selType].map(row=>{
                        return row[selCol].attr[id] = value;
                    });
                    gantt[ganttType].map(row=>{
                        return row[colid.value].attr[id] = value;
                    });
                }
            }

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
                    applyRowCol('textAlign', align);

                    if(selects)
                    gantt[selType][selRow][selCol].attr['textAlign'] = align;
                    else
                    gantt[ganttType][rowid.value][colid.value].attr['textAlign'] = align;
                    break;

                case 'borderWidth': case 'borderStyle': case 'borderColor':
                    applyRowCol(target.id, autoValue);

                    gantt[ganttType].map(row=>{
                        return row.map(col=>{
                            col.attr[target.id] = autoValue;
                            return col;
                        });
                    });
                    break;

                default :
                    applyRowCol(target.id, autoValue);
                    if(selects)
                    gantt[selType][selRow][selCol].attr[target.id] = autoValue;
                    gantt[ganttType][rowid.value][colid.value].attr[target.id] = autoValue;
                    break;
            }
        };

        this.popupControlSheet = function (closest, ev){
            views.popupControlSheet(closest, closest.id);
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

        this.getSheetStorage = function (){
            let temp;
            if(!localStorage['ganttSheet']) this.setSheetStorage(ganttSheet);
            if(localStorage['ganttSheet']) temp = JSON.parse(localStorage['ganttSheet']);
            
            if(!temp.some(g=>g.id==gantt.id)){
                temp.push(gantt);
                this.setSheetStorage(temp);
            }

            return temp;
        }

        this.setSheetStorage = function (){
            this.asyncGanttToSheet(gantt);
            localStorage['ganttSheet'] = JSON.stringify(ganttSheet);
        }

        this.asyncGanttToSheet = function (){
            const [has, idx] = this.findGanttSheet(gantt.id);
            ganttSheet[idx] = gantt;
        }

        this.getStorage = function(){
            let temp;
            if(!localStorage['gantt']) this.setStorage(Sheet());
            if(localStorage['gantt']) temp = JSON.parse(localStorage['gantt']);
            
            temp = this.validGantt(temp);
            temp.head.map(row=>{
                return row.map(col=>{
                    delete col.attr['[object HTMLInputElement]'];
                    delete col.attr['allUnit'];
                    delete col['select'];
                    return;
                });
            });
            
            temp.body.map(row=>{
                return row.map(col=>{
                    delete col.attr['[object HTMLInputElement]'];
                    delete col.attr['allUnit'];
                    delete col['select'];
                    return;
                });
            });
            return temp;
        }

        this.setStorage = function(data){
            localStorage['gantt'] = JSON.stringify(data);
        }

        this.validGantt = function (temp){
            if(!temp.hasOwnProperty('title')){
                temp.title = `Sheet ${ganttSheet.length+1}`;
            }
            if(!temp.hasOwnProperty('id')){
                temp.id = new Date().getTime().toString(36);
            }
            if(!temp.hasOwnProperty('regdate')){
                temp.regdate = new Date().getTime();
            }
            if(!temp.hasOwnProperty('head')){
                temp.head = [];
            }
            if(!temp.hasOwnProperty('body')){
                temp.body = [];
            }

            return temp;
        }

        this.exportResult = function (target){
            const ganttBody = document.querySelector("#gantt #chart");
            
            navigator.clipboard.writeText(document.querySelector("#ganttWrap").innerHTML.trim().replace(/\s{2,}/g, ' ')).then(
            clipText => {/** console.log(document.querySelector("#ganttWrap").innerHTML.trim().replace(/\s{2,}/g, ' '),'를 복사했습니다') */});
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

            this.renderChartAddHistory();
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
            
            this.renderChartAddHistory();
        }

        this.addRowCol = function (target) {
            const {type, rowid, colid, direction} = target.attributes;
            const dir = direction.value;

            switch(dir){
                case 'top': case 'bottom':
                    if(type.value == 'TH') this.addHeadRow(rowid.value, dir);
                    else this.addBodyRow(rowid.value, dir);
                    break;
                case 'left': case 'right':
                    this.addHeadCol(colid.value, dir);
                    this.addBodyCol(colid.value, dir);
                    break;
            }
            if(dir=='bottom'){
                
            } else {
                
            }
            
            this.renderChartAddHistory();
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

        this.addHeadRow = function(rowid, dir){
            let temp = {text: '', attr: {backgroundColor: '#ffffff'}};
            Object.entries(copiedAttrs).forEach(([k,v])=>temp.attr[k]=v);

            temp.text = copiedContents.text;

            let isEmpty = Object.keys(temp.attr).length==0;
            let isContentsEmpty = temp.text=='';

            rowid = parseInt(rowid);

            gantt.head.splice((dir=='top'?rowid:rowid + 1), 0, [...gantt.head[rowid]].map((col, cid)=>{
                let beforeCopy = {text: '', attr: {}};
                Object.entries(col.attr).forEach(([k,v])=>beforeCopy.attr[k]=v);
                beforeCopy.text = col.text;

                col = {text: isContentsEmpty?beforeCopy.text:temp.text||'', attr: isEmpty?beforeCopy.attr:temp.attr||{}};
                return col;
            }));
        }

        this.addBodyRow = function(rowid, dir){
            let temp = {text: '', attr: {}};
            Object.entries(copiedAttrs).forEach(([k,v])=>temp.attr[k]=v);

            temp.text = copiedContents.text;

            let isEmpty = Object.keys(temp.attr).length==0;
            let isContentsEmpty = temp.text=='';
            
            rowid = parseInt(rowid);

            gantt.body.splice(dir=='top'?rowid:rowid + 1, 0, [...gantt.body[rowid]].map((col, cid)=>{
                let beforeCopy = {text: '', attr: {}};
                Object.entries(col.attr).forEach(([k,v])=>beforeCopy.attr[k]=v);
                beforeCopy.text = col.text;

                col = {text: isContentsEmpty?beforeCopy.text:temp.text||'', attr: isEmpty?beforeCopy.attr:temp.attr||{}};
                return col;
            }));
        }

        this.addHeadCol = function(colid, dir){
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

                row.splice((dir=='left'?colid:colid + 1), 0, {text:isContentsEmpty?beforeCopy.text:temp.text||'', attr: isEmpty?beforeCopy.attr:temp.attr||{}});
                return row;
            });
        }

        this.addBodyCol = function(colid, dir){
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

                row.splice((dir=='left'?colid:colid + 1), 0, {text:isContentsEmpty?beforeCopy.text:temp.text||'', attr: isEmpty?beforeCopy.attr:temp.attr||{}});
                return row;
            });
        }

        this.popupDeleteBtn = function (target){
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
            views.popupDeleteBtn(target, control);
        }

        this.popupAddBtn = function (target){
            views.popupAddBtn(target);
        }

        this.renderChartAddHistory = function () {
            this.addHistory();
            this.renderChart();
        }

        this.renderChart = function (){
            this.setSheetStorage(ganttSheet);
            this.setStorage(gantt);
            views.renderChart(gantt);
            views.renderSheets(ganttSheet, gantt.id);
        }
    }

    function View() {
        let parts, chart, thead, tbody, isMoved, selectBox, startTop, startLeft;

        this.init = function (part) {
            parts = part;

            this.renderTable();
        }

        this.popupControlSheet = function (closest, id){
            parts.sheetList.render(closest, id);
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

        this.popupDeleteBtn = function(target, control){

            parts.delBtn.render(target, target.attributes, control);
        }

        this.popupAddBtn = function (target){
            isMoved = target;
            
            if(isMoved == target) parts.addBtn.render(target, target.attributes);
        }

        this.clearSelectBox = function (){
            selectBox = null;
            startTop = null;
            startLeft = null;
            document.querySelectorAll('.select-box').forEach(s=>s.remove());
        }

        this.controlSelectingBox = function (ev){
            let height = ev.clientY - startTop;
            let width = ev.clientX - startLeft;

            if(ev.clientY<=startTop){
                selectBox.classList.add('dashed', 'flip');
                selectBox.style.top = `${ev.y}px`;
                selectBox.style.height = `${startTop - ev.y}px`;
            } else {
                selectBox.classList.remove('dashed');
                selectBox.classList.remove('flip');
            }
            if(ev.clientX<=startLeft){
                selectBox.classList.add('dashed', 'flip');
                selectBox.style.left = `${ev.clientX}px`;
                selectBox.style.width = `${startLeft - ev.clientX}px`;
            } else {
                selectBox.classList.remove('dashed');
                selectBox.classList.remove('flip');
            }

            selectBox.style.width = `${width}px`;
            selectBox.style.height = `${height}px`;
        }

        this.renderSelectingBox = function (ev){
            selectBox = document.createElement('span');
            selectBox.classList.add('select-box');
            selectBox.style.top = `${ev.clientY}px`;
            selectBox.style.left = `${ev.clientX}px`;
            startTop = ev.clientY;
            startLeft = ev.clientX;
            document.querySelector('.gantt-workspace').insertAdjacentElement('beforeend',selectBox);
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
                        if(val) th.style.setProperty(textEdit.camelToKebab(key), val, 'important');
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
                        if(val) td.style.setProperty(textEdit.camelToKebab(key), val, 'important');
                    });
                    td.innerHTML = textEdit.taToHTML(cols.text);
                    td.setAttribute('rowId', rowId);
                    td.setAttribute('colId', colId);
                    tr.append(td);
                });
                tbody.append(tr);
            });
        }

        this.renderSheets = function (sheets, id){
            this.clearSheetBar();

            sheets.forEach(sh=>{
                document.querySelector('.work-tabs').insertAdjacentHTML('beforeend', `<span id="${sh.id}" class="work${sh.id==id?' selected':''}">${sh.title}</span>`);
            });

            document.querySelector('.work-tabs').insertAdjacentHTML('beforeend', `<span class="work add-work">+</span>`);
        }

        this.popupHotKeyList = function(){
            this.clearpopupHotkey();
            document.body.insertAdjacentHTML('beforeend', parts.hotKeyList.render());
        }

        this.clearpopupHotkey = function (){
            document.querySelectorAll('.popup-hotkey').forEach(el=>el?.remove());
        }
        
        this.clearSheetBar = function (){
            document.querySelectorAll('.work').forEach(el=>el?.remove());
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
                        target.insertAdjacentHTML('beforeend',`<table id="chart" style="table-layout:auto;border-collapse:collapse!important;width: 100%!important;border-spacing: 0!important;">
                            <thead id="thead">
                                
                            </thead>
                            <tbody id="tbody">
                                
                            </tbody>
                        </table>`);
                    }
                },
                sheetList: {
                    render(closest, id){
                        const rect = closest.getBoundingClientRect();
                        return ganttWrap.insertAdjacentHTML('beforeend', `
                            <ul
                            id="${id}"
                            class="sheet-list"
                            style="
                                position: absolute;
                                top: ${rect.top - rect.height}px;
                                left: ${rect.left}px;
                            ">
                                <button class="btn" id="workRename">rename</button>
                                <button class="btn" id="workRemove">remove</button>
                            </ul>
                        `);
                    }
                },
                controlList: {
                    verticalAligns: ['top', 'bottom', 'middle', 'baseline', 'revert', 'unset', 'initail', 'inherit'],
                    styles: ['solid', 'dotted', 'dashed', 'groove', 'ridge', 'double', 'outset', 'hidden', 'none'],
                    units: ['auto', 'px', 'cm', 'mm', 'in', 'pc', 'pt', 'ch', 'em', 'rem', 'vh', 'vw', 'vmin', 'vmax'],
                    getLastName(str){
                        if(str=='backgroundColor') return 'bgColor';
                        return str.match(/[A-Z][a-z]*/g)?.pop()||str.charAt(0).toUpperCase()+str.slice(1);
                    },
                    getOpacity(id, data) {
                        return data.attr[id]?.slice(7, 9)||'ff';
                    },
                    hexToNumber(id, data) {
                        return parseFloat(parseInt((this.getOpacity(id, data)), 16).toFixed(2));
                    },
                    getColor(id, data) {
                        let autoDefault = 0;
                        if(id.match(/border/g)) autoDefault = '#e0e0e0';
                        else if(id.match(/font/g)) autoDefault = '#000000';
                        else if(id.match(/background/g)) autoDefault = '#ffffff';
                        return data.attr[id]?.slice(0, 7)||'#e0e0e0';
                    },
                    setNumberUnitList(unitName) {
                        return [...this.units].map(numberUnit => `<option${(unitName||'auto')==numberUnit?' selected':''} value="${numberUnit=='auto'?'':numberUnit}">${numberUnit}</option>`).join('');
                    },
                    setOptionList (style) {
                        return [...this.verticalAligns].map(st => `<option${(style||'solid')==st?' selected':''} value="${st}">${st}</option$>`).join('')
                    },
                    setBorderStyleList (style) {
                        return [...this.styles].map(st => `<option${(style||'solid')==st?' selected':''} value="${st}">${st}</option$>`).join('')
                    },
                    getUnit(id, data) {
                        return data.attr[id]?.match(/([0-9.]+)(\w+)/)?.slice(1).pop()||'px'
                    },
                    getNumber(id, data, target) {
                        let autoDefault = 0;
                        if(id.match(/border/g)) autoDefault = 1;
                        else if(id.match(/font/g)) autoDefault = 16;
                        else if(id.match(/font/g)) autoDefault = 16;
                        else if(id.match(/width/g)) autoDefault = target.clientWidth;
                        return data.attr[id]?.match(/([0-9.]+)(\w+)/)?.slice(1).shift()||autoDefault;
                    },
                    getStyle(id, data) {
                        return data.attr[id];
                    },
                    getOption(id, data) {
                        return data.attr[id];
                    },
                    colorPannel(id, data) {
                        return `<input type="color" id="${id}" class="form-input attrs" value="${this.getColor(id, data)}">
                        <input type="range" step="1" min="0" max="255" class="form-input attrs p-0" id="${id}" value="${this.hexToNumber(id, data)}">`;
                    },
                    widthPannel(id, data, target){
                        return `<span class="text-center">
                        <input type="number" class="form-input attrs" id="${id}" value="${this.getNumber(id, data, target)}">
                        <select id="${id}" class="form-input attrs">
                            ${this.setNumberUnitList(this.getUnit(id, data))}
                        </select>
                    </span>`;
                    },
                    stylePannel(id, data){
                        return `<select id="${id}" class="form-input attrs">
                        ${this.setBorderStyleList(this.getStyle(id, data))}
                    </select>`;
                    },
                    optionPannel(id, data){
                        return `<select id="${id}" class="form-input attrs">
                        ${this.setOptionList(this.getOption(id, data))}
                    </select>`;
                    },
                    render(target, data, {x, y}, isCopied, isContentsCopied){
                        const {rowid, colid} = target.attributes;

                        const fontWeight = data.attr.fontWeight||'normal';

                        const radio = data.attr.textAlign;

                        if(window.innerWidth < 160 + x){
                            x = x - 160;
                        }

                        // transform: translateY(0%);
                        // top: ${y + document.body.scrollTop}px;
                        // left: ${x}px;
                        // ${window.innerWidth/2<x?'transform: translateX(-50%)':''}
                        ganttWrap.insertAdjacentHTML('beforeend', `
                            <ul
                            type="${target.tagName}"
                            class="control-list"
                            rowid="${rowid.value}"
                            colid="${colid.value}">
                                <li>
                                    <span>Contents Copy</span>
                                    <span class="tool-bundle">
                                        ${isContentsCopied?`
                                            <button id="pasteContents" class="btn">Paste</button>
                                        `:`
                                            <button id="pasteContents" class="btn" disabled>Pates</button>
                                        `}
                                        <button id="copyContents" class="btn">Copy</button>
                                        <button id="clearContents" class="btn clear">Clear</button>
                                    </span>
                                </li>
                                <li>
                                    <span>Attrs Copy</span>
                                    <span class="tool-bundle">
                                        ${isCopied>0?`
                                            <button id="pasteAttrs" class="btn">Paste</button>
                                        `:`
                                            <button id="pasteAttrs" class="btn" disabled>Pates</button>
                                        `}
                                        <button id="copyAttrs" class="btn">Copy</button>
                                        <button id="clearAttrs" class="btn clear">Clear</button>
                                    </span>
                                </li>
                                <li>
                                    <span>Move</span>
                                    <span class="tool-bundle">
                                        <button class="btn move" moving="left" class="btn">👈</button>
                                        <button class="btn move" moving="top" class="btn">👆</button>
                                        <button class="btn move" moving="bottom" class="btn">👇</button>
                                        <button class="btn move" moving="right" class="btn">👉</button>
                                    </span>
                                </li>
                                <li>
                                    <span>Cell Concat & Divide</span>
                                    <span class="tool-bundle" style="gap: .5rem;">
                                        <button id="cellConcat" class="btn">셀 합치기</button>
                                        <button id="cellDivide" class="btn">셀 나누기</button>
                                    </span>
                                </li>
                                <li>
                                    <span>Apply To</span>
                                    <span class="tool-bundle">
                                        <label for="bRow">Rows</label>
                                        <input type="checkbox" class="" id="bRow">
                                        <label for="bCol">Cols</label>
                                        <input type="checkbox" class="" id="bCol">
                                    </span>
                                </li>
                                <li>
                                    <span>Border All</span>
                                    <br>
                                    <button class="btn" id="bReset">Reset Border</button>
                                    <span class="tool-bundle">
                                        ${this.widthPannel('borderWidth', data, target)}
                                        ${this.stylePannel('borderStyle', data)}
                                        ${this.colorPannel('borderColor', data)}
                                    </span>
                                </li>
                                <li>
                                    <span>Border Width</span>
                                    <br>
                                    <span class="w-flex flex-column justify-content-center gap-1">
                                        <span class="tool-bundle-col justify-content-center">
                                            <span style="display: block;">
                                                ${this.widthPannel('borderTopWidth', data, target)}
                                            </span>
                                            <span class="w-flex align-items-center">
                                                ${this.widthPannel('borderLeftWidth', data, target)}
                                                <span class="box"></span>
                                                ${this.widthPannel('borderRightWidth', data, target)}
                                            </span>
                                            <span style="display: block;">
                                                ${this.widthPannel('borderBottomWidth', data, target)}
                                            </span>
                                        </span>
                                    </span>
                                </li>
                                <li>
                                    <span>Border Style</span>
                                    <br>
                                    <span class="w-flex flex-column justify-content-center gap-1">
                                        <span class="tool-bundle-col justify-content-center">
                                            <span>
                                                ${this.stylePannel('borderTopStyle', data)}
                                            </span>
                                            <span class="w-flex align-items-center">
                                                ${this.stylePannel('borderLeftStyle', data)}
                                                <span class="box"></span>
                                                ${this.stylePannel('borderRightStyle', data)}
                                            </span>
                                            <span style="display: block;">
                                            </span>
                                            ${this.stylePannel('borderBottomStyle', data)}
                                        </span>
                                    </span>
                                </li>
                                <li>
                                    <span>Border Color</span>
                                    <br>
                                    <span class="w-flex flex-column justify-content-center gap-1">
                                        <span class="tool-bundle-col justify-content-center">
                                            <span>
                                                ${this.colorPannel('borderTopColor', data)}
                                            </span>
                                            <span class="w-flex align-items-center">
                                                ${this.colorPannel('borderLeftColor', data)}
                                                <span class="box"></span>
                                                <span>
                                                    ${this.colorPannel('borderRightColor', data)}
                                                </span>
                                            </span>
                                            <span style="display: block;">
                                            </span>
                                            ${this.colorPannel('borderBottomColor', data)}
                                        </span>
                                    </span>
                                </li>
                                <li>
                                    <span class="tool-bundle-col">
                                        <label>Width ${this.widthPannel('width', data, target)}</label>
                                        <label>Height ${this.widthPannel('height', data, target)}</label>
                                    </span>
                                </li>
                                <li>
                                    <span>Padding All</span>
                                    <br>
                                    ${this.widthPannel('padding', data, target)}
                                </li>
                                <li>
                                    <span>Padding</span>
                                    <span class="tool-bundle-col">
                                        ${this.widthPannel('paddingTop', data, target)}
                                        <span class="w-flex align-items-center">
                                            ${this.widthPannel('paddingLeft', data, target)}
                                            <span class="box"></span>
                                            ${this.widthPannel('paddingRight', data, target)}
                                        </span>
                                        ${this.widthPannel('paddingBottom', data, target)}
                                    </span>
                                </li>
                                <li>
                                    <span>Colors</span>
                                    <br>
                                    <span class="w-flex justify-content-center" style="gap:.3rem;">
                                        <span class="tool-bundle">
                                            ${this.colorPannel('color', data)}
                                            ${this.colorPannel('backgroundColor', data)}
                                        </span>
                                    </span>
                                </li>
                                <li>
                                    <span>Font</span>
                                    <br>
                                    <span class="w-flex justify-content-center" style="gap:.3rem;">
                                        ${this.widthPannel('fontSize', data, target)}
                                        <span>
                                            <select id="fontWeight" class="form-input attrs">
                                                <option${fontWeight=='lighter'?' selected':''} value="lighter">lighter</option>
                                                <option${fontWeight=='normal'?' selected':''} value="normal">normal</option>
                                                <option${fontWeight=='bold'?' selected':''} value="bold">bold</option>
                                                <option${fontWeight=='bolder'?' selected':''} value="bolder">bolder</option>
                                            </select>
                                        </span>
                                    </span>
                                </li>
                                <li>
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
                                <li>
                                    <span>Vertical align</span>
                                    <br>
                                    <span class="w-flex justify-content-center ta">
                                        ${this.optionPannel('verticalAlign', data)}
                                    </span>
                                </li>
                            </ul>
                        `);
                    }
                },
                addBtn: {
                    render(target, {rowid, colid}){
                        const scale = 'scale(0.5)';
                        ganttChart.insertAdjacentHTML('beforeend',
                        `<span
                        type="${target.tagName}"
                        direction="left"
                        class="add-btn"
                        rowId="${rowid.value}"
                        colId="${colid.value}"
                        style="
                        top: ${target.offsetTop + target.clientHeight/2}px;
                        left: ${target.offsetLeft}px;
                        transform: translate(-50%, -50%) ${scale};
                        ">
                            ➕
                        </span>
                        <span
                        type="${target.tagName}"
                        direction="right"
                        class="add-btn"
                        rowId="${rowid.value}"
                        colId="${colid.value}"
                        style="
                        top: ${target.offsetTop + target.clientHeight/2}px;
                        left: ${target.offsetLeft + target.offsetWidth}px;
                        transform: translate(-50%, -50%) ${scale};
                        ">
                            ➕
                        </span>
                        <span
                        type="${target.tagName}"
                        direction="top"
                        class="add-btn"
                        rowId="${rowid.value}"
                        colId="${colid.value}"
                        style="
                        top: ${target.offsetTop}px;
                        left: ${target.offsetLeft + target.clientWidth/2}px;
                        transform: translate(-50%, -50%) ${scale};
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
                        top: ${target.offsetTop + target.clientHeight}px;
                        left: ${target.offsetLeft + target.clientWidth/2}px;
                        transform: translate(-50%, -50%) ${scale};
                        ">
                            ➕
                        </span>`.replace(/[\s]+/g, ' '));
                    }
                },
                delBtn: {
                    render(target, {rowid, colid}, control){
                        const tableTop = target.closest('table').offsetTop;
                        const tableLeft = target.closest('table').offsetLeft;
                        let targetHeightGap = parseInt(target.clientTop);
                        let heightGap = parseInt(target.closest('table').clientTop);
                        let widthGap = parseInt(target.closest('table').clientTop);

                        if(control>0)
                        ganttChart.insertAdjacentHTML('beforeend',
                        ((control%2!=0?`<span
                        type="${target.tagName}"
                        direction="col"
                        class="del-btn"
                        rowId="${rowid.value}"
                        colId="${colid.value}"
                        style="
                        width: ${target.clientWidth}px;
                        top: ${tableTop + heightGap }px;
                        left: ${widthGap/2 + target.offsetLeft + target.clientWidth/2}px;
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
                        height: ${target.clientHeight}px;
                        top: ${target.offsetTop + targetHeightGap}px;
                        left: ${tableLeft + widthGap}px;
                        transform: translate(-100%, 0%);
                        ">
                            ❌
                        </span>`:'')
                        + `<span
                        type="${target.tagName}"
                        direction="col"
                        class="del-btn"
                        rowId="${rowid.value}"
                        colId="${colid.value}"
                        style="
                        width: ${target.clientWidth}px;
                        top: ${tableTop + target.closest('table').offsetHeight - heightGap/2}px;
                        left: ${widthGap/2 + target.offsetLeft + target.clientWidth/2}px;
                        transform: translate(-50%, 0%);
                        ">
                            ❌
                        </span>
                        `).replace(/[\s]+/g, ' '));
                    }
                },
                hotKeyList: {
                    render(){
                        return `
                            <div class="popup-hotkey">
                                <div class="hotkey-wrap">
                                    <div class="hotkey-head">
                                        <span>Hot Key</span>
                                        <span class="del-popup">&times;</span>
                                    </div>
                                    <div class="hotkey-body">
                                        <div style="font-size: 1.2rem">단일 키</div>
                                        <ul>
                                            <li><kbd>esc</kbd> 셀 편집 취소, 선택 취소</li>
                                            <li><kbd>tab</kbd> 다음 셀 편집모드 (마지막 컬럼에서는 다음 로우 첫 셀로 이동)</li>
                                            <li><kbd>delete</kbd> 선택 셀 내용 모두 삭제</li>
                                            <li><kbd>f2</kbd> 선택 셀 편집모드</li>
                                        </ul>
                                        <hr>
                                        <div style="font-size: 1.2rem">ctrl 혼합 키</div>
                                        <ul>
                                            <li><kbd>ctrl</kbd> + <kbd>c</kbd> 복사</li>
                                            <li><kbd>ctrl</kbd> + <kbd>v</kbd> 붙여넣기</li>
                                            <li><kbd>ctrl</kbd> + <kbd>a</kbd> 전체 셀 선택</li>
                                            <li><kbd>ctrl</kbd> + <kbd>delete</kbd> 전체 행, 열 삭제</li>
                                            <li><kbd>ctrl</kbd> + <kbd>z</kbd> 작업 뒤로 돌리기</li>
                                            <li><kbd>ctrl</kbd> + <kbd>y</kbd> 작업 앞으로 돌리기</li>
                                        </ul>
                                        <hr>
                                        <div style="font-size: 1.2rem">shift 혼합 키</div>
                                        <ul>
                                            <li><kbd>shift</kbd> + <kbd>셀 호버</kbd> 셀 추가 버튼 표시</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        `;
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