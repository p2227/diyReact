/*
 * @Author: kqy 
 * @Date: 2018-04-16 15:02:12 
 * @Last Modified by: kqy
 * @Last Modified time: 2018-04-22 21:28:41
 * 更新列表，模拟domdiff算法
 * 
 * 
 * component 写代码时的对象，面向开发者 ，继承至 React.Component
 * element 虚拟dom ,从 React.createElement 创建出来，用一个对象去描述dom，兼顾component和dom，有些地方也叫vdom,vnode
 *    element : string ,number
 *    null, undefined 这里先不考虑，
 *    object:{
 *      type: string
 *      type: function
 *    } 
 * dom 真实dom
 * 
 * _inst component 实例化的对象
 */

var React = {}, ReactDOM = {};
class Component {
  constructor(props){
    this.props = props;
  }
  setState(newState){
    Object.assign(this.state, newState);
    const new_element = this.render();
    const { _inner_element } = this;
    const patches = compareElement(new_element, _inner_element);
    if(patches.length){
      applyDiff(patches);
    }else{
      //no diff
      return ;
    }
  }
}
React.Component = Component;


//把element的差异更新到真实dom中
function applyDiff(patches){
  patches.forEach(r=>{
    const { newEle, oldEle, diff } = r;
    if(diff){
      switch(diff.type){
        case 'context':
          const {idx} = diff;
          if(typeof idx === 'undefined'){
            oldEle._dom.firstChild.textContent = newEle.props.children;
          }else{
            oldEle._dom.childNodes[idx].textContent = newEle.props.children[idx];
          }
        break;
        case 'props':
          const {diffProps} = diff;
          diffProps.forEach(prop=>{
            if(prop.type === 'props'){
              prop.opr === 'update' && oldEle._dom.setAttribute(prop.key, prop.value);
              prop.opr === 'delete' && oldEle._dom.removeAttribute(props.key)
            }
            if(prop.type === 'style'){
              setDomStyleProps(oldEle._dom, { [prop.key]: prop.value })
            }
          })
      }
    }else{
      const _dom = renderOne(newEle);
      oldEle._dom.replaceWith(_dom);
      oldEle._dom = _dom;
    }
    ['type','props','key'].forEach(key=>oldEle[key]=newEle[key]);
  })
}

let currPointer = null;
function compareElement(newEle, oldEle, patches = []){ 
  //先假定同级节点的类型都一样
  if(Array.isArray(newEle) && Array.isArray(oldEle)){
    if(newEle.length === oldEle.length){
      newEle.forEach((ele,idx)=>{
        currPointer && (currPointer.idx = idx);
        compareElement(ele, oldEle[idx],patches)
      });
    }else{
      currPointer && patches.push(currPointer);
    }
  }else if(typeof newEle === 'object' && typeof oldEle === 'object'){
    if(
      newEle.type === oldEle.type && 
      newEle.key === oldEle.key
     ){
       const diffProps = comparePropsNotChild(newEle.props, oldEle.props)
       if(diffProps.length){
         //同一个节点类型，属性有不一样
          patches.push({newEle, oldEle, diff:{
            type:'props',
            diffProps
          }})
       }else{
          //节点类型，key一样，比较子节点
          currPointer = { newEle, oldEle };
          compareElement(newEle.props.children, oldEle.props.children, patches);
       }
     }else{
      patches.push({newEle, oldEle})
    }
  }else{
    if(newEle !== oldEle){
      currPointer && patches.push({
        newEle:currPointer.newEle,
        oldEle:currPointer.oldEle,
        diff:{
          type:'context',
          idx:currPointer.idx
        }
      });
    }
  }
  return patches;
}

/**
 * 比较props,但不包括children
 * @param {*} newProps 
 * @param {*} oldProps 
 * @param {*} diffProps 
 *      [{ type:'props', key:'className', opr:'update/delete', value:'__new__class' }]
 *      [{ type:'style', key:'color', opr:'update/delete', value:'red' }]
 */
function comparePropsNotChild(newProps, oldProps, diffProps = []){
  const newArr = Object.keys(newProps).filter(prop=>prop!=='children');
  const oldArr = Object.keys(oldProps).filter(prop=>prop!=='children');
  newArr.forEach((prop,idx)=>{
    if('style' === prop){
      const styleDiff = comparePropsNotChild(newProps.style, oldProps.style);
      (styleDiff.length) &&(diffProps = diffProps.concat(styleDiff.map(item=>{
        return { ...item , type:'style'};
      })))
    }else if(typeof newProps[prop] === 'function' && typeof oldProps[prop] === 'function'){

    }else if(oldProps[prop] !== newProps[prop]){
      diffProps.push({type:'props', key:prop, opr:'update', value:newProps[prop]});
    }
    oldArr.splice(idx,1);
  });
  oldArr.length && diffProps.concat(oldArr.map(prop=>({type:'props', key:prop, opr:'delete'})))
  return diffProps;
}

//return object
React.createElement = function(type,props,...children){
  props = props || {};
  props.children = arguments.length === 3 ? children[0] : children;
  const {key = null,...other} = props; //最新版的chrome已经支持这个语法了，但是babel居然要 transform-object-rest-spread 才能支持
  return {
    type,
    props:other,
    key,
    _inst:null,
    _inner_element:null,
    _dom:null,
    _renderOne:null
  }
}

function setDomStyleProps(dom, style){
  Object.assign(dom.style, style);
  if( typeof style.width === 'number'){
    dom.style.width = style.width + 'px';
  }
}

//渲染一个组件，输入虚拟dom，输出真实dom
function renderOne(element){
  var dom
  if(typeof element === 'string' || typeof element === 'number'){
    dom = document.createTextNode(element);
  }else if(typeof element === 'object'){
    if(typeof element.type === 'string'){
      dom = document.createElement(element.type);
      if(element.id) dom.id = element.id;
      if(element.key) dom.key = element.key;
      const { props } = element;
      if(props.style){
        //此处要建立一个css in js 和 css prop 的对应关系，一般是建立一个字典，然后有特殊的特殊处理，鉴于时间问题先省略
        setDomStyleProps(dom, props.style);
      }
      props.type && dom.setAttribute('type',props.type);
      props.checked &&  dom.setAttribute('checked',!!props.checked);
      if(props.onClick){
        //react中是使用合成事件的，鉴于时间问题先省略
        dom.addEventListener('click',props.onClick);
      }
      if(typeof props.children !== 'undefined'){
        if(props.children.forEach){
          props.children.forEach(child=>render(child, dom));
        } else{
          render(props.children, dom);
        }
      }
      element._dom = dom;
      element._renderOne = renderOne;
    }else if(typeof element.type === 'function'){
      const inst = new element.type(element.props);
      const inner_element = inst.render();
      dom = renderOne(inner_element);
      inst._inner_element = inner_element;
      element._inst = inst;
      inst._dom = dom;
      inst._renderOne = renderOne;
    }
  }
  return dom;
}

//把一个虚拟dom挂载到一个真实dom里面
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
    const {list} = this.state;
    return (
      <div>
        <p>Hello {this.props.name}</p>
        <ul>
          {
            list.map((v,idx) => <li key={idx}>{v}</li>)
          }
        </ul>
        <span>{list[0]}{list[1]}</span>
        <p style={{background:'red',width:list[0]*10+100}} id={'aaa'+list[0]}>a</p>
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