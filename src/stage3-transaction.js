/*
 * @Author: kqy 
 * @Date: 2018-04-16 15:02:12 
 * @Last Modified by: kqy
 * @Last Modified time: 2018-04-21 16:25:36
 * 异步更新dom
 */

var React = {}, ReactDOM = {};
var transaction = {};

class Component {
  constructor(props, context, queue){
    this.props = props;
  }
  _renderElement(){
    this.props.children = this.render();
  }
  setState(newState){
    Object.assign(this.state, newState);
    const newChildren = this.render();
    const { children } = this.props;
    //toread: 更新的时候如何通知到dom？
    const result = compareNode(newChildren, children);
    if(result.length){
      result.forEach(diff=>{
        const { oldNode, newNode } = diff;
        if(oldNode._dom.replaceWith){
          oldNode._dom.replaceWith(oldNode._renderOne(newNode))
        }else{
          oldNode.props.children._dom.replaceWith(oldNode.props.children._renderOne(newNode.props.children));
        }
      })
    }
  }
}
React.Component = Component;

transaction.wrapper = function(cb){
  
}

class VDomDiff{
  constructor(newNode,oldNode,diff){
    this.newNode = newNode;
    this.oldNode = oldNode;
    this.diff = diff;
  }
}

//比较props,但不包括children
function comparePropsNotChild(props1, props2){
  const keyArr1 = Object.keys(props1);
  const keyArr2 = Object.keys(props2);
  return keyArr1.filter(key=>key!=='children').every(key=>{
    if(key === 'style'){
      return comparePropsNotChild(props1.style,props2.style);
    }else{
      return props1[key] === props2[key];
    }
  })
}

function compareChild(ReactNode1,ReactNode2,dirtyComponent){
  let child1 = ReactNode1.props.children; //children 有可能是字符串，数字，节点，或者是包含以上内容的数组。
  let child2 = ReactNode2.props.children;
  Array.isArray(child1) || (child1 = [ child1 ]);
  Array.isArray(child2) || (child2 = [ child2 ]);
  return (child1.length === child2.length && child1.every((key,idx)=>{
    const n1 = key, n2 = child2[idx]
    if(typeof n1 !== 'object' && typeof n2 !== 'object'){
      if(n1 !== n2){
        child2[idx] = n1;
        dirtyComponent.push(new VDomDiff(ReactNode1,ReactNode2,{})); //如果子节点有不一样，暂时把整个父节点都替换掉，等dom diff 细化的时候再调整
        return false;
      }else{
        return true;
      }
    }else{
      return compareNode(n1,n2,dirtyComponent);
    }
  }))
}

function compareNode(ReactNode1,ReactNode2,dirtyComponent = []){ 
  if(!(
    ReactNode1.type === ReactNode2.type && 
    ReactNode1.key === ReactNode2.key && 
    comparePropsNotChild(ReactNode1.props,ReactNode2.props) &&
    compareChild(ReactNode1, ReactNode2, dirtyComponent)
  )){
    dirtyComponent.push(new VDomDiff(ReactNode1, ReactNode2, {}));
  }
  // isSameNode || ReactNode2._dom.replaceWith(ReactNode2._renderOne(ReactNode1));  
  return dirtyComponent.length > 0 ? dirtyComponent : true;
}

function normalizeChildren(children){
  //[array] -> array
  if(Array.isArray(children)){
    if(children.length === 1){
      return children[0];
    }
  }
  return children;
}

//return object
React.createElement = function(type,props,...children){
  props = props || {};
  props.children = normalizeChildren(children);
  return {
    type,
    props,
    key:props.key || null,
    _dom:null,
    _renderOne:null
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
  if(typeof element === 'string' || typeof element === 'number'){
    domElement = document.createTextNode(element);
  }else if(typeof element === 'object'){
    if(typeof element.type === 'string'){
      domElement = document.createElement(element.type);
      if(element.id) domElement.id = element.id;
      if(element.key) domElement.key = element.key;
      const { props } = element;
      if(props.style){
        //此处要建立一个css in js 和 css prop 的对应关系，一般是建立一个字典，然后有特殊的特殊处理，鉴于时间问题先省略
        Object.assign(domElement.style, props.style);
      }
      props.type && domElement.setAttribute('type',props.type);
      props.checked &&  domElement.setAttribute('checked',!!props.checked);
      if(props.onClick){
        //react中是使用合成事件的，鉴于时间问题先省略
        domElement.addEventListener('click',props.onClick);
      }
      domElement.appendChild(renderChild(element.props.children));
    }else if(typeof element.type === 'function'){
      var domComplict = new element.type(element.props);
      domComplict._renderElement();
      domElement = document.createDocumentFragment();
      domElement.appendChild(renderChild(domComplict.props.children));
    }else if(Array.isArray(element)){
      return renderChild(element);
    }
  }
  element._dom = domElement;
  element._renderOne = renderOne;
  return domElement;
}

ReactDOM.render = function(element,mountNode){
  mountNode.appendChild(renderOne(element));
}


//reactClass ReactELementclass BHelloMessage extends React.Component {

  class BHelloMessage extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        checked: true
      };
    }
    checkHandler() {
      this.setState({
        checked: !this.state.checked
      });
    }
    render() {
      const text = ['unchecked', 'checked'][+this.state.checked];
      return React.createElement(
        'div',
        null,
        React.createElement(
          'p',
          null,
          'Hello ',
          this.props.name,
          ' ',
          text
        ),
        React.createElement(
          'p',
          null,
          React.createElement(Inner, { onClick: () => this.checkHandler(), checked: this.state.checked })
        ),
        React.createElement(
          'label',
          null,
          React.createElement('input', { type: 'checkbox', checked: this.state.checked, onClick: () => this.checkHandler() }),
          'change state'
        )
      );
    }
  }
  class Inner extends React.Component {
    clickHander() {
      this.props.onClick && this.props.onClick();
    }
    render() {
      const color = ['blue', 'red'][+this.props.checked];
      const text = ['unchecked', 'checked'][+this.props.checked];
      return React.createElement(
        'span',
        null,
        React.createElement(
          'span',
          { style: { color }, onClick: () => this.clickHander() },
          text
        )
      );
    }
  }
  
  ReactDOM.render(React.createElement(BHelloMessage, { name: 'Taylor' }), document.getElementById('root'));
/**
 * 
class BHelloMessage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      checked: true
    }
  }
  checkHandler() {
    this.setState({
      checked: !this.state.checked
    })
  }
  render() {
    const text = ['unchecked', 'checked'][+this.state.checked];
    return (
      <div>
        <p>Hello {this.props.name} {text}</p>
        <p><Inner onClick={() => this.checkHandler()} checked={this.state.checked} /></p>
        <label><input type="checkbox" checked={this.state.checked} onClick={() => this.checkHandler()} />change state</label>
      </div>
    );
  }
}
class Inner extends React.Component {
  clickHander() {
    this.props.onClick && this.props.onClick();
  }
  render() {
    const color = ['blue', 'red'][+this.props.checked];
    const text = ['unchecked', 'checked'][+this.props.checked];
    return (
      <span>
        <span style={{ color }} onClick={() => this.clickHander()}>{text}</span>
      </span>
    )
  }
}

ReactDOM.render(
  <BHelloMessage name="Taylor" />,
  document.getElementById('root')
);
 */