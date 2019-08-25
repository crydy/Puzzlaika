'use strict'

// Длительность анимации слияния (секунды)
const TRANSITION_DURATION = .3;
// Коэффициент расширения области чувствительности поиска смежных элементов (сдвиг от края)
const SEARCH_SPREAD = 20;
// Размах стыковки при совпадении (степень допустимого смещения в стороны от "оси стыковки")
const MERGE_SPREAD = 20;

// Элементы стартового меню
const startMenu = document.querySelector('.start-menu'),
      inputFile = startMenu.querySelector('.start-menu__inputfile'),
      label = startMenu.querySelector('.start-menu__inputfile-label'),
      startButton = startMenu.querySelector('.start-menu__start-button'),
      inputAmount = startMenu.querySelector('#pieces-amount'),
      startMenuCloser = startMenu.querySelector('.start-menu__closer');

// Элементы углового меню
const menu = document.querySelector('.menu'),
      menuTime = menu.querySelector('.menu__time'),
      menuPauseButton = menu.querySelector('.menu__pause-button'),
      menuRestart = menu.querySelector('.menu__restart'),
      menuReset = menu.querySelector('.menu__reset'),
      menuToggle = menu.querySelector('.menu__toggle'),
      toggle = menu.querySelector('.menu__toggle');

const overlay = document.querySelector('.overlay');

// Путь к юзерской картинке
let userImageURL;

// Количество элементов
let elementCount,
    horizontalAmount,
    verticalAmount;

// размер сторон элементов
let elemSideLength;
// сдвиги изображения для центровки
let pictureShifts;

// id для подсчета времени игры
let timekeeper;

// Запретить прокрутку
document.body.style.overflow = "hidden";

// Свернуть и спрятать угловое меню
menuToggleClickHandler('no-trans');
menu.hidden = true;

// ------------------- Слушать события ---------------------

// Ожидать юзерский файл
inputFile.addEventListener('change', inputFileChangeHandler);
// Стартовать игру по клику на startButton
startButton.addEventListener('click', startButtonClickHandler);
// Сворачивать и разворачивать угловое меню
menuToggle.addEventListener('click', menuToggleClickHandler);
// Выход на стартовое меню
menuRestart.addEventListener('click', menuRestartClickHandler);
// Раскидывать элементы заново
menuReset.addEventListener('click', menuResetClickHandler);
// Перетаскивание, повороты, сцепки деталей пазла
document.addEventListener('mousedown', documentMousedownHandler);
// Закрывашка стартового меню
startMenuCloser.addEventListener('click', startMenuCloserClickHandler);
// Кнопка паузы
menuPauseButton.addEventListener('click', menuPauseButtonClickHandler);



/* --------------------------------------------------- */
/* --------------------- ФУНКЦИИ --------------------- */
/* --------------------------------------------------- */
/* ---------------- Общего назначения ---------------- */

// Случайно целое в заданном диапазоне
function randomInteger(min, max) {
  let rand = min + Math.random() * (max + 1 - min);
  return Math.floor(rand);
}


/* --------------- Обработчики событий --------------- */

// Получить ссылку на юзерский файл
function inputFileChangeHandler() {
  // получить загруженный файл
  let file = inputFile.files[0];
  // преобразовать в ссылку
  let imageURL = URL.createObjectURL(file);

  // получить размер изображения
  getPictureData('outer', imageURL).then(
    (result) => {
      label.textContent = 'Your image is downloaded';
      userImageURL = result;
    }
  );
}

// Начать игру
function startButtonClickHandler() {

  // удалить элементы раскладки предыдущей игры и сбросить тайминг
  if (document.querySelector('.piece')) {
    document.querySelectorAll('.piece').forEach(item => item.remove());
    getTimeGame();
    overlay.hidden = true;
    menuToggleClickHandler('no-trans');
  }

  // Отобразить угловое меню
  menu.hidden = false;
  // Спрятать стартовое меню
  startMenu.hidden = true;
  // количество элементов по короткой стороне
  elementCount = +inputAmount.value;

  // Раскидать пазл
  if (!userImageURL) {
    getPictureData('inner').then(layOutElements);
  } else {
    layOutElements(userImageURL);
  };

  // Запуск минутомера
  startTimeGame();
}

