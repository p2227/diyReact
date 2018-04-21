/*
 * @Author: kqy 
 * @Date: 2018-04-16 15:02:12 
 * @Last Modified by: kqy
 * @Last Modified time: 2018-04-21 22:53:42
 * 更新列表
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
  if(ReactNode1 === ReactNode2) return true;//都是空节点，都是字符串
  if(ReactNode1.type === ReactNode2.type && ReactNode1.key === ReactNode2.key){
    const keyArr1 = Object.keys(ReactNode1.props);
    const keyArr2 = Object.keys(ReactNode2.props);
    if(keyArr1.length === keyArr2.length && keyArr1.filter(key=>key!=='children').every(key=>ReactNode1.props[key] === ReactNode2.props[key])){
      // style 样式比较
      const child1 = ReactNode1.props.children;
      const child2 = ReactNode2.props.children;
      if(child1 !== child2) {
        if(Array.isArray(child1) && Array.isArray(child2)){
          return child1.length === child2.length && child1.every((key,idx)=>compareNode(key,child2[idx]));
        }
      }
    }
  }
  ReactNode2._dom.replaceWith(ReactNode2._renderOne(ReactNode1)); 
  return false;
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
  const {key = null,...other} = props;
  return {
    type,
    props:other,
    key,
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

function render(element,mountNode){
  mountNode.appendChild(renderOne(element));
}

ReactDOM.render = render;

class BHelloMessage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      list: [0,1,2,3]
    }
  }
  render() {
    return (
      <div>
        <p>Hello {this.props.name}</p>
        <ul>
          {
            this.state.list.map(v => <li key={v}>{v}</li>)
          }
        </ul>
        <button onClick={() => {
          let arr = this.state.list.slice();
          arr.sort((a,b)=>{
            return Math.random()-0.5;
          });
          console.log(this.state.list, arr);
          this.setState({
            list: arr
          })
        }}>Random change</button>
      </div>
    );
  }
}

ReactDOM.render(
  <BHelloMessage name="Taylor" />,
  document.getElementById('root')
);