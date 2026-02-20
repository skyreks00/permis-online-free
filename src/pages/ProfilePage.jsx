import React from 'react';
import { useNavigate } from 'react-router-dom';
import Profile from '../components/Profile';
import TopControls from '../components/TopControls';

const ProfilePage = ({
    progress,
    themesData,
    onReset,
    instantFeedback,
    onToggleInstantFeedback,
    autoPlayAudio,
    onToggleAutoPlayAudio,
    toggleTheme,
    isDarkMode
}) => {
    const navigate = useNavigate();

    return (
        <>
            <Profile
                progress={progress}
                themesData={themesData}
                onBack={() => navigate('/')}
                onReset={onReset}
                instantFeedback={instantFeedback}
                onToggleInstantFeedback={onToggleInstantFeedback}
                autoPlayAudio={autoPlayAudio}
                onToggleAutoPlayAudio={onToggleAutoPlayAudio}
            />
        </>
    );
};

export default ProfilePage;
