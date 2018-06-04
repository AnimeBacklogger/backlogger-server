import React from 'react';
import ReactDOM from 'react-dom';

import HelloWorld from '../ui/HelloWorldComponent.jsx'



console.log('About to attempt a react render:');
ReactDOM.render(
    /*/
    <div>Hello World!</div>,
    /*/
    <HelloWorld/>,
    //*/
    document.getElementById('root')
);