'use strict'

// количество элементов
const HORISONTAL_AMOUNT = 4;
const VERTICAL_AMOUNT = 3;
// длительность анимации слияния (секунды)
const TRANSITION_DURATION = .3;
// коэффициент расширения области чувствительности поиска смежных элементов (сдвиг от края)
const SEARCH_SPREAD = 20;
// размах стыковки при совпадении (степень допустимого смещения в стороны от "оси стыковки")
const MERGE_SPREAD = 20;

// получить изображение и обертку
const imgWrapper = document.querySelector('.field__img-wrapper');
const img = document.querySelector('.field__img');

// размер исходной картинки
const fieldWidth = img.offsetWidth;
const fieldHeight = img.offsetHeight;

// размеры элементов
const elemWidth = fieldWidth / HORISONTAL_AMOUNT;
const elemHeight = fieldHeight / VERTICAL_AMOUNT;

// массив для объектов, описывающих элементы
const pieces = [];

// общее количество элементов
const amount = HORISONTAL_AMOUNT * VERTICAL_AMOUNT;

// хранение сдвигов
let xShift = 0;
let yShift = 0;

// хранение строк и рядов
let row = 1;
let column = 1;

// вписать элементы в массив с данными о начальном позициионировании
for (let i = 0; i < amount; i++) {

  // новый элемент в массив
  pieces.push( new CreatePuzzElem(elemWidth, elemHeight, xShift, yShift, row, column) );

  // смена позиции для следующего элемента
  if (xShift < (elemWidth * (HORISONTAL_AMOUNT - 1))) { // если не переходим на следующий ряд
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
setPositions(pieces, 'random');

// Фрагмент для накопления
let fragment = document.createDocumentFragment();

// Создать DOM-элементы
pieces.forEach(function(item, index) {

  let piece = document.createElement('div');
  piece.className = `piece piece-${index + 1} row-${item.row} column-${item.column}`;
  piece.index = index + 1;
  piece.row = item.row;
  piece.column = item.column;

  // вписать размер
  piece.style.width = item.width + 'px';
  piece.style.height = item.height + 'px';

  // вписать расположение
  piece.style.left = item.left + 'px';
  piece.style.top = item.top + 'px';

  // вписать данные о положении картинки в элементе
  piece.style.backgroundPosition = `${-item.xPicShift}px ${-item.yPicShift}px`;

  // вставить во фрагмент
  fragment.append(piece);
});

// интегрировать в document
imgWrapper.append(fragment);


/* 
// ---------------------- ОБРАБОТКА СОБЫТИЙ ------------------------  
*/ 

// Слушать "вжатие" мыши на документе
document.addEventListener('mousedown', function(event) {

  // если клик левой клавишей по детали пазла
  if (event.target.classList.contains('piece') && event.which == 1) {
    event.preventDefault();

    // двигаемый элемент
    let activeElem = event.target;

    // расстояние от краев элемента до места клика
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
  
    // двигать элемент относительно краев браузера
    function moveAt(activeElem, x, y) {
      activeElem.style.left = x + 'px';
      activeElem.style.top = y + 'px';
    }

    // обработка события движения с захваченным элементом
    function onMouseMove(event) {

      // двигать сам элемент
      moveAt(activeElem, event.pageX - shiftX, event.pageY - shiftY);

      // если элемент имеет id (часть группы) - двигать всю группу
      if (activeElem.id) {
        Array.from(document.querySelectorAll('.piece'))
          .filter((item) => item.id === activeElem.id && item !== activeElem)
          .forEach(function(item) {
            let itemX = event.pageX - ((activeElem.column - item.column) * elemWidth) - shiftX;
            let itemY = event.pageY - ((activeElem.row - item.row) * elemHeight) - shiftY;
            moveAt( item, itemX, itemY);
          });
      };
    }
  
    // Слушать движение мыши, при смене позиции
    // подгонять положение элемента
    document.addEventListener('mousemove', onMouseMove);
  
    // При отпускании клавиши...
    activeElem.onmouseup = function() {

      // удалять прослушку движения
      document.removeEventListener('mousemove', onMouseMove);

      // самоудаляться текущему обработчику события
      activeElem.onmouseup = null;

      // Получить данные о искомых деталях, присоединить, если есть совпадения
      mergePieces( activeElem, getAllAdjacent(activeElem) );

      // Запустить поиск и слияние при совпадении для каждой детали с таким-же id
      Array.from(document.querySelectorAll('.piece'))
      .filter((item) => item.id === activeElem.id && item !== activeElem)
      .forEach(function(item) {
        mergePieces( item, getAllAdjacent(item) );
      });
    };

    // отменить дефолтную обработку перетаскивания
    activeElem.ondragstart = function() {
      return false;
    };
  }
});


/* 
// ---------------------- ФУНКЦИИ ------------------------  
*/ 

// Присоединение элементов. Аргументы: рабочий элемент, массив элементов для присоединения.
function mergePieces(activeElem, adjElemArray) {
  if (!adjElemArray) return;

  // сгенерировать общий идентификатор для сцепляемых элементов
  if (!activeElem.id) activeElem.id = `f${(~~(Math.random()*1e8)).toString(16)}`;

    // присоединить каждый из массива, либо группу элементов, частью которой является присоединяемый
    for (let targetElem of adjElemArray) {

      // если оба элемента имеют разные id (еще не сцеплены меж собой)
      if (targetElem.id !== activeElem.id) {

        if (!targetElem.id) { // если целевой элемент не имеет id (не является частью группы сцепленных элементов)...
          moveToActive(activeElem, targetElem); // придвинуть к активному
          targetElem.id = activeElem.id; // присвоить общий id с активным (образовать группу)
        } else { // иначе, целевой - часть группы, выполнить те-же действия для каждого элемента группы
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

// Сдвиг пассивного элемента к активному
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
  attachableElem.style.left = activeElem.getBoundingClientRect().left - ((activeElem.column - attachableElem.column) * elemWidth) + 'px';
  attachableElem.style.top = activeElem.getBoundingClientRect().top - ((activeElem.row - attachableElem.row) * elemHeight) + 'px';

  // сбросить анимацию
  setTimeout( () => attachableElem.style.transitionDuration = '', TRANSITION_DURATION * 1000);
}

// Получить все смежные части мозайки. Возвращает массив
// подходящих частей, либо null, если подходящих не найдено.
function getAllAdjacent(activeElem) {
  const elems = [];

  let left = getAdjacent(activeElem, 'left');
  if (left) elems.push(left);

  let right = getAdjacent(activeElem, 'right');
  if (right) elems.push(right);

  let top = getAdjacent(activeElem, 'top');
  if (top) elems.push(top);

  let bottom = getAdjacent(activeElem, 'bottom');
  if (bottom) elems.push(bottom);

  return (elems.length > 0) ? elems : null;
}

// Поиск смежных частей мозайки для данного элемента в заданном направлении.
// Возвращает найденный элемент или null.
function getAdjacent(activeElem, direction) {

  // координаты заданного элемента
  let coord = activeElem.getBoundingClientRect();

  // точки "прощупывания" с учетом коэффициента
  let x, y;

  switch(direction) {
    case 'left':
      x = coord.left - SEARCH_SPREAD;
      y = coord.top;
      break;

    case 'right':
      x = coord.right + SEARCH_SPREAD;
      y = coord.top;
      break;

    case 'top':
      x = coord.left;
      y = coord.top - SEARCH_SPREAD;
      break;

    case 'bottom':
      x = coord.left;
      y = coord.bottom + SEARCH_SPREAD;
      break;
  }

  // найденные элементы в указанном направлении
  // поиск по трем точкам - 2 крайних и одной по центру
  const adjacents = [];

  if (direction === 'left' || direction === 'right') {
    adjacents.push( document.elementFromPoint(x, y) );
    adjacents.push( document.elementFromPoint(x, y + ((coord.bottom - coord.top) / 2)) ); // от центра элемента
    adjacents.push( document.elementFromPoint(x, coord.bottom) );
  };

  if (direction === 'top' || direction === 'bottom') {
    adjacents.push( document.elementFromPoint(x, y) );
    adjacents.push( document.elementFromPoint(x  + ((coord.right - coord.left) / 2), y)); // от центра элемента
    adjacents.push( document.elementFromPoint(coord.right, y) );
  };

  // целевой элемент
  let targetPiece = null;

  // перебрать найденные, вычислить целевой
  adjacents.forEach(function(item) {
    if (item && item.classList.contains('piece') && !targetPiece) {

      switch(direction) {

        case 'left': // условие совпадения: порядковый номер минус один + тот-же ряд элемента
          if (activeElem.index === item.index + 1 &&
              activeElem.row === item.row &&
              Math.abs(item.getBoundingClientRect().top - coord.top) <= MERGE_SPREAD &&
              Math.abs(item.getBoundingClientRect().right - coord.left) <= MERGE_SPREAD) {
                targetPiece = item;
          };
          break;

        case 'right': // условие совпадения: порядковый номер плюс один + тот-же ряд элемента
          if (activeElem.index === item.index - 1 &&
              activeElem.row === item.row &&
              Math.abs(item.getBoundingClientRect().top - coord.top) <= MERGE_SPREAD &&
              Math.abs(item.getBoundingClientRect().left - coord.right) <= MERGE_SPREAD) {
                targetPiece = item;
          };
          break;

        case 'top': // условие совпадения: та-же колонка + ряд меньший на один
          if (activeElem.column === item.column &&
              activeElem.row === item.row + 1 &&
              Math.abs(item.getBoundingClientRect().left - coord.left) <= MERGE_SPREAD &&
              Math.abs(item.getBoundingClientRect().bottom - coord.top) <= MERGE_SPREAD) {
                targetPiece = item;
          };
          break;

        case 'bottom': // условие совпадения: та-же колонка + ряд больший на один
          if (activeElem.column === item.column &&
              activeElem.row === item.row - 1 &&
              Math.abs(item.getBoundingClientRect().left - coord.left) <= MERGE_SPREAD &&
              Math.abs(item.getBoundingClientRect().top - coord.bottom) <= MERGE_SPREAD) {
                targetPiece = item;
          };
          break;
      };
    };
  });
  return targetPiece;
}

// управление раскладкой элементов
function setPositions(pieces, how) {

  switch(how) {

    // Расположение в соответствии с исходной картинкой
    case 'direct':
      pieces.forEach(function(item) {
        item.left = item.xPicShift;
        item.top = item.yPicShift;
      });
      break;

    // Рандомное расположение
    case 'random':
      // массив объектов, описывающих возможные позиции
      let positions = pieces.map( item => ({ left: item.xPicShift, top: item.yPicShift }) );

      for (let i = 0; i < pieces.length; i++) {
        // случайное целое для массива position (вариации на понижение,
        // поскольку массив неиспользованных позиции уменьшается с каждой итерацией)
        let random = randomInteger(0, pieces.length - 1 - i);
        [pieces[i].left, pieces[i].top] = [positions[random].left, positions[random].top];
        // удалить использованную позицию
        positions.splice(random, 1);
      };
      break;
  }
}

// конструктор элементов
function CreatePuzzElem(width, height, xShift, yShift, row, column) {
  this.width = width;
  this.height = height;
  this.xPicShift = xShift;
  this.yPicShift = yShift;
  this.row = row;
  this.column = column;
}

// Случайно целое в заданном диапазоне
function randomInteger(min, max) {
  let rand = min + Math.random() * (max + 1 - min);
  return Math.floor(rand);
}