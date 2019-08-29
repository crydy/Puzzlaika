'use strict'

// Длительность анимации слияния (секунды)
const MERGE_TRANSITION_DURATION = .3;
// Длительность анимации поворота
const ROTATE_TRANSITION_DURATION = .15;
// Коэффициент расширения области чувствительности поиска смежных элементов (сдвиг от края)
const SEARCH_SPREAD = 20;
// Размах стыковки при совпадении (степень допустимого смещения в стороны от "оси стыковки")
const MERGE_SPREAD = 20;
// Максимальное количество деталей по короткой стороне
const MAX_SHORT_SIDE_ELEMENTS_AMOUNT = 12;

// Элементы стартового меню
const startMenu = document.querySelector('.start-menu__wrapper'),
      inputFile = startMenu.querySelector('.start-menu__inputfile'),
      inputFileLabel = startMenu.querySelector('.start-menu__inputfile-label'),
      startButton = startMenu.querySelector('.start-menu__start-button'),
      inputAmount = startMenu.querySelector('#pieces-amount'),
      startMenuCloser = startMenu.querySelector('.start-menu__closer');

// Элементы углового меню
const menu = document.querySelector('.menu'),
      menuTime = menu.querySelector('.menu__time'),
      menuPauseButton = menu.querySelector('.menu__pause-button'),
      menuRestart = menu.querySelector('.menu__restart'),
      menuReset = menu.querySelector('.menu__reset'),
      menuToggle = menu.querySelector('.menu__toggle');

const overlay = document.querySelector('.overlay');

// Данные юзерской картинки (src, width, height);
let userImageURLData;

// Количество элементов
let shortSideElementAmount,
    horizontalAmount,
    verticalAmount;

// hазмер сторон элементов
let elemSideLength;
// Cдвиги изображения для центровки
let pictureShifts;

// Подсчет времени игры
let timekeeper;

// Количество сцепленных элементов на момент последнего слияния
let linkedElems = 1;

// Состояние игры
let gameState;

// Поворачиваемые в определенный момент элементы
let rotatingElems = new Set();

// Запретить прокрутку
document.body.style.overflow = "hidden";

// Свернуть и спрятать угловое меню
menuToggleClickHandler('no-trans');
menu.hidden = true;

// ------------------- Слушать события ---------------------

// Ограничение количества деталей
inputAmount.addEventListener('input', inputAmountInputListener);

// Ожидать юзерский файл
inputFile.addEventListener('change', inputFileChangeHandler);
// Стартовать игру
startButton.addEventListener('click', startButtonClickHandler);
// Закрывашка стартового меню
startMenuCloser.addEventListener('click', startMenuCloserClickHandler);

// Сворачивать и разворачивать угловое меню
menuToggle.addEventListener('click', menuToggleClickHandler);
// Выход на стартовое меню
menuRestart.addEventListener('click', menuNewGameClickHandler);
// Раскидывать элементы заново
menuReset.addEventListener('click', menuRestartClickHandler);
// Кнопка паузы
menuPauseButton.addEventListener('click', menuPauseButtonClickHandler);

// Перетаскивание, повороты, сцепки деталей пазла
document.addEventListener('mousedown', documentMousedownHandler);
document.addEventListener('wheel', documentWheelHandler);


/* --------------------------------------------------- */
/* --------------------- ФУНКЦИИ --------------------- */
/* --------------------------------------------------- */
/* ---------------- Общего назначения ---------------- */

// Случайно целое в заданном диапазоне
function randomInteger(min, max) {
  return Math.floor( min + Math.random() * (max + 1 - min) );
}


/* --------------------- События --------------------- */

// Ограничить количество деталей
function inputAmountInputListener() {
  if (inputAmount.value >= MAX_SHORT_SIDE_ELEMENTS_AMOUNT) {
    inputAmount.value = MAX_SHORT_SIDE_ELEMENTS_AMOUNT;
  };
}

