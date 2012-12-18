var Isearch = function (params) {
    /**
     * 入力フォーム
     */
    this.inputForm = params.inputForm;
    /**
     * inputノード
     */
    this.inputNode = params.inputNode;
    /**
     * 後方検索ボタン
     */
    this.backwardBotton = params.backwardBotton;
    /**
     * 前方検索ボタン
     */
    this.forwardBotton = params.forwardBotton;
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
    /**
     * 候補選択
     */
    this.suggestSelect = -1;
    /**
     * 候補リスト
     */
    this.suggestNodeList = [];
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

        newNode.style.color = 'black';
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
    // 候補選択
    ,suggestSelect = function (selectIndex) {
        if (self.suggestNodeList[selectIndex]
            && self.suggestNodeList[selectIndex].onmouseenter) {
            self.suggestNodeList[selectIndex].onmouseenter();
        }
    };

    // イベント追加
    /**
     * シフトキー
     */
    this.inputForm.ownerDocument.onkeyup = function(e) {
        self.shiftKey = e ? e.shiftKey : event.shiftKey;
    };
    this.inputForm.ownerDocument.onkeydown = function(e) {
        self.shiftKey = e ? e.shiftKey : event.shiftKey;
    };
    /**
     * エンター押下
     */
    this.inputForm.onsubmit = function () {
        if (self.suggestSelect >= 0) {
            self.suggestNodeList[self.suggestSelect].onclick();
        }
        if (self.shiftKey) {
            self.searchBackward();
        }
        else {
            self.searchForward();
        }
        self.deleteSuggest();
        return false;
    };
    /**
     * 矢印キー
     */
    this.inputNode.onkeydown = function (event) {
        if (event) {
            return;
        }
        // for IE
        var keyCode = window.event.keyCode;
        if (keyCode == 38) {
            // 上
            suggestSelect(self.suggestSelect - 1);
        }
        else if (keyCode == 40){
            // 下
            suggestSelect(self.suggestSelect + 1);
        }
    };
    this.inputNode.onkeypress = function (event) {
        if (!event) {
            return;
        }
        // for FF
        var keyCode = event.keyCode;
        if (keyCode == 38) {
            suggestSelect(self.suggestSelect - 1);
        }
        else if (keyCode == 40){
            // 下
            suggestSelect(self.suggestSelect + 1);
        }
    };
    /**
     * 検索キーワード入力
     */
    this.inputNode.onkeyup = function (event) {
        var keyCode = event ? event.charCode : window.event.keyCode;
        if (keyCode != 38 && keyCode != 40){
            self.wordSearch();
        }
    };
    /**
     * 後方検索
     */
    this.backwardBotton.onclick = function () {
        self.searchBackward();
        self.deleteSuggest();
    };
    /**
     * 前方検索
     */
    this.forwardBotton.onclick = function () {
        self.searchForward();
        self.deleteSuggest();
    };

    /**
     * ノードリスト作成
     */
    this.makeNodeList = function (node) {
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
            $A(node.childNodes).each(
                function (x) {
                    self.makeNodeList(x);
                });
        }
    };

    /**
     * 検索
     */
    this.wordSearch = function () {
        var
        word = this.inputNode.value
        ,node
        ,startIndex = 0
        ,nodeList
        ,kouhoIndex = 0
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

        // クリア
        this.kouhoList.each(
            function (x) {
                x.each(
                    function (x) {
                        x.clearNode();
                    }
                );
            }
        );
        
        this.kouhoList = [];

        this.backwardBotton.disabled = true;
        this.forwardBotton.disabled = true;

        // 候補非表示
        this.deleteSuggest();

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
                    nodeList.selectNodeList = [];
                    nodeList.text = '';
                    nodeList.index = this.kouhoList.length;

                    // ノード選択
                    nodeList.each(
                        function (x) {
                            nodeList.selectNodeList.push(
                                x.selectNode(startIndex, word.length));
                            nodeList.text += x.text;
                        }
                    );
                    nodeList.text = nodeList.text.replace(/(^\s+)|(\s+$)/g, '');

                    this.kouhoList.push(nodeList);
                }

                startIndex++;
            }
        }

        if (this.kouhoList.length > 0) {
            // 検索箇所をさがす
            this.searchIndex = 0;
            while (this.searchIndex < this.kouhoList.length) {
                node = this.kouhoList[this.searchIndex][0].node;
                if (node.ownerDocument.body.scrollTop <=
                    Position.cumulativeOffset(node)[1]) {
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

        // 候補表示
        this.suggest();
    };

    /**
     * 候補表示
     */
    this.suggest = function () {
        if (!this.inputForm || !this.inputForm.parentNode
            || this.kouhoList.length <= 1) {
            return;
        }
        var
        suggestNode = this.inputForm.parentNode.childNodes[
            $A(this.inputForm.parentNode.childNodes).indexOf(this.inputForm) + 1]
        ,kouhoTextList
        ,suggestText
        ,suggestChild
        ,count = 0
        ,position
        ;

        // 候補リスト作成
        kouhoTextList = {};
        this.kouhoList.each(
            function (x) {
                if (!kouhoTextList[x.text]) {
                    count++;
                    kouhoTextList[x.text] = x;
                }
            });

        if (count <= 1) {
            // 候補が１以下なら表示しない
            return;
        }

        if (!suggestNode || suggestNode.id != 'suggestList') {
            // 候補ボックスがない場合は作成
            suggestNode = this.inputForm.ownerDocument.createElement('div');
            suggestNode.id = 'suggestList';
            suggestNode.align = 'left';
            suggestNode.style.position = 'absolute';
            suggestNode.style.backgroundColor = '#FFFFFF';
            suggestNode.style.border = '1px solid #CCCCFF';
            position = Position.cumulativeOffset(this.inputForm);
            suggestNode.style.top = position[1]
                + this.inputForm.offsetHeight + 2 +'px';
            suggestNode.style.right
                = (document.body.clientWidth
                   - (position[0] + this.inputForm.offsetWidth)) + 'px';
            suggestNode.style.width = this.inputForm.offsetWidth +'px';
            suggestNode.style.overflow = 'hidden';
            if (this.inputForm.nextSibling) {
                // 次の要素がある場合はその直前
                this.inputForm.parentNode.insertBefore(
                    suggestNode, this.inputForm.nextSibling);
            }
            else {
                // ない場合は最後に追加
                this.inputForm.parentNode.appendChild(suggestNode);
            }
        }
        else {
            suggestNode.style.display = '';
            // 候補がある場合は削除
            while (suggestNode.hasChildNodes()) {
                suggestNode.removeChild(suggestNode.firstChild);
            }
        }

        
        // 候補に表示
        self.suggestNodeList = [];
        for (suggestText in kouhoTextList) {
            suggestChild = suggestNode.ownerDocument.createElement('div');
            suggestChild.style.color = '#888888';
            kouhoTextList[suggestText].each(
                function (node) {
                    if (!node.node || !node.node.childNodes) {
                        return;
                    }
                    $A(node.node.childNodes).each(
                        function (childNode) {
                            var newNode;
                            if (childNode.nodeType == Node.TEXT_NODE) {
                                // テキストの場合はそのまま追加
                                suggestChild.appendChild(
                                    suggestNode.ownerDocument.createTextNode(
                                        childNode.nodeValue)
                                );
                            }
                            else {
                                // 強調の場合
                                newNode = suggestNode.ownerDocument
                                    .createElement('strong');
                                newNode.appendChild(
                                    suggestNode.ownerDocument.createTextNode(
                                        childNode.firstChild.nodeValue)
                                );
                                newNode.style.color = 'black';
                                suggestChild.appendChild(newNode);
                            }
                        }
                    );
                }
            );

            suggestChild.kouho = kouhoTextList[suggestText];
            suggestChild.onclick = function () {
                self.inputNode.value = this.kouho.text;
                self.wordSearch();
                self.deleteSuggest();
            };
            
            // 候補リストに追加
            self.suggestNodeList.push(suggestChild);
        }

        // ソート
        self.suggestNodeList.sortBy(
            function (x) {
                return Position.cumulativeOffset(x.kouho.node)[1];
            });

        // 追加
        self.suggestNodeList.each(
            function (x, index) {
                if (index < 20) {
                    x.onmouseenter = function () {
                        if (self.suggestSelect >= 0) {
                            self.suggestNodeList[self.suggestSelect]
                                .style.backgroundColor = '';
                        }
                        self.suggestSelect = index;
                        this.style.backgroundColor = 'blue';
                        self.searchSelect(this.kouho.index);
                    };
                    suggestNode.appendChild(x);
                }
            }
        );
    };

    /**
     * 候補削除
     */
    this.deleteSuggest = function () {
        this.suggestSelect = -1;
        if (!this.inputForm || !this.inputForm.parentNode) {
            return;
        }
        var
        suggestNode = this.inputForm.parentNode.childNodes[
            $A(this.inputForm.parentNode.childNodes).indexOf(this.inputForm) + 1]
        ;

        if (suggestNode && suggestNode.id == 'suggestList') {
            // 候補を消す
            suggestNode.style.display = 'none';
        }
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
        var node;
        if (selectIndex < 0 || this.kouhoList.length <= selectIndex) {
            return;            
        }
        // 前を戻す
        if (this.searchIndex >= 0) {
            this.kouhoList[this.searchIndex].selectNodeList.each(
                function (x) {
                    x.style.color = 'black';
                    x.style.backgroundColor = 'yellow';
                }
            );
        }
        this.searchIndex = selectIndex;

        // 選択対象を選択
        this.kouhoList[this.searchIndex].selectNodeList.each(
            function (x) {
                x.style.color = 'white';
                x.style.backgroundColor = 'blue';
            }
        );
        
        // ボタン
        if (this.searchIndex > 0) {
            this.backwardBotton.disabled = false;
        }
        else {
            this.backwardBotton.disabled = true;
        }
        if (this.searchIndex < this.kouhoList.length - 1) {
            this.forwardBotton.disabled = false;
        }
        else {
            this.forwardBotton.disabled = true;
        }

        node = this.kouhoList[this.searchIndex][0];
        if (this.onJump) {
          this.onJump(node.node);
        }
        else {
            node.node.ownerDocument.location.hash
                = '#' + node.node.name;
        }
    };
};