importScripts('//unpkg.com/babel-standalone@6.26.0/babel.min.js');

onmessage = function(e) {
  const [stage] = e.data;
  fetch(`./../src/${stage}.js`)
    .then(resp=>resp.text())
    .then(text=>{
      const js = Babel.transform(text, { presets: ['react'] }).code;
      postMessage(js);
    })
}