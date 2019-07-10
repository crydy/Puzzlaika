'use strict'

// количество элементов
const HORISONTAL_AMOUNT = 6;
const VERTICAL_AMOUNT = 4;

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

// Фрагмент для элементов
let fragment = document.createDocumentFragment();

// Создать элементы DOM
pieces.forEach(function(item, index) {

  let piece = document.createElement('div');
  // ... общий класс, порядковый номер, строка, колонка
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

  // накапливаем во фрагмент
  fragment.append(piece);
});

// вставить фрагмент
imgWrapper.append(fragment);


/* 
// ---------------------- ОБРАБОТКА СОБЫТИЙ ------------------------  
*/ 

// Слушать вжатие мыши на документе
document.addEventListener('mousedown', function(event) {

  // если клик левой клавишей по детали пазла
  if (event.target.classList.contains('piece') && event.which == 1) {
    event.preventDefault();

    // двигаемый элемент
    let piece = event.target;

    // расстояние от краев элемента до места клика
    let shiftX = event.clientX - piece.getBoundingClientRect().left;
    let shiftY = event.clientY - piece.getBoundingClientRect().top;
  
    // отображать поверх других элементов, позиционировать относительно document
    piece.style.position = 'absolute';
    piece.style.zIndex = 1000;
    document.body.append(piece);

    // отражать все перетаскиваемые элементы поверх прочих
    Array.from(document.querySelectorAll('.piece'))
      .filter((item) => item.id && item.id === piece.id)
      .forEach(function(item) {
        document.body.append(item);
      });

    // захватить элемент под курсор
    moveAt(piece, event.pageX - shiftX, event.pageY - shiftY);
  
    // двигать элемент относительно краев браузера
    function moveAt(elem, x, y) {
      elem.style.left = x + 'px';
      elem.style.top = y + 'px';
    }

    // обработка события движения с зажатой клавишей (с захваченным элементом)
    function onMouseMove(event) {
      moveAt(piece, event.pageX - shiftX, event.pageY - shiftY);

      // если элемент имеет id (было слияние с другими) - двигать слитые элементы синхронно
      if (piece.id) {
        Array.from(document.querySelectorAll('.piece'))
          .filter((item) => item.id === piece.id && item !== piece)
          .forEach(function(item) {
            let itemX = event.pageX - ((piece.column - item.column) * elemWidth) - shiftX;
            let itemY = event.pageY - ((piece.row - item.row) * elemHeight) - shiftY;
            moveAt( item, itemX, itemY);
          });
      };
    }
  
    // слушать движение мыши, при смене позиции
    // подгонять положение элемента
    document.addEventListener('mousemove', onMouseMove);
  
    // при отпускании клавиши: удалять прослушку движения,
    // самоудаляться текущему обработчику события
    piece.onmouseup = function() {
      document.removeEventListener('mousemove', onMouseMove);
      piece.onmouseup = null;

      // Получить данные о искомых деталях, присоединить, если есть совпадения
      mergePieces( piece, getAllAdjacent(piece) );

      // Запустить поиск и слияние при совпадении для каждой детали с таким-же id
      Array.from(document.querySelectorAll('.piece'))
      .filter((item) => item.id === piece.id && item !== piece)
      .forEach(function(item) {
        mergePieces( item, getAllAdjacent(item) );
      });

    };

    // отменить дефолтную обработку перетаскивания
    piece.ondragstart = function() {
      return false;
    };
  }
});


/* 
// ---------------------- ФУНКЦИИ ------------------------  
*/ 

