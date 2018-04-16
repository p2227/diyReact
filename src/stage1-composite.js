/*
 * @Author: kqy 
 * @Date: 2018-04-16 15:02:12 
 * @Last Modified by: kqy
 * @Last Modified time: 2018-04-16 16:26:33
 */

var React = {}, ReactDOM = {};
class Component {
  constructor(props){
    this.props = props;
    this.props.children = this.render()
  }
}
React.Component  = Component;

//return object
React.createElement = function(type,props,...children){
  props = props || {};
  props.children = children
  return {
    type,
    props,
    key:props.key || null
  }
}

function renderChild(children){
  var domElement = document.createDocumentFragment();
  children = Array.isArray(children) ? children : [children];
  children.forEach(element => {
    domElement.appendChild(renderOne(element));
  });
  return domElement;
}

function renderOne(element){
  var domElement
  if(typeof element === 'string'){
    domElement = document.createTextNode(element);
  }else if(typeof element === 'object'){
    if(typeof element.type === 'string'){
      domElement = document.createElement(element.type);
      if(element.id) domElement.id = element.id;
      if(element.key) domElement.key = element.key;
      const { props } = element;
      if(props.style){
        //此处要建立一个css in js 和 实际 js 的对应关系，一般是建立一个字典，然后有特殊的特殊处理，鉴于时间问题先省略
        Object.assign(domElement.style, props.style);
      }
      if(props.type){
        domElement.setAttribute('type',props.type);
      }
      domElement.appendChild(renderChild(element.props.children));
    }else if(typeof element.type === 'function'){
      var domComplict = new element.type(element.props);
      domElement = document.createDocumentFragment();
      domElement.appendChild(renderChild(domComplict.props.children));
    }
  }
  return domElement;
}

ReactDOM.render = function(element,mountNode){
  mountNode.appendChild(renderOne(element));
}


//reactClass ReactELement
class BHelloMessage extends React.Component {
  render() {
    return React.createElement(
      "div",
      null,
      React.createElement(
        "p",
        null,
        "Hello ",
        this.props.name,
        " ",
        React.createElement(
          "span",
          { style: { color: 'red' } },
          "checked"
        )
      ),
      React.createElement(
        "label",
        null,
        React.createElement("input", { type: "checkbox" }),
        "change state"
      )
    );
  }
}

// ReactDOM.render( React.createElement('h1',null,'abcd'),document.getElementById('root'));
ReactDOM.render( React.createElement(BHelloMessage,{name:'Taylor'},null),document.getElementById('root'));
