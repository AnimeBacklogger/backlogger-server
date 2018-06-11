import React from 'react';
import styles from './styles.scss';
import { Icon, BackloggerIcon } from '../../icons';

export default props => (
    <div className={styles.mainBar}>
        <Icon icon={BackloggerIcon} style={{ color: 'white' }} />
        <span>Backlogger</span>
    </div>
);
