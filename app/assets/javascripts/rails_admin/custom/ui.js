//= require 'application.js'


// define a custom grid layout that makes sure the length of each lane is the same
// and that each lane is broad enough to hold its subgraph
class PoolLayout extends go.GridLayout {
    constructor() {
        super();
        this.MINLENGTH = 200;  // this controls the minimum length of any swimlane
        this.MINBREADTH = 180;  // this controls the minimum breadth of any non-collapsed swimlane
        this.cellSize = new go.Size(1, 1);
        this.wrappingColumn = Infinity;
        this.wrappingWidth = Infinity;
        this.spacing = new go.Size(0, 0);
        this.alignment = go.GridLayout.Position;
    }

    doLayout(coll) {
        const diagram = this.diagram;
        if (diagram === null) return;
        diagram.startTransaction("PoolLayout");
        // make sure all of the Group Shapes are big enough
        const minlen = this.computeMinPoolLength();
        diagram.findTopLevelGroups().each(lane => {
            if (!(lane instanceof go.Group)) return;
            const shape = lane.selectionObject;
            if (shape !== null) {  // change the desiredSize to be big enough in both directions
                const sz = this.computeLaneSize(lane);
                shape.width = (!isNaN(shape.width)) ? Math.max(shape.width, sz.width) : sz.width;
                // if you want the height of all of the lanes to shrink as the maximum needed height decreases:
                shape.height = minlen;
                // if you want the height of all of the lanes to remain at the maximum height ever needed:
                //shape.height = (isNaN(shape.height) ? minlen : Math.max(shape.height, minlen));
                const cell = lane.resizeCellSize;
                if (!isNaN(shape.width) && !isNaN(cell.width) && cell.width > 0) shape.width = Math.ceil(shape.width / cell.width) * cell.width;
                if (!isNaN(shape.height) && !isNaN(cell.height) && cell.height > 0) shape.height = Math.ceil(shape.height / cell.height) * cell.height;
            }
        });
        // now do all of the usual stuff, according to whatever properties have been set on this GridLayout
        super.doLayout(coll);
        diagram.commitTransaction("PoolLayout");
    };

    // compute the minimum length of the whole diagram needed to hold all of the Lane Groups
    computeMinPoolLength() {
        let len = this.MINLENGTH;
        myDiagram.findTopLevelGroups().each(lane => {
            const holder = lane.placeholder;
            if (holder !== null) {
                const sz = holder.actualBounds;
                len = Math.max(len, sz.height);
            }
        });
        return len;
    }

    // compute the minimum size for a particular Lane Group
    computeLaneSize(lane) {
        // assert(lane instanceof go.Group);
        const sz = new go.Size(lane.isSubGraphExpanded ? this.MINBREADTH : 1, this.MINLENGTH);
        if (lane.isSubGraphExpanded) {
            const holder = lane.placeholder;
            if (holder !== null) {
                const hsz = holder.actualBounds;
                sz.width = Math.max(sz.width, hsz.width);
            }
        }
        // minimum breadth needs to be big enough to hold the header
        const hdr = lane.findObject("HEADER");
        if (hdr !== null) sz.width = Math.max(sz.width, hdr.actualBounds.width);
        return sz;
    }
}

// end PoolLayout class


