/*
 * @Author: kqy 
 * @Date: 2018-04-16 15:02:12 
 * @Last Modified by: kqy
 * @Last Modified time: 2018-05-03 22:33:33
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

const React = {};
const ReactDOM = {};
class Component {
  constructor(props){
    this.props = props;
  }
  setState(newState){
    Object.assign(this.state, newState);
    const new_element = this.render();
    const { _inner_element } = this;
    debugger;
    const patches = compareElement(new_element, _inner_element);
    if(patches.length){
      applyPatches(patches);
    }else{
      //no diff
      return ;
    }
  }
}
React.Component = Component;


//更新差异 1. 应用到虚拟dom,应用到真实dom
function applyPatches(patches){
  patches.forEach(r=>{
    const { newEle, oldEle, diff } = r;
    if(diff){
      switch(diff.type){
        case 'context':{
            const {idx} = diff;
            if(typeof idx === 'undefined'){
              oldEle._dom.firstChild.textContent = newEle.props.children;
              oldEle.props.children = newEle.props.children;
            }else{
              oldEle._dom.childNodes[idx].textContent = newEle.props.children[idx];
              oldEle.props.children[idx] = newEle.props.children[idx];
            }
          }
          break;
        case 'props':{
            const {diffProps} = diff;
            diffProps.forEach(prop=>{
              if(prop.type === 'props'){
                prop.opr === 'update' && oldEle._dom.setAttribute(prop.key, prop.value);
                prop.opr === 'delete' && oldEle._dom.removeAttribute(props.key)
              }
              if(prop.type === 'style'){
                setDomStyleProps(oldEle._dom, { [prop.key]: prop.value }); //todo: style 可以合并处理
              }
            })
            oldEle.props = newEle.props;
          }
          break;
        case 'children':{
            const {reorderChildren, addChildren, delChildren} = diff;
            const oldDOMChildren = oldEle._dom.childNodes;
            const oldChildren = oldEle.props.children;

            delChildren.forEach((item)=>{
              const { ele, idx } = item;
              ele._dom.parentNode.removeChild(ele._dom);//如果只考虑chrome, 可以直接 ele._dom.remove();
              oldChildren.splice(idx,1);
            });
            
            addChildren.forEach((item)=>{
              const { ele, idx } = item;
              const newInsertDOM = oldEle._renderOne(ele);
              oldEle._dom.insertBefore(newInsertDOM,oldDOMChildren[idx+1]);
              oldChildren.splice(idx,0,ele);
            });

            reorderChildren.forEach((item)=>{
              const { newIdx, oldIdx } = item;
              oldEle._dom.insertBefore(oldDOMChildren[oldIdx],oldDOMChildren[newIdx]);
              swapArrayItem(oldChildren, newIdx, oldIdx);
            });
          }
          break;
      }
    }else{
      const _dom = renderOne(newEle);
      oldEle._dom.replaceWith(_dom);
      oldEle._dom = _dom;
      ['type','props','key'].forEach(key=>oldEle[key]=newEle[key]);
    }
  })
}

function changeArrayChildToObject(arr){
  const r = {};
  arr.forEach((item,idx)=>{
    (item.key !== null && item.key !== undefined) && (r[item.key] = {
      idx,
      item
    })
  })
  return r;
}

//交换一个数组的两个项目
function swapArrayItem(array,idx1,idx2){
  const tmp = array[idx1];
  array[idx1] = array[idx2];
  array[idx2] = tmp;
}

//比较节点类型 如果不一样，返回0；都是文本/数字，返回1；都是数组，返回2，都是函数，返回3，都是对象，返回4
function compareNodeType(n1, n2){
  if ((typeof n1 === 'string' || typeof n1 === 'number') && (typeof n2 === 'string' || typeof n2 === 'number')) return 1;
  if(Array.isArray(n1) && Array.isArray(n2)) return 2; //数组要先于对象判断
  if(typeof n1 === 'object' && typeof n2 === 'object') return 3;
  if(typeof n1 === 'function' && typeof n2 === 'function') return 4;
  return 0;
}

let currPointer = null;
function compareElement(newEle, oldEle, patches = []) {
  const nodeType = compareNodeType(newEle, oldEle);
  if (nodeType === 0) {
    patches.push(currPointer || { newEle, oldEle }); //完全不一样的两个元素
  } else {
    if (typeof newEle === 'string' || typeof newEle === 'number') {
      if (newEle !== oldEle) { //文本节点
        currPointer && patches.push({
          newEle: currPointer.newEle,
          oldEle: currPointer.oldEle,
          diff: {
            type: 'context',
            idx: currPointer.idx
          }
        });
      }
    } else if (Array.isArray(newEle)) { //一排子元素，最复杂的情况
      /**
       * 我们来简化一下情况，
       * 要么子元素所有都有key，要么都没有
       * 如果有key,key唯一
       */
      //克隆一份，然后针对克隆的直接应用index
      const oldEleClone = oldEle.slice();
      const newEleClone = newEle.slice();
      /**
       * 
       * oldObj = {
       *  [key1]:{ idx, item },
       *  [key2]:{ idx, item },
       * }
       */
      
      const delChildren = [];
      const addChildren = [];
      const reorderChildren = [];
      const newObj = changeArrayChildToObject(newEleClone);
      if(Object.keys(newObj).length){
        for (let i = oldEleClone.length - 1; i >= 0; i--) {
          const ele = oldEleClone[i];
          const newOneEle = newObj[ele.key];
          if (!newOneEle) {
            //旧的里面有，新的里面没有，要删除
            delChildren.push({
              ele, idx: i
            });
            oldEleClone.splice(i, 1);
          }
        }
  
        let oldObj = changeArrayChildToObject(oldEleClone);
        for (let i = newEleClone.length - 1; i >= 0; i--) {
          const ele = newEleClone[i];
          const oldOneEle = oldObj[ele.key];
          if (!oldOneEle) {
            //新的里面有，旧的里面没有，要新增
            addChildren.push({
              ele, idx: i
            });
            oldEleClone.splice(i, 0, ele);
          }
        }
  
        oldObj = changeArrayChildToObject(oldEleClone);
        const swapEdIdx = {};
        let swapPointer = 0;
        while (swapPointer < newEleClone.length) {
          if (swapEdIdx[swapPointer]){
            swapPointer++;
            continue;
          }
          let ele = newEleClone[swapPointer];
          let oldOneEle = oldObj[ele.key];
          if (oldOneEle) {
            if (oldOneEle.idx !== swapPointer) {
              reorderChildren.push({
                oldIdx: oldOneEle.idx,
                newIdx: swapPointer
              });
              swapArrayItem(oldEleClone, oldOneEle.idx, swapPointer);
              swapEdIdx[oldOneEle.idx] = true;
              swapEdIdx[swapPointer] = true;
            }
            compareElement(ele, oldEleClone);
          }
          swapPointer++;
        }
  
        currPointer && patches.push({
          newEle: currPointer.newEle,
          oldEle: currPointer.oldEle,
          diff: {
            type: 'children',
            delChildren,
            addChildren,
            reorderChildren,
          }
        });
      }else{
        newEleClone.forEach((ele, idx) => {
          currPointer && (currPointer.idx = idx);
          compareElement(ele, oldEleClone[idx], patches);
        });
      }
    } else if (typeof newEle === 'object') { //同一类型的两个元素
      if (
        newEle.type === oldEle.type &&
        newEle.key === oldEle.key //namespace
      ) {
        const diffProps = comparePropsNotChild(newEle.props, oldEle.props);
        if (diffProps.length) {
          //同一个节点类型，属性有不一样
          patches.push({
            newEle, oldEle, diff: {
              type: 'props',
              diffProps
            }
          })
        } 
        //比较子节点
        currPointer = { newEle, oldEle };
        compareElement(newEle.props.children, oldEle.props.children, patches);
      }else{
        patches.push({ newEle, oldEle });
      }
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
      // element._inst = inst;
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
      list: [0,1,2,3],
      a:true
    }
  }
  render() {
    const {list,a} = this.state;
    return (
      <div>
        <p>Hello {this.props.name}</p>
        {
          /**
           * 
           * 
           * 测试用例
           * 1. 所有子节点都有Key
           * 1.1 新旧子节点都有能找到对应，只是顺序不一样
           * 1.2 新子节点有（旧子节点中没有的节点），要新增
           * 1.3 旧子节点有（新子节点中没有的节点），要删除
           *      然后相同key的节点还要继续比较
           * 2. 不是所有子节点有key
           * 2.1 把有key的拿出来，按照上面的处理
           * 2.2 顺序对应好之后，剩下的，按节点出现顺序比较
           * 2.3 新子节点有（旧子节点中没有的节点），要新增
           * 2.4 旧子节点有（新子节点中没有的节点），要删除
           * 
           * 
           * 如何判断（新子节点）和（旧子节点）中有没有对应的节点？
           *
           */
        }
        <ul>
        {
          a ? [
              <li key="1">1</li>,
              <li key="2">2</li>,
              <li key="3">3</li>,
          ]: [
            <li key="1">1</li>,
            <li key="2">2</li>,
          ]
        }
        </ul>
        <hr/>
        <ul>
        {
          a ? [
              <li key="1">1</li>,
              <li key="2">2</li>,
              <li key="3">3</li>,
          ]: [
            <li key="1">1</li>,
            <li key="2">2</li>,
            <li key="3">3</li>,
            <li key="4">4</li>,
          ]
        }
        </ul>
        <hr/>
        <ul>
        {
          a ? [
              <li key="1">1</li>,
              <li key="2">2</li>,
              <li key="3">3</li>,
          ]: [
            <li key="1">1</li>,
            <li key="3">3</li>,
            <li key="2">2</li>,
          ]
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
            list: arr,
            a: !this.state.a
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