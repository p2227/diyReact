/*
 * @Author: kqy 
 * @Date: 2018-04-16 15:02:12 
 * @Last Modified by: kqy
 * @Last Modified time: 2018-04-16 15:52:42
 */
// class HelloMessage extends React.Component {
//   render() {
//     return (
//       <div>
//         Hello {this.props.name}
//       </div>
//     );
//   }
// }

// ReactDOM.render(
//   <HelloMessage name="Taylor" />,
//   mountNode
// );



var React = {}, ReactDOM = {};
class Component {
  constructor(props){
    this.props = props;
    this.props.children = this.render()
  }
}
React.Component  = Component;

//return object
React.createElement = function(type,props,children){
  props = props || {};
  props.children = children
  return {
    type,
    props,
    key:props.key || null
  }
}

function renderInner(element){
  var domElement = document.createElement(element.type);
  if(element.id){
    domElement.id = element.id;
  }
  if(element.key) domElement.key = element.key;
  if(element.props.children) domElement.innerHTML = element.props.children;
  return domElement;
}

ReactDOM.render = function(element,mountNode){
  var fragment = document.createDocumentFragment();
  if(typeof element.type === 'string'){
    var domElement = renderInner(element);
    fragment.appendChild(domElement);
  }
  if(typeof element.type === 'function'){
    var domComplict = new element.type(element.props);
    var domElement = renderInner(domComplict.props.children)
    fragment.appendChild(domElement);
  }
  mountNode.appendChild(fragment);
}


//reactClass ReactELement
class BHelloMessage extends React.Component{
  render(){
    return (
      React.createElement('div',null,`Hello ` + this.props.name)
    )
  }
}

// ReactDOM.render( React.createElement('h1',null,'abcd'),document.getElementById('root'));
ReactDOM.render( React.createElement(BHelloMessage,{name:'Taylor'},null),document.getElementById('root'));
