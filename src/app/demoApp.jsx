/* global document */
import React from 'react';
import ReactDOM from 'react-dom';

import HelloWorld from '../ui/HelloWorldComponent';
import BasePage from '../ui/pages/BasePage';


ReactDOM.render(
    <BasePage>
        <HelloWorld />
    </BasePage>,
    document.getElementById('root')
);
