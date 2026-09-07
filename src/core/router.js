export class Router {
    static init(onRouteChange) {
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.replace('#', '') || 'portal';
            onRouteChange(hash);
        });
        
        const initialHash = window.location.hash.replace('#', '') || 'portal';
        onRouteChange(initialHash);
    }

    static navigate(screenId) {
        window.location.hash = screenId;
    }
}