// Получить ссылку на юзерский файл
function inputFileChangeHandler() {
  // получить загруженный файл
  const file = inputFile.files[0];
  // преобразовать в ссылку
  const imageURL = URL.createObjectURL(file);

  // получить размер изображения
  getPictureData('outer', imageURL).then(
    (result) => {
      inputFileLabel.textContent = 'Your image is downloaded';
      userImageURLData = result;
    }
  );
}

// Начать игру
function startButtonClickHandler() {

  // удалить элементы раскладки предыдущей игры и сбросить тайминг
  clearField();

  gameState = 'game';

  // Отобразить угловое меню
  menu.hidden = false;
  // Спрятать стартовое меню ('hidden' не срабатывает для flexbox)
  startMenu.style.display = 'none';
  // количество элементов по короткой стороне
  shortSideElementAmount = +inputAmount.value;

  // Раскидать пазл
  if (!userImageURLData) {
    getPictureData('inner').then(layOutElements);
  } else {
    layOutElements(userImageURLData);
  };

  // Запуск минутомера
  startTimeGame();
}

// Закрывашка стартового меню
function startMenuCloserClickHandler() {

  // Отобразить угловое меню
  menu.hidden = false;
  // Спрятать стартовое меню
  startMenu.style.display = 'none'; // 'hidden' не срабатывает с flexbox
  // Убрать оверлей
  overlay.hidden = true;
  // Продолжить тайминг
  if (gameState !== 'finished') startTimeGame();
}

// Свернуть и развернуть угловое меню
function menuToggleClickHandler() {

  // расстояние до верха браузера
  const menuInnerSpread = menuToggle.closest('.menu__item').offsetTop - menu.offsetTop;

  // сворачивание без анимации без анимации
  if (arguments[0] === 'no-trans') {
    const trDur = parseFloat( getComputedStyle(menu).transitionDuration );
    menu.style.transitionDuration = '0s';
    setTimeout(() => { menu.style.transitionDuration = trDur + 's' }, trDur + 's');
  }
  
  // открывать-закрывать по клику
  if( !menu.classList.contains('menu--closed') ) {
    menu.style.top = -menuInnerSpread + 'px';
    menu.classList.add('menu--closed');
    menuToggle.textContent = 'menu';
  } else {
    menu.classList.remove('menu--closed');
    menu.style.top = 0;
    menuToggle.textContent = 'hide';
  };
}

// Новая игра
function menuNewGameClickHandler() {

  // Показать стартовое меню и кнопку закрытия
  startMenuCloser.hidden = false;
  startMenu.style.display = ''; // 'hidden' не срабатывает для flexbox
  // Заблокировать игровое поле
  overlay.hidden = false;

  // Убрать описательный текст
  let info = document.querySelector('.start-menu__info');
  if (info) info.remove();

  // Тайминг на паузу
  pauseTimeGame();
}

// Рестарт (перераскладка с тем-же изображением)
function menuRestartClickHandler() {

  pauseTimeGame();
  overlay.hidden = false;

  // Создать диалоговое окно из шаблона
  const tmpl = document.querySelector('#popup-template').content.cloneNode(true),
        popupWrapper = tmpl.querySelector('.popup__wrapper'),
        popup = tmpl.querySelector('.popup');

  // Настроить
  tmpl.querySelector('.popup__title').textContent = 'Restart';
  tmpl.querySelector('.popup__text').textContent = `Restart game with the same picture?`;
  tmpl.querySelector('.popup__button--ok').textContent = 'Restart';
  tmpl.querySelector('.popup__button--cancel').textContent = 'Cancel';

  // Отобразить окно
  document.body.append(tmpl);

  // Обработка юзерского выбора
  popup.addEventListener('click', popupClickHandler);

  function popupClickHandler(event) {
    const target = event.target;

    // вернуться к игре
    if ( target.classList.contains('popup__button') || target.classList.contains('popup__closer') ) {

      // закрыть окно
      popup.removeEventListener('click', popupClickHandler);
      popupWrapper.remove();
      overlay.hidden = true;
      if (gameState !== 'finished') startTimeGame();

      // новая раскладка
      if ( target.classList.contains('popup__button--ok') ) {

        // свернуть меню
        menuToggleClickHandler('no-trans');
        // удалить элементы
        document.querySelectorAll('.piece').forEach(item => item.remove());
        // прервать таймер
        getTimeGame();
        // раскидать заново
        startButtonClickHandler();
      }
    }
  }
}

