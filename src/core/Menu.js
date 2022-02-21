const Menu = (function (){
    function TabList(){
        let tabReady = false, elNow, hover=false;
        let list = {
            file: {
                list: [
                    {
                        tab: 'save',
                    },
                    {
                        tab: 'export',
                        id: 'export'
                    },
                ]
            },
            tools: {
                list: [
                    {
                        tab: 'cursor mode : pen',
                        id: 'penMode',
                        active: false,
                    },
                    {
                        tab: 'select : all',
                        id: 'selectAll',
                    },
                    {
                        tab: 'delete : all',
                        id: 'deleteAll',
                    },
                    {
                        tab: 'layout : auto',
                        id: 'layoutAuto',
                    },
                    {
                        tab: 'layout : fixed',
                        id: 'layoutFixed'
                    },
                    {
                        tab: 'add : head',
                        id: 'addRowHead',
                    },
                    {
                        tab: 'add : body',
                        id: 'addRowBody',
                    },
                ]
            },
            about: {
                list: [
                    {
                        tab: 'devkimson',
                        id: 'devkimson',
                    },
                    {
                        tab: 'gantt chart',
                        id: 'ganttChart',
                    },
                    {
                        tab: 'help',
                        id: 'showKeyBinding',
                    },
                ]
            },
        };

        this.init = function(){
            this.genLists();

            window.addEventListener('mouseover', this.tabOver.bind(this));
            window.addEventListener('click', this.tabOpen.bind(this));
        }

        this.genLists = function (){
            Object.keys(list).forEach(e=>{
                document.querySelector('.menu-list').insertAdjacentHTML('beforeend',`<li class="menu-btn-wrap ${e}">
                    <button id="${e}" class="menu-btn expand">${e}</button>
                </li>`);
            });
        }

        this.tabOver = function (ev){
            const target = ev.target;
            const closest = target.closest('.expand,.popup');

            if(target.classList.contains('expand')){
                elNow = null;
                document.querySelectorAll(`.popup,.popup:not(#${target.id})`).forEach(e=>e.remove());
            }

            if(!closest) {
                hover = false;
                tabReady = false;
                elNow = null;
                document.querySelectorAll(`.popup`).forEach(e=>e.remove());
                return;
            }

            if(tabReady && hover && target.classList.contains('expand')){
                elNow = target;
                this.openTab(target.textContent);
            }

            hover = true;
        }

        this.tabOpen = function (ev){
            const target = ev.target;
            const closest = target.closest('.expand');

            if(target.classList.contains('tab'))
            document.querySelectorAll(`.popup`).forEach(e=>e.remove());

            if(target.classList.contains('expand'))
            document.querySelectorAll(`.popup,.popup:not(#${target.id})`).forEach(e=>e.remove());

            if(!hover) hover = true;
            if(elNow==target){
                hover = false;
                tabReady = false;
                elNow = null;
                document.querySelectorAll(`.popup`).forEach(e=>e.remove());
            }
            
            if(!closest || !hover) {
                hover = false;
                tabReady = false;
                elNow = null;
                document.querySelectorAll(`.popup`).forEach(e=>e.remove());
                return;
            }

            tabReady = true;
            elNow = target;
            this.openTab(target.textContent);
        }

        this.openTab = function (type){
            const {top, left, width, height} = elNow.getBoundingClientRect();
            document.body.insertAdjacentHTML('beforeend',
             `<ul
             id="${type}"
             class="menu-list popup"
             style="
                position: absolute;
                top: ${top+height}px;
                left: ${left}px;
             ">
                ${[...list[type].list]
                    .map((l)=>`<li${l.id?` id="${l.id}"`:''} class="tab${l.active?'togglable':''}">${l.tab}</li>`)
                    .join('')}
            </ul>`);
        }

        this.closeTabs = function (){
            document.querySelectorAll(`.popup`).forEach(e=>e.remove());
        }
    }

    return {
        init(){
            const tabList = new TabList();
            return tabList.init();
        }
    }
})().init();

// const menuList = {
//     ...Menu.getList('file'),
//     ...Menu.getList('tools'),
//     ...Menu.getList('about'),
// };

