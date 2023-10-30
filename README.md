# UX-Tracking: Web Extension
Repositório da extensão web do framework [UX-Tracking: User eXperience Tracking](https://uxtracking.andrepereira.eng.br/)

## Tabela de conteúdos

*  [Pré Requisitos](#pré-requisitos)
*  [Topologia](#topologia)
*  [Ambiente de desenvolvimento](#ambiente-de-desenvolvimento)
*  [Utilização](#utilização)
* * [Distribuição](#distribuição)
* * [Ambiente de desenvolvimento](#ambiente-de-desenvolvimento)
*  [Extensão](#Extensão)
* * [Cliente](#cliente)
* * * [Rastreamento de mouse](#rastreamento-de-mouse)
* * * [Rastreamento ocular](#rastreamento-ocular)
* * * [Keylogging](#keylogging)
* * * [Think aloud](#Transcrição-de-voz

 ## Pré-requisitos

📃 Para o desenvolvimento do projeto contido neste repositório, estabelecem-se os seguintes requisitos:

*  [Visual Studio Code](https://code.visualstudio.com/download)
*  [Google Chrome](https://www.google.com/chrome/)


## Topologia

- [popup](https://github.com/Colab-UNIRIO-UFPA/UX-Tracking-Extension/tree/master/popup)  - `Popup exibido na extensão`
 - index.html  - `Página html do popup`
 - script.js - `Script do popup`
 - styles.css - `CSS da página do popup`
- [vendor](https://github.com/Colab-UNIRIO-UFPA/UX-Tracking-Extension/tree/master/vendor)  - `Pasta para os scripts externos utilizados na extensão`
 - browser-polyfill-0.10.0.min.js
 - jquery-3.4.1.min.js
- background.js - `Script de background da extensão`
- content.js - `Script de conteúdo da extensão`
- logo.png - `Logo da extensão`
- main.js - `Script main da extensão`
- manifest.json - `Manifesto da extensão chrome`

## Extensão
Desenvolvido como uma extensão do navegador Google Chrome utilizando Javascript, esta extensão é responsável por capturar - do lado cliente - as interações dos usuários, no papel de usuários da aplicação web, a partir das técnicas de rastreamento do mouse, do olho e do teclado, além de transcrição de fala.
#### Rastreamento de mouse
A captura de interações do mouse contempla 4 tipos de interação:
* Movimento
* Clique
* Pausa
#### Rastreamento ocular
O rastreamento ocular é realizado por meio de uma versão modificada do [WebGazer](https://github.com/brownhci/WebGazer) (Copyright © 2016-2021, Brown HCI Group).
#### Keylogging
A extensão também pode capturar entradas de teclado, registrando a digitação de caracteres.
#### Transcrição de voz
Utilizando o [WebKit Voice Recognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition), o módulo cliente é capaz de capturar voz, incluindo pausas, transcrevendo e enviando como entradas de texto.
