import React from 'react';
import classnames from 'classnames';
import styles from './styles.scss';

export default (props) => {

    const classes = classnames({
            [styles.icon]: true,
            [styles.large]: props.large
    }, props.classes);
    

    return (
        <div className={classes}>
            <props.icon />
        </div>
    );
}