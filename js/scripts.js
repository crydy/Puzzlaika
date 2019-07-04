'use strict'

// количество элементов
const HORISONTAL_AMOUNT = 5;
const VERTICAL_AMOUNT = 3;

// получить изображение
const imgWrapper = document.querySelector('.field__img-wrapper');
const img = document.querySelector('.field__img');

// размер исходной картинки
let fieldWidth = img.offsetWidth;
let fieldHeight = img.offsetHeight;
console.log(`Ширина исходного img: ${fieldWidth}`);
console.log(`Высота исходного img: ${fieldHeight}`);

// размеры элементов
let elemWidth = fieldWidth / HORISONTAL_AMOUNT;
let elemHeight = fieldHeight / VERTICAL_AMOUNT;
console.log(elemWidth);
console.log(elemHeight);

// конструктор элементов
function CreatePuzzElem(width, height, xShift, yShift) {
  this.width = width;
  this.height = height;
  this.left = xShift;
  this.top = yShift;
}

// накопить пакет элементов в массив,
// вписать исходное позиционирование
let pieces = [];

let amount = HORISONTAL_AMOUNT * VERTICAL_AMOUNT;
let xShift = 0;
let yShift = 0;

for (let i = 0; i < amount; i++) {
  pieces.push( new CreatePuzzElem(elemWidth, elemHeight, xShift, yShift) );
  // смена позиции для следующей части
  if (xShift < (elemWidth * (HORISONTAL_AMOUNT - 1))) {
    xShift += elemWidth;
  } else {
    yShift += elemHeight; // следующая строка
    xShift = 0; // ряд с начала
  };
}

// Фрагмент для элементов
let fragment = document.createDocumentFragment();

// Создать элементы DOM
pieces.forEach(function(item) {
  let piece = document.createElement('div');
  piece.className = 'piece';

  piece.style.width = item.width + 'px';
  piece.style.height = item.height + 'px';
  piece.style.left = item.left + 'px';
  piece.style.top = item.top + 'px';

  piece.style.backgroundPosition = `${-item.left}px ${-item.top}px`;

  // собирать во фрагмент
  fragment.append(piece);
});

// вставить фрагмент
imgWrapper.append(fragment);







// Слушать клики
document.addEventListener('mousedown', function(event) {

  // обработка левого клика по куску пазла
  if (event.target.classList.contains('piece') && event.which == 1) {
    event.preventDefault();

    let piece = event.target;

    // запомнить расстояния от краев до места клика
    let shiftX = event.clientX - piece.getBoundingClientRect().left;
    let shiftY = event.clientY - piece.getBoundingClientRect().top;
  
    piece.style.position = 'absolute';
    piece.style.zIndex = 1000;
    document.body.append(piece);

    moveAt(event.pageX, event.pageY);
  
    // moves the piece at (pageX, pageY) coordinates
    // taking initial shifts into account
    function moveAt(pageX, pageY) {
      piece.style.left = pageX - shiftX + 'px';
      piece.style.top = pageY - shiftY + 'px';
    }
  
    function onMouseMove(event) {
      moveAt(event.pageX, event.pageY);
    }
  
    // move the piece on mousemove
    document.addEventListener('mousemove', onMouseMove);
  
    // drop the piece, remove unneeded handlers
    piece.onmouseup = function() {
      document.removeEventListener('mousemove', onMouseMove);
      piece.onmouseup = null;
    };
  }



} );
document.ondragstart = function() {
  return false;
};