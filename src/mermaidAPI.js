/**
 * ---
 * title: mermaidAPI
 * order: 5
 * ---
 * # mermaidAPI
 * This is the api to be used when handling the integration with the web page instead of using the default integration
 * (mermaid.js).
 *
 * The core of this api is the **render** function that given a graph definitionas text renders the graph/diagram and
 * returns a svg element for the graph. It is is then up to the user of the API to make use of the svg, either insert it
 * somewhere in the page or something completely different.
 */
var graph = require('./diagrams/flowchart/graphDb');
var flow = require('./diagrams/flowchart/parser/flow');
var utils = require('./utils');
var flowRenderer = require('./diagrams/flowchart/flowRenderer');
var seq = require('./diagrams/sequenceDiagram/sequenceRenderer');
var info = require('./diagrams/example/exampleRenderer');
var infoParser = require('./diagrams/example/parser/example');
var flowParser = require('./diagrams/flowchart/parser/flow');
var dotParser = require('./diagrams/flowchart/parser/dot');
var sequenceParser = require('./diagrams/sequenceDiagram/parser/sequenceDiagram');
var sequenceDb = require('./diagrams/sequenceDiagram/sequenceDb');
var infoDb = require('./diagrams/example/exampleDb');
var gantt       = require('./diagrams/gantt/ganttRenderer');
var ganttParser = require('./diagrams/gantt/parser/gantt');
var ganttDb = require('./diagrams/gantt/ganttDb');
var d3 = require('./d3');
var nextId = 0;
var log = require('./logger').create();

/**
 * ## Configuration
 * These are the default options which can be overridden with the initialization call as in the example below:
 * ```
 * mermaid.initialize({
 *   flowchart:{
 *      htmlLabels: false
 *   }
 * });
 * ```
 */
var config = {
    /**
     * **cloneCssStyles** - This options controls whether or not the css rules should be copied into the generated svg
     */
    cloneCssStyles: true,

    /**
     * **startOnLoad** - This options controls whether or mermaid starts when the page loads
     */
    startOnLoad: true,

    /**
     * ### flowchart
     * *The object containing configurations specific for flowcharts*
     */
    flowchart:{
        /**
         * **htmlLabels** - Flag for setting whether or not a html tag should be used for rendering labels
         * on the edges
         */
        htmlLabels:true,
        /**
         * **useMaxWidth** - Flag for setting whether or not a all available width should be used for
         * the diagram.
         */
        useMaxWidth:true
    },

    /**
     * ###  sequenceDiagram
     * The object containing configurations specific for sequence diagrams
     */
    sequenceDiagram:{

        /**
         * **diagramMarginX** - margin to the right and left of the sequence diagram
         */
        diagramMarginX:50,

        /**
         * **diagramMarginY** - margin to the over and under the sequence diagram
         */
        diagramMarginY:10,

    /**
     * **actorMargin** - Margin between actors
     */
        actorMargin:50,

    /**
     * **width** - Width of actor boxes
     */
        width:150,

    /**
     * **height** - Height of actor boxes
     */
        height:65,

    /**
     * **boxMargin** - Margin around loop boxes
     */
        boxMargin:10,

     /**
      * **boxTextMargin** - margin around the text in loop/alt/opt boxes
      */
        boxTextMargin:5,

     /**
     * **noteMargin** - margin around notes
      */
        noteMargin:10,

        /**
     * **messageMargin** - Space between messages
         */
        messageMargin:35,

    /**
     * **mirrorActors** - mirror actors under diagram
     */
        mirrorActors:true,

    /**
     * **bottomMarginAdj** - Depending on css styling this might need adjustment.
     * Prolongs the edge of the diagram downwards
     */
        bottomMarginAdj:1,

    /**
     * **useMaxWidth** - when this flag is set the height and width is set to 100% and is then scaling with the
     * available space if not the absolute space required is used
     */
        useMaxWidth:true
    },

    /** ### gantt
     * The object containing configurations specific for gantt diagrams*
     */ 
    gantt:{
        /**
         * **titleTopMargin** - margin top for the text over the gantt diagram
         */ 
        titleTopMargin: 25,

        /** 
         * **barHeight** - the height of the bars in the graph
         */ 
        barHeight: 20,

        /** 
         * **barGap** - the margin between the different activities in the gantt diagram
         */ 
        barGap: 4,

        /** 
         *  **topPadding** - margin between title and gantt diagram and between axis and gantt diagram.
         */  
        topPadding: 50,

        /** 
         *  **sidePadding** - the space allocated for the section name to the left of the activities.
         */  
        sidePadding: 75,

        /** 
         *  **gridLineStartPadding** - Vertical starting position of the grid lines
         */
        gridLineStartPadding: 35,

        /** 
         *  **fontSize** - font size ...
         */
        fontSize: 11,

        /** 
         * **fontFamily** - font family ...
         */
        fontFamily: '"Open-Sans", "sans-serif"',

        /** 
         * **numberSectionStyles** - the number of alternating section styles
         */
        numberSectionStyles:3,

        /** 
         * **axisFormatter** - formatting of the axis, this might need adjustment to match your locale and preferences
         */  
        axisFormatter: [

            // Within a day
            ["%I:%M", function (d) {
                return d.getHours();
            }],
            // Monday a week
            ["w. %U", function (d) {
                return d.getDay() == 1;
            }],
            // Day within a week (not monday)
            ["%a %d", function (d) {
                return d.getDay() && d.getDate() != 1;
            }],
            // within a month
            ["%b %d", function (d) {
                return d.getDate() != 1;
            }],
            // Month
            ["%m-%y", function (d) {
                return d.getMonth();
            }]
        ]
    }
};

