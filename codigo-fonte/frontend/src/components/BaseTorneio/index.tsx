import React from 'react';
import type { ReactNode } from 'react';
import styles from './styles.module.css';

interface BaseTorneioProps {
    title: string;
    subtitle: string;
    rightComponents: {
        prizeComponent?: ReactNode;
        tournamentInfoComponent?: ReactNode;
        rulesComponent?: ReactNode;
        rankingComponent?: ReactNode;
    };
    leftContent: ReactNode;
}

const BaseTorneio: React.FC<BaseTorneioProps> = ({
        title,
        subtitle,
        rightComponents,
        leftContent
}) => {
    return (
        <div className={styles.container}>
        {/* Header Section */}
        <div className={styles.header}>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.subtitle}>{subtitle}</p>
        </div>

        {/* Main Content Section */}
        <div className={styles.content}>
            {/* Left Section - 2/3 width */}
            <div className={styles.leftSection}>
            {leftContent}
            </div>

            {/* Right Section - 1/3 width */}
            <div className={styles.rightSection}>
            {/* Prize Section */}
            <div className={styles.rightBlock}>
                {rightComponents.prizeComponent}
            </div>

            {/* Tournament Info Section */}
            <div className={styles.rightBlock}>
                {rightComponents.tournamentInfoComponent}
            </div>

            {/* Rules Section */}
            <div className={styles.rightBlock}>
                {rightComponents.rulesComponent}
            </div>

            {/* Ranking Section */}
            <div className={styles.rightBlock}>
                {rightComponents.rankingComponent}
            </div>
            </div>
        </div>
        </div>
    );
};

export default BaseTorneio;
