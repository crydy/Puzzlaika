'use strict'

// длительность анимации слияния (секунды)
const TRANSITION_DURATION = .3;
// коэффициент расширения области чувствительности поиска смежных элементов (сдвиг от края)
const SEARCH_SPREAD = 20;
// размах стыковки при совпадении (степень допустимого смещения в стороны от "оси стыковки")
const MERGE_SPREAD = 20;

// Элементы стартового меню
let startMenu = document.querySelector('.start-menu');
let inputFile = startMenu.querySelector('.start-menu__inputfile');
let label = startMenu.querySelector('.start-menu__inputfile-label');
let startButton = startMenu.querySelector('.start-menu__start-button');
let inputAmount = startMenu.querySelector('#pieces-amount');

// Элементы углового меню
let menu = document.querySelector('.menu');
let menuToggle = menu.querySelector('.menu__toggle');
let toggle = menu.querySelector('.menu__toggle');
let toggleLi = toggle.closest('.menu__item');

// Путь к юзерской картинке
let userImageURL;

// количество элементов
let elementCount;
let horizontal_amount;
let vertical_amount;

// Запретить прокрутку
document.body.style.overflow = "hidden";

// Свернуть меню без анимации
menuToggleClickHandler('no-trans');
menu.hidden = true;

// Слушать загрузку файла
inputFile.addEventListener('change', inputFileChangeHandler);
// Слушать кнопку старта игры
startButton.addEventListener('click', startButtonClickHandler);
// Открывать угловое меню по клику
menuToggle.addEventListener('click', menuToggleClickHandler);


// Получить ссылку на юзерский файл
function inputFileChangeHandler() {
  // получить загруженный файл
  let file = inputFile.files[0];
  // преобразовать в ссылку
  let imageURL = URL.createObjectURL(file);

  // получить размер изображения
  getPictureSize('outer', imageURL).then(
    (result) => {
      label.textContent = 'Your image is downloaded';
      userImageURL = result;
    }
  );
}

// Начать игру
function startButtonClickHandler() {
  // Проверить наличие юзерского файла
  if (!userImageURL) {
    getPictureSize('inner').then(createPazzle);
  };
  
  // Отобразить угловое меню
  menu.hidden = false;
  // Спрятать стартовую менюшку
  startMenu.hidden = true;
  // количество элементов по короткой стороне
  elementCount = +inputAmount.value;
  // Раскидать пазл
  createPazzle(userImageURL);
}

// Свернуть и развернуть меню
function menuToggleClickHandler() {

  // расстояние до верха браузера
  let menuInnerSpread = toggleLi.offsetTop - menu.offsetTop;

  // скрыть без анимации (при загрузке страницы)
  if (arguments[0] === 'no-trans') {
    let trDur = parseFloat(getComputedStyle(menu).transitionDuration);
    menu.style.transitionDuration = '0s';
    setTimeout(() => {menu.style.transitionDuration = trDur + 's'}, trDur + 's');
  }
  
  // открывать-закрывать по клику
  if(!menu.classList.contains('menu--closed')) {
    menu.style.top = -menuInnerSpread + 'px';
    menu.classList.add('menu--closed');
    toggle.textContent = 'menu';
  } else {
    menu.classList.remove('menu--closed');
    menu.style.top = 0;
    toggle.textContent = 'hide';
  };
}

// получить промис с размерами изображения
function getPictureSize(method, source) {

  let image = document.createElement('img');

  switch(method) {

    case 'inner':
      return new Promise(function(resolve) {
        image.src = 'img/image.jpg';
        image.onload = function() {
          resolve( {src: this.src, width: this.width, height: this.height} );
        };
      });
    
    case 'outer':
      return new Promise(function(resolve) {
        image.src = source;
        image.onload = function() {
          resolve( {src: this.src, width: this.width, height: this.height} );
        };
      });
  }
}

