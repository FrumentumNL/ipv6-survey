(function () {
    async function test() {
        const COOLDOWN_KEY = 'nl.frumentum.ipv6_survey.cooldown';
        const COOLDOWN_AMOUNT = 7 * 24 * 60 * 60 * 1000; // 7 days
        const IP4_ENDPOINT = 'https://v4.ipv6-survey.frumentum.nl';
        const IP6_ENDPOINT = 'https://v6.ipv6-survey.frumentum.nl';
        const DUALSTACK_ENDPOINT = 'https://dual.ipv6-survey.frumentum.nl';
        // We may not be on HTTPS context, so we cannot use window.crypto.
        const testId = Array(8)
            .fill(0)
            .map((_) => Math.random().toString(36).charAt(2))
            .join('');
        let ip4Success = false, ip6Success = false;

        let coolDown = localStorage.getItem(COOLDOWN_KEY);
        if (coolDown && Date.now() < parseInt(coolDown)) return;

        try {
            await fetch(`${IP4_ENDPOINT}/test/${testId}/ip4`, {
                method: 'POST',
                credentials: 'omit'
            });
            ip4Success = true;
        } catch (ignored) {
        }
        try {
            await fetch(`${IP6_ENDPOINT}/test/${testId}/ip6`, {
                method: 'POST',
                credentials: 'omit'
            });
            ip6Success = true;
        } catch (ignored) {
        }

        if (!ip4Success && !ip6Success) return;
        try {
            await fetch(`${DUALSTACK_ENDPOINT}/test/${testId}/dualstack`, {
                method: 'POST',
                credentials: 'omit'
            });
            localStorage.setItem(COOLDOWN_KEY, Date.now() + COOLDOWN_AMOUNT);
        } catch (ignored) {
        }
    }

    if (document.readyState === 'complete') {
        test();
    } else {
        window.addEventListener('load', test);
    }
})();
