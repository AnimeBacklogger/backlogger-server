import React from 'react';
import PropTypes from 'prop-types';

import TopBar from '../../molecules/TopBar';
import styles from './styles.scss';

class BasePage extends React.Component {
    render() {
        const { children } = this.props;
        return (
            <div className={styles.pageBody}>
                <TopBar />
                <div className={styles.mainPage}>
                    {children}
                </div>
            </div>
        );
    }
}

BasePage.propTypes = {
    children: PropTypes.element.isRequired
};

export default BasePage;