// разложить пазл
function createPazzle(image) {
  
  // размеры изображения
  let fieldWidth = image.width;
  let fieldHeight = image.height;

  // размеры вьюпорта
  let windowWidth = document.documentElement.clientWidth;
  let windowHeight = document.documentElement.clientHeight;

  // Вписать во вьюпорт
  if (windowHeight < fieldHeight) {

    // коэффициент уменьшения
    let yRatio = windowHeight / fieldHeight;

    // подогнать высоту под вьюпорт
    fieldHeight = windowHeight;

    // пропорционально подогнать ширину
    fieldWidth = fieldWidth * yRatio;

    // пропорционально скорректировать фон деталей
    let piecesStyle = document.createElement('style');
    piecesStyle.innerHTML = `.piece {background-size: auto ${fieldHeight}px;}`;
    document.querySelector('head').append(piecesStyle);

  }

  if (windowWidth < fieldWidth) {

    // коэффициент уменьшения
    let xRatio = windowWidth / fieldWidth;

    // подогнать ширину под вьюпорт
    fieldWidth = windowWidth;

    // пропорционально подогнать высоту
    fieldHeight = fieldHeight * xRatio;

    // пропорционально скорректировать фон деталей
    let piecesStyle = document.createElement('style');
    piecesStyle.innerHTML = `.piece {background-size: ${fieldWidth}px auto;}`;
    document.querySelector('head').append(piecesStyle);
  }

// размер части мозайки
let elemSideLength;

// сдвиги изображения для центровки
let pictureShifts;

// выбор количества делатей по короткой ширине,
// все детали - квадратные, по длинной стороне остаток картинки урезается
if (fieldWidth < fieldHeight) { // для вертикальной картинки

  horizontal_amount = elementCount;
  // размер куска
  elemSideLength = fieldWidth / elementCount;
  // количество вмещаемых элементов по высоте
  vertical_amount = Math.trunc(fieldHeight / elemSideLength);
  // Требуемая высота
  const targetHeight = elemSideLength * vertical_amount;

  // Боковой сдвиг для центрирования картинки в раскладке
  pictureShifts = {
    x: 0,
    y: (fieldHeight - targetHeight) / 2
  };

  // Подрезать картинку по краям
  // img.style.objectFit = 'none';
  // img.style.objectPosition = 'center';
  // img.style.height = targetHeight + 'px';

  // запомнить подрезанный размер
  fieldHeight = targetHeight;

} else { // для горизонтальной картинки

  vertical_amount = elementCount;
  // размер куска
  elemSideLength = fieldHeight / elementCount;
  // количество вмещаемых элементов по ширине
  horizontal_amount = Math.trunc(fieldWidth / elemSideLength);
  // Требуемая ширина
  const targetWidth = elemSideLength * horizontal_amount;

  // Боковой сдвиг для центрирования картинки в раскладке
  pictureShifts = {
    x: (fieldWidth - targetWidth) / 2,
    y: 0
  };

  // Подрезать картинку по краям
  // img.style.objectFit = 'none';
  // img.style.objectPosition = 'center';
  // img.style.width = targetWidth + 'px';

  // запомнить подрезанный размер
  fieldWidth = targetWidth;

};

// размеры сторон элементов
const elemWidth = elemSideLength;
const elemHeight = elemSideLength;

// массив для объектов, описывающих элементы
const pieces = [];

// общее количество элементов
const amount = horizontal_amount * vertical_amount;

// хранение сдвигов
let xShift = 0;
let yShift = 0;

// хранение строк и рядов
let row = 1;
let column = 1;

// вписать элементы в массив с данными о начальном позициионировании
for (let i = 0; i < amount; i++) {

  // новый элемент в массив
  pieces.push( new CreatePuzzElem(elemWidth, elemHeight, xShift, yShift, row, column, pictureShifts) );

  // смена позиции для следующего элемента
  if ( !Number.isInteger( (i + 1) / horizontal_amount ) ) { // если деталь должна остаться в том-же ряду
    column++; // следующая колонка
    xShift += elemWidth; // левый край следующего элемента к правому предыдущего
  } else { // при переходе на следующий ряд
    row++; // следующий ряд
    column = 1; // отсчет колонок с начала
    yShift += elemHeight; // следующая строка
    xShift = 0; // ... и ряд с начала
  };
}

// Настроить раскладку
setPositions(pieces, pictureShifts, 'random');

// Фрагмент для накопления
let fragment = document.createDocumentFragment();

// Создать DOM-элементы
pieces.forEach(function(item, index) {

  // создать с классами
  let piece = document.createElement('div');
  piece.className = `piece piece-${index + 1} row-${item.row} column-${item.column}`;

  // мета
  piece.index = index + 1;
  piece.row = item.row;
  piece.column = item.column;

  // размер
  piece.style.width = item.width + 'px';
  piece.style.height = item.height + 'px';

  // расположение
  piece.style.left = (document.documentElement.clientWidth - fieldWidth) / 2 + item.left + 'px';
  piece.style.top = (document.documentElement.clientHeight - fieldHeight) / 2 + item.top + 'px';
  // piece.style.top = item.top + 'px';

  // фон и положение фона
  piece.style.backgroundImage = `url(${image.src})`;
  piece.style.backgroundPosition = `${-item.xPicShift}px ${-item.yPicShift}px`;

  // угол поворота
  piece.deg = item.deg;
  piece.style.transform = `rotate(${item.deg}deg)`;

  // вставить во фрагмент
  fragment.append(piece);
});





// интегрировать в document
document.body.append(fragment);


/* 
// ---------------------- ОБРАБОТКА СОБЫТИЙ ------------------------  
*/ 

// Слушать "вжатие" мыши на документе
document.addEventListener('mousedown', function(event) {

  // обработать клик левой клавишей по детали пазла
  if (event.target.classList.contains('piece') && event.which == 1) {

    // двигаемый элемент
    let activeElem = event.target;

    // отменить дефолтную обработку перетаскивания
    activeElem.ondragstart = function() {
      return false;
    };

    // смещения от краев элемента до места клика
    let shiftX = event.clientX - activeElem.getBoundingClientRect().left;
    let shiftY = event.clientY - activeElem.getBoundingClientRect().top;
  
    // отображать поверх других элементов, позиционировать относительно document
    activeElem.style.position = 'absolute';
    activeElem.style.zIndex = 1000;
    document.body.append(activeElem);

    // если есть сцепленные элементы - также отображать поверх
    Array.from(document.querySelectorAll('.piece'))
      .filter((item) => item.id && item.id === activeElem.id)
      .forEach(function(item) {
        document.body.append(item);
      });

    // захватить элемент под курсор
    moveAt(activeElem, event.pageX - shiftX, event.pageY - shiftY);
  
    // двигать элемент с курсором
    document.addEventListener('mousemove', mouseMoveHandler);

    // вращать элемент или группу элементов правой клавишей,
    // предотвратить выпадение контекстного меню
    activeElem.addEventListener('mousedown', rightClickHandler);
    document.addEventListener('contextmenu', preventContextMenu);
  
    // При отпускании клавиши...
    activeElem.onmouseup = function(event) {

      // правая клавиша обрабатывает вращение элемента
      if (event.which === 3) return;

      // удалять прослушку движения и нажания
      document.removeEventListener('mousemove', mouseMoveHandler);
      activeElem.removeEventListener('mousedown', rightClickHandler);

      // вернуть контекстное меню
      document.removeEventListener('contextmenu', preventContextMenu);

      // самоудаляться текущему обработчику события
      activeElem.onmouseup = null;

      // Получить данные о искомых деталях, присоединить, если есть совпадения
      mergePieces( activeElem, getAllAdjacent(activeElem) );

      // Если активный элемент - часть группы, запустить поиск совпадений от каждого элемента группы
      if (activeElem.id) {
        Array.from(document.querySelectorAll('.piece'))
          .filter((item) => item.id === activeElem.id && item !== activeElem)
          .forEach(function(item) {
            mergePieces( item, getAllAdjacent(item) );
          });
      }
    };

    // двигать элемент относительно краев браузера
    function moveAt(activeElem, x, y) {
      activeElem.style.left = x + 'px';
      activeElem.style.top = y + 'px';
    }

    // движение элемента или группы
    function mouseMoveHandler(event) {

      // двигать сам элемент
      moveAt(activeElem, event.pageX - shiftX, event.pageY - shiftY);

      // если элемент имеет id (часть группы) - двигать всю группу
      if (activeElem.id) {
        Array.from(document.querySelectorAll('.piece'))
          .filter((item) => item.id === activeElem.id && item !== activeElem)
          .forEach(function(item) {

            // получить сдвиги отностиельно активного элемента
            let relativeShifts = getRelativeShifts(activeElem, item);
            // требуемое положение относительно вьюпорта
            let itemX = event.pageX - relativeShifts.x - shiftX;
            let itemY = event.pageY - relativeShifts.y - shiftY;
            // двигать вместе с активным
            moveAt( item, itemX, itemY);

          });
      };
    }

    // предотвращение вызова контекстного меню
    function preventContextMenu(event) {
      event.preventDefault();
    }
  }
});





/* 
// ---------------------- ФУНКЦИИ ------------------------  
*/ 


// Случайно целое в заданном диапазоне
function randomInteger(min, max) {
  let rand = min + Math.random() * (max + 1 - min);
  return Math.floor(rand);
}


// конструктор элементов
function CreatePuzzElem(width, height, xShift, yShift, row, column, pictureShifts) {
  this.width = width;
  this.height = height;
  this.xPicShift = xShift + pictureShifts.x;
  this.yPicShift = yShift + pictureShifts.y;
  this.row = row;
  this.column = column;
}


// управление раскладкой элементов
function setPositions(pieces, pictureShifts, how) {

  switch(how) {

    // Расположение в соответствии с исходной картинкой
    case 'direct':
      pieces.forEach(function(item) {
        item.left = item.xPicShift - pictureShifts.x;
        item.top = item.yPicShift - pictureShifts.y;
        item.deg = 0;
      });
      break;

    // Рандомное расположение
    case 'random':
      // массив объектов, описывающих возможные позиции
      let positions = pieces.map( item => ({ left: item.xPicShift - pictureShifts.x, top: item.yPicShift - pictureShifts.y }) );

      for (let i = 0; i < pieces.length; i++) {
        // случайное целое для массива position (вариации на понижение,
        // поскольку массив неиспользованных позиции уменьшается с каждой итерацией)
        let random = randomInteger(0, pieces.length - 1 - i);
        // произвольая (из оставшихся) позиция для каждого следующего элемента
        [pieces[i].left, pieces[i].top] = [positions[random].left, positions[random].top];
        // произвольный угол поворота
        pieces[i].deg = randomInteger(0, 3) * 90;
        // pieces[i].deg = 0;
        // удалить использованную позицию
        positions.splice(random, 1);
      };
      break;
  }
}


// получить смещения позиции целевого элемента
// относительно активного (возвращает объект с ключами x, y)
function getRelativeShifts(activeElem, targetElem) {

  let shiftX, shiftY;

  // сдвиги при натуральной раскладке
  let natureX = ((activeElem.column - targetElem.column) * elemWidth);
  let natureY = ((activeElem.row - targetElem.row) * elemHeight);

  // сдвиги при поворотах
  if (!activeElem.deg || activeElem.deg === 360) {
    shiftX = natureX;
    shiftY = natureY;
  } else if (activeElem.deg === 90) {
    shiftX = -natureY;
    shiftY = natureX;
  } else if (activeElem.deg === 180) {
    shiftX = -natureX;
    shiftY = -natureY;
  } else if (activeElem.deg === 270) {
    shiftX = natureY;
    shiftY = -natureX;
  }

  return { x: shiftX, y: shiftY };
}


// Получить подходящие смежные детали мозайки.
// Возвращается массив деталей или null.
function getAllAdjacent(activeElem) {

  // массив для найденных
  const targetElems = [];

  // координаты активного элемента
  let coord = activeElem.getBoundingClientRect();

  // точки "прощупывания" смежных элементов
  let x, y;
  let targetElem;

  // Поиск слева
  x = coord.left - SEARCH_SPREAD;
  y = coord.top;
  targetElem = [
    document.elementFromPoint(x, y),
    document.elementFromPoint(x, y + (elemHeight / 2)),
    document.elementFromPoint(x, coord.bottom)
  ].filter((item) => item && item.classList.contains('piece') && item !== activeElem).find( function(item) {
    return activeElem.deg === item.deg &&
           ((activeElem.index === item.index + 1 && activeElem.row === item.row && item.deg === 0) ||
            (activeElem.row === item.row - 1 && activeElem.column === item.column && item.deg === 90) ||
            (activeElem.index === item.index - 1 && activeElem.row === item.row && item.deg === 180) ||
            (activeElem.row === item.row + 1 && activeElem.column === item.column && item.deg === 270)) &&
           Math.abs(item.getBoundingClientRect().top - coord.top) <= MERGE_SPREAD &&
           Math.abs(item.getBoundingClientRect().right - coord.left) <= MERGE_SPREAD
  });
  if (targetElem) targetElems.push(targetElem);

  // справа
  x = coord.right + SEARCH_SPREAD;
  y = coord.top;
  targetElem = [
    document.elementFromPoint(x, y),
    document.elementFromPoint(x, y + (elemHeight / 2)),
    document.elementFromPoint(x, coord.bottom)
  ].filter((item) => item && item.classList.contains('piece') && item !== activeElem).find( function(item) {
    return activeElem.deg === item.deg &&
           ((activeElem.index === item.index - 1 && activeElem.row === item.row && item.deg === 0) ||
            (activeElem.row === item.row + 1 && activeElem.column === item.column && item.deg === 90) ||
            (activeElem.index === item.index + 1 && activeElem.row === item.row && item.deg === 180) ||
            (activeElem.row === item.row - 1 && activeElem.column === item.column && item.deg === 270)) &&
           Math.abs(item.getBoundingClientRect().top - coord.top) <= MERGE_SPREAD &&
           Math.abs(item.getBoundingClientRect().left - coord.right) <= MERGE_SPREAD
  });
  if (targetElem) targetElems.push(targetElem);

  // сверху
  x = coord.left;
  y = coord.top - SEARCH_SPREAD;
  targetElem = [
    document.elementFromPoint(x, y),
    document.elementFromPoint(x  + (elemWidth / 2), y),
    document.elementFromPoint(coord.right, y)
  ].filter((item) => item && item.classList.contains('piece') && item !== activeElem).find( function(item) {
    return activeElem.deg === item.deg &&
            ((activeElem.row === item.row + 1 && activeElem.column === item.column && item.deg === 0) ||
             (activeElem.index === item.index + 1 && activeElem.row === item.row && item.deg === 90) ||
             (activeElem.row === item.row - 1 && activeElem.column === item.column && item.deg === 180) ||
             (activeElem.index === item.index - 1 && activeElem.row === item.row && item.deg === 270)) &&
           Math.abs(item.getBoundingClientRect().left - coord.left) <= MERGE_SPREAD &&
           Math.abs(item.getBoundingClientRect().bottom - coord.top) <= MERGE_SPREAD
  });
  if (targetElem) targetElems.push(targetElem);

  // снизу
  x = coord.left;
  y = coord.bottom + SEARCH_SPREAD;
  targetElem = [
    document.elementFromPoint(x, y),
    document.elementFromPoint(x  + (elemWidth / 2), y),
    document.elementFromPoint(coord.right, y)
  ].filter((item) => item && item.classList.contains('piece') && item !== activeElem).find( function(item) {
    return activeElem.deg === item.deg &&
            ((activeElem.row === item.row - 1 && activeElem.column === item.column && item.deg === 0) ||
             (activeElem.index === item.index - 1 && activeElem.row === item.row && item.deg === 90) ||
             (activeElem.row === item.row + 1 && activeElem.column === item.column && item.deg === 180) ||
             (activeElem.index === item.index + 1 && activeElem.row === item.row && item.deg === 270)) &&
           Math.abs(item.getBoundingClientRect().left - coord.left) <= MERGE_SPREAD &&
           Math.abs(item.getBoundingClientRect().top - coord.bottom) <= MERGE_SPREAD
  });
  if (targetElem) targetElems.push(targetElem);

  // Вернуть массив подходящих или null
  return (targetElems.length > 0) ? targetElems : null;
}


// Сдвиг прикрепляемого элемента к активному
function moveToActive(activeElem, attachableElem) {

  // выдернуть на уровень document в то-же место, установить плавную анимацию
  let initCoord = attachableElem.getBoundingClientRect();
  attachableElem.style.position = 'absolute';
  attachableElem.style.zIndex = 1000;
  attachableElem.style.left = initCoord.left + 'px';
  attachableElem.style.top = initCoord.top + 'px';
  attachableElem.style.transitionDuration = TRANSITION_DURATION + 's';
  document.body.append(attachableElem);

  // сдвинуть в соответствие с дОлжной позицией относительно активного
  let relativeShifts = getRelativeShifts(activeElem, attachableElem);
  attachableElem.style.left = activeElem.getBoundingClientRect().left - relativeShifts.x + 'px';
  attachableElem.style.top = activeElem.getBoundingClientRect().top - relativeShifts.y + 'px';

  // сбросить анимацию
  setTimeout( () => attachableElem.style.transitionDuration = '', TRANSITION_DURATION * 1000);
}


// Присоединение элементов (рабочий элемент, массив элементов для присоединения).
function mergePieces(activeElem, adjElemArray) {
  if (!adjElemArray) return;

  // сгенерировать общий идентификатор для сцепляемых элементов
  if (!activeElem.id) activeElem.id = `f${(~~(Math.random()*1e8)).toString(16)}`;

    // присоединить каждый из массива, либо группу элементов, частью которой является присоединяемый
    for (let targetElem of adjElemArray) {

      // если оба элемента имеют разные id (еще не сцеплены меж собой)
      if (targetElem.id !== activeElem.id) {

        // присоединить целевой элемент или группу элементов (сдвинуть, назначить id от активного)
        if (!targetElem.id) {
          moveToActive(activeElem, targetElem);
          targetElem.id = activeElem.id;
        } else {
          Array.from(document.querySelectorAll('.piece'))
            .filter((item) => targetElem.id && item.id === targetElem.id)
            .forEach(function(item) {
              moveToActive(activeElem, item);
              item.id = activeElem.id;
            });
        }
      }
    }
}


// Поворот элемента
// (анимация вдвое короче анимации происоединения)
function rotateElem(elem) {

  // анимировать поворот
  elem.style.transitionDuration = TRANSITION_DURATION / 2 + 's';

  // запомнить угол, повернуть
  elem.deg = (elem.deg) ? elem.deg + 90 : 90;
  elem.style.transform = `rotate(${elem.deg}deg)`;

  setTimeout(() => {
    
    // сброс анимации
    elem.style.transitionDuration = '';

    // обнулить "transform" для предотвращения анимации в обратную сторону
    if (elem.deg >= 360) {
      elem.style.transform = '';
      elem.deg = 0;
    };

  }, TRANSITION_DURATION * 1000 / 2);
}

// Обработка правого клика - поворот элемента
// или группы связанных элементов
function rightClickHandler(event) {

  const elem = event.target;

  // повернуть элемент
  rotateElem(elem);

   // если есть связанные - повернуть все
   if (elem.id) {
    let elemCoords = elem.getBoundingClientRect();

    Array.from(document.querySelectorAll('.piece'))
    .filter((item) => item.id === elem.id && item !== elem)
    .forEach(function(item) {

      // получить относительные сдвиги
      let relativeShifts = getRelativeShifts(elem, item);

      // анимировать
      item.style.transitionDuration = TRANSITION_DURATION + 's';

      // новое положение
      item.style.left = elemCoords.left - relativeShifts.x + 'px';
      item.style.top = elemCoords.top - relativeShifts.y + 'px';

      // снять анимацию
      setTimeout( () => item.style.transitionDuration = '', TRANSITION_DURATION * 1000);

      // повернуть
      rotateElem(item);
    });
  }
}

}