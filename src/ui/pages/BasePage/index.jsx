import React from 'react';
import PropTypes from 'prop-types';

import TopBar from '../../molecules/TopBar'

class BasePage extends React.Component {

    render(){
        const {children} = this.props;
        return (
            <div>
                <TopBar/>
                <div>
                    {children}
                </div>
            </div>
        );
    }
}

BasePage.propTypes = {
    children: PropTypes.element.isRequired
}

export default BasePage;