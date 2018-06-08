import React from 'react';
import ReactDOM from 'react-dom';

import HelloWorld from '../ui/HelloWorldComponent.jsx'
import BasePage from '../ui/pages/BasePage';



console.log('About to attempt a react render:');
ReactDOM.render(
    <BasePage>
        <HelloWorld/>
    </BasePage>,
    document.getElementById('root')
);