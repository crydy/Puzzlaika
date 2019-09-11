"use strict";const MERGE_TRANSITION_DURATION=.3,ROTATE_TRANSITION_DURATION=.15,SEARCH_SPREAD=20,MERGE_SPREAD=20,MAX_SHORT_SIDE_ELEMENTS_AMOUNT=12,BG_FILES=8,startMenu=document.querySelector(".start-menu__wrapper"),inputFile=startMenu.querySelector(".start-menu__inputfile"),inputFileLabel=startMenu.querySelector(".start-menu__inputfile-label"),startButton=startMenu.querySelector(".start-menu__start-button"),inputAmount=startMenu.querySelector("#pieces-amount"),bgSwitch=startMenu.querySelector(".start-menu__bg-change-switch"),startMenuCloser=startMenu.querySelector(".start-menu__closer"),menu=document.querySelector(".menu"),menuNewGame=menu.querySelector(".menu__new-game"),menuRestart=menu.querySelector(".menu__restart"),menuBGChanger=menu.querySelector(".menu__bg-changer"),menuTime=menu.querySelector(".menu__time"),menuPauseButton=menu.querySelector(".menu__pause-button"),menuToggle=menu.querySelector(".menu__toggle"),overlay=document.querySelector(".overlay"),previewShower=document.querySelector(".preview-shower");let userImageURLData,shortSideElementAmount,horizontalAmount,verticalAmount,elemSideLength,pictureShifts,timekeeper,gameState,showPreviewConstantly,bgStyle="01",linkedElems=1,rotatingElems=new WeakSet;document.body.style.overflow="hidden",menuToggleClickHandler("no-trans"),menu.hidden=!0;const bgs=[];for(let i=1;i<=BG_FILES;i++){const bg=document.createElement("img");bg.className=`start-menu__bg-change-img bg-${i<10?"0"+i:i}`,bg.style.backgroundImage=`url(img/bg/bg-${i<10?"0"+i:i}.jpg)`,bgs.push(bg)}function randomInteger(min,max){return Math.floor(min+Math.random()*(max+1-min))}function inputAmountInputHandler(){inputAmount.value>=MAX_SHORT_SIDE_ELEMENTS_AMOUNT?inputAmount.value=MAX_SHORT_SIDE_ELEMENTS_AMOUNT:inputAmount.value<2&&(inputAmount.value=2)}function inputFileChangeHandler(){const file=inputFile.files[0];getPictureData("outer",URL.createObjectURL(file)).then(result=>{if(inputFileLabel.textContent="Your image is downloaded",userImageURLData=result,document.querySelector(".small-preview"))document.querySelector(".small-preview").src=result.src;else{const prew=document.createElement("img");prew.src=result.src,prew.classList.add("small-preview"),prew.style.display="block",prew.style.height=inputFileLabel.offsetHeight+"px",prew.style.width="auto",prew.style.position="absolute",prew.style.left=inputFileLabel.offsetWidth+15+"px",prew.style.border=`1px solid ${getComputedStyle(inputFileLabel).borderColor}`,inputFile.closest(".start-menu__loader").after(prew)}})}function bgSwitchClickHandler(){let bgNumber=event.target.classList[1];bgNumber&&(bgStyle=bgNumber.slice(-2),document.body.style.backgroundImage=`url(img/bg/${event.target.classList[1]}.jpg)`)}function startButtonClickHandler(){if(clearField(),gameState="game",menu.hidden=!1,previewShower.classList.remove("preview-shower--hidden"),document.querySelector(".preview-image"))userImageURLData&&(document.querySelector(".preview-image").src=userImageURLData.src);else{let preview=document.createElement("img");preview.classList.add("preview-image"),preview.style.display="none",preview.src=userImageURLData?userImageURLData.src:"img/image.jpg",document.querySelector(".preview-image-wrapper").append(preview)}startMenu.style.display="none",shortSideElementAmount=+inputAmount.value,userImageURLData?layOutElements(userImageURLData):getPictureData("inner").then(layOutElements),startTimeGame()}function startMenuCloserClickHandler(){menu.hidden=!1,startMenu.style.display="none",overlay.hidden=!0,"finished"!==gameState&&startTimeGame()}function menuToggleClickHandler(){const menuInnerSpread=menuToggle.closest(".menu__item").offsetTop-menu.offsetTop;if("no-trans"===arguments[0]){const trDur=parseFloat(getComputedStyle(menu).transitionDuration);menu.style.transitionDuration="0s",setTimeout(()=>{menu.style.transitionDuration=trDur+"s"},trDur+"s")}menu.classList.contains("menu--closed")?(menu.classList.remove("menu--closed"),menu.style.top=0,menuToggle.textContent="hide"):(menu.style.top=-menuInnerSpread+"px",menu.classList.add("menu--closed"),menuToggle.textContent="menu")}function previewShowerMouseenterHandler(){previewShower.removeEventListener("mouseenter",previewShowerMouseenterHandler),previewShower.addEventListener("mouseout",function previewShowerMouseoutHandler(){showPreviewConstantly||(previewShower.style.boxShadow="",document.querySelector(".preview-image").style.display="none");previewShower.removeEventListener("mouseout",previewShowerMouseoutHandler);previewShower.addEventListener("mouseenter",previewShowerMouseenterHandler)}),previewShower.style.boxShadow="none",document.querySelector(".preview-image").style.display=""}function previewShowerClickHandler(){showPreviewConstantly?(showPreviewConstantly=!1,document.querySelector(".preview-image").style.zIndex="",previewShower.classList.remove("preview-shower--const")):(showPreviewConstantly=!0,document.querySelector(".preview-image").style.zIndex="1",previewShower.classList.add("preview-shower--const"))}function menuNewGameClickHandler(){startMenuCloser.hidden=!1,startMenu.style.display="",overlay.hidden=!1;let info=document.querySelector(".start-menu__info");info&&info.remove(),pauseTimeGame()}function menuRestartClickHandler(){pauseTimeGame(),overlay.hidden=!1;const tmpl=document.querySelector("#popup-template").content.cloneNode(!0),popupWrapper=tmpl.querySelector(".popup__wrapper"),popup=tmpl.querySelector(".popup");tmpl.querySelector(".popup__title").textContent="Restart",tmpl.querySelector(".popup__text").textContent="Restart game with the same picture?",tmpl.querySelector(".popup__button--ok").textContent="Restart",tmpl.querySelector(".popup__button--cancel").textContent="Cancel",document.body.append(tmpl),popup.addEventListener("click",function popupClickHandler(event){const target=event.target;(target.classList.contains("popup__button")||target.classList.contains("popup__closer"))&&(popup.removeEventListener("click",popupClickHandler),popupWrapper.remove(),overlay.hidden=!0,"finished"!==gameState&&startTimeGame(),target.classList.contains("popup__button--ok")&&(menuToggleClickHandler("no-trans"),document.querySelectorAll(".piece").forEach(item=>item.remove()),getTimeGame(),startButtonClickHandler()))})}function menuBGChangerClickHandler(){parseInt(bgStyle)<+BG_FILES?(bgStyle=parseInt(bgStyle)+1,document.body.style.backgroundImage=`url(img/bg/bg-${bgStyle<10?"0"+bgStyle:bgStyle}.jpg)`):(bgStyle="01",document.body.style.backgroundImage="url(img/bg/bg-01.jpg)")}function menuPauseButtonClickHandler(){pauseTimeGame(),overlay.hidden=!1;const tmpl=document.querySelector("#popup-template").content.cloneNode(!0),popupWrapper=tmpl.querySelector(".popup__wrapper"),popup=tmpl.querySelector(".popup");tmpl.querySelector(".popup__button--cancel").remove(),tmpl.querySelector(".popup__title").textContent="... Pause ...",tmpl.querySelector(".popup__text").textContent=`Your time in the game: ${menuTime.textContent}`,tmpl.querySelector(".popup__button--ok").textContent="Back to the game!",document.body.append(tmpl),popup.addEventListener("click",function popupClickHandler(event){const target=event.target;console.log(target);(target.classList.contains("popup__button--ok")||target.classList.contains("popup__closer"))&&(popup.removeEventListener("click",popupClickHandler),popupWrapper.remove(),overlay.hidden=!0,"finished"!==gameState&&startTimeGame())})}function documentMousedownHandler(event){if(event.target.classList.contains("piece")&&1==event.which){const activeElem=event.target,shiftX=event.clientX-activeElem.getBoundingClientRect().left,shiftY=event.clientY-activeElem.getBoundingClientRect().top;function moveAt(elem,x,y){elem.style.left=x+"px",elem.style.top=y+"px"}function mouseMoveHandler(event){moveAt(activeElem,event.pageX-shiftX,event.pageY-shiftY),activeElem.id&&Array.from(document.querySelectorAll(".piece")).filter(item=>item.id===activeElem.id&&item!==activeElem).forEach(function(item){let relativeShifts=getRelativeShifts(activeElem,item);moveAt(item,event.pageX-relativeShifts.x-shiftX,event.pageY-relativeShifts.y-shiftY)})}function preventContextMenu(event){event.preventDefault()}activeElem.ondragstart=function(){return!1},activeElem.style.position="absolute",activeElem.style.zIndex=1e3,document.body.append(activeElem),Array.from(document.querySelectorAll(".piece")).filter(item=>item.id&&item.id===activeElem.id).forEach(function(item){document.body.append(item)}),moveAt(activeElem,event.pageX-shiftX,event.pageY-shiftY),document.addEventListener("mousemove",mouseMoveHandler),activeElem.addEventListener("mousedown",draggableElemRightClickHandler),document.addEventListener("contextmenu",preventContextMenu),activeElem.addEventListener("mouseup",function activeElemMouseupHandler(event){if(1!==event.which)return;document.removeEventListener("mousemove",mouseMoveHandler);activeElem.removeEventListener("mousedown",draggableElemRightClickHandler);document.removeEventListener("contextmenu",preventContextMenu);activeElem.removeEventListener("mouseup",activeElemMouseupHandler);mergePieces(activeElem,getAllAdjacent(activeElem));linkedElems=1;activeElem.id&&(Array.from(document.querySelectorAll(".piece")).filter(item=>item.id===activeElem.id&&item!==activeElem).forEach(function(item){linkedElems++,mergePieces(item,getAllAdjacent(item))}),linkedElems===horizontalAmount*verticalAmount&&0===activeElem.deg&&"finished"!==gameState&&finishGame())}),document.addEventListener("mouseout",function documentMouseoutHandler(event){event.relatedTarget===document.documentElement&&(document.removeEventListener("mousemove",mouseMoveHandler),activeElem.removeEventListener("mousedown",draggableElemRightClickHandler),document.removeEventListener("contextmenu",preventContextMenu),document.removeEventListener("mouseout",documentMouseoutHandler))})}}function draggableElemRightClickHandler(event,direction){const elem=event.target;rotateElem(elem,direction),setTimeout(()=>{if(elem.id){const elemCoords=elem.getBoundingClientRect();Array.from(document.querySelectorAll(".piece")).filter(item=>item.id===elem.id&&item!==elem).forEach(function(item){const relativeShifts=getRelativeShifts(elem,item);item.style.transitionDuration=ROTATE_TRANSITION_DURATION+"s",rotateElem(item,direction),item.style.left=elemCoords.left-relativeShifts.x+"px",item.style.top=elemCoords.top-relativeShifts.y+"px",setTimeout(()=>item.style.transitionDuration="",1e3*ROTATE_TRANSITION_DURATION)})}},1e3*ROTATE_TRANSITION_DURATION)}function documentWheelHandler(event){event.target.classList.contains("piece")&&event.deltaY>0&&draggableElemRightClickHandler(event),event.target.classList.contains("piece")&&event.deltaY<0&&draggableElemRightClickHandler(event,"reverse")}function getPictureData(method,source){const image=document.createElement("img");switch(method){case"inner":return new Promise(function(resolve){image.src="img/image.jpg",image.onload=function(){resolve({src:this.src,width:this.width,height:this.height})}});case"outer":return new Promise(function(resolve){image.src=source,image.onload=function(){resolve({src:this.src,width:this.width,height:this.height})}})}}function createElementsFragment(data){const fragment=document.createDocumentFragment();let xShift=0,yShift=0,row=1,column=1;switch(data.apportionmentType){case"direct":for(let i=1;i<=data.elemsAmount;i++){let piece=document.createElement("div");piece.className=`piece piece-${i} row-${row} column-${column}`,piece.index=i,piece.row=row,piece.column=column,piece.style.width=data.elemSideLength+"px",piece.style.height=data.elemSideLength+"px",piece.style.left=(data.clientSize.width-data.image.width)/2+xShift+"px",piece.style.top=(data.clientSize.height-data.image.height)/2+yShift+"px",piece.style.backgroundImage=`url(${date.image.src})`,piece.style.backgroundPosition=`${-xShift-data.pictureShifts.x}px ${-yShift-data.pictureShifts.y}px`,piece.deg=0,piece.style.transform="rotate(0deg)",fragment.append(piece),Number.isInteger(i/data.horizontalAmount)?(row++,column=1,yShift+=data.elemSideLength,xShift=0):(column++,xShift+=data.elemSideLength)}return fragment;case"random":const positions=[];let xShiftPosition=0,yShiftPosition=0;for(let i=1;i<=data.elemsAmount;i++)positions.push({left:xShiftPosition,top:yShiftPosition}),Number.isInteger(i/data.horizontalAmount)?(row++,column=1,yShiftPosition+=data.elemSideLength,xShiftPosition=0):(column++,xShiftPosition+=data.elemSideLength);for(let i=1;i<=data.elemsAmount;i++){const piece=document.createElement("div");piece.className=`piece piece-${i} row-${row} column-${column}`,piece.index=i,piece.row=row,piece.column=column,piece.style.width=data.elemSideLength+"px",piece.style.height=data.elemSideLength+"px";const random=randomInteger(0,positions.length-1),randomPosition=positions[random];piece.style.left=(data.clientSize.width-data.image.width)/2+randomPosition.left+"px",piece.style.top=(data.clientSize.height-data.image.height)/2+randomPosition.top+"px",positions.splice(random,1),piece.style.backgroundImage=`url(${data.image.src})`,piece.style.backgroundPosition=`${-xShift-data.pictureShifts.x}px ${-yShift-data.pictureShifts.y}px`;const randomDeg=90*randomInteger(0,3);piece.deg=randomDeg,piece.style.transform=`rotate(${randomDeg}deg)`,fragment.append(piece),Number.isInteger(i/horizontalAmount)?(row++,column=1,yShift+=data.elemSideLength,xShift=0):(column++,xShift+=data.elemSideLength)}return fragment}}function layOutElements(image){const clientSize={width:document.documentElement.clientWidth,height:document.documentElement.clientHeight};if(clientSize.height<image.height){let yRatio=clientSize.height/image.height;image.height=clientSize.height,image.width=image.width*yRatio;const piecesStyle=document.createElement("style");piecesStyle.innerHTML=`.piece {background-size: auto ${image.height}px;}`,document.querySelector("head").append(piecesStyle)}if(clientSize.width<image.width){let xRatio=clientSize.width/image.width;image.width=clientSize.width,image.height=image.height*xRatio;const piecesStyle=document.createElement("style");piecesStyle.innerHTML=`.piece {background-size: ${image.width}px auto;}`,document.querySelector("head").append(piecesStyle)}if(image.width<image.height){horizontalAmount=shortSideElementAmount,elemSideLength=image.width/shortSideElementAmount,verticalAmount=Math.trunc(image.height/elemSideLength);const targetHeight=elemSideLength*verticalAmount;pictureShifts={x:0,y:(image.height-targetHeight)/2},image.height=targetHeight}else{verticalAmount=shortSideElementAmount,elemSideLength=image.height/shortSideElementAmount,horizontalAmount=Math.trunc(image.width/elemSideLength);const targetWidth=elemSideLength*horizontalAmount;pictureShifts={x:(image.width-targetWidth)/2,y:0},image.width=targetWidth}const elemsAmount=horizontalAmount*verticalAmount;document.body.append(createElementsFragment({apportionmentType:"random",image:image,clientSize:clientSize,pictureShifts:pictureShifts,elemsAmount:elemsAmount,horizontalAmount:horizontalAmount,verticalAmount:verticalAmount,elemSideLength:elemSideLength}))}function rotateElem(elem,direction){if(!rotatingElems.has(elem)){switch(rotatingElems.add(elem),elem.style.transitionDuration=ROTATE_TRANSITION_DURATION+"s",direction){case"reverse":elem.deg-=90,elem.style.transform=`rotate(${elem.deg}deg)`;break;default:elem.deg=elem.deg?elem.deg+90:90,elem.style.transform=`rotate(${elem.deg}deg)`}setTimeout(()=>{elem.style.transitionDuration="",(elem.deg>=360||elem.deg<=-360)&&(elem.style.transform="",elem.deg=0),rotatingElems.delete(elem)},1e3*ROTATE_TRANSITION_DURATION)}}function getRelativeShifts(activeElem,targetElem){let shiftX,shiftY;const natureX=(activeElem.column-targetElem.column)*elemSideLength,natureY=(activeElem.row-targetElem.row)*elemSideLength;return activeElem.deg&&360!==activeElem.deg&&-360!==activeElem.deg?90===activeElem.deg||-270===activeElem.deg?(shiftX=-natureY,shiftY=natureX):180===activeElem.deg||-180===activeElem.deg?(shiftX=-natureX,shiftY=-natureY):270!==activeElem.deg&&-90!==activeElem.deg||(shiftX=natureY,shiftY=-natureX):(shiftX=natureX,shiftY=natureY),{x:shiftX,y:shiftY}}function getAllAdjacent(activeElem){const targetElems=[],coord=activeElem.getBoundingClientRect();let x,y,targetElem;return x=coord.left-SEARCH_SPREAD,y=coord.top,(targetElem=[document.elementFromPoint(x,y),document.elementFromPoint(x,y+elemSideLength/2),document.elementFromPoint(x,coord.bottom)].filter(item=>item&&item.classList.contains("piece")&&item!==activeElem).find(function(item){return(activeElem.deg===item.deg||Math.abs(activeElem.deg)+Math.abs(item.deg)===360)&&(activeElem.index===item.index+1&&activeElem.row===item.row&&(0===item.deg||-360===item.deg)||activeElem.row===item.row-1&&activeElem.column===item.column&&(90===item.deg||-270===item.deg)||activeElem.index===item.index-1&&activeElem.row===item.row&&(180===item.deg||-180===item.deg)||activeElem.row===item.row+1&&activeElem.column===item.column&&(270===item.deg||-90===item.deg))&&Math.abs(item.getBoundingClientRect().top-coord.top)<=MERGE_SPREAD&&Math.abs(item.getBoundingClientRect().right-coord.left)<=MERGE_SPREAD}))&&targetElems.push(targetElem),x=coord.right+SEARCH_SPREAD,y=coord.top,(targetElem=[document.elementFromPoint(x,y),document.elementFromPoint(x,y+elemSideLength/2),document.elementFromPoint(x,coord.bottom)].filter(item=>item&&item.classList.contains("piece")&&item!==activeElem).find(function(item){return(activeElem.deg===item.deg||Math.abs(activeElem.deg)+Math.abs(item.deg)===360)&&(activeElem.index===item.index-1&&activeElem.row===item.row&&(0===item.deg||-360===item.deg)||activeElem.row===item.row+1&&activeElem.column===item.column&&(90===item.deg||-270===item.deg)||activeElem.index===item.index+1&&activeElem.row===item.row&&(180===item.deg||-180===item.deg)||activeElem.row===item.row-1&&activeElem.column===item.column&&(270===item.deg||-90===item.deg))&&Math.abs(item.getBoundingClientRect().top-coord.top)<=MERGE_SPREAD&&Math.abs(item.getBoundingClientRect().left-coord.right)<=MERGE_SPREAD}))&&targetElems.push(targetElem),x=coord.left,y=coord.top-SEARCH_SPREAD,(targetElem=[document.elementFromPoint(x,y),document.elementFromPoint(x+elemSideLength/2,y),document.elementFromPoint(coord.right,y)].filter(item=>item&&item.classList.contains("piece")&&item!==activeElem).find(function(item){return(activeElem.deg===item.deg||Math.abs(activeElem.deg)+Math.abs(item.deg)===360)&&(activeElem.row===item.row+1&&activeElem.column===item.column&&(0===item.deg||-360===item.deg)||activeElem.index===item.index+1&&activeElem.row===item.row&&(90===item.deg||-270===item.deg)||activeElem.row===item.row-1&&activeElem.column===item.column&&(180===item.deg||-180===item.deg)||activeElem.index===item.index-1&&activeElem.row===item.row&&(270===item.deg||-90===item.deg))&&Math.abs(item.getBoundingClientRect().left-coord.left)<=MERGE_SPREAD&&Math.abs(item.getBoundingClientRect().bottom-coord.top)<=MERGE_SPREAD}))&&targetElems.push(targetElem),x=coord.left,y=coord.bottom+SEARCH_SPREAD,(targetElem=[document.elementFromPoint(x,y),document.elementFromPoint(x+elemSideLength/2,y),document.elementFromPoint(coord.right,y)].filter(item=>item&&item.classList.contains("piece")&&item!==activeElem).find(function(item){return(activeElem.deg===item.deg||Math.abs(activeElem.deg)+Math.abs(item.deg)===360)&&(activeElem.row===item.row-1&&activeElem.column===item.column&&(0===item.deg||-360===item.deg)||activeElem.index===item.index-1&&activeElem.row===item.row&&(90===item.deg||-270===item.deg)||activeElem.row===item.row+1&&activeElem.column===item.column&&(180===item.deg||-180===item.deg)||activeElem.index===item.index+1&&activeElem.row===item.row&&(270===item.deg||-90===item.deg))&&Math.abs(item.getBoundingClientRect().left-coord.left)<=MERGE_SPREAD&&Math.abs(item.getBoundingClientRect().top-coord.bottom)<=MERGE_SPREAD}))&&targetElems.push(targetElem),targetElems.length>0?targetElems:null}function moveToActive(activeElem,attachableElem){const initCoord=attachableElem.getBoundingClientRect();attachableElem.style.position="absolute",attachableElem.style.zIndex=1e3,attachableElem.style.left=initCoord.left+"px",attachableElem.style.top=initCoord.top+"px",attachableElem.style.transitionDuration=MERGE_TRANSITION_DURATION+"s",document.body.append(attachableElem);const relativeShifts=getRelativeShifts(activeElem,attachableElem);attachableElem.style.left=activeElem.getBoundingClientRect().left-relativeShifts.x+"px",attachableElem.style.top=activeElem.getBoundingClientRect().top-relativeShifts.y+"px",setTimeout(()=>attachableElem.style.transitionDuration="",1e3*MERGE_TRANSITION_DURATION)}function mergePieces(activeElem,adjElemArray){if(adjElemArray){activeElem.id||(activeElem.id=`f${(~~(1e8*Math.random())).toString(16)}`);for(let targetElem of adjElemArray)targetElem.id!==activeElem.id&&(targetElem.id?Array.from(document.querySelectorAll(".piece")).filter(item=>targetElem.id&&item.id===targetElem.id).forEach(function(item){moveToActive(activeElem,item),item.id=activeElem.id}):(moveToActive(activeElem,targetElem),targetElem.id=activeElem.id))}}function clearField(){document.querySelector(".piece")&&(document.querySelectorAll(".piece").forEach(item=>item.remove()),getTimeGame(),overlay.hidden=!0,menuToggleClickHandler("no-trans"))}function finishGame(){setTimeout(()=>{overlay.hidden=!1,gameState="finished";const tmpl=document.querySelector("#popup-template").content.cloneNode(!0),popupWrapper=tmpl.querySelector(".popup__wrapper"),popup=tmpl.querySelector(".popup");popup.style.paddingLeft="40px",popup.style.paddingRight="40px",tmpl.querySelector(".popup__button--cancel").remove(),tmpl.querySelector(".popup__title").textContent="Congratulations!",tmpl.querySelector(".popup__text").textContent=`You put the puzzle of ${horizontalAmount*verticalAmount} parts together from ${getTimeGame()} minutes`,tmpl.querySelector(".popup__button--ok").textContent="Start menu",document.body.append(tmpl),popup.addEventListener("click",function popupClickHandler(event){const target=event.target;target.classList.contains("popup__button--ok")?(popup.removeEventListener("click",popupClickHandler),popupWrapper.remove(),menuNewGameClickHandler()):target.classList.contains("popup__closer")&&(popup.removeEventListener("click",popupClickHandler),popupWrapper.remove(),overlay.hidden=!0)})},1e3*MERGE_TRANSITION_DURATION)}function startTimeGame(){let startTime=Date.now();if("paused"===timekeeper){let ms=parseInt(1e3*menuTime.textContent.slice(3))+parseInt(6e4*menuTime.textContent.slice(0,2));startTime-=ms}timekeeper=setInterval(()=>{const timeFromStart=Math.floor((Date.now()-startTime)/1e3);let s=timeFromStart%60,m=Math.floor(timeFromStart/60);m<10&&(m="0"+m),s<10&&(s="0"+s),menuTime.textContent=`${m}:${s}`},1e3)}function pauseTimeGame(){clearInterval(timekeeper),timekeeper="paused"}function getTimeGame(){return clearInterval(timekeeper),timekeeper=null,menuTime.textContent}bgSwitch.append(...bgs),inputAmount.addEventListener("input",inputAmountInputHandler),inputFile.addEventListener("change",inputFileChangeHandler),bgSwitch.addEventListener("click",bgSwitchClickHandler),startButton.addEventListener("click",startButtonClickHandler),startMenuCloser.addEventListener("click",startMenuCloserClickHandler),menuToggle.addEventListener("click",menuToggleClickHandler),menuNewGame.addEventListener("click",menuNewGameClickHandler),menuRestart.addEventListener("click",menuRestartClickHandler),menuBGChanger.addEventListener("click",menuBGChangerClickHandler),menuPauseButton.addEventListener("click",menuPauseButtonClickHandler),previewShower.addEventListener("mouseenter",previewShowerMouseenterHandler),previewShower.addEventListener("click",previewShowerClickHandler),document.addEventListener("mousedown",documentMousedownHandler),document.addEventListener("wheel",documentWheelHandler);