// Кнопка паузы
function menuPauseButtonClickHandler() {

  pauseTimeGame();
  overlay.hidden = false;

  // Создать диалоговое окно из шаблона
  const tmpl = document.querySelector('#popup-template').content.cloneNode(true),
        popupWrapper = tmpl.querySelector('.popup__wrapper'),
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
    const target = event.target;
    console.log(target);

    // ... по любой из двух кнопок
    if ( target.classList.contains('popup__button--ok') || target.classList.contains('popup__closer') ) {
      popup.removeEventListener('click', popupClickHandler);
      popupWrapper.remove();
      overlay.hidden = true;
      if (gameState !== 'finished') startTimeGame();
    }
  }
}

// Перетаскивание элементов и выполнение сцепки с подходящими
function documentMousedownHandler(event) {

  // только для клика левой клавишей по детали пазла
  if (event.target.classList.contains('piece') && event.which == 1) {

    // двигаемый элемент
    const activeElem = event.target;
    // смещения от краев элемента до места клика
    const shiftX = event.clientX - activeElem.getBoundingClientRect().left;
    const shiftY = event.clientY - activeElem.getBoundingClientRect().top;

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

    // При отпускании левой клавиши
    activeElem.onmouseup = function(event) {
      if ( !(event.which === 1) ) return;

      // удалять прослушку движения и нажания
      document.removeEventListener('mousemove', mouseMoveHandler);
      activeElem.removeEventListener('mousedown', draggableElemRightClickHandler);

      // вернуть контекстное меню
      document.removeEventListener('contextmenu', preventContextMenu);

      // самоудаляться текущему обработчику события
      activeElem.onmouseup = null;

      // Получить данные о искомых деталях, присоединить, если есть совпадения
      mergePieces( activeElem, getAllAdjacent(activeElem) );

      // Сбросить прошлые подсчеты
      linkedElems = 1;

      // Если активный элемент - часть группы, запустить поиск совпадений от каждого элемента группы
      if (activeElem.id) {
        Array.from(document.querySelectorAll('.piece'))
          .filter((item) => item.id === activeElem.id && item !== activeElem)
          .forEach(function(item) {
            // подсчитывать сцепляемые
            linkedElems++;
            // выполнять сцепку
            mergePieces( item, getAllAdjacent(item) );
          });

        // Закончить игру при сцепке всех деталей
        if (linkedElems === horizontalAmount * verticalAmount &&
            activeElem.deg === 0 &&
            gameState !== 'finished') finishGame();
      };
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

// Поворот элемента или группы связанных элементов по клику
function draggableElemRightClickHandler(event, direction) {
  const elem = event.target;

  // повернуть элемент
  rotateElem(elem, direction);
  
  // повернуть все связанные элементы сразу после активного
  setTimeout(() => {

    if (elem.id) {
      const elemCoords = elem.getBoundingClientRect();

      Array.from(document.querySelectorAll('.piece'))
        .filter((item) => item.id === elem.id && item !== elem)
        .forEach(function(item) {

          // получить относительные сдвиги
          const relativeShifts = getRelativeShifts(elem, item);

          // анимировать
          item.style.transitionDuration = ROTATE_TRANSITION_DURATION + 's';

          // повернуть
          rotateElem(item, direction);

          // новое положение
          item.style.left = elemCoords.left - relativeShifts.x + 'px';
          item.style.top = elemCoords.top - relativeShifts.y + 'px';

          // снять анимацию
          setTimeout( () => item.style.transitionDuration = '', ROTATE_TRANSITION_DURATION * 1000);
        });
    }
  }, ROTATE_TRANSITION_DURATION * 1000);
}

// Поворот элемента или группы связанных элементов колесом мыши
function documentWheelHandler(event) {
  if (event.target.classList.contains('piece') && event.deltaY > 0) {
    draggableElemRightClickHandler(event);
  };
  if (event.target.classList.contains('piece') && event.deltaY < 0) {
    draggableElemRightClickHandler(event, 'reverse');
  };
}

/* ----------------- Создание пазла ------------------ */

// Получить данные о изображении
// (объект: ссылка на изображение, ширина, высота)
function getPictureData(method, source) {

  const image = document.createElement('img');

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
  const fragment = document.createDocumentFragment();

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
      const positions = [];

      let xShiftPosition = 0,
          yShiftPosition = 0;

      for (let i = 1; i <= data.elemsAmount; i++) {
        
        positions.push(
          { left: xShiftPosition, top: yShiftPosition }
        );

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
      };

      // создать элементы, добавить во фрагмент
      for (let i = 1; i <= data.elemsAmount; i++) {

        // создать элемент с классами
        const piece = document.createElement('div');
        piece.className = `piece piece-${i} row-${row} column-${column}`;

        // мета
        piece.index = i;
        piece.row = row;
        piece.column = column;

        // размер
        piece.style.width = data.elemSideLength + 'px';
        piece.style.height = data.elemSideLength + 'px';

        // рандомоное целое в пределах размера массива
        const random = randomInteger(0, positions.length - 1);
        // позиция по заданному значению
        const randomPosition = positions[ random ];
        
        // произвольная позиция элемента
        piece.style.left = (data.clientSize.width - data.image.width) / 2 + randomPosition.left + 'px';
        piece.style.top = (data.clientSize.height - data.image.height) / 2 + randomPosition.top + 'px';

        // не переиспользовать данную позицию
        positions.splice(random, 1);

        // фон и положение фона
        piece.style.backgroundImage = `url(${data.image.src})`;
        piece.style.backgroundPosition = `${-xShift - data.pictureShifts.x}px ${-yShift - data.pictureShifts.y}px`;

        // произвольный угол поворота
        const randomDeg = randomInteger(0, 3) * 90;
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
  };
}

// Разложить пазл на document
function layOutElements(image) {

  // размеры вьюпорта
  const clientSize = {
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
    const piecesStyle = document.createElement('style');
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
    const piecesStyle = document.createElement('style');
    piecesStyle.innerHTML = `.piece {background-size: ${image.width}px auto;}`;
    document.querySelector('head').append(piecesStyle);
  }

  // выбор количества делатей по короткой ширине,
  // все детали - квадратные, по длинной стороне остаток картинки урезается
  if (image.width < image.height) { // для вертикальной картинки

    horizontalAmount = shortSideElementAmount;
    // размер куска
    elemSideLength = image.width / shortSideElementAmount;
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

    verticalAmount = shortSideElementAmount;
    // размер куска
    elemSideLength = image.height / shortSideElementAmount;
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
function rotateElem(elem, direction) {

  // если элемент еще не в режиме поворота...
  if ( !rotatingElems.has(elem) ) {

    // добавить в набор поворачиваемых
    rotatingElems.add(elem);

    // анимировать поворот
    elem.style.transitionDuration = ROTATE_TRANSITION_DURATION + 's';
  
    // повернуть и запомнить угол
    switch (direction) {
      case 'reverse':

        elem.deg -= 90;
        elem.style.transform = `rotate(${elem.deg}deg)`;
        break;
  
      default:
        elem.deg = (elem.deg) ? elem.deg + 90 : 90;
        elem.style.transform = `rotate(${elem.deg}deg)`;

    }
  
    // ... сразу после окончания анимации
    setTimeout(() => {
      
      // сброс анимации
      elem.style.transitionDuration = '';
  
      // при нулевом угле обнулить "transform"
      if (elem.deg >= 360 || elem.deg <= -360) {
        elem.style.transform = '';
        elem.deg = 0;
      };

      // убрать элемент из списка анимируемых
      rotatingElems.delete(elem);
  
    }, ROTATE_TRANSITION_DURATION * 1000);
  };
}

// получить смещения позиции целевого элемента
// относительно активного (возвращает объект с ключами x, y)
function getRelativeShifts(activeElem, targetElem) {

  let shiftX, shiftY;

  // сдвиги при натуральной раскладке
  const natureX = ((activeElem.column - targetElem.column) * elemSideLength),
        natureY = ((activeElem.row - targetElem.row) * elemSideLength);

  // сдвиги при поворотах
  if (!activeElem.deg || activeElem.deg === 360 || activeElem.deg === -360) {
    shiftX = natureX;
    shiftY = natureY;
  } else if (activeElem.deg === 90 || activeElem.deg === -270) {
    shiftX = -natureY;
    shiftY = natureX;
  } else if (activeElem.deg === 180 || activeElem.deg === -180) {
    shiftX = -natureX;
    shiftY = -natureY;
  } else if (activeElem.deg === 270 || activeElem.deg === -90) {
    shiftX = natureY;
    shiftY = -natureX;
  };

  return { x: shiftX, y: shiftY };
}

// Получить подходящие смежные детали мозайки.
// Возвращается массив деталей или null.
function getAllAdjacent(activeElem) {

  // массив для найденных
  const targetElems = [];

  // координаты активного элемента
  const coord = activeElem.getBoundingClientRect();

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
    return ( activeElem.deg === item.deg || (Math.abs(activeElem.deg) + Math.abs(item.deg)) === 360) &&
           ((activeElem.index === item.index + 1 && activeElem.row === item.row && (item.deg === 0 || item.deg === -360)) ||
            (activeElem.row === item.row - 1 && activeElem.column === item.column && (item.deg === 90 || item.deg === -270)) ||
            (activeElem.index === item.index - 1 && activeElem.row === item.row && (item.deg === 180 || item.deg === -180)) ||
            (activeElem.row === item.row + 1 && activeElem.column === item.column && (item.deg === 270 || item.deg === -90))) &&
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
    return ( activeElem.deg === item.deg || (Math.abs(activeElem.deg) + Math.abs(item.deg)) === 360) &&
           ((activeElem.index === item.index - 1 && activeElem.row === item.row && (item.deg === 0 || item.deg === -360)) ||
            (activeElem.row === item.row + 1 && activeElem.column === item.column && (item.deg === 90 || item.deg === -270)) ||
            (activeElem.index === item.index + 1 && activeElem.row === item.row && (item.deg === 180 || item.deg === -180)) ||
            (activeElem.row === item.row - 1 && activeElem.column === item.column && (item.deg === 270 || item.deg === -90))) &&
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
    return ( activeElem.deg === item.deg || (Math.abs(activeElem.deg) + Math.abs(item.deg)) === 360) &&
           ((activeElem.row === item.row + 1 && activeElem.column === item.column && (item.deg === 0 || item.deg === -360)) ||
            (activeElem.index === item.index + 1 && activeElem.row === item.row && (item.deg === 90 || item.deg === -270)) ||
            (activeElem.row === item.row - 1 && activeElem.column === item.column && (item.deg === 180 || item.deg === -180)) ||
            (activeElem.index === item.index - 1 && activeElem.row === item.row && (item.deg === 270 || item.deg === -90))) &&
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
    return ( activeElem.deg === item.deg || (Math.abs(activeElem.deg) + Math.abs(item.deg)) === 360) &&
           ((activeElem.row === item.row - 1 && activeElem.column === item.column && (item.deg === 0 || item.deg === -360)) ||
            (activeElem.index === item.index - 1 && activeElem.row === item.row && (item.deg === 90 || item.deg === -270)) ||
            (activeElem.row === item.row + 1 && activeElem.column === item.column && (item.deg === 180 || item.deg === -180)) ||
            (activeElem.index === item.index + 1 && activeElem.row === item.row && (item.deg === 270 || item.deg === -90))) &&
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
  const initCoord = attachableElem.getBoundingClientRect();
  attachableElem.style.position = 'absolute';
  attachableElem.style.zIndex = 1000;
  attachableElem.style.left = initCoord.left + 'px';
  attachableElem.style.top = initCoord.top + 'px';
  attachableElem.style.transitionDuration = MERGE_TRANSITION_DURATION + 's';
  document.body.append(attachableElem);

  // сдвинуть в соответствие с дОлжной позицией относительно активного
  const relativeShifts = getRelativeShifts(activeElem, attachableElem);
  attachableElem.style.left = activeElem.getBoundingClientRect().left - relativeShifts.x + 'px';
  attachableElem.style.top = activeElem.getBoundingClientRect().top - relativeShifts.y + 'px';

  // сбросить анимацию
  setTimeout( () => attachableElem.style.transitionDuration = '', MERGE_TRANSITION_DURATION * 1000);
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

// Очистить поле, сброчить тайминг
function clearField() {

  if (document.querySelector('.piece')) {
    document.querySelectorAll('.piece').forEach(item => item.remove());
    getTimeGame();
    overlay.hidden = true;
    menuToggleClickHandler('no-trans');
  }
}

// Закончить игру
function finishGame() {

  // дождаться окончания анимации 
  setTimeout(() => {

    overlay.hidden = false;
    gameState = 'finished';

    // Создать диалоговое окно из шаблона
    const tmpl = document.querySelector('#popup-template').content.cloneNode(true),
          popupWrapper = tmpl.querySelector('.popup__wrapper'),
          popup = tmpl.querySelector('.popup');

    // Настроить
    popup.style.paddingLeft = '40px';
    popup.style.paddingRight = '40px';

    tmpl.querySelector('.popup__button--cancel').remove();

    tmpl.querySelector('.popup__title').textContent = 'Congratulations!';
    tmpl.querySelector('.popup__text').textContent = `Your time in the game: ${getTimeGame()}`;
    tmpl.querySelector('.popup__button--ok').textContent = 'Start menu';

    // Отобразить окно
    document.body.append(tmpl);

    // Закрывашка окна
    popup.addEventListener('click', popupClickHandler);

    function popupClickHandler(event) {
      const target = event.target;

      if ( target.classList.contains('popup__button--ok') ) {
        popup.removeEventListener('click', popupClickHandler);
        popupWrapper.remove();
        // Отобразить стартовое окно
        menuNewGameClickHandler();
      } else if ( target.classList.contains('popup__closer') ) {
        popup.removeEventListener('click', popupClickHandler);
        popupWrapper.remove();
        overlay.hidden = true;
      }
    }

  }, MERGE_TRANSITION_DURATION * 1000);
}


/* --------------------- Тайминг --------------------- */

// Засечь время игры
function startTimeGame() {

  let startTime = Date.now();

  // если были на паузе
  if (timekeeper === 'paused') {

    // получить количество миллисекунд в игре
    let ms = parseInt( menuTime.textContent.slice(3) * 1000 ) +
             parseInt( menuTime.textContent.slice(0, 2) * 60000 );

    // скорректировать точку отсчета
    startTime -= ms;
  }

  // обновлять ежесекундно
  timekeeper = setInterval(() => {

    // разница между текущим и стартовым временем
    const timeFromStart = Math.floor( (Date.now() - startTime) / 1000);

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

// Остановить тайминг, получить время игры
function getTimeGame() {
  clearInterval(timekeeper);
  timekeeper = null;
  return menuTime.textContent;
}