// соединение элементов
function mergePieces(elem, adjElemArray) {
  if (!adjElemArray) return;

  // общий идентификатор для сцепленных элементов
  if (!elem.id) elem.id = `f${(~~(Math.random()*1e8)).toString(16)}`;

  for (let obj of adjElemArray) {
    for (let dir in obj) {

      // Совпавший элемент
      let anotherElem = obj[dir];

      // Если оба элемента имеют разные id (не сцеплены) - соединить с анимацией
      if (anotherElem.id !== elem.id) {

        // Исходные координаты относительно вьюпорта
        let initCoord = anotherElem.getBoundingClientRect();
  
        // выдернуть на уровень document в то-же место, сделать плавную анимацию
        anotherElem.style.position = 'absolute';
        anotherElem.style.zIndex = 1000;
        anotherElem.style.left = initCoord.left + 'px';
        anotherElem.style.top = initCoord.top + 'px';
        anotherElem.style.transitionDuration = TRANSITION_DURATION + 's';
        document.body.append(anotherElem);
  
        // придвинуть
        switch (dir) {
          case 'left':
            anotherElem.style.top = elem.getBoundingClientRect().top + 'px';
            anotherElem.style.left = elem.getBoundingClientRect().left - elemWidth + 'px';
            break;
  
          case 'right':
            anotherElem.style.top = elem.getBoundingClientRect().top + 'px';
            anotherElem.style.left = elem.getBoundingClientRect().left + elemWidth + 'px';
            break;
  
          case 'top':
            anotherElem.style.left = elem.getBoundingClientRect().left + 'px';
            anotherElem.style.top = elem.getBoundingClientRect().top - elemHeight + 'px';
            break;
  
          case 'bottom':
            anotherElem.style.left = elem.getBoundingClientRect().left + 'px';
            anotherElem.style.top = elem.getBoundingClientRect().top + elemHeight + 'px';
            break;
        }
  
        // сбросить анимацию
        setTimeout( () => anotherElem.style.transitionDuration = '', TRANSITION_DURATION * 1000);

        // если anotherElem не имеет соседей со своим id - сдвигать только его,
        // если имеет - сдвинуть всех товарищей синхронно
        Array.from(document.querySelectorAll('.piece'))
          .filter((item) => anotherElem.id && item.id === anotherElem.id && item !== anotherElem)
          .forEach(function(item) {

            document.body.append(item);

            item.style.transitionDuration = TRANSITION_DURATION + 's';

            item.style.left = elem.getBoundingClientRect().left - ((elem.column - item.column) * elemWidth) + 'px';
            item.style.top = elem.getBoundingClientRect().top - ((elem.row - item.row) * elemHeight) + 'px';

            setTimeout( () => item.style.transitionDuration = '', TRANSITION_DURATION * 1000);
          });
      }
      
      // Поделиться id с совпавшим, и всеми, прицепленными к совпавшему
      if (anotherElem.id) {
        Array.from(document.querySelectorAll('.piece'))
        .filter((item) => item.id === anotherElem.id)
        .forEach(function(item) {
          item.id = elem.id;
        });
      };
      anotherElem.id = elem.id;
    }
  }
}

// Получить все смежные части мозайки. Возвращает массив
// объектов вида { 'direction': correct-elem },
// либо null, если подходящих не найдено.
function getAllAdjacent(elem) {
  const elems = [];

  let left = getAdjacent(elem, 'left');
  if (left) elems.push(left);

  let right = getAdjacent(elem, 'right');
  if (right) elems.push(right);

  let top = getAdjacent(elem, 'top');
  if (top) elems.push(top);

  let bottom = getAdjacent(elem, 'bottom');
  if (bottom) elems.push(bottom);

  return (elems.length > 0) ? elems : null;
}


// Поиск смежных частей мозайки для данного элемента в заданном направлении.
// Возвращает объект вида { 'direction': correct elem } или null.
function getAdjacent(elem, direction) {

  // координаты заданного элемента
  let coord = elem.getBoundingClientRect();

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
  }

  if (direction === 'top' || direction === 'bottom') {
    adjacents.push( document.elementFromPoint(x, y) );
    adjacents.push( document.elementFromPoint(x  + ((coord.right - coord.left) / 2), y)); // от центра элемента
    adjacents.push( document.elementFromPoint(coord.right, y) );
  }

  // целевой элемент
  let targetPiece = null;

  // перебрать найденные, вычислить целевой
  adjacents.forEach(function(item) {
    if (item && item.classList.contains('piece') && !targetPiece) {

      switch(direction) {
        case 'left': // условие совпадения: порядковый номер минус один + тот-же ряд элемента
          if (elem.index === item.index + 1
            && elem.row === item.row
            && Math.abs(item.getBoundingClientRect().top - coord.top) <= MERGE_SPREAD
            && Math.abs(item.getBoundingClientRect().right - coord.left) <= MERGE_SPREAD) {
              // console.log('left concurrency!');
              targetPiece = {left: item};
          }
          break;

        case 'right': // условие совпадения: порядковый номер плюс один + тот-же ряд элемента
          if (elem.index === item.index - 1
            && elem.row === item.row
            && Math.abs(item.getBoundingClientRect().top - coord.top) <= MERGE_SPREAD
            && Math.abs(item.getBoundingClientRect().left - coord.right) <= MERGE_SPREAD) {
              // console.log('right concurrency!');
              targetPiece = {right: item};
          }
          break;

        case 'top': // условие совпадения: та-же колонка + ряд меньший на один
          if (elem.column === item.column
            && elem.row === item.row + 1
            && Math.abs(item.getBoundingClientRect().left - coord.left) <= MERGE_SPREAD
            && Math.abs(item.getBoundingClientRect().bottom - coord.top) <= MERGE_SPREAD) {
              // console.log('top concurrency!');
              targetPiece = {top: item};
          }
          break;

        case 'bottom': // условие совпадения: та-же колонка + ряд больший на один
          if (elem.column === item.column
            && elem.row === item.row - 1
            && Math.abs(item.getBoundingClientRect().left - coord.left) <= MERGE_SPREAD
            && Math.abs(item.getBoundingClientRect().top - coord.bottom) <= MERGE_SPREAD) {
              // console.log('bottom concurrency!');
              targetPiece = {bottom: item};
          }
          break;
      }
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