// Свернуть и развернуть меню
function menuToggleClickHandler() {

  // расстояние до верха браузера
  let menuInnerSpread = toggle.closest('.menu__item').offsetTop - menu.offsetTop;

  // скрыть без анимации
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

// Кнопка паузы
function menuPauseButtonClickHandler() {
  pauseTimeGame();
  overlay.hidden = false;

  // Создать диалоговое окно из шаблона
  let tmpl = document.querySelector('#popup-template').content.cloneNode(true);

  let popupWrapper = tmpl.querySelector('.popup__wrapper'),
      popup = tmpl.querySelector('.popup');

  // Настроить
  tmpl.querySelector('.popup__button--cancel').remove();

  tmpl.querySelector('.popup__title').textContent = '... Pause ...';
  tmpl.querySelector('.popup__text').textContent = `Your time in the game: ${menuTime.textContent}`;
  tmpl.querySelector('.popup__button--ok').textContent = 'Back to the game!';

  // Отобразить окно
  document.body.append(tmpl);

  // возвращение к игре
  popup.addEventListener('click', popupClickHandler);

  // Закрвашка окна
  function popupClickHandler(event) {
    let target = event.target;
    console.log(target);

    // ... по любой из двух кнопок
    if ( target.classList.contains('popup__button--ok') || target.classList.contains('popup__closer') ) {
      popup.removeEventListener('click', popupClickHandler);
      popupWrapper.remove();
      overlay.hidden = true;
      startTimeGame();
    }
  } 
}

// Отобразить стартовое меню по вызову
function menuRestartClickHandler() {

    // Показать стартовое меню и кнопку закрытия
    startMenuCloser.hidden = false;
    startMenu.hidden = false;
    // Заблокировать игровое поле
    overlay.hidden = false;

    // Убрать описательный текст
    let info = document.querySelector('.start-menu__info');
    if (info) info.remove();

    // Тайминг на паузу
    pauseTimeGame();
}

// Закрывашка стартового меню
function startMenuCloserClickHandler() {

  // Отобразить угловое меню
  menu.hidden = false;
  // Спрятать стартовое меню
  startMenu.hidden = true;
  // Убрать оверлей
  overlay.hidden = true;
  // Продолжить тайминг
  startTimeGame();
}

// Перераскладка деталей
function menuResetClickHandler() {

  // удалить элементы
  document.querySelectorAll('.piece').forEach(item => item.remove());

  // прервать таймер
  getTimeGame();

  // раскидать заново
  startButtonClickHandler();
}

// Перетаскивание деталей
function documentMousedownHandler(event) {

  // обработать клик левой клавишей по детали пазла
  if (event.target.classList.contains('piece') && event.which == 1) {

    // двигаемый элемент
    let activeElem = event.target;
    // смещения от краев элемента до места клика
    let shiftX = event.clientX - activeElem.getBoundingClientRect().left;
    let shiftY = event.clientY - activeElem.getBoundingClientRect().top;

    // отменить дефолтную обработку перетаскивания
    activeElem.ondragstart = function() {
      return false;
    };

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
    activeElem.addEventListener('mousedown', draggableElemRightClickHandler);
    document.addEventListener('contextmenu', preventContextMenu);

    // При отпускании клавиши...
    activeElem.onmouseup = function(event) {

      // правая клавиша обрабатывает вращение элемента
      if (event.which === 3) return;

      // удалять прослушку движения и нажания
      document.removeEventListener('mousemove', mouseMoveHandler);
      activeElem.removeEventListener('mousedown', draggableElemRightClickHandler);

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
}

// поворот элемента или группы связанных элементов
function draggableElemRightClickHandler(event) {

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


/* ----------------- Создание пазла ------------------ */

// Получить данные о изображении
// (объект: ссылка на изображение, ширина, высота)
function getPictureData(method, source) {

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

// Создать фрагмент с элементами мозаики
function createElementsFragment(data) {

  // Фрагмент для накопления
  let fragment = document.createDocumentFragment();

  // хранение сдвигов
  let xShift = 0;
  let yShift = 0;

  // хранение строк и рядов
  let row = 1;
  let column = 1;

  // Тип раскладки
  switch(data.apportionmentType) {

    // Расположение в соответствии с исходной картинкой
    case 'direct':

      // конструирование элеменов
      for (let i = 1; i <= data.elemsAmount; i++) {

        // создать элемент с классами
        let piece = document.createElement('div');
        piece.className = `piece piece-${i} row-${row} column-${column}`;

        // мета
        piece.index = i;
        piece.row = row;
        piece.column = column;

        // размер
        piece.style.width = data.elemSideLength + 'px';
        piece.style.height = data.elemSideLength + 'px';

        // расположение
        piece.style.left = (data.clientSize.width - data.image.width) / 2 + xShift + 'px';
        piece.style.top = (data.clientSize.height - data.image.height) / 2 + yShift + 'px';

        // фон и положение фона
        piece.style.backgroundImage = `url(${date.image.src})`;
        piece.style.backgroundPosition = `${-xShift - data.pictureShifts.x}px ${-yShift - data.pictureShifts.y}px`;

        // угол поворота
        piece.deg = 0;
        piece.style.transform = `rotate(${0}deg)`;

        // вставить во фрагмент
        fragment.append(piece);

        // смена позиции для следующего элемента
        if ( !Number.isInteger( (i) / data.horizontalAmount ) ) { // если деталь должна остаться в том-же ряду
          column++; // следующая колонка
          xShift += data.elemSideLength; // левый край следующего элемента к правому предыдущего
        } else { // при переходе на следующий ряд
          row++; // следующий ряд
          column = 1; // отсчет колонок с начала
          yShift += data.elemSideLength; // следующая строка
          xShift = 0; // ... и ряд с начала
        };
      };

      return fragment;

    // рандомное расположение деталей
    case 'random':

      // накопить массив возможных позиций элементов
      let xShiftPosition = 0;
      let yShiftPosition = 0;
      let positions = [];

      for (let i = 1; i <= data.elemsAmount; i++) {
        
        positions.push(
          { left: xShiftPosition, top: yShiftPosition }
        )

        // смена позиции
        if ( !Number.isInteger( (i) / data.horizontalAmount ) ) { // если деталь должна остаться в том-же ряду
          column++; // следующая колонка
          xShiftPosition += data.elemSideLength; // левый край следующего элемента к правому предыдущего
        } else { // при переходе на следующий ряд
          row++; // следующий ряд
          column = 1; // отсчет колонок с начала
          yShiftPosition += data.elemSideLength; // следующая строка
          xShiftPosition = 0; // ... и ряд с начала
        };
      }

      // создать элементы, добавить во фрагмент
      for (let i = 1; i <= data.elemsAmount; i++) {

        // создать элемент с классами
        let piece = document.createElement('div');
        piece.className = `piece piece-${i} row-${row} column-${column}`;

        // мета
        piece.index = i;
        piece.row = row;
        piece.column = column;

        // размер
        piece.style.width = data.elemSideLength + 'px';
        piece.style.height = data.elemSideLength + 'px';

        // рандомоное целое в пределах размера массива
        let random = randomInteger(0, positions.length - 1);
        // позиция по заданному значению
        let randomPosition = positions[ random ];
        
        // произвольная позиция элемента
        piece.style.left = (data.clientSize.width - data.image.width) / 2 + randomPosition.left + 'px';
        piece.style.top = (data.clientSize.height - data.image.height) / 2 + randomPosition.top + 'px';

        // не переиспользовать данную позицию
        positions.splice(random, 1);

        // фон и положение фона
        piece.style.backgroundImage = `url(${data.image.src})`;
        piece.style.backgroundPosition = `${-xShift - data.pictureShifts.x}px ${-yShift - data.pictureShifts.y}px`;

        // произвольный угол поворота
        let randomDeg = randomInteger(0, 3) * 90;
        piece.deg = randomDeg;
        piece.style.transform = `rotate(${randomDeg}deg)`;

        // вставить во фрагмент
        fragment.append(piece);

        // смена позиции для следующего элемента
        if ( !Number.isInteger( (i) / horizontalAmount ) ) { // если деталь должна остаться в том-же ряду
          column++; // следующая колонка
          xShift += data.elemSideLength; // левый край следующего элемента к правому предыдущего
        } else { // при переходе на следующий ряд
          row++; // следующий ряд
          column = 1; // отсчет колонок с начала
          yShift += data.elemSideLength; // следующая строка
          xShift = 0; // ... и ряд с начала
        };
      };

      return fragment;
  }
}

// Разложить пазл
function layOutElements(image) {

  // размеры вьюпорта
  let clientSize = {
    width: document.documentElement.clientWidth,
    height: document.documentElement.clientHeight
  };

  // Вписать во вьюпорт по высоте
  if (clientSize.height < image.height) {

    // коэффициент уменьшения
    let yRatio = clientSize.height / image.height;

    // подогнать высоту под вьюпорт
    image.height = clientSize.height;

    // пропорционально подогнать ширину
    image.width = image.width * yRatio;

    // пропорционально скорректировать фон деталей
    let piecesStyle = document.createElement('style');
    piecesStyle.innerHTML = `.piece {background-size: auto ${image.height}px;}`;
    document.querySelector('head').append(piecesStyle);
  }

  // Вписать во вьюпорт по ширине
  if (clientSize.width < image.width) {

    // коэффициент уменьшения
    let xRatio = clientSize.width / image.width;

    // подогнать ширину под вьюпорт
    image.width = clientSize.width;

    // пропорционально подогнать высоту
    image.height = image.height * xRatio;

    // пропорционально скорректировать фон деталей
    let piecesStyle = document.createElement('style');
    piecesStyle.innerHTML = `.piece {background-size: ${image.width}px auto;}`;
    document.querySelector('head').append(piecesStyle);
  }

  // выбор количества делатей по короткой ширине,
  // все детали - квадратные, по длинной стороне остаток картинки урезается
  if (image.width < image.height) { // для вертикальной картинки

    horizontalAmount = elementCount;
    // размер куска
    elemSideLength = image.width / elementCount;
    // количество вмещаемых элементов по высоте
    verticalAmount = Math.trunc(image.height / elemSideLength);
    // Требуемая высота
    const targetHeight = elemSideLength * verticalAmount;

    // Боковой сдвиг для центрирования картинки в раскладке
    pictureShifts = {
      x: 0,
      y: (image.height - targetHeight) / 2
    };

    // запомнить подрезанный размер
    image.height = targetHeight;

  } else { // для горизонтальной картинки

    verticalAmount = elementCount;
    // размер куска
    elemSideLength = image.height / elementCount;
    // количество вмещаемых элементов по ширине
    horizontalAmount = Math.trunc(image.width / elemSideLength);
    // Требуемая ширина
    const targetWidth = elemSideLength * horizontalAmount;

    // Боковой сдвиг для центрирования картинки в раскладке
    pictureShifts = {
      x: (image.width - targetWidth) / 2,
      y: 0
    };

    // запомнить подрезанный размер
    image.width = targetWidth;

  };

  // общее количество элементов
  const elemsAmount = horizontalAmount * verticalAmount;

  // Создать элементы мозаики, вставить в документ
  document.body.append(
    createElementsFragment({
      apportionmentType: 'random',
      image,
      clientSize,
      pictureShifts,
      elemsAmount,
      horizontalAmount,
      verticalAmount,
      elemSideLength
    })
  );
}


/* ----------------- Игровой процесс ----------------- */

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

// получить смещения позиции целевого элемента
// относительно активного (возвращает объект с ключами x, y)
function getRelativeShifts(activeElem, targetElem) {

  let shiftX, shiftY;

  // сдвиги при натуральной раскладке
  let natureX = ((activeElem.column - targetElem.column) * elemSideLength);
  let natureY = ((activeElem.row - targetElem.row) * elemSideLength);

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
    document.elementFromPoint(x, y + (elemSideLength / 2)),
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
    document.elementFromPoint(x, y + (elemSideLength / 2)),
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
    document.elementFromPoint(x  + (elemSideLength / 2), y),
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
    document.elementFromPoint(x  + (elemSideLength / 2), y),
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

// Плавный сдвиг прикрепляемого элемента к активному
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

// Присоединение группы элементов (рабочий элемент, массив элементов для присоединения).
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


/* --------------------- Тайминг --------------------- */

// Засечь время игры
function startTimeGame() {

  let startTime = Date.now();

  // если были на паузе
  if (timekeeper === 'paused') {
    console.log('after pause');

    // получить количество миллисекунд в игре
    let ms = parseInt( menuTime.textContent.slice(3) * 1000 ) +
             parseInt( menuTime.textContent.slice(0, 2) * 60000 );

    // скорректировать точку отсчета
    startTime -= ms;
  }

  // обновлять ежесекундно
  timekeeper = setInterval(() => {

    // разница между текущим и стартовым временем
    let timeFromStart = Math.floor( (Date.now() - startTime) / 1000);

    let s = timeFromStart % 60;
    let m = Math.floor(timeFromStart / 60);
    
    if (m < 10) m = '0' + m;
    if (s < 10) s = '0' + s;

    // выводить в меню
    menuTime.textContent = `${m}:${s}`;

  }, 1000);
}

// Приостановка времени
function pauseTimeGame() {
  clearInterval(timekeeper);
  timekeeper = 'paused';
}

// остановить тайминг, получить время игры
function getTimeGame() {
  clearInterval(timekeeper);
  timekeeper = null;
  return menuTime.textContent;
}