const grid = document.querySelector('.grid');
const spanPlayer = document.querySelector('.player');
const timer = document.querySelector('.timer');

const characters = [
  '1',
  '2',
  '2',
  '4',
  '5',
  '6',

];

const createElement = (tag, className) => {
  const element = document.createElement(tag);
  element.className = className;
  return element;
}

let firstCard = '';
let secondCard = '';

const checkEndGame = () => {
  const disabledCards = document.querySelectorAll('.disabled-card');

  if (disabledCards.length === 20) {
    clearInterval(this.loop);
    alert(`Parabéns, ${spanPlayer.innerHTML}! Seu tempo foi de: ${timer.innerHTML}`);
  }
}

const checkCards = () => {
  const firstCharacter = firstCard.getAttribute('data-character');
  const secondCharacter = secondCard.getAttribute('data-character');

  if (firstCharacter === secondCharacter) {

    firstCard.firstChild.classList.add('disabled-card');
    secondCard.firstChild.classList.add('disabled-card');

    firstCard = '';
    secondCard = '';

    checkEndGame();

  } else {
    setTimeout(() => {

      firstCard.classList.remove('reveal-card');
      secondCard.classList.remove('reveal-card');

      firstCard = '';
      secondCard = '';

    }, 500);
  }

}

//  Codigo que de erro de duplo clique

// const revealCard = ({ target }) => {

//   if (target.parentNode.className.includes('reveal-card')) {
//     return;
//   }

//   if (firstCard === '') {

//     target.parentNode.classList.add('reveal-card');
//     firstCard = target.parentNode;

//   } else if (secondCard === '') {

//     target.parentNode.classList.add('reveal-card');
//     secondCard = target.parentNode;

//     checkCards();

//   }
// }

const revealCard = ({ target }) => {
  // Acha o elemento .card mais próximo, não importa se clicou na frente ou no verso
  const card = target.closest('.card'); 

  // Se não achou a carta, ou se ela já está virada, ou se já temos duas cartas selecionadas, não faz nada
  if (!card || card.classList.contains('reveal-card') || secondCard !== '') {
    return;
  }

  if (firstCard === '') {
    card.classList.add('reveal-card');
    firstCard = card;
  } else if (secondCard === '') {
    card.classList.add('reveal-card');
    secondCard = card;

    checkCards();
  }
}

const createCard = (character) => {

  const card = createElement('div', 'card');
  const front = createElement('div', 'face front');
  const back = createElement('div', 'face back');

  front.style.backgroundImage = `url('../images/${character}.jpg')`;

  card.appendChild(front);
  card.appendChild(back);

  card.addEventListener('click', revealCard);
  card.setAttribute('data-character', character)

  return card;
}

const loadGame = () => {
  const duplicateCharacters = [...characters, ...characters];

  const shuffledArray = duplicateCharacters.sort(() => Math.random() - 0.5);

  shuffledArray.forEach((character) => {
    const card = createCard(character);
    grid.appendChild(card);
  });
}

const startTimer = () => {

  this.loop = setInterval(() => {
    const currentTime = +timer.innerHTML;
    timer.innerHTML = currentTime + 1;
  }, 1000);

}

window.onload = () => {
  spanPlayer.innerHTML = localStorage.getItem('player');
  startTimer();
  loadGame();
}