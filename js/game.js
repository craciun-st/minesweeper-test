const game = {
    flagImageURLstring: "url('/img/flag.png')",
    mineImageURLstring: "url('/img/mine.png')",
    maxRows: 0, //changed by drawBoard
    maxCols: 0, //changed by drawBoard
    totalMines: 0, //changed by drawBoard
    numberColors: [
        "", 
        "blue", 
        "green", 
        "red", 
        "purple", 
        "maroon", 
        "turquoise", 
        "black",
        "gray"],       
    init: function () {        
        let gameField = document.querySelector(".game-field");
        let mineLeftCounter = document.querySelector("#mine-left-counter");
        this.drawBoard(gameField);                
        let canClickBoard = true;
        gameField.addEventListener('mouseup', event => {
            // should check that event is what we want, but I do not think it's necessary
            if (typeof(event) === 'object' && event.bubbles) {
                if (canClickBoard) {
                    let targetCell = event.target;  // this selects the actual cell (inside a row, which is
                    //                              // also inside gameField, hence why we need bubbling)
                    switch (event.button) {
                        case 0:     // case 1 is the middle mouse button
                            gameState = this.openCell(targetCell);
                            gameState = this.updateWithWonState(gameState, gameField);
                            switch (gameState) {
                                case 0:     // can continue game
                                    if (targetCell.className.includes("open")) {
                                        this.displayNeighborMines(targetCell, gameField);
                                    }
                                    break;
                                case -1:    // Game Over (Loss)
                                    this.showUnopenedMines(gameField);
                                    window.alert("Sorry, you've triggered a mine and lost!");                                    
                                    canClickBoard = false;
                                    break;
                                case 1:     // Game Won
                                    window.alert("Congratulations, you've cleared the area of mines!");
                                    canClickBoard = false;
                                    break;
                            }       
                            break;
                        case 2:                        
                            this.flagCell(targetCell, someInt => this.updateCounter(mineLeftCounter, someInt));
                            break;
                    }
                }
            }
        })       
    },

    drawBoard: function (gameField) {
        const queryString = window.location.search;     // Location property of an object represents the URL
        // attached to it! In HTML, this is the href property (of a button, of an anchor etc.). For the 'window'
        // (i.e. the browser tab) this represents the URL in the address field. This property can be set!!!
        // In the browser, this allows you to navigate to another page
        // The .search property of the .location returns the leading '?' part of the URL (e.g. "?p1=value&p2=v2")

        const urlParams = new URLSearchParams(queryString);  // can parse this string now as below with .get('key')
        const rows = parseInt(urlParams.get('rows'));
        const cols = parseInt(urlParams.get('cols'));
        const mineCount = parseInt(urlParams.get('mines'));
        const minePlaces = this.getRandomMineIndexes(mineCount, cols, rows); // 'this.', since function is not 
        //                                                                   // yet defined

        
        this.setGameFieldSize(gameField, rows, cols);
        let cellIndex = 0
        for (let row = 0; row < rows; row++) {
            const rowElement = this.addRow(gameField);
            for (let col = 0; col < cols; col++) {
                this.addCell(rowElement, row, col, minePlaces.has(cellIndex));
                cellIndex++;    // note that with this code, cellIndex goes through all possible values from
                //              // 0 to (rows*cols)-1 (which is cellCount - 1 in getRandomMineIndexes)
                //              // so minePlaces.has(cellIndex) makes sense, since minePlaces is a Set
                //              // which has elements from that same range of integers
            }
        }
        this.maxRows = rows;
        this.maxCols = cols;
        this.totalMines = mineCount;
        this.updateCounter(document.querySelector("#mine-left-counter"), this.totalMines)
    },
    getRandomMineIndexes: function (mineCount, cols, rows) {
        const cellCount = cols * rows;  // cols and rows are local variables here!!
        let mines = new Set();
        do {
            mines.add(Math.round(Math.random() * (cellCount - 1)));     // since mines is a Set, we can add
            //                                                          // duplicates without worry
        } while (mines.size < mineCount && mines.size < cellCount);     /* we effectively truncate mineCount to
                                                                    min(mineCount, cellCount) here, as the user
                                                                    can be evil and supply mineCount > rows*cols */
        return mines;
    },
    setGameFieldSize: function (gameField, rows, cols) {
        gameField.style.width = (gameField.dataset.cellWidth * rows) + 'px';
        /* From MDN web-docs:
        The .dataset is a read-only property of HTMLOrForeignElement (foreign, as in SVG or MathMLE)
        In JavaScript, the property name of a custom data attribute is the same as the HTML attribute without 
        the 'data-' prefix, and removes single dashes (-) for when to capitalize the property’s “camelCased” name.

        So 'gameField.dataset.cellWidth' corresponds to 'data-cell-width' of 'class=game-field' inside game.html */
        gameField.style.height = (gameField.dataset.cellHeight * cols) + 'px';
    },
    addRow: function (gameField) {
        gameField.insertAdjacentHTML(
            'beforeend',
            '<div class="row"></div>'
        );
        /* .insertAdjacentHTML(position, text) parses 'text' as XML/HTML and inserts the resulting DOM nodes 
        (e.g. new paragraphs, new images) at 'position', where 'position' is relative to the DOM node that calls
        insertAdjacentHTML (referred to below as the "element"). There are 4 positions:
            - 'beforebegin' -> immediately before the element in the DOM tree (new nodes are of the same rank
                               as element in the tree, but will be reached first when parsing the tree)
            - 'afterbegin'  -> just inside the element, before its first child (effectively making the new nodes
                               the first children of the element)
            - 'beforeend'   -> still inside the element, after its last child (making the new nodes the final
                               children)
            - 'afterend'    -> immediately after the element in the DOM tree (new nodes are again of the same rank
                               as the element, but now element will be reached first when parsing the tree)

        So, this creates a div container of class .row as the final child of the <div class="game-field"> element */

        return gameField.lastElementChild;  // returns said div container (the last child of the gameField element) 
        //                                  // as a DOM node/element in its own rights
    },
    addCell: function (rowElement, row, col, isMine) {
        rowElement.insertAdjacentHTML(
            'beforeend',
            `<div class="field${isMine ? ' mine' : ''}" 
                        data-row="${row}" 
                        data-col="${col}"></div>`);
        /*  this function has as parameters:
                -  'rowElement', which is the same kind of row as in 'addRow' (namely,
                   a div container of class .row which is a child of the 'game-field' container)
                -  'row' and 'col', integers representing coordinates in the matrix for the cell
                -  'isMine', a boolean which is true if a mine is present at the cell, false otherwise
            
            So, it creates a div container of either classes "field" AND "mine" (if isMine is true) or class="field" (if
            isMine is false) and sets its custom data-* attributes row and col to the string converted values of the
            likewise named parameters 'row' and 'col'.
            This div container is the last child of rowElement in the DOM tree. */

    },
    flagCell: function(cellElement, updateCounter) {
        if ( !cellElement.className.includes("open") ) {
            if (cellElement.style.background == "") {    // the cell has no background property!! it
            //                                           // inherits it from the parent row style !!
                    cellElement.style.background = game.flagImageURLstring    // now it is a special child
                    updateCounter(-1)
            }
            else {
                cellElement.style.background = ""    // now it is no longer distinct 
                //                                   // (revert to inheritance from parent)
                updateCounter(1)
            };
        };
    },
    openCell: function(cellElement) {
        let gameState = 0
        if ( !cellElement.className.includes("open") 
            && cellElement.style.background == "" ) {
            if (cellElement.className.includes("mine")) {    // string.includes() is not supported by IE version < 11
                cellElement.className = "field open mine";
                gameState = -1;
            }
            else {                
                cellElement.className = "field open"            
            }    
        };
        return gameState;
    },
    displayNeighborMines: function(cellElement, gameField) {
        coords = this.getRowColAsInt(cellElement);
        nrAtThisCell = this.countMines(this.getNeighborSet(coords), gameField);
        if (nrAtThisCell > 0) {
            cellElement.style.color = game.numberColors[nrAtThisCell]
            cellElement.innerText = nrAtThisCell
        }
        
    },
    getRowColAsInt: function(cellElement) {
        let row = parseInt(cellElement.dataset.row);
        let col = parseInt(cellElement.dataset.col);
        return [row, col];
    },
    getNeighborSet: function(coordPair) {
        // let maxRows = gameField.childElementCount;
        // let maxCols = gameField.children[0].childElementCount;
        let neighborCoordArray = []
        for (let deltaX = -1; deltaX < 2; deltaX++) {
            for (let deltaY = -1; deltaY < 2; deltaY++) {
                let newRow = coordPair[0] + deltaY;
                let newCol = coordPair[1] + deltaX;
                if ( newRow >= 0 && newRow < game.maxRows 
                && newCol >= 0 && newCol < game.maxCols
                && !(deltaX == 0 && deltaY == 0) ) {
                    neighborCoordArray.push([newRow, newCol])
                }
            }
        }
        return neighborCoordArray
    },
    countMines: function(coordArray, gameField) {
        let mineCounter = 0;
        for (let i = 0; i < coordArray.length; i++) {
            let row = coordArray[i][0];
            let col = coordArray[i][1];

            // the gameField was built as a sequence of row children, each such child
            // with its own sequence of child cells, so it seems efficient to do the
            // array referencing below
            // (unless the DOM tree gets reordered somehow)
            if ( gameField.children[row].children[col].className.includes("mine") ) {
                mineCounter++
            }
        }
        return mineCounter;
    },
    updateCounter: function(counterElement, someInt) {
        let counterValue = parseInt(counterElement.value)
        counterValue += someInt
        counterElement.value = counterValue    
    },
    updateWithWonState: function(gameState, gameField) {
        if (gameState == 0) {
            let canNotBeAWonState = false;
            let unopenedFieldCount = 0;

            // OLD WAY OF DOING THINGS
            //
            // for (let row = 0; row < game.maxRows; row++) {
            //     for (let col = 0; col < game.maxCols; col++) {
            //         if ( !(gameField.children[row].children[col].className.includes("open")) ) {
            //             unopenedFieldCount++
            //             if (unopenedFieldCount > game.totalMines) {
            //                 canNotBeAWonState = true;
            //                 break;  
            //             }
            //         }                    
            //     }
            // }

            // BETTER WAY OF DOING THINGS
            openedFieldCount = gameField.querySelectorAll(".row .field.open")  .length
            unopenedFieldCount = game.maxCols*game.maxRows - openedFieldCount
            /////////////////////////////////////////////////////////////////////////

            // Code below is a bit redundant, but makes either the old or the new way functional
            if (unopenedFieldCount > game.totalMines) {
                canNotBeAWonState = true
            }
            if (!canNotBeAWonState) {
                gameState = 1
            }
        }
        return gameState
    },
    showUnopenedMines: function(gameField) {
        mineElementArray = gameField.querySelectorAll(".row .field.mine");
        mineElementArray.forEach(element => {
            element.style.background = game.mineImageURLstring
        })
    }
};

game.init();
