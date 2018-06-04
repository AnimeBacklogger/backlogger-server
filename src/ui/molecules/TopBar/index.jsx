import React from 'react';
import styles from './styles.scss';

export default (props) => {

    return (
        <div class={styles.mainBar}>
            <span>This is a top bar</span>
            <span>With props: {JSON.stringify(props)}</span>
        </div>
    );
}