/**
 * ## parse
 * Function that parses a mermaid diagram definition. If parsing fails the parseError callback is called and an error is
 * thrown and
 * @param text
 */
var parse = function(text){
    var graphType = utils.detectType(text);
    var parser;

    switch(graphType){
        case 'graph':
            parser = flowParser;
            parser.parser.yy = graph;
            break;
        case 'dotGraph':
            parser = dotParser;
            parser.parser.yy = graph;
            break;
        case 'sequenceDiagram':
            parser = sequenceParser;
            parser.parser.yy = sequenceDb;
            break;
        case 'info':
            parser = infoParser;
            parser.parser.yy = infoDb;
            break;
        case 'gantt':
            parser = ganttParser;
            parser.parser.yy = ganttDb;
            break;
    }

    try{
        parser.parse(text);
        return true;
    }
    catch(err){
        return false;
    }
};
exports.parse = parse;

/**
 * ## version
 * Function returning version information
 * @returns {string} A string containing the version info
 */
exports.version = function(){
    return require('../package.json').version;
};

/**
 * ##render
 * Function that renders an svg with a graph from a chart definition. Usage example below.
 *
 * ```
 * mermaidAPI.initialize({
 *      startOnLoad:true
 *  });
 *  $(function(){
 *      var graphDefinition = 'graph TB\na-->b';
 *      var cb = function(svgGraph){
 *          console.log(svgGraph);
 *      };
 *      mermaidAPI.render('id1',graphDefinition,cb);
 *  });
 *```
 * @param id the id of the element to be rendered
 * @param txt the graph definition
 * @param cb callback which is called after rendering is finished with the svg code as inparam.
 * @param container selector to element in which a div with the graph temporarily will be inserted. In one is
 * provided a hidden div will be inserted in the body of the page instead. The element will be removed when rendering is
 * completed.
 */
