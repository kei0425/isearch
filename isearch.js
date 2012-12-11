var Isearch = function (element) {
    /**
     * ノードリスト
     */
    this.nodeList = [];
    /**
     * 検索文字列
     */
    this.word = '';
    /**
     * 候補リスト
     */
    this.kouhoList = [];
    /**
     * 検索対象文字列
     */
    this.alltext = '';
    /**
     * 検索箇所インデックス
     */
    this.searchIndex = -1;
    var
    self = this
    // ノードクリア
    ,clearNode = function () {
        if (!this.node.parentNode) {
            return;
        }
        var newNode = this.node.ownerDocument.createTextNode(this.text);
        this.node.parentNode.insertBefore(newNode, this.node);
        this.node.parentNode.removeChild(this.node);
        this.node = newNode;
    }
    // ノード強調
    ,selectNode = function (startIndex, length) {
        if (!this.node.parentNode) {
            return null;
        }
        var
        selectStartIndex
        ,selectEndIndex
        ,newNode
        ;
        if (this.node.nodeType == Node.TEXT_NODE) {
            // アンカーノード作成
            try {
                newNode = this.node.ownerDocument.createElement(
                    "<a name='isearch" + this.no + "'>");
            } catch (x) {
                newNode = this.node.ownerDocument.createElement('a');
                newNode.name = 'isearch' + this.no;
            }
            // 直前に挿入
            this.node.parentNode.insertBefore(newNode,this.node);
            // テキストノード削除
            this.node.parentNode.removeChild(this.node);

            // ノード入れかえ
            this.node = newNode;

            if (this.index < startIndex) {
                selectStartIndex = startIndex - this.index;
                // 先頭未選択ノード作成
                this.node.appendChild(
                    this.node.ownerDocument.createTextNode(
                        this.text.substring(0, selectStartIndex)));
            }
            else {
                // 先頭から
                selectStartIndex = 0;
            }
        }
        else {
            selectStartIndex = startIndex - this.index;
            if (this.text.length - selectStartIndex
                == this.node.lastChild.nodeValue.length) {
                // 末尾テキストノード削除
                this.node.removeChild(this.node.lastChild);
            }
            else {
                // 末尾テキストノード縮小
                this.node.lastChild.nodeValue =
                    this.node.lastChild.nodeValue.substring(
                        0, 
                        this.node.lastChild.nodeValue.length -
                            (this.text.length - selectStartIndex));
            }
        }

        if (this.index + this.text.length <= startIndex + length) {
            // 末尾まで
            selectEndIndex = this.text.length;
        }
        else {
            selectEndIndex = this.text.length
                - ((this.index + this.text.length)
                   - (startIndex + length));
        }

        // 選択ノード作成
        newNode = this.node.ownerDocument.createElement('strong');
        this.selectedNode = newNode;

        newNode.style.backgroundColor = 'yellow';

        newNode.appendChild(
            newNode.ownerDocument.createTextNode(
                this.text.substring(
                    selectStartIndex, selectEndIndex)));
        this.node.appendChild(newNode);

        if (selectEndIndex < this.text.length) {
            // 末尾未選択ノード作成
            this.node.appendChild(
                this.node.ownerDocument.createTextNode(
                    this.text.substring(selectEndIndex)));
        }
        return newNode;
    }
    ;
    /**
     * ノードリスト作成
     */
    this.makeNodeList = function (node) {
        var
        i
        ;

        if (node.nodeType == Node.TEXT_NODE) {
            if (!node.parentNode) {
                return;
            }
            // 登録
            this.nodeList.push(
                {
                    no          : this.nodeList.length + 1
                    ,node       : node
                    ,text       : node.nodeValue
                    ,index      : this.alltext.length
                    ,clearNode  : clearNode
                    ,selectNode : selectNode
            });

            this.alltext += node.nodeValue;
        }
        else {
            // 子ノードチェック
            for (i = 0; i < node.childNodes.length; i++) {
                this.makeNodeList(node.childNodes[i]);
            }
        }
    };

    /**
     * 検索
     */
    this.wordSearch = function () {
        var
        word = $('searchword').value
        ,i
        ,j
        ,node
        ,startIndex = 0
        ,nodeList
        ,kouhoIndex = 0
        ,oldIndex = 0
        ,searchNode = function (startIndex, length) {
            var
            nodeList = []
            ,node
            ;

            while (kouhoIndex < self.nodeList.length) {
                node = self.nodeList[kouhoIndex];

                if (startIndex + length <= node.index) {
                    kouhoIndex--;
                    break;
                }

                if (startIndex < node.index + node.text.length) {
                    nodeList.push(node);
                }

                kouhoIndex++;
            }

            return nodeList;
        }

        ;
        if (this.word == word) {
            // 変らない場合は何もしない
            return;
        }

        // 既存の検索位置を保持
        if (this.searchIndex >= 0) {
            oldIndex = this.kouhoList[this.searchIndex][0].index;
        }

        // クリア
        for (i = 0; i < this.kouhoList.length; i++) {
            for (j = 0; j < this.kouhoList[i].length; j++) {
                this.kouhoList[i][j].clearNode();
            }
        }
        
        this.kouhoList = [];

        $('searchbackward').disabled = true;
        $('searchforward').disabled = true;

        if (word.length > 0) {
            while (true) {
                startIndex = this.alltext.indexOf(word, startIndex);

                if (startIndex < 0) {
                    // 終了
                    break;
                }

                // 該当ノード抽出
                nodeList = searchNode(startIndex, word.length);
                if (nodeList.length > 0) {
                    this.kouhoList.push(nodeList);
                }

                nodeList.selectNodeList = [];

                for (i = 0; i < nodeList.length; i++) {
                    // ノード選択
                    nodeList.selectNodeList.push(
                        nodeList[i].selectNode(startIndex, word.length));
                }

                startIndex++;
            }
        }

        if (this.kouhoList.length > 0) {
            // 検索箇所をさがす
            this.searchIndex = 0;
            while (this.searchIndex < this.kouhoList.length) {
                if (oldIndex <= this.kouhoList[this.searchIndex][0].index) {
                    break;
                }
                this.searchIndex++;
            }
            if (this.kouhoList.length <= this.searchIndex) {
                this.searchIndex = this.kouhoList.length - 1;
            }
            this.searchSelect(this.searchIndex);
        }
        else {
            this.searchIndex = -1;
        }
        this.word = word;
    };

    /**
     * 逆方向候補表示
     */
    this.searchBackward = function () {
        this.searchSelect(this.searchIndex - 1);
    };
    /**
     * 順方向候補表示
     */
    this.searchForward = function () {
        this.searchSelect(this.searchIndex + 1);
    };
    /**
     * 指定候補表示
     */
    this.searchSelect = function (selectIndex) {
        if (selectIndex < 0 || this.kouhoList.length <= selectIndex) {
            return;            
        }
        var
        kouhoList
        ,i
        ;
        // 前を戻す
        if (this.searchIndex >= 0) {
            kouhoList = this.kouhoList[this.searchIndex];
            for (i = 0; i < kouhoList.selectNodeList.length; i++) {
                kouhoList.selectNodeList[i].style.backgroundColor = 'yellow';
            }
        }
        this.searchIndex = selectIndex;

        // 選択対象を選択
        kouhoList = this.kouhoList[this.searchIndex];
        for (i = 0; i < kouhoList.selectNodeList.length; i++) {
            kouhoList.selectNodeList[i].style.backgroundColor = 'blue';
        }
        
        // ボタン
        if (this.searchIndex > 0) {
            $('searchbackward').disabled = false;
        }
        else {
            $('searchbackward').disabled = true;
        }
        if (this.searchIndex < this.kouhoList.length - 1) {
            $('searchforward').disabled = false;
        }
        else {
            $('searchforward').disabled = true;
        }

        kouhoList[0].node.ownerDocument.location.hash
            = '#' + kouhoList[0].node.name;
    };
};