
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const Dashboard = () => {
    const location = useLocation();

    useEffect(() => {
        // Check if we need to reload
        if (location.state?.reload) {
            // Clear the state to prevent infinite reloads
            window.history.replaceState({}, document.title);
            // Reload the page
            window.location.reload();
        }
    }, [location]);

    // Rest of your Dashboard component code...
};