function initDiagram() {

    // Since 2.2 you can also author concise templates with method chaining instead of GraphObject.make
    // For details, see https://gojs.net/latest/intro/buildingObjects.html
    const $go = go.GraphObject.make;

    myDiagram =
        new go.Diagram("myDiagramDiv",
            {
                // make sure the top-left corner of the viewport is occupied
                contentAlignment: go.Spot.TopCenter,
                // use a simple layout to stack the top-level Groups next to each other
                layout: $go(PoolLayout),
                // don't allow dropping onto the diagram's background unless they are all Groups (lanes or pools)
                mouseDragOver: e => {
                    if (!e.diagram.selection.all(function (n) {
                        return n instanceof go.Group;
                    })) {
                        e.diagram.currentCursor = 'not-allowed';
                    }
                },
                // disallow nodes to be dragged to the diagram's background
                mouseDrop: e => {
                    e.diagram.currentTool.doCancel();
                },
                // a clipboard copied node is pasted into the original node's group (i.e. lane).
                "commandHandler.copiesGroupKey": true,
                // automatically re-layout the swim lanes after dragging the selection
                "SelectionMoved": relayoutDiagram,  // this DiagramEvent listener is
                "SelectionCopied": relayoutDiagram, // defined above
                "linkingTool.isEnabled": false,
                "undoManager.isEnabled": true,
                // allow TextEditingTool to start without selecting first
                "textEditingTool.starting": go.TextEditingStarting.SingleClick
            });
    // Customize the dragging tool:
    // When dragging a node set its opacity to 0.6 and move it to be in front of other nodes
    myDiagram.toolManager.draggingTool.doActivate = function () {  // method override must be function, not =>
        go.DraggingTool.prototype.doActivate.call(this);
        this.currentPart.opacity = 0.6;
        this.currentPart.layerName = "Foreground";
    }
    myDiagram.toolManager.draggingTool.doDeactivate = function () {  // method override must be function, not =>
        this.currentPart.opacity = 1;
        this.currentPart.layerName = "";
        go.DraggingTool.prototype.doDeactivate.call(this);
    }

    // this is called after nodes have been moved
    function relayoutDiagram() {
        myDiagram.selection.each(n => n.invalidateLayout());
        myDiagram.layoutDiagram();
    }

    // There are only three note colors by default, blue, red, and yellow but you could add more here:
    const noteColors = ['#ce6925', '#ffdf71', '#3aa6dd', '#7ab648', '#b391b5'];


    function getNoteColor(num) {
        return noteColors[Math.min(num, noteColors.length - 1)];
    }

    myDiagram.nodeTemplate =
        $go(go.Node, "Spot",
            new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
            $go(go.Shape, "RoundedRectangle", {
                    fill: '#009CCC', strokeWidth: 1, stroke: '#009CCC',
                    width: 140, height: 70,
                    stretch: go.Stretch.Vertical,
                    portId: "", cursor: "pointer", fromLinkable: true, toLinkable: true,
                    fromSpot: go.Spot.Right, toSpot: go.Spot.Left,
                    // if a user clicks the colored portion of a node, cycle through colors
                    click: (e, obj) => {
                        myDiagram.startTransaction("Update node color");
                        let newColor = parseInt(obj.part.data.color) + 1;
                        if (newColor > noteColors.length - 1) newColor = 0;
                        myDiagram.model.setDataProperty(obj.part.data, "color", newColor);
                        myDiagram.commitTransaction("Update node color");
                    }
                },
                new go.Binding("fill", "color", getNoteColor),
                new go.Binding("stroke", "color", getNoteColor)
            ),
            $go(go.Panel, "Auto",
                {
                    alignment: new go.Spot(1, 0.5, -60, 0)
                },
                $go(go.Shape, "RoundedRectangle", {
                    fill: "white", stroke: '#CCCCCC',
                    width: 120, height: 70
                }),
                $go(go.Panel, "Table",
                    {width: 120, minSize: new go.Size(NaN, 50)},
                    $go(go.TextBlock,
                        {
                            name: 'TEXT',
                            margin: 6, font: '11px Lato, sans-serif', editable: true,
                            stroke: "#000", maxSize: new go.Size(130, NaN),
                            verticalAlignment: go.Spot.Center,
                            alignment: go.Spot.Center,
                            textAlign: "center",
                            overflow: go.TextOverflow.Ellipsis,
                            wrap: go.Wrap.DesiredSize,
                        },
                        new go.Binding("text", "text").makeTwoWay())
                )
            ),
        );

    // When user hits + button, increment count on that option
    function incrementHP(e, obj) {
        let node = obj.part.data;
        if (node !== null) {
            myDiagram.model.startTransaction("increment count");
            myDiagram.model.setDataProperty(node, "HP", isNaN(node.HP) ? 1 : node.HP + 1);
            obj.part.findObject("HP").text = node.HP;
            myDiagram.model.commitTransaction("increment count");
        }
    }

    function incrementHT(e, obj) {
        let node = obj.part.data;
        if (node !== null) {
            myDiagram.model.startTransaction("increment count");
            myDiagram.model.setDataProperty(node, "HT", isNaN(node.HT) ? 1 : node.HT + 1);
            obj.part.findObject("HT").text = node.HT;
            myDiagram.model.commitTransaction("increment count");
        }
    }

    // When user hits - button, decrement count on that option
    function decrementHP(e, obj) {
        let node = obj.part.data;
        if (node !== null) {
            myDiagram.model.startTransaction("decrement count");
            if (node.HP > 1)
                myDiagram.model.setDataProperty(node, "HP", node.HP - 1);
            obj.part.findObject("HP").text = node.HP;
            myDiagram.model.commitTransaction("decrement count");
        }
    }

    function decrementHT(e, obj) {
        let node = obj.part.data;
        if (node !== null) {
            myDiagram.model.startTransaction("decrement count");
            if (node.HT > 1)
                myDiagram.model.setDataProperty(node, "HT", node.HT - 1);
            obj.part.findObject("HT").text = node.HT;
            myDiagram.model.commitTransaction("decrement count");
        }
    }

    // Validation function for editing text
    function isValidCount(textblock, oldstr, newstr) {
        if (newstr === "") return false;
        var num = +newstr; // quick way to convert a string to a number
        return !isNaN(num) && Number.isInteger(num) && num >= 0;
    }

    function editText(e, button) {
        var node = button.part.adornedPart;
        e.diagram.commandHandler.editTextBlock(node.findObject("TEXTBLOCK"));
    }

    function changeColor(e, obj) {
        myDiagram.startTransaction("Update node color");
        var newColor = parseInt(obj.part.data.color) + 1;
        if (newColor > noteColors.length - 1) newColor = 0;
        myDiagram.model.setDataProperty(obj.part.data, "color", newColor);
        //obj["_buttonFillNormal"] = getNoteColor(newColor); // uncomment to update the button too
        myDiagram.commitTransaction("Update node color");
    }


    function drawLink(e, button) {
        var node = button.part.adornedPart;
        var tool = e.diagram.toolManager.linkingTool;
        tool.startObject = node.port;
        e.diagram.currentTool = tool;
        tool.doActivate();
    }


    myDiagram.nodeTemplate.selectionAdornmentTemplate =
        $go(go.Adornment, "Spot",
            $go(go.Panel, "Auto",
                $go(go.Shape, {
                    stroke: "dodgerblue",
                    strokeWidth: 2,
                    fill: null
                }),
                $go(go.Placeholder)
            ),
            $go(go.Panel, "Horizontal", {
                    alignment: go.Spot.Top,
                    alignmentFocus: go.Spot.Bottom
                },
                $go("Button", {
                        click: editText
                    }, // defined below, to support editing the text of the node
                    $go(go.TextBlock, "t", {
                        font: "bold 10pt sans-serif",
                        desiredSize: new go.Size(15, 15),
                        textAlign: "center"
                    })
                ),
                $go("Button", {
                        click: changeColor,
                        // "_buttonFillOver": "transparent"
                    }, // defined below, to support changing the color of the node
                    new go.Binding("ButtonBorder.fill", "color", getNoteColor),
                    $go(go.Shape, {
                        fill: null,
                        stroke: null,
                        desiredSize: new go.Size(14, 14)
                    })
                ),
                $go("Button", { // drawLink is defined below, to support interactively drawing new links
                        click: drawLink, // click on Button and then click on target node
                        actionMove: drawLink // drag from Button to the target node
                    },
                    $go(go.Shape, {
                        geometryString: "M0 0 L8 0 8 12 14 12 M12 10 L14 12 12 14"
                    })
                ),
                $go("Button", {
                        click: function (e, obj) {
                            var node = obj.part.adornedPart;
                            if (node !== null) {
                                myDiagram.startTransaction("remove");
                                myDiagram.commandHandler.deleteSelection(node.data);
                                myDiagram.commitTransaction("remove");
                            }
                        }
                    },
                    $go(go.TextBlock, "X", {
                        font: "bold 10pt sans-serif",
                        desiredSize: new go.Size(15, 15),
                        textAlign: "center"
                    })
                )
            ),
            $go(go.Panel, "Horizontal", {
                    alignment: go.Spot.Bottom,
                    alignmentFocus: go.Spot.Top
                },
                $go(go.Panel, "Horizontal", {
                        column: 4
                    },
                    $go(go.TextBlock, "HP:", {
                        font: "10pt Verdana, sans-serif",
                        textAlign: "right",
                        margin: 2,
                        wrap: go.TextBlock.None,
                        width: 25,
                    }),
                    $go(go.TextBlock, {
                            name: "HP",
                            margin: 2,
                            textValidation: isValidCount
                        },
                        new go.Binding("text", "HP").makeTwoWay(function (count) {
                            return parseInt(count, 10);
                        })),
                    $go("Button", {
                            click: incrementHP
                        },
                        $go(go.Shape, "PlusLine", {
                            margin: 3,
                            desiredSize: new go.Size(7, 7)
                        })
                    ),
                    $go("Button", {
                            click: decrementHP
                        },
                        $go(go.Shape, "MinusLine", {
                            margin: 3,
                            desiredSize: new go.Size(7, 7)
                        })
                    )
                ),
                $go(go.Panel, "Horizontal", {
                        column: 3
                    },
                    $go(go.TextBlock, "HT:", {
                        font: "10pt Verdana, sans-serif",
                        textAlign: "right",
                        margin: 2,
                        wrap: go.TextBlock.None,
                        width: 25,
                    }),
                    $go(go.TextBlock, {
                        name: "HT",
                        margin: 2,
                        textValidation: isValidCount
                    }, new go.Binding("text", "HT").makeTwoWay(function (count) {
                        return parseInt(count, 10);
                    })),
                    $go("Button", {
                            click: incrementHT
                        },
                        $go(go.Shape, "PlusLine", {
                            margin: 3,
                            desiredSize: new go.Size(7, 7)
                        })
                    ),
                    $go("Button", {
                            click: decrementHT
                        },
                        $go(go.Shape, "MinusLine", {
                            margin: 3,
                            desiredSize: new go.Size(7, 7)
                        })
                    )
                )
            )
        );

    myDiagram.linkTemplate =
        $go(go.Link, // the whole link panel
            {
                relinkableFrom: true,
                relinkableTo: true,
                reshapable: true,
                resegmentable: true
            }, {
                routing: go.Link.AvoidsNodes, // but this is changed to go.Link.Orthgonal when the Link is reshaped
                adjusting: go.Link.End,
                curve: go.Link.JumpOver,
                corner: 15,
                toShortLength: 4
            },
            new go.Binding("points").makeTwoWay(),
            // remember the Link.routing too
            new go.Binding("routing", "routing", go.Binding.parseEnum(go.Link, go.Link.AvoidsNodes))
                .makeTwoWay(go.Binding.toString),
            $go(go.Shape, // the link path shape
                {
                    isPanelMain: true,
                    strokeWidth: 2
                }),
            $go(go.Shape, // the arrowhead
                {
                    toArrow: "Standard",
                    stroke: null
                })
        );

    // permitir enlazar solo a materias de semestres posteriores
    function correlatividadenlace(fromnode, fromport, tonode, toport) {
        return parseInt(fromnode.data.group.substr(8)) < parseInt(tonode.data.group.substr(8));
    }

    // only allow new links between ports
    myDiagram.toolManager.linkingTool.linkValidation = correlatividadenlace;

    // only allow reconnecting an existing link to a port
    myDiagram.toolManager.relinkingTool.linkValidation = correlatividadenlace;


    // updateLinks on expand
    function updateCrossLaneLinks(group) {
        group.findExternalLinksConnected().each(function (l) {
            l.visible = (l.fromNode.isVisible() && l.toNode.isVisible());
        });
    }

    // While dragging, highlight the dragged-over group
    function highlightGroup(grp, show) {
        if (show) {
            const part = myDiagram.toolManager.draggingTool.currentPart;
            if (part.containingGroup !== grp) {
                grp.isHighlighted = true;
                return;
            }
        }
        grp.isHighlighted = false;
    }

    function groupStyle() { // common settings for both Lane and Pool Groups
        return [{
            layerName: "Background", // all pools and lanes are always behind all nodes and links
            background: "transparent", // can grab anywhere in bounds
            copyable: false, // can't copy lanes or pools
            avoidable: false, // don't impede AvoidsNodes routed Links
            selectable: false,
            click: function (e, grp) { // allow simple click on group to clear selection
                if (!e.shift && !e.control && !e.meta) e.diagram.clearSelection();
            }
        },
            new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify)
        ];
    }

    function correlatividadgrupo(group, node) {
        if (group === null) return true; // when maybe dropping a node in the background
        if (node instanceof go.Group) return false; // don't add Groups to Groups
        let nodebeforeiterator = node.findNodesInto();
        let nodeafteriterator = node.findNodesOutOf();
        let nodebefore = 0,
            nodeafter = 11;
        while (nodebeforeiterator.next()) {
            let i = parseInt(nodebeforeiterator.value.data.group.substr(8));
            if (i > nodebefore) {
                nodebefore = i
            }
        }
        while (nodeafteriterator.next()) {
            let i = parseInt(nodeafteriterator.value.data.group.substr(8));
            if (i < nodeafter) {
                nodeafter = i
            }
        }
        let groupid = parseInt(group.data.key.substr(8));
        return groupid > nodebefore && groupid < nodeafter;
    }

    function addNewNode(e, obj) {
        const diagram = e ? e.diagram : myDiagram;
        // maybe add to clicked group
        let sel = obj ? obj.part : null;
        if (sel && !(sel instanceof go.Group)) sel = sel.containingGroup;
        // else add to group of selected node
        if (!sel) sel = diagram.selection.first();
        if (sel && !(sel instanceof go.Group)) sel = sel.containingGroup;
        // else add to first group
        if (!sel) sel = diagram.findTopLevelGroups().first();
        if (!sel) return;
        diagram.startTransaction('add node');
        const newdata = {
            group: sel.key,
            text: "New item " + sel.memberParts.count,
            color: 0,
            HP: 1,
            HT: 1,
            tipo: "OB"
        };
        diagram.model.addNodeData(newdata);
        diagram.commitTransaction('add node');
        const newnode = diagram.findNodeForData(newdata);
        diagram.select(newnode);
        diagram.commandHandler.scrollToPart(newnode);
        diagram.commandHandler.editTextBlock();
    }


    myDiagram.groupTemplate =
        $go(go.Group, "Vertical", groupStyle(), {
                selectionObjectName: "SHAPE", // even though its not selectable, this is used in the layout
                layout: $go(go.GridLayout,  // automatically lay out the lane's subgraph
                    {
                        wrappingColumn: 1,
                        cellSize: new go.Size(1, 1),
                        spacing: new go.Size(NaN, 20),
                        comparer: (a, b) => {  // can re-order tasks within a lane
                            const ay = a.location.y;
                            const by = b.location.y;
                            if (isNaN(ay) || isNaN(by)) return 0;
                            if (ay < by) return -1;
                            if (ay > by) return 1;
                            return 0;
                        }
                    }),
                computesBoundsAfterDrag: true,  // needed to prevent recomputing Group.placeholder bounds too soon
                handlesDragDropForMembers: true,  // don't need to define handlers on member Nodes and Links
                click: (e, grp) => {  // allow simple click on group to clear selection
                    if (!e.shift && !e.control && !e.meta) e.diagram.clearSelection();
                },

                doubleClick: addNewNode,
                memberValidation: correlatividadgrupo,
                mouseDragEnter: function (e, grp, prev) {
                    // this will call samePrefix; it is true if any node has the same key prefix
                    if (grp.canAddMembers(grp.diagram.selection)) {
                        highlightGroup(grp, true);
                        grp.diagram.currentCursor = "";
                    } else {
                        grp.diagram.currentCursor = "not-allowed";
                    }
                },
                mouseDragLeave: function (e, grp, next) {
                    highlightGroup(grp, false);
                    grp.diagram.currentCursor = "";
                },
                mouseDrop: function (e, grp) {
                    if (grp.canAddMembers(grp.diagram.selection)) {
                        // this will only add nodes with the same key prefix
                        grp.addMembers(grp.diagram.selection, true);
                        updateCrossLaneLinks(grp);
                    } else { // and otherwise cancel the drop
                        grp.diagram.currentTool.doCancel();
                    }
                },
                subGraphExpandedChanged: grp => {
                    const shp = grp.selectionObject;
                    if (grp.diagram.undoManager.isUndoingRedoing) return;
                    if (grp.isSubGraphExpanded) {
                        shp.width = grp.data.savedBreadth;
                    } else {  // remember the original width
                        if (!isNaN(shp.width)) grp.diagram.model.set(grp.data, "savedBreadth", shp.width);
                        shp.width = NaN;
                    }
                }
            },
            new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
            new go.Binding("isSubGraphExpanded", "expanded").makeTwoWay(),
            // the lane header consisting of a TextBlock and an expander button
            $go(go.Panel, "Horizontal",
                {name: "HEADER", alignment: go.Spot.Left},
                $go("SubGraphExpanderButton", {margin: 5}),  // this remains always visible
                $go(go.TextBlock,  // the lane label
                    {font: "15px Lato, sans-serif", editable: true, margin: new go.Margin(2, 0, 0, 0)},
                    // this is hidden when the swimlane is collapsed
                    new go.Binding("visible", "isSubGraphExpanded").ofObject(),
                    new go.Binding("text").makeTwoWay())
            ),  // end Horizontal Panel
            $go(go.Panel, "Auto",  // the lane consisting of a background Shape and a Placeholder representing the subgraph
                $go(go.Shape, "Rectangle",  // this is the resized object
                    {name: "SHAPE", fill: "#F1F1F1", stroke: null, strokeWidth: 4},  // strokeWidth controls space between lanes
                    new go.Binding("fill", "isHighlighted", h => h ? "#D6D6D6" : "#F1F1F1").ofObject(),
                    new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify)),
                $go(go.Placeholder,
                    {padding: 12, alignment: go.Spot.TopLeft}),
                $go(go.TextBlock,  // this TextBlock is only seen when the swimlane is collapsed
                    {
                        name: "LABEL", font: "15px Lato, sans-serif", editable: true,
                        angle: 90, alignment: go.Spot.TopLeft, margin: new go.Margin(4, 0, 0, 2)
                    },
                    new go.Binding("visible", "isSubGraphExpanded", e => !e).ofObject(),
                    new go.Binding("text").makeTwoWay())
            )  // end Auto Panel
        );  // end Group

    myDiagram.add(
        $go(go.Part, "Table", {
                position: new go.Point(10000, 10000),
                selectable: true
            },
            $go(go.TextBlock, "Areas", {
                row: 0,
                font: "700 14px Droid Serif, sans-serif"
            }), // end row 0
            $go(go.Panel, "Horizontal", {
                    row: 1,
                    alignment: go.Spot.Left
                },
                $go(go.Shape, "Rectangle", {
                    desiredSize: new go.Size(10, 10),
                    fill: getNoteColor(0),
                    margin: 5
                }),
                $go(go.TextBlock, "Ciencias de la Computación", {
                    font: "700 13px Droid Serif, sans-serif",
                }),
            ), // end row 1
            $go(go.Panel, "Horizontal", {
                    row: 2,
                    alignment: go.Spot.Left
                },
                $go(go.Shape, "Rectangle", {
                    desiredSize: new go.Size(10, 10),
                    fill: getNoteColor(1),
                    margin: 5
                }),
                $go(go.TextBlock, "Ciencias Matemáticas y Físicas", {
                    font: "700 13px Droid Serif, sans-serif"
                })
            ), // end row 2
            $go(go.Panel, "Horizontal", {
                    row: 3,
                    alignment: go.Spot.Left
                },
                $go(go.Shape, "Rectangle", {
                    desiredSize: new go.Size(10, 10),
                    fill: getNoteColor(2),
                    margin: 5
                }),
                $go(go.TextBlock, "Tecnologías Aplicadas", {
                    font: "700 13px Droid Serif, sans-serif"
                })
            ), // end row 3
            $go(go.Panel, "Horizontal", {
                    row: 4,
                    alignment: go.Spot.Left
                },
                $go(go.Shape, "Rectangle", {
                    desiredSize: new go.Size(10, 10),
                    fill: getNoteColor(3),
                    margin: 5
                }),
                $go(go.TextBlock, "Complementarias", {
                    font: "700 13px Droid Serif, sans-serif"
                })
            ), // end row 4
            $go(go.Panel, "Horizontal", {
                    row: 5,
                    alignment: go.Spot.Left
                },
                $go(go.Shape, "Rectangle", {
                    desiredSize: new go.Size(10, 10),
                    fill: getNoteColor(4),
                    margin: 5
                }),
                $go(go.TextBlock, "Enfásis u orientación propio de la carrera", {
                    font: "700 13px Droid Serif, sans-serif"
                })
            )
        ));

    myDiagram.addModelChangedListener(evt => {
        if (evt.isTransactionFinished) saveModel(evt.model);
    });

    loadModel();

}  // end init

// Show the diagram's model in JSON format
function saveModel(model) {
    document.getElementById("curriculum_data").value = model.toJson();
    myDiagram.isModified = false;
}

function loadModel() {
    myDiagram.model = go.Model.fromJson(document.getElementById("curriculum_data").value);
}

$(document).on('rails_admin.dom_ready', function () {
    if (document.getElementById("myDiagramDiv")) {
        initDiagram();
    }
});