var render = function(id, txt, cb, container){

    if(typeof container !== 'undefined'){
        d3.select(container).append('div')
            .attr('id', 'd'+id)
            .append('svg')
            .attr('id', id)
            .attr('width','100%')
            .attr('xmlns','http://www.w3.org/2000/svg')
            .append('g');
    }
    else{
        d3.select('body').append('div')
            .attr('id', 'd'+id)
            .append('svg')
            .attr('id', id)
            .attr('width','100%')
            .attr('xmlns','http://www.w3.org/2000/svg')
            .append('g');
    }

    var element = d3.select('#d'+id).node();
    var graphType = utils.detectType(txt);
    var classes = {};
    switch(graphType){
        case 'graph':
            flowRenderer.setConf(config.flowchart);
            flowRenderer.draw(txt, id, false);
            if(config.cloneCssStyles){
                classes = flowRenderer.getClasses(txt, false);
                utils.cloneCssStyles(element.firstChild, classes);
            }
            break;
        case 'dotGraph':
            flowRenderer.setConf(config.flowchart);
            flowRenderer.draw(txt, id, true);
            if(config.cloneCssStyles) {
                classes = flowRenderer.getClasses(txt, true);
                utils.cloneCssStyles(element.firstChild, classes);
            }
            break;
        case 'sequenceDiagram':
            seq.setConf(config.sequenceDiagram);
            seq.draw(txt,id);
            if(config.cloneCssStyles) {
                utils.cloneCssStyles(element.firstChild, []);
            }
            break;
        case 'gantt':
            gantt.setConf(config.gantt);
            gantt.draw(txt,id);
            if(config.cloneCssStyles) {
                utils.cloneCssStyles(element.firstChild, []);
            }
            break;
        case 'info':
            info.draw(txt,id,exports.version());
            if(config.cloneCssStyles) {
                utils.cloneCssStyles(element.firstChild, []);
            }
            break;
    }

    // Fix for when the base tag is used
    var svgCode = d3.select('#d'+id).node().innerHTML.replace(/url\(#arrowhead/g,'url('+ window.location.protocol+'//'+location.host+location.pathname +'#arrowhead','g');

    if(typeof cb !== 'undefined'){
        cb(svgCode,graph.bindFunctions);
    }else{
        log.warn('CB = undefined');
    }

    var node = d3.select('#d'+id).node();
    if(node !== null && typeof node.remove === 'function'){
        d3.select('#d'+id).node().remove();
    }
};

exports.render = function(id, text, cb, containerElement){
if(typeof document === 'undefined'){
        // Todo handle rendering serverside using phantomjs
    }
    else{
        // In browser
        render( id, text, cb, containerElement);
    }
};


var setConf = function(cnf){
    // Top level initially mermaid, gflow, sequenceDiagram and gantt
    var lvl1Keys = Object.keys(cnf);
    var i;
    for(i=0;i<lvl1Keys.length;i++){

        if(typeof cnf[lvl1Keys[i]] === 'object' ){
            var lvl2Keys = Object.keys(cnf[lvl1Keys[i]]);

            var j;
            for(j=0;j<lvl2Keys.length;j++) {
                //log.debug('Setting conf ',lvl1Keys[i],'-',lvl2Keys[j]);
                if(typeof config[lvl1Keys[i]] === 'undefined'){
                    
                    config[lvl1Keys[i]] = {};
                }
                log.debug('Setting config: '+lvl1Keys[i]+' '+lvl2Keys[j]+' to '+cnf[lvl1Keys[i]][lvl2Keys[j]]);
                config[lvl1Keys[i]][lvl2Keys[j]] = cnf[lvl1Keys[i]][lvl2Keys[j]];
            }
        }else{
            config[lvl1Keys[i]] = cnf[lvl1Keys[i]];
        }
    }
};
exports.initialize = function(options){
    // Update default config with options supplied at initialization
    if(typeof options === 'object'){
        setConf(options);
    }

};
exports.getConfig = function(){
    return config;
};

exports.parseError = function(err, hash) {
    if(typeof mermaid !== 'undefined') {
        mermaid.parseError(err,hash);
    }else{
        log.debug('Mermaid Syntax error:');
        log.debug(err);
    }
};
global.mermaidAPI = {
    render     : exports.render,
    parse      : exports.parse,
    initialize : exports.initialize,
    detectType : utils.detectType,
    parseError : exports.parseError,
    getConfig  : exports.getConfig
};
