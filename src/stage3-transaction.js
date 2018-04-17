/*
 * @Author: kqy 
 * @Date: 2018-04-16 15:02:12 
 * @Last Modified by: kqy
 * @Last Modified time: 2018-04-17 21:13:41
 * 更新dom
 */

var React = {}, ReactDOM = {};
class Component {
  constructor(props){
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
    if(compareNode(newChildren, children)){
      return;
    }else{
      this.props.children = newChildren;
    }
  }
}
React.Component = Component;

//toread: 比较跟更新如何分离？
function compareNode(ReactNode1,ReactNode2){ 
  let isSameNode = true;
  if(ReactNode1 === ReactNode2) return isSameNode = true;//都是空节点，都是字符串

  if(ReactNode1.type === ReactNode2.type && ReactNode1.key === ReactNode2.key){
    const keyArr1 = Object.keys(ReactNode1.props);
    const keyArr2 = Object.keys(ReactNode2.props);
    if(keyArr1.length === keyArr2.length && keyArr1.filter(key=>key!=='children').every(key=>ReactNode1.props[key] === ReactNode2.props[key])){
      // style 样式比较
      const child1 = ReactNode1.props.children;
      const child2 = ReactNode2.props.children;
      if(child1 !== child2) {
        if(Array.isArray(child1) && Array.isArray(child2)){
          child1.length === child2.length && child1.every((key,idx)=>{
            const n1 = key, n2 = child2[idx]
            if(typeof n1 !== 'object' && typeof n2 !== 'object'){
              if(n1 !== n2){
                child2[idx] = n1;
                return isSameNode = false;
              }else{
                return true;
              }
            }else{
              return isSameNode = compareNode(n1,n2);
            }
          });
        }
      }
    }
  }
  isSameNode || ReactNode2._dom.replaceWith(ReactNode2._renderOne(ReactNode1));  
  return isSameNode;
}

//return object
React.createElement = function(type,props,...children){
  props = props || {};
  props.children = children;
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
      element._dom = domElement;
      element._renderOne = renderOne;
    }else if(typeof element.type === 'function'){
      var domComplict = new element.type(element.props);
      domComplict._renderElement();
      domElement = document.createDocumentFragment();
      domElement.appendChild(renderChild(domComplict.props.children));
    }
  }
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
        checked: true,
        text:'a'
      };
    }
    render() {
      return React.createElement(
        'div',
        null,
        React.createElement(
          'p',
          null,
          'Hello ',
          this.props.name,
          ' ',
          this.state.text,
          React.createElement(
            'span',
            { style: { color: 'red' } },
            ['unchecked', 'checked'][+this.state.checked]
          )
        ),
        React.createElement(
          'label',
          null,
          React.createElement('input', { type: 'checkbox', checked: this.state.checked, onClick: () => {
              this.setState({
                checked: !this.state.checked
              }) 
              this.setState({
                text: Math.random()
              }) 
            }
          }),
          'change state'
        )
      );
    }
  }
  
  ReactDOM.render(React.createElement(BHelloMessage, { name: 'Taylor' }), document.getElementById('root'));
/**
 * 
class BHelloMessage extends React.Component {
  constructor(props){
	  super(props)
    this.state = {
  		checked:true
  	}
  }
  render() {
    return (
      <div>
        <p>Hello {this.props.name} <span style={{color:'red'}}>{['unchecked','checked'][+this.state.checked]}</span></p>
        <label><input type="checkbox" checked={this.state.checked} onClick={()=>this.setState({
            	checked: !this.state.checked
            })}/>change state</label>
      </div>
    );
  }
}

ReactDOM.render(
  <BHelloMessage name="Taylor" />,
  document.getElementById('root')
);
 */